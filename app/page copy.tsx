import { ChatBot } from "@/components/ai/ChatBot";
import React from "react";

export default function page() {
  return (
    <div className="size-full max-w-5xl mx-auto flex flex-col gap-2 p-2">
      <ChatBot />
    </div>
  );
}
