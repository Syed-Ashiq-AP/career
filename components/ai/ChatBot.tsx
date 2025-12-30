"use client";

import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Conversation } from "./Conversation";

const ChatBot = () => {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(message);
  };

  const conversations = useMemo(() => {
    const objectSet: { user: UIMessage; response: UIMessage }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const maybe_response = messages[i + 1];
      if (
        maybe_response &&
        message.role === "user" &&
        maybe_response.role === "assistant"
      ) {
        objectSet.push({ user: message, response: maybe_response });
        i++;
      }
    }
    return objectSet;
  }, [messages]);

  return (
    <div className="flex flex-col items-stretch">
      <div className="pb-10">
        {conversations.map((convo) => (
          <Conversation {...convo} key={convo.response.id} />
        ))}

        {error && (
          <div className="mx-auto my-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            <p className="font-semibold">Error:</p>
            <p>{error.message}</p>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 pb-5 bg-linear-to-t from-background  to-transparent ">
        <PromptInputProvider>
          <PromptInput
            globalDrop
            multiple
            onSubmit={handleSubmit}
            className="max-w-5xl mx-auto bg-background"
          >
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputBody>
              <PromptInputTextarea ref={textareaRef} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools></PromptInputTools>
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
};

export { ChatBot };
