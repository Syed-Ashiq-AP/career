"use client";
import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/evaluate/Button";
import { PaginateButton } from "@/components/evaluate/PaginateButton";
import { Careers } from "@/components/evaluate/Careers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Question {
    id: number;
    question: string;
    group: string;
    options: {
        [key: string]: {
            text: string;
            category: string;
            image_keyword: string;
            careers: string[];
            next_questions: number[];
        };
    };
}

interface UserAnswer {
    selected_option: string;
    category: string;
    careers: string[];
    text: string;
}

export const Survey = () => {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
        null
    );
    const [questionHistory, setQuestionHistory] = useState<Question[]>([]);
    const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [futureQuestions, setFutureQuestions] = useState<Question[]>([]);
    const [completed, setCompleted] = useState(false);
    const [optionImages, setOptionImages] = useState<Record<string, string>>(
        {}
    );
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>(
        {}
    );

    // Cache for storing fetched images to avoid redundant API calls
    const imageCache = useRef<Record<string, string>>({});

    // Load initial question on mount
    useEffect(() => {
        startSurvey();
    }, []);

    // Set selected option if current question has been answered before
    useEffect(() => {
        if (currentQuestion && userAnswers[currentQuestion.id]) {
            setSelectedOption(userAnswers[currentQuestion.id].selected_option);
        } else {
            setSelectedOption(null);
        }
    }, [currentQuestion, userAnswers]);

    // Fetch images for current question options
    useEffect(() => {
        if (!currentQuestion) return;

        const fetchImages = async () => {
            try {
                const imageMap: Record<string, string> = {};
                const loadedMap: Record<string, boolean> = {};
                const keywordsToFetch: string[] = [];
                const keywordToOptionKey: Record<string, string> = {};

                // Check cache first and only fetch uncached images
                Object.entries(currentQuestion.options).forEach(
                    ([key, option]) => {
                        const keyword = option.image_keyword;

                        if (imageCache.current[keyword]) {
                            // Use cached image
                            imageMap[key] = imageCache.current[keyword];
                            loadedMap[key] = true; // Cached images are considered loaded
                        } else {
                            // Need to fetch this image
                            keywordsToFetch.push(keyword);
                            keywordToOptionKey[keyword] = key;
                            loadedMap[key] = false; // Mark as not loaded yet
                        }
                    }
                );

                // Set initial state
                setOptionImages(imageMap);
                setLoadedImages(loadedMap);

                // If all images are cached, we're done
                if (keywordsToFetch.length === 0) {
                    return;
                }

                // Fetch only the uncached images
                const response = await fetch("/api/images", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ keywords: keywordsToFetch }),
                });

                if (!response.ok) throw new Error("Failed to fetch images");

                const data = await response.json();

                // Preload images and track when they're loaded
                keywordsToFetch.forEach((keyword, index) => {
                    if (data.images && data.images[index]) {
                        const imageUrl = data.images[index].url;
                        const optionKey = keywordToOptionKey[keyword];

                        // Cache the image
                        imageCache.current[keyword] = imageUrl;

                        // Preload the image
                        const img = new Image();
                        img.onload = () => {
                            setLoadedImages((prev) => ({
                                ...prev,
                                [optionKey]: true,
                            }));
                        };
                        img.onerror = () => {
                            // Even on error, mark as loaded to hide the loading state
                            setLoadedImages((prev) => ({
                                ...prev,
                                [optionKey]: true,
                            }));
                        };
                        img.src = imageUrl;

                        // Update image map
                        setOptionImages((prev) => ({
                            ...prev,
                            [optionKey]: imageUrl,
                        }));
                    }
                });
            } catch (error) {
                console.error("Error fetching images:", error);
                // Mark all as loaded on error
                const loadedMap: Record<string, boolean> = {};
                Object.keys(currentQuestion.options).forEach((key) => {
                    loadedMap[key] = true;
                });
                setLoadedImages(loadedMap);
            }
        };

        fetchImages();
    }, [currentQuestion]);

    const startSurvey = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error("Failed to start survey");

            const data = await response.json();
            setCurrentQuestion(data.question);
            setError(null);
        } catch (err) {
            setError("Failed to load survey. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (optionKey: string) => {
        if (!currentQuestion) return;

        setSelectedOption(optionKey);

        // Check if this is a change to an existing answer
        const isChangingAnswer = answeredQuestions.includes(currentQuestion.id);

        if (isChangingAnswer) {
            // User is changing a previous answer
            // Find the index of this question
            const questionIndex = answeredQuestions.indexOf(currentQuestion.id);

            // Remove all answers after this point
            const newAnsweredQuestions = answeredQuestions.slice(
                0,
                questionIndex + 1
            );
            const newUserAnswers: Record<number, UserAnswer> = {};

            // Keep only answers up to this question
            newAnsweredQuestions.forEach((qId) => {
                if (qId !== currentQuestion.id && userAnswers[qId]) {
                    newUserAnswers[qId] = userAnswers[qId];
                }
            });

            // Add the new answer for this question
            const optionData = currentQuestion.options[optionKey];
            newUserAnswers[currentQuestion.id] = {
                selected_option: optionKey,
                category: optionData.category,
                careers: optionData.careers,
                text: optionData.text,
            };

            // Update question history
            const newQuestionHistory = questionHistory.slice(
                0,
                questionIndex + 1
            );

            setAnsweredQuestions(newAnsweredQuestions);
            setUserAnswers(newUserAnswers);
            setQuestionHistory(newQuestionHistory);

            // Get next question based on new answer
            await getNextQuestion(newAnsweredQuestions, newUserAnswers);
        } else {
            // Normal flow - answering a new question
            const optionData = currentQuestion.options[optionKey];
            const newAnswer: UserAnswer = {
                selected_option: optionKey,
                category: optionData.category,
                careers: optionData.careers,
                text: optionData.text,
            };

            const newAnsweredQuestions = [
                ...answeredQuestions,
                currentQuestion.id,
            ];
            const newUserAnswers = {
                ...userAnswers,
                [currentQuestion.id]: newAnswer,
            };

            const newQuestionHistory = [...questionHistory, currentQuestion];

            setAnsweredQuestions(newAnsweredQuestions);
            setUserAnswers(newUserAnswers);
            setQuestionHistory(newQuestionHistory);
            setFutureQuestions([]);

            // Get next question
            await getNextQuestion(newAnsweredQuestions, newUserAnswers);
        }
    };

    const getNextQuestion = async (
        answered: number[],
        answers: Record<number, UserAnswer>
    ) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answered_questions: answered,
                    user_answers: answers,
                }),
            });

            if (!response.ok) throw new Error("Failed to get next question");

            const data = await response.json();

            if (data.completed) {
                // Survey completed - show results
                setCompleted(true);
            } else {
                setCurrentQuestion(data.question);
                setSelectedOption(null);
            }
        } catch (err) {
            setError("Failed to load next question. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (questionHistory.length === 0) return;

        // Get the previous question from history
        const previousQuestion = questionHistory[questionHistory.length - 1];

        // Save current question to future stack
        if (currentQuestion) {
            setFutureQuestions([currentQuestion, ...futureQuestions]);
        }

        // Remove the current question from answered questions if it was answered
        let newAnsweredQuestions = [...answeredQuestions];
        const newUserAnswers = { ...userAnswers };

        // If current question was answered, remove it
        if (currentQuestion && answeredQuestions.includes(currentQuestion.id)) {
            newAnsweredQuestions = newAnsweredQuestions.filter(
                (id) => id !== currentQuestion.id
            );
            delete newUserAnswers[currentQuestion.id];
        }

        setAnsweredQuestions(newAnsweredQuestions);
        setUserAnswers(newUserAnswers);
        setQuestionHistory(questionHistory.slice(0, -1));
        setCurrentQuestion(previousQuestion);
    };

    const handleNext = () => {
        if (futureQuestions.length === 0) return;

        // Get the next question from future stack
        const nextQuestion = futureQuestions[0];

        // Move current question back to history
        if (currentQuestion) {
            setQuestionHistory([...questionHistory, currentQuestion]);

            // Re-add answer if it exists
            if (userAnswers[currentQuestion.id]) {
                setAnsweredQuestions([
                    ...answeredQuestions,
                    currentQuestion.id,
                ]);
            }
        }

        setFutureQuestions(futureQuestions.slice(1));
        setCurrentQuestion(nextQuestion);
    };

    if (loading && !currentQuestion) {
        return (
            <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:w-md mx-2 md:mx-auto">
                <p className="text-center">Loading survey...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:w-md mx-auto">
                <p className="text-center text-destructive">{error}</p>
                <button
                    onClick={startSurvey}
                    className="text-primary underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!currentQuestion) {
        return null;
    }

    // Show results when completed
    if (completed) {
        return <Careers userAnswers={userAnswers} />;
    }

    const optionKeys = Object.keys(currentQuestion.options);

    return (
        <>
            <PaginateButton
                dir={"left"}
                show={questionHistory.length > 0}
                onClick={handlePrevious}
            />
            <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:w-md mx-2 md:mx-auto">
                <div className="p-2 rounded bg-accent w-fit text-sm">
                    Q{questionHistory.length + 1}
                </div>
                <p className="font-semibold capitalize text-lg">
                    {currentQuestion.question}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {optionKeys.map((key) => (
                        <Button
                            key={key}
                            onClick={() => handleAnswer(key)}
                            disabled={loading}
                            backgroundImage={optionImages[key]}
                            imageLoading={!loadedImages[key]}
                            className={` aspect-square ${
                                selectedOption === key
                                    ? "ring-2 ring-primary "
                                    : ""
                            }`}
                        >
                            {currentQuestion.options[key].text}
                        </Button>
                    ))}
                </div>
                {loading && (
                    <p className="text-sm text-muted-foreground text-center">
                        Loading next question...
                    </p>
                )}
            </div>
            <PaginateButton
                dir={"right"}
                show={futureQuestions.length > 0}
                onClick={handleNext}
            />
        </>
    );
};
