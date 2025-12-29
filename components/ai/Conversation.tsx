import { UIMessage } from "ai";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Streamdown } from "streamdown";

export const Conversation = ({
  user,
  response,
}: {
  user: UIMessage;
  response: UIMessage;
}) => {
  const userMessage = user.parts.find((part) => part.type === "text")?.text;
  const responseMessage = response.parts.find(
    (part) => part.type === "text"
  )?.text;
  return (
    <div className="rounded-lg my-4 bg-card space-y-2 overflow-clip max-w-5xl mx-auto ">
      <Tabs defaultValue="summary">
        <div className="bg-accent rounded-b-lg p-1 sticky top-0 shadow-lg">
          <div className="p-2 font-semibold">{userMessage}</div>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary" className="py-2 px-4">
          <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{responseMessage}</Streamdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
