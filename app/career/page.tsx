"use client";
import { QuestionProvider } from "@/components/question-context";
import Survey from "@/components/survey/survey";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const page = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <QuestionProvider>
                <div className="h-dvh flex items-center justify-center">
                    <Survey />
                </div>
            </QuestionProvider>
        </QueryClientProvider>
    );
};

export default page;
