import Providers from "@/components/page-layout/ai/providers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";
const page = async ({ params }: { params: Promise<{ id?: string }> }) => {
    const { id: chatId } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <>
            <Providers
                userId={session?.user.id as string}
                chatId={chatId}
            ></Providers>
        </>
    );
};

export default page;
