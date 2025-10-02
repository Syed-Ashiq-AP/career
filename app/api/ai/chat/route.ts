import { Message, PrismaClient } from "@/lib/generated/prisma";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { messages, userId } = (await req.json()) as {
        messages: Message[];
        userId: string;
    };

    const prisma = new PrismaClient();
    try {
        const chat = await prisma.chat.create({
            data: {
                id: new ObjectId().toHexString(),
                title: messages[0].query,
                userId,
            },
        });
        if (!chat) {
            console.log("Failed to get Chat ID");

            return NextResponse.json(
                { error: "Failed to get Chat ID" },
                { status: 500 }
            );
        }

        const upsertedMessages = await Promise.all(
            messages.map((msg) =>
                prisma.message.upsert({
                    where: { id: msg.id ?? new ObjectId().toHexString() },
                    update: { ...msg, chatId: chat.id },
                    create: {
                        ...msg,
                        chatId: chat.id,
                        id: msg.id ?? new ObjectId().toHexString(),
                    },
                })
            )
        );

        return NextResponse.json({
            chatId: chat.id,
            messages: upsertedMessages,
        });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: e }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};
