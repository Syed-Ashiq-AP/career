import { ChatBot } from "@/components/ai/ChatBot";
import { Sidebar } from "@/components/side-panel/sidebar";
import React from "react";

export default function page() {
    return (
        <div>
            <Sidebar />
            <ChatBot />
        </div>
    );
}
