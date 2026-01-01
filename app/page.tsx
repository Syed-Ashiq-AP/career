import { ChatBot } from "@/components/ai/ChatBot";
import React from "react";

export default function page() {
    return (
        <main className="flex flex-col overflow-hidden w-full">
            <ChatBot />
        </main>
    );
}
