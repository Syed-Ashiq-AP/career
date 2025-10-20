import { ConversationMemoryManager } from "@/lib/ai/conversation-memory";
import { createLLMService } from "@/lib/ai/llm-service";
import {
    getRateLimitHeaders,
    getRateLimitIdentifier,
    streamRateLimiter,
} from "@/lib/ai/rate-limiter";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { JsonValue } from "@/lib/generated/prisma/runtime/library";

interface ChatStreamRequest {
    conversationId?: string;
    message: string;
    userId: string;
}

interface ChatStreamChunk {
    type: "token" | "message_start" | "message_complete" | "error" | "metadata";
    data: {
        content?: string;
        messageId?: string;
        conversationId?: string;
        error?: string;
        metadata?: JsonValue;
    };
}

export async function POST(req: Request) {
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
            return NextResponse.json(
                {
                    error: "Rate limit exceeded",
                    resetTime: rateLimitResult.resetTime,
                },
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
            return NextResponse.json(
                { error: "Missing Required Fields" },
                { status: 400 }
            );
        }

        if (session.user.id !== userId) {
            return new Response("Forbidden", { status: 403 });
        }

        const prisma = new PrismaClient();
        const LLM = createLLMService();
        const memoryManager = new ConversationMemoryManager(prisma, LLM);

        try {
            const currentConversationId = conversationId
                ? conversationId
                : (
                      await prisma.conversation.create({
                          data: {
                              id: new ObjectId().toHexString(),
                              title: message.slice(0, 50),
                              userId,
                          },
                      })
                  ).id;

            // Add system message first (if this is a new conversation)
            if (!conversationId) {
                await memoryManager.addMessage(currentConversationId, {
                    id: new ObjectId().toHexString(),
                    role: "system",
                    content: `You are an AI career consultant specializing in the Indian job market. You have access to real-time information through your search capabilities, which allows you to provide current and accurate career advice.

**Response Guidelines:**
1. Always respond in first person as a helpful career consultant
2. Use proper markdown formatting for all responses
3. When discussing current topics (job market trends, salary data, company information, industry updates, etc.), naturally incorporate up-to-date information
4. Structure your responses with clear headings, bullet points, and proper formatting
5. Provide comprehensive advice relevant to career guidance, job search, and professional growth in India
6. If the conversation is not about career consulting in India, respond with "I'm sorry, but I can only assist with career-related questions specific to the Indian job market."

**Markdown Formatting Requirements:**
- Use # for main headings, ## for subheadings
- Use **bold** for emphasis and important points  
- Use bullet points (-) or numbered lists (1.) for structured information
- Use \`code formatting\` for technical terms, job titles, or specific programs
- Use > blockquotes for important advice or key takeaways
- Include proper line breaks for readability

**Citation Format:**
- When referencing sources, use natural language instead of numbered citations like [1][2]
- Example: "According to recent industry reports" instead of "[1][2]"
- Sources will be provided separately for user reference

Provide detailed, current, and actionable career advice based on the latest information available.`,
                    metadata: null,
                    tokenCount: null,
                    finishReason: null,
                });
            }

            const userMessage = await memoryManager.addMessage(
                currentConversationId,
                {
                    id: new ObjectId().toHexString(),
                    role: "user",
                    content: message,
                    metadata: null,
                    tokenCount: null,
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

                        // Use Perplexity's built-in search capabilities without explicit tools
                        const stream = LLM.streamCompletion(
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
                                onComplete: async (fullResponse: string) => {
                                    try {
                                        // Get the final completion with metadata for citations and sources
                                        const completionWithMetadata =
                                            await LLM.generateCompletion(
                                                conversationMessages
                                            );

                                        await memoryManager.addMessage(
                                            currentConversationId,
                                            {
                                                id: assistantMessageId!,
                                                role: "assistant",
                                                content: fullResponse,
                                                metadata: {
                                                    citations:
                                                        completionWithMetadata.citations ||
                                                        [],
                                                    searchResults:
                                                        completionWithMetadata.searchResults ||
                                                        [],
                                                    videos:
                                                        completionWithMetadata.videos ||
                                                        [],
                                                } as unknown as JsonValue,
                                                tokenCount:
                                                    completionWithMetadata.tokenCount ||
                                                    null,
                                                finishReason:
                                                    completionWithMetadata.finishReason ||
                                                    null,
                                            }
                                        );

                                        // Send metadata chunk with citations, sources, images, and videos
                                        if (
                                            completionWithMetadata.citations ||
                                            completionWithMetadata.searchResults ||
                                            completionWithMetadata.videos
                                        ) {
                                            const tabs = [];

                                            // Add search results tab
                                            if (
                                                completionWithMetadata.searchResults &&
                                                completionWithMetadata
                                                    .searchResults.length > 0
                                            ) {
                                                tabs.push({
                                                    type: "search",
                                                    title: "Sources",
                                                    items: completionWithMetadata.searchResults.map(
                                                        (result) => ({
                                                            title: result.title,
                                                            link: result.url,
                                                            favicon: "",
                                                        })
                                                    ),
                                                });
                                            }

                                            // Add videos tab
                                            if (
                                                completionWithMetadata.videos &&
                                                completionWithMetadata.videos
                                                    .length > 0
                                            ) {
                                                tabs.push({
                                                    type: "videos",
                                                    title: "Videos",
                                                    items: completionWithMetadata.videos.map(
                                                        (video) => ({
                                                            imageUrl:
                                                                video.thumbnail_url,
                                                            link: video.url,
                                                            duration:
                                                                video.duration,
                                                        })
                                                    ),
                                                });
                                            }

                                            // For images, we'll use search results that contain images
                                            const imageResults =
                                                completionWithMetadata.searchResults?.filter(
                                                    (result) =>
                                                        result.url.match(
                                                            /\.(jpg|jpeg|png|gif|webp|svg)$/i
                                                        )
                                                ) || [];

                                            if (imageResults.length > 0) {
                                                tabs.push({
                                                    type: "images",
                                                    title: "Images",
                                                    items: imageResults.map(
                                                        (result) => ({
                                                            title: result.title,
                                                            link: result.url,
                                                        })
                                                    ),
                                                });
                                            }

                                            const metadataChunk: ChatStreamChunk =
                                                {
                                                    type: "metadata",
                                                    data: {
                                                        messageId:
                                                            assistantMessageId,
                                                        metadata: {
                                                            citations:
                                                                completionWithMetadata.citations ||
                                                                [],
                                                            searchResults:
                                                                completionWithMetadata.searchResults ||
                                                                [],
                                                            videos:
                                                                completionWithMetadata.videos ||
                                                                [],
                                                            tabs,
                                                        } as unknown as JsonValue,
                                                    },
                                                };

                                            controller.enqueue(
                                                encoder.encode(
                                                    `data: ${JSON.stringify(metadataChunk)}\n\n`
                                                )
                                            );
                                        }

                                        const completeChunk: ChatStreamChunk = {
                                            type: "message_complete",
                                            data: {
                                                messageId: assistantMessageId,
                                                conversationId:
                                                    currentConversationId,
                                            },
                                        };
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify(completeChunk)}\n\n`
                                            )
                                        );

                                        // Close the controller here after everything is complete
                                        controller.close();
                                    } catch (saveError) {
                                        console.error(
                                            "Error saving assistant message:",
                                            saveError
                                        );
                                        // Close controller even on error
                                        controller.close();
                                    }
                                },
                                onError: (error: Error) => {
                                    const errorChunk: ChatStreamChunk = {
                                        type: "error",
                                        data: {
                                            error: error.message,
                                            conversationId:
                                                currentConversationId,
                                        },
                                    };
                                    controller.enqueue(
                                        encoder.encode(
                                            `data: ${JSON.stringify(errorChunk)}\n\n`
                                        )
                                    );
                                    // Close controller on error
                                    controller.close();
                                },
                            }
                        );

                        // Execute the stream
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        for await (const chunk of stream) {
                            // Chunks are handled by onToken callback
                        }

                        // Controller will be closed in onComplete or onError callbacks
                    } catch (error) {
                        console.error("Stream error:", error);
                        const errorChunk: ChatStreamChunk = {
                            type: "error",
                            data: {
                                error: "An error occurred while processing your request",
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
            });

            return new Response(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Chat stream error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
