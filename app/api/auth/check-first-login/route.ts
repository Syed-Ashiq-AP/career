import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
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

        const { userId } = await req.json();

        if (userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const prisma = new PrismaClient();

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hasSeenCheckout: true },
            });

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            // Return true if user hasn't seen checkout yet
            return NextResponse.json({
                shouldShowCheckout: !user.hasSeenCheckout,
            });
        } finally {
            await prisma.$disconnect();
        }
    } catch (error) {
        console.error("Error checking first login:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
