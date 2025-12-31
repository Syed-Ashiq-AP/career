"use client";
import React, { useState, useEffect } from "react";
import CareerCard from "./career-card";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface UserAnswer {
    selected_option: string;
    category: string;
    careers: string[];
    text: string;
}

interface CareerResult {
    career: string;
    mentions: number;
    description?: string;
    category?: string;
}

interface CategoryResult {
    category: string;
    score: number;
    percentage: number;
    description: string;
}

interface CareersProps {
    userAnswers: Record<number, UserAnswer>;
}

export const Careers = ({ userAnswers }: CareersProps) => {
    const [careers, setCareers] = useState<CareerResult[]>([]);
    const [categories, setCategories] = useState<CategoryResult[]>([]);
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_answers: userAnswers,
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch results");

            const data = await response.json();
            setCareers(data.careers || []);
            setSummary(data.summary || "");
            setCategories(data.categories || []);
            setError(null);
        } catch (err) {
            setError(
                "Failed to load career recommendations. Please try again."
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGuide = async (career: string) => {
        localStorage.setItem("survey-query", career);
        redirect("/");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">
                    Analyzing your answers...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <p className="text-destructive">{error}</p>
                <button
                    onClick={fetchResults}
                    className="text-primary underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    const topCareers = careers.slice(0, 3);

    return (
        <div className="flex flex-col items-center gap-6 p-4 w-fit mx-auto overflow-y-auto py-5">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Your Top Career Matches</h1>
                <p className="text-muted-foreground">
                    AI-powered analysis based on your answers
                </p>
                {summary && (
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
                        {summary}
                    </p>
                )}
            </div>

            {categories.length > 0 && (
                <div className="w-full bg-card rounded-lg p-4 border">
                    <h2 className="text-xl font-semibold mb-3">Your Profile</h2>
                    <div className="space-y-2">
                        {categories.map((cat, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between"
                            >
                                <span className="font-medium">
                                    {cat.category}
                                </span>
                                <span className="text-muted-foreground">
                                    {cat.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-6 mx-auto items-center justify-center">
                {topCareers.map((career, index) => {
                    return (
                        <CareerCard
                            key={career.career}
                            career={career.career}
                            rank={index + 1}
                            match={career.mentions}
                            description={career.description || ""}
                            onGuide={handleGuide}
                            isLoading={false}
                        />
                    );
                })}
            </div>
        </div>
    );
};
