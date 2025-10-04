import React from "react";
import ChatBot from "@/components/page-layout/ai/chatbot";

import { ChatBotProvider } from "@/hooks/use-chat";
import { Navbar } from "@/components/side-panel/navbar";
import { Sidebar } from "@/components/side-panel/sidebar";
import { RedirectToSignIn } from "@daveyplate/better-auth-ui";

const Providers = ({
    children,
    userId,
    chatId,
}: React.ComponentProps<"div"> & { userId: string; chatId?: string }) => {
    return (
        <ChatBotProvider userId={userId} initialConversationId={chatId}>
            <RedirectToSignIn />
            <Sidebar />{" "}
            <div className="w-full h-full">
                <Navbar />

                <ChatBot />
                {children}
            </div>
        </ChatBotProvider>
    );
};

export default Providers;
