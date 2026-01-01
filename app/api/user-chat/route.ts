import { auth } from "@/lib/auth";
import { Chat, PrismaClient } from "@/lib/generated/prisma/client";
import { generateId } from "ai";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    applyRateLimit,
    RATE_LIMITS,
    addRateLimitHeaders,
} from "@/lib/security/rate-limiter";
import {
    validateRequestBody,
    addSecurityHeaders,
    sanitizeString,
    detectSuspiciousInput,
} from "@/lib/security/middleware";

// Validation schema for POST
const createChatSchema = z.object({
    title: z.string().min(1).max(200),
});

export async function GET(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_READ);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

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
            const conversations = await prisma.chat.findMany({
                where: {
                    userId: session.user.id,
                },
                orderBy: { updatedAt: "desc" },
                take: 100, // Limit to 100 conversations
            });

            const response = NextResponse.json({ conversations });
            return addSecurityHeaders(
                addRateLimitHeaders(response, req, RATE_LIMITS.API_READ)
            );
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("List conversations error:", error);
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        );
    }
}

export async function POST(req: NextRequest) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_WRITE);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    try {
        // Validate request body
        const validation = await validateRequestBody(req, createChatSchema);
        if (!validation.success) {
            return addSecurityHeaders(validation.error);
        }

        const { title } = validation.data;

        // Sanitize and validate title
        const cleanTitle = sanitizeString(title);
        if (detectSuspiciousInput(cleanTitle)) {
            return addSecurityHeaders(
                new Response(JSON.stringify({ error: "Invalid title" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                })
            );
        }

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
            const conversation: Chat = await prisma.chat.create({
                data: {
                    id: generateId(),
                    title: cleanTitle,
                    userId: session.user.id,
                },
            });

            if (!conversation) {
                console.error("Create conversation error:", conversation);
                return addSecurityHeaders(
                    new Response(
                        JSON.stringify({
                            error: "Failed to create conversation",
                        }),
                        {
                            status: 500,
                            headers: { "Content-Type": "application/json" },
                        }
                    )
                );
            }

            const response = NextResponse.json(conversation);
            return addSecurityHeaders(
                addRateLimitHeaders(response, req, RATE_LIMITS.API_WRITE)
            );
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Create conversation error:", error);
        return addSecurityHeaders(
            new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            })
        );
    }
}
