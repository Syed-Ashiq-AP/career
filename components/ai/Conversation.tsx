import { UIMessage } from "ai";
import React, { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export const Conversation = React.memo(
  ({ user, response }: { user: UIMessage; response: UIMessage }) => {
    const [throttledResponse, setThrottledResponse] = useState("");
    const lastUpdateRef = useRef(Date.now());

    // Throttle markdown rendering to every 100ms
    useEffect(() => {
      const responseMessage =
        response.parts.find((p) => p.type === "text")?.text || "";
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // Update immediately if it's been more than 100ms, otherwise schedule an update
      if (timeSinceLastUpdate >= 100) {
        setThrottledResponse(responseMessage);
        lastUpdateRef.current = now;
      } else {
        const timeoutId = setTimeout(() => {
          setThrottledResponse(responseMessage);
          lastUpdateRef.current = Date.now();
        }, 100 - timeSinceLastUpdate);

        return () => clearTimeout(timeoutId);
      }
    }, [response]);

    const userMessage = user.parts.find((part) => part.type === "text")?.text;
    return (
      <div className="rounded-lg my-4 bg-card space-y-2 overflow-clip max-w-5xl mx-auto ">
        <Tabs defaultValue="summary">
          <div className="bg-accent rounded-b-lg p-1 sticky top-0 shadow-lg">
            <div className="p-2">{userMessage}</div>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="summary" className="py-2 px-4">
            <div className="markdown-content">
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {throttledResponse}
              </Markdown>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

Conversation.displayName = "Conversation";
