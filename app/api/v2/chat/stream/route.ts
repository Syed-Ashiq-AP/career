import { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { createLLMService } from "@/lib/ai/llm-service";
import { ConversationMemoryManager } from "@/lib/ai/conversation-memory";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    streamRateLimiter,
    getRateLimitIdentifier,
    getRateLimitHeaders,
} from "@/lib/ai/rate-limiter";

interface ChatStreamRequest {
    conversationId?: string;
    message: string;
    userId: string;
}

interface ChatStreamChunk {
    type: "token" | "message_start" | "message_complete" | "error";
    data: {
        content?: string;
        messageId?: string;
        conversationId?: string;
        error?: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const rateLimitId = getRateLimitIdentifier(req, session.user.id);
        const rateLimitResult = streamRateLimiter.check(rateLimitId);

        if (!rateLimitResult.allowed) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    resetTime: rateLimitResult.resetTime,
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        ...getRateLimitHeaders(rateLimitResult),
                    },
                }
            );
        }

        const { conversationId, message, userId }: ChatStreamRequest =
            await req.json();

        if (!message || !userId) {
            console.error("Missing required fields:", {
                message: !!message,
                userId: !!userId,
            });
            return new Response("Missing required fields", { status: 400 });
        }

        if (session.user.id !== userId) {
            return new Response("Forbidden", { status: 403 });
        }

        const prisma = new PrismaClient();

        let llmService;
        try {
            llmService = createLLMService();
        } catch (error) {
            console.warn(
                "A4F provider not available, falling back to OpenAI:",
                error
            );
            try {
                llmService = createLLMService();
            } catch (openaiError) {
                console.error("No LLM provider available:", openaiError);
                return new Response("LLM service unavailable", { status: 503 });
            }
        }

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
                        userId,
                    },
                });
                currentConversationId = newConversation.id;
            }

            const userMessage = await memoryManager.addMessage(
                currentConversationId,
                {
                    id:new ObjectId().toHexString()
                    role: "user",
                    content: message,
                    metadata: null,
                    tokenCount: null,
                    // model: null,
                    finishReason: null,
                }
            );

            const conversationMessages = await memoryManager.getMessagesForAPI(
                currentConversationId
            );

            const encoder = new TextEncoder();
            let assistantMessageId: string | undefined;

            const readable = new ReadableStream({
                async start(controller) {
                    try {
                        const startChunk: ChatStreamChunk = {
                            type: "message_start",
                            data: {
                                conversationId: currentConversationId,
                                messageId: userMessage.id,
                            },
                        };
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify(startChunk)}\n\n`
                            )
                        );

                        assistantMessageId = new ObjectId().toHexString();

                        const stream = llmService.streamCompletion(
                            conversationMessages,
                            {
                                onToken: (token: string) => {
                                    const tokenChunk: ChatStreamChunk = {
                                        type: "token",
                                        data: {
                                            content: token,
                                            messageId: assistantMessageId,
                                            conversationId:
                                                currentConversationId,
                                        },
                                    };
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify(tokenChunk)}\n\n`
                                        )
                                    );
                                },
                                onComplete: async (content: string) => {
                                    try {
                                        await memoryManager.addMessage(
                                            currentConversationId!,
                                            {
                                                id: assistantMessageId as string,
                                                role: "assistant",
                                                content,
                                                metadata: {
                                                    model:
                                                        llmService.modelConfig
                                                            ?.model ||
                                                        "unknown",
                                                    streamedAt:
                                                        new Date().toISOString(),
                                                },
                                                tokenCount: Math.ceil(
                                                    content.length / 4
                                                ),
                                                // model:
                                                //     llmService.modelConfig
                                                //         ?.model || null,
                                                finishReason: "stop",
                                            }
                                        );

                                        const completeChunk: ChatStreamChunk = {
                                            type: "message_complete",
                                            data: {
                                                messageId: assistantMessageId,
                                                conversationId:
                                                    currentConversationId,
                                                content,
                                            },
                                        };
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify(completeChunk)}\n\n`
                                            )
                                        );
                                        controller.close();
                                    } catch (error) {
                                        console.error(
                                            "Error saving assistant message:",
                                            error
                                        );
                                        const errorChunk: ChatStreamChunk = {
                                            type: "error",
                                            data: {
                                                error: "Failed to save message",
                                            },
                                        };
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify(errorChunk)}\n\n`
                                            )
                                        );
                                        controller.close();
                                    }
                                },
                                onError: (error: Error) => {
                                    console.error(
                                        "LLM streaming error:",
                                        error
                                    );
                                    const errorChunk: ChatStreamChunk = {
                                        type: "error",
                                        data: {
                                            error: error.message,
                                        },
                                    };
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify(errorChunk)}\n\n`
                                        )
                                    );
                                    controller.close();
                                },
                            }
                        );

                        for await (const _ of stream) {
                        }
                    } catch (error) {
                        console.error("Stream initialization error:", error);
                        const errorChunk: ChatStreamChunk = {
                            type: "error",
                            data: {
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            },
                        };
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify(errorChunk)}\n\n`
                            )
                        );
                        controller.close();
                    }
                },
                cancel() {},
            });

            return new Response(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Chat stream error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
