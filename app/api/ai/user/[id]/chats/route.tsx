import { PrismaClient } from "@/lib/generated/prisma";
import { NextResponse } from "next/server";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const prisma = new PrismaClient();
    try {
        const chats = await prisma.chat.findMany({ where: { userId: id } });
        return NextResponse.json({ chats: chats });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: e }, { status: 500 });
    } finally {
        prisma.$disconnect();
    }
};
