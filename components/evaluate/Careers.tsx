"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    TrendingUp,
    Shield,
    Briefcase,
    GraduationCap,
    Lightbulb,
    Target,
    Sparkles,
    Award,
    BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CareersProps {
    recommendations: any;
    onStartOver: () => void;
}

export const Careers = ({ recommendations, onStartOver }: CareersProps) => {
    const router = useRouter();

    // Handle both rawData object and direct array
    const data = recommendations?.recommendations || recommendations;
    const careers = Array.isArray(data) ? data : [];

    const handleGuide = (career: any) => {
        // Save career details to localStorage
        localStorage.setItem("survey-query", career.career);
        // Redirect to home page
        router.push("/");
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8)
            return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
        if (confidence >= 0.5)
            return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    };

    const getMatchColor = (score: number) => {
        if (score >= 85) return "text-green-600 dark:text-green-400";
        if (score >= 70) return "text-blue-600 dark:text-blue-400";
        return "text-yellow-600 dark:text-yellow-400";
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-primary/5">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                                        Your Career Matches
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-base">
                                    Personalized recommendations for your unique
                                    profile
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={onStartOver}
                                className="shrink-0 border-2 hover:bg-primary hover:text-primary-foreground font-semibold transition-all"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retake Survey
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Career Cards */}
                <div className="space-y-6">
                    {careers.map((career: any, index: number) => (
                        <Card
                            key={index}
                            className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 overflow-hidden"
                        >
                            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className="text-lg font-bold px-3 py-1 bg-primary/10"
                                            >
                                                #{index + 1}
                                            </Badge>
                                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                                                {career.career}
                                            </h2>
                                        </div>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            {career.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <Badge
                                            className={`text-lg font-bold px-4 py-2 ${getMatchColor(career.match_percentage)}`}
                                            variant="outline"
                                        >
                                            {career.match_percentage}% Match
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-6">
                                {/* Salary & Career Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Salary Range
                                            </p>
                                            <p className="font-bold text-foreground">
                                                {career.salary_range}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Growth Potential
                                            </p>
                                            <p className="font-bold text-foreground capitalize">
                                                {career.growth_potential?.replace(
                                                    /-/g,
                                                    " "
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                Job Security
                                            </p>
                                            <p className="font-bold text-foreground capitalize">
                                                {career.job_security?.replace(
                                                    /-/g,
                                                    " "
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                {career.skills && career.skills.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold text-foreground">
                                                Key Skills Required
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {career.skills.map(
                                                (
                                                    skill: string,
                                                    idx: number
                                                ) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="px-3 py-1.5 text-sm font-medium capitalize"
                                                    >
                                                        {skill.replace(
                                                            /-/g,
                                                            " "
                                                        )}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {career.education &&
                                    career.education.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-5 w-5 text-primary" />
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    Education Path
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {career.education.map(
                                                    (
                                                        edu: string,
                                                        idx: number
                                                    ) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="px-3 py-1.5 text-sm font-medium uppercase"
                                                        >
                                                            {edu}
                                                        </Badge>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Interests & Work Style */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {career.interests &&
                                        career.interests.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-semibold text-foreground">
                                                        Matches Your Interests
                                                    </h3>
                                                </div>
                                                <div className="space-y-2">
                                                    {career.interests.map(
                                                        (
                                                            interest: string,
                                                            idx: number
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                <span className="capitalize">
                                                                    {interest.replace(
                                                                        /-/g,
                                                                        " "
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    {career.work_style &&
                                        career.work_style.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-5 w-5 text-primary" />
                                                    <h3 className="text-base font-semibold text-foreground">
                                                        Work Environment
                                                    </h3>
                                                </div>
                                                <div className="space-y-2">
                                                    {career.work_style.map(
                                                        (
                                                            style: string,
                                                            idx: number
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                <span className="capitalize">
                                                                    {style.replace(
                                                                        /-/g,
                                                                        " "
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Guide Button */}
                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={() => handleGuide(career)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                                        size="lg"
                                    >
                                        <BookOpen className="mr-2 h-5 w-5" />
                                        Get AI Career Guide
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Next Steps */}
                <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/5 to-card">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Target className="h-6 w-6 text-primary" />
                            Your Action Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                🎯 This Week
                            </h3>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Research your top 2-3 career choices in
                                        depth
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Connect with professionals on LinkedIn
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Browse online courses (Coursera, Udemy,
                                        NPTEL)
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                📅 1-6 Months
                            </h3>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Enroll in certification programs
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Build portfolio/gain internship
                                        experience
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Join professional communities and forums
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                🚀 1-3 Years
                            </h3>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Complete formal education or specialized
                                        training
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Gain 1-2 years of practical experience
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary mt-1">→</span>
                                    <span className="text-muted-foreground">
                                        Develop specialized expertise in your
                                        field
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
