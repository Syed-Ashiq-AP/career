"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Careers } from "./Careers";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Question {
    id: string;
    text: string;
    category: string;
    importance_weight: number;
    options: {
        id: string;
        text: string;
        description: string;
    }[];
}

interface Answer {
    questionId: string;
    optionId: string;
}

export const Survey = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load questions on mount
    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const response = await fetch("/api/career-survey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "get_questions" }),
            });

            const data = await response.json();
            if (data.questions && data.questions.length > 0) {
                setQuestions(data.questions);
            } else {
                setError("Failed to load questions");
            }
        } catch (err) {
            setError("Failed to load questions. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    const totalSteps = questions.length;

    const handleOptionSelect = async (optionId: string, optionText: string) => {
        setSelectedOption(optionId);
        setError(null);

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 200));

        const newAnswers = [
            ...answers,
            { questionId: questions[currentStep].id, optionId },
        ];
        setAnswers(newAnswers);
        setSelectedOption(null);

        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Generate recommendations
            setLoading(true);
            try {
                const response = await fetch("/api/career-survey", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "get_recommendations",
                        answers: newAnswers,
                    }),
                });

                const data = await response.json();
                if (data.recommendations) {
                    // Pass the raw data (recommendations array) instead of markdown
                    setRecommendations(data.rawData || data);
                    setCurrentStep(currentStep + 1);
                } else {
                    setError(
                        "Failed to generate recommendations. Please try again."
                    );
                }
            } catch (err) {
                setError(
                    "Failed to generate recommendations. Please try again."
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0 && !loading) {
            setCurrentStep(currentStep - 1);
            const newAnswers = answers.slice(0, -1);
            setAnswers(newAnswers);
        }
    };

    const handleStartOver = () => {
        setCurrentStep(0);
        setAnswers([]);
        setSelectedOption(null);
        setRecommendations(null);
        setError(null);
    };

    // Show loading state while fetching questions
    if (loading && questions.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                <Card className="w-full max-w-3xl shadow-lg border-2">
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-semibold text-foreground">
                                    Loading Career Assessment
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Preparing your personalized questions...
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show error state
    if (error && questions.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                <Card className="w-full max-w-3xl shadow-lg border-2 border-destructive/50">
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="p-4 bg-destructive/10 rounded-full">
                                <svg
                                    className="h-12 w-12 text-destructive"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-semibold text-destructive">
                                    {error}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Please try again
                                </p>
                            </div>
                            <Button
                                onClick={loadQuestions}
                                size="lg"
                                className="font-semibold"
                            >
                                Retry Loading
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show recommendations
    if (recommendations) {
        return (
            <Careers
                recommendations={recommendations}
                onStartOver={handleStartOver}
            />
        );
    }

    return (
        <div className="w-full h-full flex p-4 sm:p-6 overflow-hidden">
            <Card className="w-full max-w-3xl shadow-lg border-2 mx-auto">
                <CardHeader className="space-y-4 pb-6">
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Career Consultant
                        </CardTitle>
                        <CardDescription className="text-base">
                            Answer {totalSteps} questions to discover your ideal
                            career path
                        </CardDescription>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">
                                Question {currentStep + 1} of {totalSteps}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                                {Math.round(
                                    ((currentStep + 1) / totalSteps) * 100
                                )}
                                % Complete
                            </span>
                        </div>
                        <div className="relative w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">
                                Generating your personalized recommendations...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 flex flex-col h-full overflow-y-hidden">
                            <div className="space-y-4">
                                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full">
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                        {questions[currentStep].category}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-foreground leading-relaxed">
                                    {questions[currentStep].text}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-3 overflow-y-auto">
                                {questions[currentStep].options.map(
                                    (option) => (
                                        <button
                                            key={option.id}
                                            onClick={() =>
                                                handleOptionSelect(
                                                    option.id,
                                                    option.text
                                                )
                                            }
                                            disabled={loading}
                                            className="group relative w-full text-left p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="relative shrink-0 w-6 h-6 mt-0.5">
                                                    <div className="absolute inset-0 rounded-full border-2 border-muted-foreground group-hover:border-primary transition-colors" />
                                                    {selectedOption ===
                                                        option.id && (
                                                        <CheckCircle2 className="absolute inset-0 h-6 w-6 text-primary animate-in zoom-in-50 duration-200" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1.5">
                                                    <span className="block text-base font-medium text-foreground group-hover:text-primary transition-colors">
                                                        {option.text}
                                                    </span>
                                                    {option.description && (
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {option.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>

                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            {/* Show previous answers */}
                            {answers.length > 0 && (
                                <div className="space-y-4 pt-6 border-t-2 border-dashed">
                                    <button
                                        onClick={() => {
                                            const el =
                                                document.getElementById(
                                                    "previous-answers"
                                                );
                                            el?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "nearest",
                                            });
                                        }}
                                        className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    >
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Previous Answers
                                        </h3>
                                        <span className="text-xs font-medium px-2 py-1 bg-primary/20 text-primary rounded-full">
                                            {answers.length}
                                        </span>
                                    </button>
                                    <div
                                        id="previous-answers"
                                        className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                                    >
                                        {answers.map((item, idx) => {
                                            const question = questions[idx];
                                            const selectedOpt =
                                                question?.options.find(
                                                    (opt) =>
                                                        opt.id === item.optionId
                                                );
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-secondary/40 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                                                >
                                                    <p className="font-medium text-xs text-muted-foreground mb-1.5">
                                                        Q{idx + 1}:{" "}
                                                        {question?.text}
                                                    </p>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {selectedOpt?.text}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={loading}
                                    className="w-full h-11 font-semibold border-2 hover:bg-secondary hover:border-primary transition-all"
                                >
                                    ← Back to Previous Question
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
