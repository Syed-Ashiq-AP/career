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

            let userMessage = await memoryManager.addMessage(
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

Provide detailed, current, and actionable career advice based on the latest information available.`,
                metadata: null,
                tokenCount: null,
                finishReason: null,
            });

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

                        const tools = [
                            {
                                type: "function",
                                function: {
                                    name: "search_online",
                                    description:
                                        "Search for current information online when users ask about: job market trends, salary data, company information, specific courses, certifications, industry updates, job openings, or any career-related topic that would benefit from up-to-date information. Use this to provide accurate, current advice.",
                                    parameters: {
                                        type: "object",
                                        properties: {
                                            query: {
                                                type: "string",
                                                description:
                                                    "A specific search query to find relevant career information (e.g., 'AI ML courses India 2024', 'software engineer salary Mumbai 2024', 'remote work opportunities India')",
                                            },
                                        },
                                        required: ["query"],
                                    },
                                },
                            },
                        ];

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
                                onFunctionCall: async (functionCall) => {
                                    if (functionCall.name === "search_online") {
                                        try {
                                            const args = JSON.parse(
                                                functionCall.arguments
                                            );
                                            const searchQuery = args.query;

                                            const [
                                                searchResults,
                                                imageResults,
                                                videoResults,
                                            ] = await Promise.all([
                                                serperSearch(searchQuery).catch(
                                                    () => []
                                                ),
                                                getImages(searchQuery).catch(
                                                    () => []
                                                ),
                                                getVideos(searchQuery).catch(
                                                    () => []
                                                ),
                                            ]);

                                            const functionTabs: Tab[] = [
                                                ...(searchResults.length > 0
                                                    ? [
                                                          {
                                                              type: "search" as const,
                                                              title: "Search Results",
                                                              items: searchResults,
                                                          },
                                                      ]
                                                    : []),
                                                ...(imageResults.length > 0
                                                    ? [
                                                          {
                                                              type: "images" as const,
                                                              title: "Images",
                                                              items: imageResults,
                                                          },
                                                      ]
                                                    : []),
                                                ...(videoResults &&
                                                videoResults.length > 0
                                                    ? [
                                                          {
                                                              type: "videos" as const,
                                                              title: "Videos",
                                                              items: videoResults,
                                                          },
                                                      ]
                                                    : []),
                                            ];

                                            if (functionTabs.length > 0) {
                                                const metadataChunk: ChatStreamChunk =
                                                    {
                                                        type: "metadata",
                                                        data: {
                                                            messageId:
                                                                userMessage.id,
                                                            metadata: {
                                                                tabs: functionTabs,
                                                            } as unknown as JsonValue,
                                                        },
                                                    };

                                                userMessage =
                                                    await memoryManager.updateMessage(
                                                        userMessage.id,
                                                        {
                                                            metadata:
                                                                metadataChunk
                                                                    .data
                                                                    .metadata,
                                                        }
                                                    );
                                                controller.enqueue(
                                                    encoder.encode(
                                                        `data: ${JSON.stringify(metadataChunk)}\n\n`
                                                    )
                                                );
                                            }

                                            let searchContext = `Based on my search for "${searchQuery}", I found the following current information:\n\n`;

                                            if (searchResults.length > 0) {
                                                searchContext +=
                                                    "Current web resources:\n";
                                                searchResults
                                                    .slice(0, 5)
                                                    .forEach(
                                                        (result, index) => {
                                                            searchContext += `${index + 1}. ${result.title}\n   Source: ${result.link}\n\n`;
                                                        }
                                                    );
                                            }

                                            if (imageResults.length > 0) {
                                                searchContext +=
                                                    "Visual resources available:\n";
                                                imageResults
                                                    .slice(0, 3)
                                                    .forEach(
                                                        (result, index) => {
                                                            searchContext += `${index + 1}. ${result.title}\n   Reference: ${result.link}\n\n`;
                                                        }
                                                    );
                                            }

                                            if (
                                                videoResults &&
                                                videoResults.length > 0
                                            ) {
                                                searchContext +=
                                                    "Video resources:\n";
                                                videoResults
                                                    .slice(0, 3)
                                                    .forEach(
                                                        (result, index) => {
                                                            searchContext += `${index + 1}. Video content available\n   Link: ${result.link}\n\n`;
                                                        }
                                                    );
                                            }

                                            searchContext +=
                                                "\n[Use this information to provide a comprehensive career guidance response in first person with proper markdown formatting]";

                                            return searchContext;
                                        } catch (error) {
                                            console.error(
                                                "Function call error:",
                                                error
                                            );
                                            return "I apologize, but I encountered an error while searching for information. Please try rephrasing your question.";
                                        }
                                    }
                                    return "";
                                },
                                onComplete: async (content: string) => {
                                    try {
                                        await memoryManager.addMessage(
                                            currentConversationId,
                                            {
                                                id: assistantMessageId as string,
                                                role: "assistant",
                                                content,
                                                metadata: {
                                                    streamedAt:
                                                        new Date().toISOString(),
                                                },
                                                tokenCount: Math.ceil(
                                                    content.length / 4
                                                ),
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
                                    } catch (e) {
                                        console.error(
                                            "Error saving message",
                                            e
                                        );
                                        const errorChunk: ChatStreamChunk = {
                                            type: "error",
                                            data: {
                                                error: "Failed to save the message",
                                            },
                                        };
                                        controller.enqueue(
                                            encoder.encode(
                                                `data: ${JSON.stringify(errorChunk)}\n\n`
                                            )
                                        );
                                    } finally {
                                        controller.close();
                                    }
                                },
                                onError: (error: Error) => {
                                    console.error("Streaming error:", error);
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
                            },
                            tools.map((tool) => ({
                                name: tool.function.name,
                                description: tool.function.description,
                                parameters: tool.function.parameters,
                            }))
                        );
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        } catch (e) {
            return new Response((e as Error).toString(), { status: 500 });
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
