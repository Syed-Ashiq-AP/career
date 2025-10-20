import OpenAI from "openai";
import { ConversationMessage } from "@/lib/generated/prisma";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

interface LLMConfig {
    apiKey: string;
    apiKeys?: string[];
    baseUrl?: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

interface PerplexityResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
    }>;
    usage: {
        total_tokens: number;
    };
    model: string;
    citations?: string[];
    search_results?: Array<{
        title: string;
        url: string;
        date?: string;
    }>;
    videos?: Array<{
        url: string;
        thumbnail_url: string;
        thumbnail_width: number;
        thumbnail_height: number;
        duration: number;
    }>;
}

interface StreamingOptions {
    onToken?: (token: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
    onFunctionCall?: (functionCall: {
        id: string;
        name: string;
        arguments: string;
    }) => Promise<string>;
}

export class LLMService {
    private client: OpenAI;
    private config: LLMConfig;
    private currentKeyIndex: number = 0;
    private apiKeys: string[];

    get modelConfig() {
        return this.config;
    }

    constructor(config: LLMConfig) {
        this.config = config;

        // Parse multiple API keys if provided
        this.apiKeys = config.apiKeys || [config.apiKey];

        this.client = new OpenAI({
            apiKey: this.apiKeys[0],
            baseURL: config.baseUrl || "https://api.perplexity.ai",
        });
    }

    private rotateApiKey(): void {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        const newApiKey = this.apiKeys[this.currentKeyIndex];

        // Create a new OpenAI instance with the rotated key
        this.client = new OpenAI({
            apiKey: newApiKey,
            baseURL: this.config.baseUrl || "https://api.perplexity.ai",
        });

        console.log(`Rotated to API key index: ${this.currentKeyIndex}`);
    }

    private async makeRequestWithRetry<T>(
        requestFn: () => Promise<T>,
        maxRetries: number = this.apiKeys.length - 1
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error("Unknown error");

                // Check if it's a rate limit error (429)
                const isRateLimit =
                    lastError.message.includes("429") ||
                    lastError.message.toLowerCase().includes("rate limit");

                if (isRateLimit && attempt < maxRetries) {
                    console.log(
                        `Rate limit hit on key ${this.currentKeyIndex}, rotating...`
                    );
                    this.rotateApiKey();
                    continue;
                }

                // If it's not a rate limit error, or we've exhausted all keys, throw the error
                throw lastError;
            }
        }

        throw lastError || new Error("All API keys exhausted");
    }

    /**
     * Convert ConversationMessage[] to OpenAI format with proper ordering for Perplexity
     */
    private formatMessages(
        messages: ConversationMessage[]
    ): ChatCompletionMessageParam[] {
        // Separate system messages from user/assistant messages
        const systemMessages = messages.filter((msg) => msg.role === "system");
        const conversationMessages = messages.filter(
            (msg) => msg.role !== "system"
        );

        // Combine all system messages into one to avoid multiple system messages
        const combinedSystemContent = systemMessages
            .map((msg) => msg.content)
            .join("\n\n");

        const formattedMessages: ChatCompletionMessageParam[] = [];

        // Add combined system message if any system messages exist
        if (systemMessages.length > 0) {
            formattedMessages.push({
                role: "system" as const,
                content: combinedSystemContent,
            });
        }

        // Ensure proper alternation of user/assistant messages
        const validConversationMessages: ChatCompletionMessageParam[] = [];
        let lastRole: string | null = null;

        for (const msg of conversationMessages) {
            const currentRole = msg.role === "assistant" ? "assistant" : "user";

            // Skip consecutive messages of the same role (except the first one)
            if (lastRole === currentRole) {
                console.warn(
                    `Skipping consecutive ${currentRole} message to maintain alternation`
                );
                continue;
            }

            validConversationMessages.push({
                role: currentRole as "user" | "assistant",
                content: msg.content,
            });

            lastRole = currentRole;
        }

        // Add the valid conversation messages
        formattedMessages.push(...validConversationMessages);

        return formattedMessages;
    }

    /**
     * Generate complete response without streaming simulation
     */
    async generateCompletionWithTools(
        messages: ConversationMessage[],
        options: Omit<StreamingOptions, "onToken"> = {},
        tools?: Array<{
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        }>
    ): Promise<string> {
        try {
            let response;
            let fullResponse = "";

            // If tools are provided, use the function calling method
            if (tools && tools.length > 0) {
                response = await this.generateWithFunctions(messages, tools);

                // Handle tool calls if present
                if (
                    response.toolCalls &&
                    response.toolCalls.length > 0 &&
                    options.onFunctionCall
                ) {
                    // Create updated messages array with function results
                    const updatedMessages = [...messages];

                    // Add the assistant's tool call request (if there was content)
                    if (response.content) {
                        updatedMessages.push({
                            role: "assistant" as const,
                            content: response.content,
                            metadata: null,
                            tokenCount: null,
                            finishReason: null,
                            id: "",
                            conversationId: "",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }

                    // Execute each tool call and add results to messages
                    for (const toolCall of response.toolCalls) {
                        try {
                            const functionResult = await options.onFunctionCall(
                                {
                                    id: toolCall.id,
                                    name: toolCall.function.name,
                                    arguments: toolCall.function.arguments,
                                }
                            );

                            if (functionResult) {
                                // Add function result as a system message for context
                                updatedMessages.push({
                                    role: "system" as const,
                                    content: functionResult,
                                    metadata: null,
                                    tokenCount: null,
                                    finishReason: null,
                                    id: "",
                                    conversationId: "",
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                });
                            }
                        } catch (error) {
                            console.error(
                                "Function call execution error:",
                                error
                            );
                        }
                    }

                    // Now generate the AI's actual response using the function results as context
                    const finalResponse =
                        await this.generateCompletion(updatedMessages);
                    fullResponse = finalResponse.content;
                } else if (response.content) {
                    // No tool calls, just use the content
                    fullResponse = response.content;
                }
            } else {
                // No tools, use regular completion
                const completionResponse =
                    await this.generateCompletion(messages);
                fullResponse = completionResponse.content;
            }

            if (options.onComplete) {
                options.onComplete(fullResponse);
            }

            return fullResponse;
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error("Unknown LLM error");
            if (options.onError) {
                options.onError(err);
            }
            throw err;
        }
    }

    /**
     * Generate streaming response using Perplexity's native streaming
     */
    async *streamCompletion(
        messages: ConversationMessage[],
        options: StreamingOptions = {}
    ): AsyncGenerator<string, string, unknown> {
        try {
            let fullResponse = "";

            // Use Perplexity's native streaming (no function calling needed)
            const formattedMessages = this.formatMessages(messages);

            const stream = await this.makeRequestWithRetry(async () => {
                return this.client.chat.completions.create({
                    model: this.config.model,
                    messages: formattedMessages,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    stream: true, // Enable native streaming
                    // Perplexity-specific parameters for media
                    ...({
                        return_images: true,
                        return_related_questions: false,
                        search_domain_filter: [
                            "youtube.com",
                            "vimeo.com",
                            "dailymotion.com",
                        ],
                        search_recency_filter: "month",
                    } as Record<string, unknown>),
                });
            });

            // Process the real stream from Perplexity
            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    if (options.onToken) {
                        options.onToken(content);
                    }
                    yield content;
                }
            }

            if (options.onComplete) {
                options.onComplete(fullResponse);
            }

            return fullResponse;
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error("Unknown LLM error");
            if (options.onError) {
                options.onError(err);
            }
            throw err;
        }
    }

    /**
     * Generate non-streaming response (updated for Perplexity)
     */
    async generateCompletion(messages: ConversationMessage[]): Promise<{
        content: string;
        tokenCount?: number;
        model: string;
        finishReason?: string;
        citations?: string[];
        searchResults?: Array<{
            title: string;
            url: string;
            date?: string;
        }>;
        videos?: Array<{
            url: string;
            thumbnail_url: string;
            thumbnail_width: number;
            thumbnail_height: number;
            duration: number;
        }>;
    }> {
        return this.makeRequestWithRetry(async () => {
            const formattedMessages = this.formatMessages(messages);

            const response = await this.client.chat.completions.create({
                model: this.config.model,
                messages: formattedMessages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                // Perplexity-specific parameters for media
                ...({
                    return_images: true,
                    return_related_questions: false,
                    search_domain_filter: [
                        "youtube.com",
                        "vimeo.com",
                        "dailymotion.com",
                    ],
                    search_recency_filter: "month",
                } as Record<string, unknown>),
            });

            const choice = response.choices[0];
            const responseData = response as PerplexityResponse;

            return {
                content: choice.message.content || "",
                tokenCount: response.usage?.total_tokens,
                model: response.model,
                finishReason: choice.finish_reason || undefined,
                citations: responseData.citations,
                searchResults: responseData.search_results,
                videos: responseData.videos,
            };
        });
    }

    /**
     * Generate response with function calling capability
     * Note: Perplexity has limited function calling support, so we'll simplify this
     */
    async generateWithFunctions(
        messages: ConversationMessage[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tools: Array<{
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        }>
    ): Promise<{
        content?: string;
        toolCalls?: Array<{
            id: string;
            type: string;
            function: {
                name: string;
                arguments: string;
            };
        }>;
        tokenCount?: number;
        model: string;
        finishReason?: string;
        citations?: string[];
    }> {
        return this.makeRequestWithRetry(async () => {
            const formattedMessages = this.formatMessages(messages);

            // For Perplexity, we'll use basic completion since function calling is limited
            // The search capability is built-in, so we don't need explicit tools
            const response = await this.client.chat.completions.create({
                model: this.config.model,
                messages: formattedMessages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
            });

            const choice = response.choices[0];
            const responseData = response as PerplexityResponse;

            return {
                content: choice.message.content || undefined,
                toolCalls: undefined, // Perplexity handles search internally
                tokenCount: response.usage?.total_tokens,
                model: response.model,
                finishReason: choice.finish_reason || undefined,
                citations: responseData.citations,
            };
        });
    }
}

export function createLLMService(): LLMService {
    const apiKeyString = process.env.PERPLEXITY_API_KEY || "";
    if (!apiKeyString) {
        throw new Error(
            "PERPLEXITY_API_KEY not found in environment variables"
        );
    }

    // Parse multiple API keys from comma-separated string
    const apiKeys = apiKeyString
        .split(",")
        .map((key) => key.trim())
        .filter((key) => key.length > 0);

    const config = {
        apiKey: apiKeys[0], // Primary key
        apiKeys: apiKeys, // All keys for rotation
        baseUrl: "https://api.perplexity.ai",
        model: "sonar", // Correct Perplexity model name for search
        maxTokens: 4000,
        temperature: 0.7,
    } as LLMConfig;

    console.log(
        `Initialized Perplexity LLM service with ${apiKeys.length} API keys`
    );
    return new LLMService(config);
}
