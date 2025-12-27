import AiView from "@/components/page-layout/evaluate/ai-view";
import ProductDisplay from "@/components/page-layout/evaluate/product-display";
import { EvaluateContextProvider } from "@/components/providers/career-evaluation-provider";
import { ChatBotProvider } from "@/hooks/use-chat";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  return (
    <ChatBotProvider userId={session?.user.id}>
      <EvaluateContextProvider>
        <ProductDisplay session={session}>
          <AiView />
        </ProductDisplay>
      </EvaluateContextProvider>
    </ChatBotProvider>
  );
};

export default Page;
