import AiView from "@/components/page-layout/evaluate/ai-view";
import { EvaluateContextProvider } from "@/components/providers/career-evaluation-provider";
import { ChatBotProvider } from "@/hooks/use-chat";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";

const Page = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) return;

    return (
        <ChatBotProvider userId={session?.user.id}>
            <EvaluateContextProvider>
                <AiView />
            </EvaluateContextProvider>
        </ChatBotProvider>
    );
};

export default Page;
