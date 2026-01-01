import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { AIMessage } from "@/lib/UIMessage";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
    applyRateLimit,
    RATE_LIMITS,
    addRateLimitHeaders,
} from "@/lib/security/rate-limiter";
import {
    validateRequestBody,
    createErrorResponse,
    addSecurityHeaders,
    checkRequestSize,
    sanitizeString,
    detectSuspiciousInput,
} from "@/lib/security/middleware";

// Validation schemas
const messageSchema = z.object({
    id: z.string(),
    metadata: z.any().optional(),
    role: z.string(),
    parts: z.any().optional(),
    chatId: z.string().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
});

const postMessagesSchema = z.object({
    messages: z.array(messageSchema).min(1).max(100), // Limit to 100 messages
    update: z.boolean().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: RouteContext<"/api/user-chat/[id]">
) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_READ);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    const { id } = await params;

    // Validate and sanitize ID
    if (!id || typeof id !== "string") {
        return addSecurityHeaders(
            new Response(
                JSON.stringify({ error: "conversationId is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        );
    }

    const cleanId = sanitizeString(id);
    if (detectSuspiciousInput(cleanId)) {
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Invalid conversationId" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        );
    }
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return addSecurityHeaders(
                new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                })
            );
        }

        const prisma = new PrismaClient();

        try {
            const conversation = await prisma.chat.findFirst({
                where: {
                    id: cleanId,
                    userId: session.user.id, // Ensure user owns this conversation
                },
            });

            if (!conversation) {
                return addSecurityHeaders(
                    new Response(
                        JSON.stringify({ error: "Conversation not found" }),
                        {
                            status: 404,
                            headers: { "Content-Type": "application/json" },
                        }
                    )
                );
            }

            const messages = await prisma.message.findMany({
                where: { chatId: cleanId },
                orderBy: { createdAt: "asc" },
                take: 1000, // Limit messages returned
            });

            const response = NextResponse.json({
                conversation,
                messages,
            });
            return addSecurityHeaders(
                addRateLimitHeaders(response, req, RATE_LIMITS.API_READ)
            );
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Get conversation error:", error);
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: RouteContext<"/api/user-chat/[id]">
) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_WRITE);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    // Check request size (limit to 1MB for messages)
    const sizeCheck = await checkRequestSize(req, 1024 * 1024);
    if (sizeCheck) return addSecurityHeaders(sizeCheck);

    const { id } = await params;

    // Validate and sanitize ID
    if (!id || typeof id !== "string") {
        return addSecurityHeaders(
            new Response(
                JSON.stringify({ error: "conversationId is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        );
    }

    const cleanId = sanitizeString(id);
    if (detectSuspiciousInput(cleanId)) {
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Invalid conversationId" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        );
    }

    try {
        // Validate request body
        const validation = await validateRequestBody(req, postMessagesSchema);
        if (!validation.success) {
            return addSecurityHeaders(validation.error);
        }

        const { messages, update } = validation.data;
        const { messages, update } = validation.data;

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return addSecurityHeaders(
                new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                })
            );
        }

        const prisma = new PrismaClient();
        try {
            // Verify user owns this conversation
            const conversation = await prisma.chat.findFirst({
                where: {
                    id: cleanId,
                    userId: session.user.id,
                },
            });

            if (!conversation) {
                return addSecurityHeaders(
                    new Response(
                        JSON.stringify({
                            error: "Conversation not found or unauthorized",
                        }),
                        {
                            status: 404,
                            headers: { "Content-Type": "application/json" },
                        }
                    )
                );
            }

            const convertedMessages = messages.map((m) => ({
                id: sanitizeString(m.id),
                metadata: JSON.stringify(m.metadata ?? {}),
                role: sanitizeString(m.role),
                parts: JSON.stringify(m.parts ?? []),
                chatId: cleanId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            if (update) {
                for (const msg of convertedMessages) {
                    const JSONmsg = {
                        metadata: msg.metadata,
                        role: msg.role,
                        parts: msg.parts,
                        chatId: msg.chatId,
                        createdAt: msg.createdAt,
                        updatedAt: msg.updatedAt,
                    };
                    await prisma.message.upsert({
                        where: { id: msg.id },
                        create: { id: msg.id, ...JSONmsg },
                        update: JSONmsg,
                    });
                }
            } else {
                await prisma.message.createMany({ data: convertedMessages });
            }

            // Update conversation's updatedAt timestamp
            await prisma.chat.update({
                where: { id: cleanId },
                data: { updatedAt: new Date() },
            });

            const response = NextResponse.json({}, { status: 200 });
            return addSecurityHeaders(
                addRateLimitHeaders(response, req, RATE_LIMITS.API_WRITE)
            );
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Update conversation error:", error);
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        );
    }
}
