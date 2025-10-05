import OpenAI from "openai";
import { ConversationMessage } from "@/lib/generated/prisma";
import type {
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

interface LLMConfig {
    apiKey: string;
    apiKeys?: string[];
    baseUrl?: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
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
    private openai: OpenAI;
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

        this.openai = new OpenAI({
            apiKey: this.apiKeys[0],
            baseURL: config.baseUrl || "https://api.openai.com/v1",
        });
    }

    private rotateApiKey(): void {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        const newApiKey = this.apiKeys[this.currentKeyIndex];

        // Create a new OpenAI instance with the rotated key
        this.openai = new OpenAI({
            apiKey: newApiKey,
            baseURL: this.config.baseUrl || "https://api.openai.com/v1",
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
     * Convert ConversationMessage[] to OpenAI format
     */
    private formatMessages(
        messages: ConversationMessage[]
    ): ChatCompletionMessageParam[] {
        return messages.map((msg) => {
            switch (msg.role) {
                case "system":
                    return { role: "system" as const, content: msg.content };
                case "user":
                    return { role: "user" as const, content: msg.content };
                case "assistant":
                    return { role: "assistant" as const, content: msg.content };
                default:
                    return { role: "user" as const, content: msg.content };
            }
        });
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
     * Generate streaming response (simulated streaming using non-streaming API)
     */
    async *streamCompletion(
        messages: ConversationMessage[],
        options: StreamingOptions = {},
        tools?: Array<{
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        }>
    ): AsyncGenerator<string, string, unknown> {
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

                    // Stream the AI's response
                    const chunks = this.chunkText(finalResponse.content, 10);
                    for (const chunk of chunks) {
                        if (options.onToken) {
                            options.onToken(chunk);
                        }
                        yield chunk;
                        // Add small delay to simulate streaming
                        await new Promise((resolve) => setTimeout(resolve, 10));
                    }
                } else if (response.content) {
                    // No tool calls, just stream the content
                    fullResponse = response.content;
                    const chunks = this.chunkText(response.content, 10);
                    for (const chunk of chunks) {
                        if (options.onToken) {
                            options.onToken(chunk);
                        }
                        yield chunk;
                        // Add small delay to simulate streaming
                        await new Promise((resolve) => setTimeout(resolve, 10));
                    }
                }
            } else {
                // No tools, use regular completion
                const completionResponse =
                    await this.generateCompletion(messages);
                fullResponse = completionResponse.content;

                // Simulate streaming by breaking response into chunks
                const chunks = this.chunkText(completionResponse.content, 10);
                for (const chunk of chunks) {
                    if (options.onToken) {
                        options.onToken(chunk);
                    }
                    yield chunk;
                    // Add small delay to simulate streaming
                    await new Promise((resolve) => setTimeout(resolve, 10));
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
     * Helper method to break text into chunks for simulated streaming
     */
    private chunkText(text: string, chunkSize: number = 10): string[] {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Generate non-streaming response
     */
    async generateCompletion(messages: ConversationMessage[]): Promise<{
        content: string;
        tokenCount?: number;
        model: string;
        finishReason?: string;
    }> {
        return this.makeRequestWithRetry(async () => {
            const formattedMessages = this.formatMessages(messages);

            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: formattedMessages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
            });

            const choice = response.choices[0];

            return {
                content: choice.message.content || "",
                tokenCount: response.usage?.total_tokens,
                model: response.model,
                finishReason: choice.finish_reason || undefined,
            };
        });
    }

    /**
     * Generate response with function calling capability (using newer tools API)
     */
    async generateWithFunctions(
        messages: ConversationMessage[],
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
    }> {
        return this.makeRequestWithRetry(async () => {
            const formattedMessages = this.formatMessages(messages);

            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: formattedMessages,
                tools: tools.map((tool) => ({
                    type: "function" as const,
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters as Record<string, unknown>,
                    },
                })),
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
            });

            const choice = response.choices[0];

            return {
                content: choice.message.content || undefined,
                toolCalls:
                    choice.message.tool_calls
                        ?.filter((call) => call.type === "function")
                        .map((call) => {
                            const functionCall =
                                call as ChatCompletionMessageToolCall & {
                                    function: {
                                        name: string;
                                        arguments: string;
                                    };
                                };
                            return {
                                id: call.id,
                                type: call.type,
                                function: {
                                    name: functionCall.function.name,
                                    arguments: functionCall.function.arguments,
                                },
                            };
                        }) || undefined,
                tokenCount: response.usage?.total_tokens,
                model: response.model,
                finishReason: choice.finish_reason || undefined,
            };
        });
    }
}

export function createLLMService(): LLMService {
    const apiKeyString = process.env.A4F_API_KEY || "";
    if (!apiKeyString) {
        throw new Error("API key not found");
    }

    // Parse multiple API keys from comma-separated string
    const apiKeys = apiKeyString
        .split(",")
        .map((key) => key.trim())
        .filter((key) => key.length > 0);

    const config = {
        apiKey: apiKeys[0], // Primary key
        apiKeys: apiKeys, // All keys for rotation
        baseUrl: "https://api.a4f.co/v1",
        model: "provider-3/gpt-4o-mini",
        maxTokens: 4000,
        temperature: 0.7,
    } as LLMConfig;

    console.log(`Initialized LLM service with ${apiKeys.length} API keys`);
    return new LLMService(config);
}
