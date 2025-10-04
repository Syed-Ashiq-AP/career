import OpenAI from "openai";
import { ConversationMessage } from "@/lib/generated/prisma";
import type {
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

interface LLMConfig {
    apiKey: string;
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

    get modelConfig() {
        return this.config;
    }

    constructor(config: LLMConfig) {
        this.config = config;

        this.openai = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || "https://api.openai.com/v1",
        });
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
        try {
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
        } catch (error) {
            throw error instanceof Error
                ? error
                : new Error("Unknown LLM error");
        }
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
        try {
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
        } catch (error) {
            throw error instanceof Error
                ? error
                : new Error("Unknown LLM error");
        }
    }
}

export function createLLMService(): LLMService {
    const config = {
        apiKey: process.env.A4F_API_KEY || "",
        baseUrl: "https://api.a4f.co/v1",
        model: "provider-3/gpt-4o-mini",
        maxTokens: 4000,
        temperature: 0.7,
    } as LLMConfig;
    if (!config.apiKey) {
        throw new Error("API key not found");
    }

    return new LLMService(config);
}
