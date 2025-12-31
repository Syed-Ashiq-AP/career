import { auth } from "@/lib/auth";
import { Chat, PrismaClient } from "@/lib/generated/prisma/client";
import { generateId } from "ai";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
            const conversations = await prisma.chat.findMany({
                where: {
                    userId: session.user.id,
                },
                orderBy: { updatedAt: "desc" },
            });

            return NextResponse.json({
                conversations,
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

export async function POST(req: NextRequest) {
    const { title } = await req.json();
    if (!title) {
        return NextResponse.json(
            { error: "title is required" },
            { status: 400 }
        );
    }
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
            const conversation: Chat = await prisma.chat.create({
                data: { id: generateId(), title, userId: session.user.id },
            });
            if (!conversation) {
                console.error("List conversations error:", conversation);
                return NextResponse.json(
                    { error: "Internal server error" },
                    { status: 500 }
                );
            }
            return NextResponse.json(conversation);
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
