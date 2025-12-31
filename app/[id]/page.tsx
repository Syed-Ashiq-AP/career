import { ChatBot } from "@/components/ai/ChatBot";
import { Navbar } from "@/components/side-panel/navbar";
import React from "react";

export default function page() {
    return (
        <main className="flex flex-col overflow-hidden size-full">
            <Navbar />
            <ChatBot />
        </main>
    );
}
