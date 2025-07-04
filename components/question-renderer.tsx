"use client";
import React from "react";
import { Option, Question, useQuestion } from "./question-context";
import { Skeleton } from "./ui/skeleton";

const QuestionRenderer = () => {
    const questionContext = useQuestion();
    if (!questionContext) return;
    const { question, questionNumber, totalQuestions, respond, isLoading } =
        questionContext;
    const handleOptionClick = (optionKey: Option) => {
        if (!question) return;
        respond(question?.id, optionKey);
    };

    if (isLoading || !question) {
        return (
            <div className="mx-8 w-full max-w-2xl  p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-700">
                {/* Progress indicator skeleton */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-4 w-32 bg-gray-700" />
                        <Skeleton className="h-4 w-24 bg-gray-700" />
                    </div>
                    <Skeleton className="w-full h-2 bg-gray-700 rounded-full" />
                </div>

                {/* Question text skeleton */}
                <div className="mb-6">
                    <Skeleton className="h-6 w-full mb-2 bg-gray-700" />
                    <Skeleton className="h-6 w-3/4 bg-gray-700" />
                </div>

                {/* Options skeletons */}
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((index) => (
                        <div
                            key={index}
                            className="w-full p-4 rounded-lg border border-gray-600 bg-gray-800"
                        >
                            <div className="flex items-start">
                                <Skeleton className="w-8 h-8 bg-gray-700 rounded-full mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-full bg-gray-700" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instructions skeleton */}
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                    <Skeleton className="h-4 w-2/3 bg-gray-700" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-8 max-w-2xl  p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-700">
            {/* Progress indicator */}

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">
                        Question {questionNumber + 1} of {totalQuestions}
                    </span>
                    <span className="text-sm text-gray-400">
                        {Math.round(
                            ((questionNumber + 1) / totalQuestions) * 100
                        )}
                        % Complete
                    </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${((questionNumber + 1) / totalQuestions) * 100}%`,
                        }}
                    ></div>
                </div>
            </div>

            {/* Question text */}
            <h2 className="text-xl font-semibold text-gray-100 mb-6">
                {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
                {["a", "b", "c", "d"].map(([key, _]) => (
                    <button
                        key={key}
                        onClick={() => handleOptionClick(key as Option)}
                        className="w-full text-left p-4 rounded-lg border border-gray-600 hover:border-blue-400 hover:bg-gray-800 transition-all duration-200 group"
                    >
                        <div className="flex items-start">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-700 group-hover:bg-blue-900 text-gray-300 group-hover:text-blue-300 rounded-full text-sm font-medium mr-3 flex-shrink-0">
                                {key.toUpperCase()}
                            </span>
                            <div className="flex-1">
                                <p className="text-gray-200 font-medium">
                                    {
                                        question.options[
                                            key as keyof Question["options"]
                                        ]
                                    }
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">
                    💡 <strong>Tip:</strong> Choose the option that best
                    describes your preferences or interests. There are no right
                    or wrong answers!
                </p>
            </div>
        </div>
    );
};

export default QuestionRenderer;
