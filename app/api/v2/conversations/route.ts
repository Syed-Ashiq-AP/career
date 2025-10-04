import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { ConversationMemoryManager } from "@/lib/ai/conversation-memory";
import { createLLMService } from "@/lib/ai/llm-service";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface ConversationRequest {
    conversationId?: string;
    message: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { conversationId, message }: ConversationRequest =
            await req.json();

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const prisma = new PrismaClient();
        const llmService = createLLMService("custom");
        const memoryManager = new ConversationMemoryManager(prisma, llmService);

        try {
            let currentConversationId = conversationId;

            if (!currentConversationId) {
                const newConversation = await prisma.conversation.create({
                    data: {
                        id: new ObjectId().toHexString(),
                        title:
                            message.slice(0, 50) +
                            (message.length > 50 ? "..." : ""),
                        userId: session.user.id,
                    },
                });
                currentConversationId = newConversation.id;
            }

            const userMessage = await memoryManager.addMessage(
                currentConversationId,
                {
                    role: "user",
                    content: message,
                    metadata: null,
                    tokenCount: Math.ceil(message.length / 4),
                    model: null,
                    finishReason: null,
                }
            );

            const conversationMessages = await memoryManager.getMessagesForAPI(
                currentConversationId
            );

            const completion =
                await llmService.generateCompletion(conversationMessages);

            const assistantMessage = await memoryManager.addMessage(
                currentConversationId,
                {
                    role: "assistant",
                    content: completion.content,
                    metadata: {
                        model: completion.model,
                        finishReason: completion.finishReason,
                    },
                    tokenCount:
                        completion.tokenCount ||
                        Math.ceil(completion.content.length / 4),
                    model: completion.model,
                    finishReason: completion.finishReason || null,
                }
            );

            return NextResponse.json({
                conversationId: currentConversationId,
                userMessage,
                assistantMessage,
                usage: {
                    totalTokens: completion.tokenCount,
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Conversation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const conversationId = searchParams.get("conversationId");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!conversationId) {
            return NextResponse.json(
                { error: "conversationId is required" },
                { status: 400 }
            );
        }

        const prisma = new PrismaClient();

        try {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId: session.user.id,
                },
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            const messages = await prisma.conversationMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: "asc" },
                skip: offset,
                take: limit,
            });

            const totalMessages = await prisma.conversationMessage.count({
                where: { conversationId },
            });

            return NextResponse.json({
                conversation,
                messages,
                pagination: {
                    total: totalMessages,
                    limit,
                    offset,
                    hasMore: offset + limit < totalMessages,
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Get conversation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
