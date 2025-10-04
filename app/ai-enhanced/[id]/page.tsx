import EnhancedProviders from "@/components/page-layout/ai/enhancedProviders";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";

const EnhancedAIChatPage = async ({
    params,
}: {
    params: Promise<{ id?: string }>;
}) => {
    const { id: chatId } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        Authentication Required
                    </h1>
                    <p className="text-muted-foreground">
                        Please sign in to access the enhanced AI chat.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <EnhancedProviders userId={session.user.id} chatId={chatId} />
        </>
    );
};

export default EnhancedAIChatPage;
