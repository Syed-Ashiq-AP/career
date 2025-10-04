import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";
import EnhancedProviders from "@/components/page-layout/ai/enhancedProviders";

const EnhancedAIPage = async () => {
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
            <EnhancedProviders userId={session.user.id} />
        </>
    );
};

export default EnhancedAIPage;
