"use client";
import { useEvaluator } from "@/components/providers/career-evaluation-provider";
import React from "react";
import Suggest from "./suggest";
import Survey from "./survey";
import { Sidebar } from "@/components/side-panel/sidebar";
import { Navbar } from "@/components/side-panel/navbar";

const AiView = () => {
    const evaluatorContext = useEvaluator();

    const { careers, enquireCareer } = evaluatorContext;

    return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-950 px-2 gap-8 flex-wrap">
            <Sidebar /> <Navbar />
            {careers ? (
                <Suggest careers={careers} onGuide={enquireCareer} />
            ) : (
                <Survey />
            )}
        </div>
    );
};

export default AiView;
