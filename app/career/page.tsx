"use client";
import { QuestionProvider } from "@/components/question-context";
import Survey from "@/components/survey/survey";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "@/components/nav-bar/nav-bar";

const queryClient = new QueryClient();

const page = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <QuestionProvider>
                <div className="h-dvh w-dvw flex flex-col">
                    <Navbar />
                    <div className=" h-full flex items-center justify-center">
                        <Survey />
                    </div>
                </div>
            </QuestionProvider>
        </QueryClientProvider>
    );
};

export default page;
