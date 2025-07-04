"use client";
import React from "react";
import { useQuestion } from "../question-context";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const CareerSuggest = () => {
    const questionContext = useQuestion();
    if (!questionContext) return null;
    const { career, isCareerLoading } = questionContext;

    if (isCareerLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                        Your Career Recommendations
                    </h2>
                    <p className="text-muted-foreground">
                        Analyzing your responses...
                    </p>
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="w-full">
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-16" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!career) return null;

    const getRankBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
            case 2:
                return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
            case 3:
                return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
            default:
                return "bg-gradient-to-r from-blue-500 to-blue-700 text-white";
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return "⭐";
        }
    };

    return (
        <div className="space-y-6 mx-10">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Your Career Recommendations
                </h2>
                <p className="text-muted-foreground text-lg">
                    {career.message}
                </p>
            </div>

            <div className="grid gap-6 md:gap-4">
                {career.careers.map((careerItem, index) => (
                    <Card
                        key={index}
                        className="w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500"
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    {careerItem.career}
                                </CardTitle>
                                <div
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getRankBadgeColor(careerItem.rank)}`}
                                >
                                    <span>{getRankIcon(careerItem.rank)}</span>
                                    <span>Rank #{careerItem.rank}</span>
                                </div>
                            </div>
                            <CardDescription className="text-base">
                                Perfect match for your skills and interests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-l-green-500">
                                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                                        Why this career suits you:
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {careerItem.justification}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span>High compatibility match</span>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors">
                                        Learn more →
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-600 dark:text-blue-400">💡</span>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Want to explore these careers further? Let's discuss
                        college planning and course requirements!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CareerSuggest;
