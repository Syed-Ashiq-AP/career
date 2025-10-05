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
import { getImages, getVideos, serperSearch } from "@/lib/search-providers";

interface SearchResult {
    favicon: string;
    link: string;
    title: string;
}

interface ImageResource {
    title: string;
    link: string;
}

interface VideoResource {
    imageUrl: string;
    link: string;
}

interface Tab {
    type: "search" | "images" | "videos";
    title: string;
    items: SearchResult[] | ImageResource[] | VideoResource[];
}

interface ChatStreamRequest {
    conversationId?: string;
    message: string;
    userId: string;
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
                content: `You are an AI career consultant specializing in the Indian job market. When users ask questions that would benefit from current information (job market trends, salary data, company information, industry updates, etc.), you should use the search_online function to find relevant and up-to-date information to provide better advice.

**Response Guidelines:**
1. Always respond in first person as a helpful career consultant
2. Use proper markdown formatting for all responses
3. When you search for information, acknowledge it naturally: "Let me search for the latest information on this..." or "I'll look up current data about..."
4. Summarize search results in a conversational, first-person manner
5. Structure your responses with clear headings, bullet points, and proper formatting
6. Only provide summaries and advice relevant to career guidance, job search, and professional growth in India
7. If the conversation is not about career consulting in India, respond with "I'm sorry, but I can only assist with career-related questions specific to the Indian job market."

**Markdown Formatting Requirements:**
- Use # for main headings, ## for subheadings
- Use **bold** for emphasis and important points  
- Use bullet points (-) or numbered lists (1.) for structured information
- Use \`code formatting\` for technical terms, job titles, or specific programs
- Use > blockquotes for important advice or key takeaways
- Include proper line breaks for readability

When presenting search results, integrate them naturally into your advice rather than just listing them.`,
                metadata: null,
                tokenCount: null,
                finishReason: null,
            });

            const conversationMessages = await memoryManager.getMessagesForAPI(
                currentConversationId
            );
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

            const assistantMessageId = new ObjectId().toHexString();

            const completionResult = await LLM.generateCompletionWithTools(
                conversationMessages,
                {
                    onFunctionCall: async (functionCall) => {
                        if (functionCall.name === "search_online") {
                            try {
                                const args = JSON.parse(functionCall.arguments);
                                const searchQuery = args.query;

                                const [
                                    searchResults,
                                    imageResults,
                                    videoResults,
                                ] = await Promise.all([
                                    serperSearch(searchQuery).catch(() => []),
                                    getImages(searchQuery).catch(() => []),
                                    getVideos(searchQuery).catch(() => []),
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
                                    ...(videoResults && videoResults.length > 0
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
                                    userMessage =
                                        await memoryManager.updateMessage(
                                            userMessage.id,
                                            {
                                                metadata: {
                                                    tabs: functionTabs,
                                                } as unknown as JsonValue,
                                            }
                                        );
                                }

                                let searchContext = `Based on my search for "${searchQuery}", I found the following current information:\n\n`;

                                if (searchResults.length > 0) {
                                    searchContext += "Current web resources:\n";
                                    searchResults
                                        .slice(0, 5)
                                        .forEach((result, index) => {
                                            searchContext += `${index + 1}. ${result.title}\n   Source: ${result.link}\n\n`;
                                        });
                                }

                                if (imageResults.length > 0) {
                                    searchContext +=
                                        "Visual resources available:\n";
                                    imageResults
                                        .slice(0, 3)
                                        .forEach((result, index) => {
                                            searchContext += `${index + 1}. ${result.title}\n   Reference: ${result.link}\n\n`;
                                        });
                                }

                                if (videoResults && videoResults.length > 0) {
                                    searchContext += "Video resources:\n";
                                    videoResults
                                        .slice(0, 3)
                                        .forEach((result, index) => {
                                            searchContext += `${index + 1}. Video content available\n   Link: ${result.link}\n\n`;
                                        });
                                }

                                searchContext +=
                                    "\n[Use this information to provide a comprehensive career guidance response in first person with proper markdown formatting]";

                                return searchContext;
                            } catch (error) {
                                console.error("Function call error:", error);
                                return "I apologize, but I encountered an error while searching for information. Please try rephrasing your question.";
                            }
                        }
                        return "";
                    },
                    onError: async (error: Error) => {
                        console.error("Completion error:", error);
                    },
                },
                tools.map((tool) => ({
                    name: tool.function.name,
                    description: tool.function.description,
                    parameters: tool.function.parameters,
                }))
            );

            try {
                await memoryManager.addMessage(currentConversationId, {
                    id: assistantMessageId,
                    role: "assistant",
                    content: completionResult,
                    metadata: {
                        completedAt: new Date().toISOString(),
                    },
                    tokenCount: Math.ceil(completionResult.length / 4),
                    finishReason: "stop",
                });
            } catch (e) {
                console.error("Error saving assistant message:", e);
            }

            return NextResponse.json({
                conversationId: currentConversationId,
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
