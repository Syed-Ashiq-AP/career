import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const prisma = new PrismaClient();

        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
                orderBy: { updatedAt: "desc" },
                skip: offset,
                take: limit,
                include: {
                    _count: {
                        select: { messages: true },
                    },
                },
            });

            const total = await prisma.conversation.count({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
            });

            return NextResponse.json({
                conversations: conversations.map((conv) => ({
                    id: conv.id,
                    title: conv.title,
                    summary: conv.summary ? JSON.parse(conv.summary) : null,
                    messageCount: conv._count.messages,
                    createdAt: conv.createdAt,
                    updatedAt: conv.updatedAt,
                })),
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total,
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("List conversations error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
