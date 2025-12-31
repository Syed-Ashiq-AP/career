import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { AIMessage } from "@/lib/UIMessage";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: RouteContext<"/api/user-chat/[id]">
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json(
            { error: "conversationId is required" },
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
            const conversation = await prisma.chat.findFirst({
                where: {
                    id: id,
                },
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            const messages = await prisma.message.findMany({
                where: { chatId: id },
                orderBy: { createdAt: "asc" },
            });

            return NextResponse.json({
                conversation,
                messages,
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

export async function POST(
    req: NextRequest,
    { params }: RouteContext<"/api/user-chat/[id]">
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json(
            { error: "conversationId is required" },
            { status: 400 }
        );
    }
    const {
        messages,
        update,
    }: {
        messages: AIMessage[];
        update?: boolean;
    } = await req.json();
    if (!messages) {
        return NextResponse.json(
            { error: "messages is required" },
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
            const convertedMessages = messages.map((m) => ({
                id: m.id,
                metadata: JSON.stringify(m.metadata ?? {}),
                role: m.role,
                parts: JSON.stringify(m.parts ?? []),
                chatId: id,
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
            return NextResponse.json({}, { status: 200 });
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
