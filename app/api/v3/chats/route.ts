import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
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

        const prisma = new PrismaClient();

        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
                orderBy: { updatedAt: "desc" },
                include: {
                    _count: {
                        select: { messages: true },
                    },
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
