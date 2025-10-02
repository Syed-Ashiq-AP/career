"use client";

import AiView from "@/components/page-layout/evaluate/ai-view";
import { EvaluateContextProvider } from "@/components/providers/career-evaluation-provider";
import React from "react";

const Page = () => {
    return (
        <EvaluateContextProvider>
            <AiView />
        </EvaluateContextProvider>
    );
};

export default Page;
