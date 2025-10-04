import { ConversationMessage, PrismaClient } from "@/lib/generated/prisma";
import { LLMService } from "./llm-service";

export interface ConversationMemoryConfig {
    maxMessages: number;
    summarizeThreshold: number;
    contextWindow: number;
}

export interface ConversationSummary {
    summary: string;
    messageCount: number;
    lastSummarizedAt: Date;
}

class ConversationMemoryManager {
    private prisma: PrismaClient;
    private llmService: LLMService;
    private config: ConversationMemoryConfig;

    constructor(
        prisma: PrismaClient,
        llmService: LLMService,
        config: ConversationMemoryConfig = {
            maxMessages: 30,
            summarizeThreshold: 10,
            contextWindow: 4000,
        }
    ) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.config = config;
    }

    /**
     * Get conversation context with memory management
     */
    async getConversationContext(conversationId: string): Promise<{
        messages: ConversationMessage[];
        summary?: ConversationSummary;
        totalTokens: number;
    }> {
        const allMessages = await this.prisma.conversationMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
        });

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        const existingSummary = conversation?.summary
            ? (JSON.parse(conversation.summary) as ConversationSummary)
            : null;

        if (allMessages.length <= this.config.summarizeThreshold) {
            const totalTokens = this.estimateTokens(allMessages);
            return {
                messages: allMessages,
                summary: existingSummary || undefined,
                totalTokens,
            };
        }

        const recentMessages = allMessages.slice(-this.config.maxMessages);
        const oldMessages = allMessages.slice(0, -this.config.maxMessages);

        let summary = existingSummary;

        if (
            oldMessages.length > 0 &&
            (!summary || summary.messageCount < oldMessages.length)
        ) {
            summary = await this.createOrUpdateSummary(
                conversationId,
                oldMessages,
                summary
            );
        }

        const totalTokens =
            this.estimateTokens(recentMessages) +
            (summary
                ? this.estimateTokens([
                      { content: summary.summary } as ConversationMessage,
                  ])
                : 0);

        return {
            messages: recentMessages,
            summary: summary ?? undefined,
            totalTokens,
        };
    }

    /**
     * Create or update conversation summary
     */
    private async createOrUpdateSummary(
        conversationId: string,
        messages: ConversationMessage[],
        existingSummary?: ConversationSummary | null
    ): Promise<ConversationSummary> {
        const messagesToSummarize = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
        }));

        const systemPrompt: ConversationMessage = {
            id: "system-summary",
            conversationId,
            role: "system",
            content: `You are an AI career consultant specializing in the Indian job market. Only provide summaries and advice relevant to career guidance, job search, and professional growth in India. If the conversation is not about career consulting in India, respond with "Sorry, I can't assist with that." ${
                existingSummary
                    ? `Previous summary: "${existingSummary.summary}". Now summarize the following additional messages along with the previous context.`
                    : "Summarize the following conversation messages, focusing on key topics, decisions, and context relevant to career consulting in India."
            }`,
            metadata: null,
            tokenCount: null,
            finishReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const userPrompt: ConversationMessage = {
            id: "user-summary",
            conversationId,
            role: "user",
            content: `Summarize this conversation as a career consultant in India:\n\n${messagesToSummarize
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join("\n")}`,
            metadata: null,
            tokenCount: null,
            finishReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            const response = await this.llmService.generateCompletion([
                systemPrompt,
                userPrompt,
            ]);

            const newSummary: ConversationSummary = {
                summary: response.content,
                messageCount:
                    messages.length + (existingSummary?.messageCount || 0),
                lastSummarizedAt: new Date(),
            };

            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { summary: JSON.stringify(newSummary) },
            });

            return newSummary;
        } catch (error) {
            console.error("Failed to create conversation summary:", error);

            return (
                existingSummary || {
                    summary:
                        "Conversation history available but summarization failed.",
                    messageCount: messages.length,
                    lastSummarizedAt: new Date(),
                }
            );
        }
    }

    /**
     * Add a new message and manage memory
     */
    async addMessage(
        conversationId: string,
        message: Omit<
            ConversationMessage,
            "conversationId" | "createdAt" | "updatedAt"
        >
    ): Promise<ConversationMessage> {
        const newMessage = await this.prisma.conversationMessage.create({
            data: {
                ...message,
                conversationId,
            },
        });

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        const messageCount = await this.prisma.conversationMessage.count({
            where: { conversationId },
        });

        if (messageCount > this.config.summarizeThreshold) {
            this.getConversationContext(conversationId).catch((error) =>
                console.error("Background summarization failed:", error)
            );
        }

        return newMessage;
    }

    /**
     * Update an existing message
     */
    async updateMessage(
        messageId: string,
        updates: Partial<
            Pick<
                ConversationMessage,
                "content" | "metadata" | "tokenCount" | "finishReason"
            >
        >
    ): Promise<ConversationMessage> {
        const updatedMessage = await this.prisma.conversationMessage.update({
            where: { id: messageId },
            data: {
                ...updates,
                updatedAt: new Date(),
            },
        });

        // Update the conversation's updatedAt timestamp
        await this.prisma.conversation.update({
            where: { id: updatedMessage.conversationId },
            data: { updatedAt: new Date() },
        });

        return updatedMessage;
    }

    /**
     * Get messages for API context (with summary as system message if available)
     */
    async getMessagesForAPI(
        conversationId: string
    ): Promise<ConversationMessage[]> {
        const context = await this.getConversationContext(conversationId);

        const messages: ConversationMessage[] = [];

        if (context.summary) {
            messages.push({
                id: `summary-${conversationId}`,
                conversationId,
                role: "system",
                content: `Previous conversation summary: ${context.summary.summary}`,
                metadata: null,
                tokenCount: null,
                finishReason: null,
                createdAt: new Date(context.summary.lastSummarizedAt),
                updatedAt: new Date(context.summary.lastSummarizedAt),
            });
        }

        messages.push(...context.messages);

        return messages;
    }

    /**
     * Estimate token count for messages (rough approximation)
     */
    private estimateTokens(messages: ConversationMessage[]): number {
        return messages.reduce((total, msg) => {
            return total + Math.ceil(msg.content.length / 4);
        }, 0);
    }

    /**
     * Clean up old conversations (for maintenance)
     */
    async cleanupOldConversations(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.conversation.deleteMany({
            where: {
                updatedAt: { lt: cutoffDate },
                isActive: false,
            },
        });

        return result.count;
    }
}

export { ConversationMemoryManager };
