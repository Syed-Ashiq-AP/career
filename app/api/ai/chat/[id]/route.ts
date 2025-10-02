import { Message, PrismaClient } from "@/lib/generated/prisma";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const POST = async (
    req: Request,
    { params }: { params: Promise<{ id?: string }> }
) => {
    const { id } = await params;
    const { messages } = (await req.json()) as {
        messages: Message[];
    };

    const prisma = new PrismaClient();
    try {
        if (!id)
            return NextResponse.json(
                { error: "Failed to get Chat ID" },
                { status: 500 }
            );

        const upsertedMessages = await Promise.all(
            messages.map((msg) =>
                prisma.message.upsert({
                    where: { id: msg.id ?? new ObjectId().toHexString() },
                    update: { ...msg, chatId: id },
                    create: {
                        ...msg,
                        chatId: id,
                        id: msg.id ?? new ObjectId().toHexString(),
                    },
                })
            )
        );

        return NextResponse.json({
            chatId: id,
            messages: upsertedMessages,
        });
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id?: string }> }
) => {
    const { id } = await params;

    const prisma = new PrismaClient();
    try {
        const messages = await prisma.message.findMany({
            where: { chatId: id },
        });
        return NextResponse.json({ messages: messages });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: e }, { status: 500 });
    } finally {
        prisma.$disconnect();
    }
};
