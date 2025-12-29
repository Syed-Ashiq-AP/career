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

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;

const ChatBot = () => {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const [enrichedMessages, setEnrichedMessages] = useState<UIMessage[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const enrichedIdsRef = useRef<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enrich the last assistant message with tool data when streaming completes
  useEffect(() => {
    const enrichLastMessage = async () => {
      if (status === "ready" && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];

        if (lastMessage.role === "assistant" && !isEnriching) {
          // Check if we've already enriched this message
          if (enrichedIdsRef.current.has(lastMessage.id)) return;

          const userMessage = messages[messages.length - 2];
          if (!userMessage || userMessage.role !== "user") return;

          const userQuery =
            userMessage.parts.find((p) => p.type === "text")?.text || "";

          // Mark as enriching
          enrichedIdsRef.current.add(lastMessage.id);
          setIsEnriching(true);
          try {
            // Determine which tools to call based on keywords
            const toolsToCall: { type: string; query: string }[] = [];
            const lowerQuery = userQuery.toLowerCase();

            if (
              lowerQuery.includes("college") ||
              lowerQuery.includes("university") ||
              lowerQuery.includes("institution")
            ) {
              toolsToCall.push({ type: "colleges", query: userQuery });
            }
            if (
              lowerQuery.includes("video") ||
              lowerQuery.includes("course") ||
              lowerQuery.includes("tutorial") ||
              lowerQuery.includes("learn")
            ) {
              toolsToCall.push({ type: "videos", query: userQuery });
            }
            if (
              lowerQuery.includes("salary") ||
              lowerQuery.includes("pay") ||
              lowerQuery.includes("compensation")
            ) {
              toolsToCall.push({ type: "salary", query: userQuery });
            }
            if (
              lowerQuery.includes("compan") ||
              lowerQuery.includes("employer")
            ) {
              toolsToCall.push({ type: "companies", query: userQuery });
            }
            if (
              lowerQuery.includes("career") &&
              (lowerQuery.includes("alternative") ||
                lowerQuery.includes("related") ||
                lowerQuery.includes("similar"))
            ) {
              toolsToCall.push({ type: "careers", query: userQuery });
            }
            if (
              lowerQuery.includes("source") ||
              lowerQuery.includes("article") ||
              lowerQuery.includes("research")
            ) {
              toolsToCall.push({ type: "sources", query: userQuery });
            }

            // Always add sources and related careers by default
            if (!toolsToCall.find((t) => t.type === "sources")) {
              toolsToCall.push({ type: "sources", query: userQuery });
            }

            // Call the tools
            const toolResults = await Promise.all(
              toolsToCall.map(async ({ type, query }) => {
                try {
                  const response = await fetch("/api/generate-tools", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toolType: type, query }),
                  });

                  if (!response.ok) return null;

                  const data = await response.json();
                  const toolName =
                    type === "sources"
                      ? "provide_sources"
                      : type === "videos"
                      ? "suggest_videos"
                      : type === "colleges"
                      ? "list_colleges"
                      : type === "careers"
                      ? "suggest_related_careers"
                      : type === "salary"
                      ? "provide_salary_insights"
                      : "list_companies";
                  return {
                    type: "dynamic-tool" as const,
                    toolCallId: `${type}-${Date.now()}`,
                    toolName,
                    state: "output-available" as const,
                    input: { query },
                    output: data,
                  };
                } catch (err) {
                  console.error(`Failed to generate ${type}:`, err);
                  return null;
                }
              })
            );

            // Filter out failed calls and add to message
            const validToolCalls = toolResults.filter((t) => t !== null);

            if (validToolCalls.length > 0) {
              const enrichedMsg: UIMessage = {
                ...lastMessage,
                parts: [...lastMessage.parts, ...validToolCalls],
              };

              setEnrichedMessages((prev) => {
                const others = prev.filter((m) => m.id !== lastMessage.id);
                return [...others, enrichedMsg];
              });
            }
          } catch (err) {
            console.error("Failed to enrich message:", err);
          } finally {
            setIsEnriching(false);
          }
        }
      }
    };

    enrichLastMessage();
  }, [messages, status]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(message);
  };

  // Merge enriched messages with original messages
  const displayMessages = useMemo(() => {
    return messages.map((msg) => {
      const enriched = enrichedMessages.find((e) => e.id === msg.id);
      return enriched || msg;
    });
  }, [messages, enrichedMessages]);

  const conversations = useMemo(() => {
    const objectSet: { user: UIMessage; response: UIMessage }[] = [];
    for (let i = 0; i < displayMessages.length; i++) {
      const message = displayMessages[i];
      const maybe_response = displayMessages[i + 1];
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
  }, [displayMessages]);

  return (
    <div className="flex flex-col items-stretch">
      <div className="pb-10">
        {conversations.map((convo) => (
          <Conversation {...convo} key={convo.response.id} />
        ))}
        {isEnriching && (
          <div className="max-w-5xl mx-auto my-4 p-4 bg-accent/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            Loading additional resources...
          </div>
        )}
        {error && (
          <div className="max-w-5xl mx-auto my-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
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
