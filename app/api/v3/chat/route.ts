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
        const conversationId = searchParams.get("conversationId");

        if (!conversationId) {
            return NextResponse.json(
                { error: "conversationId is required" },
                { status: 400 }
            );
        }

        const prisma = new PrismaClient();

        try {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId: session.user.id,
                },
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            const messages = await prisma.conversationMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: "asc" },
            });

            const totalMessages = await prisma.conversationMessage.count({
                where: { conversationId },
            });

            return NextResponse.json({
                conversation,
                messages,
                pagination: {
                    total: totalMessages,
                },
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Get conversation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
