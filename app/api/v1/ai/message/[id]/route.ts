import { PrismaClient } from "@/lib/generated/prisma";
import { NextResponse } from "next/server";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const prisma = new PrismaClient();
    const { id } = await params;
    try {
        const message = await prisma.message.findFirst({ where: { id } });

        return NextResponse.json(message);
    } catch (e) {
        return NextResponse.json({ error: e }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};
