import { NextRequest, NextResponse } from "next/server";
import dataset from "@/data/dataset.json";
import { generateObject } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { z } from "zod";

export async function POST(req: NextRequest) {
    const { user_answers } = await req.json();
    const answers = user_answers || {};

    // Build a summary of user's answers for analysis
    const answerSummary: { answer: string; category: string }[] = [];
    const categoryScores: Record<string, number> = {};
    let allCareers: string[] = [];

    Object.values(answers).forEach((answerData: any) => {
        const category = answerData.category;
        categoryScores[category] = (categoryScores[category] || 0) + 1;
        allCareers = allCareers.concat(answerData.careers || []);
        answerSummary.push({
            answer: answerData.text,
            category,
        });
    });

    // Count career mentions
    const careerCounts: Record<string, number> = {};
    allCareers.forEach((career) => {
        careerCounts[career] = (careerCounts[career] || 0) + 1;
    });

    // Get top mentioned careers
    const sortedCareers = Object.entries(careerCounts).sort(
        (a, b) => b[1] - a[1]
    );
    const topMentionedCareers = sortedCareers
        .slice(0, 10)
        .map(([career]) => career);

    // Sort categories by frequency
    const sortedCategories = Object.entries(categoryScores).sort(
        (a, b) => b[1] - a[1]
    );

    // Perplexity AI integration using generateObject
    let aiCareers: any[] = [];
    let summary = "";
    try {
        const schema = z.object({
            careers: z.array(
                z.object({
                    career: z.string(),
                    match_percentage: z.number(),
                    description: z.string(),
                    category: z.string(),
                })
            ),
            summary: z.string(),
        });

        const systemPrompt = `You are an expert career counselor with deep knowledge of various career paths, market trends, and educational requirements. Analyze the user's answers and provide the top 3 most suitable career recommendations with detailed, personalized explanations. Consider current job market trends, growth potential, and alignment with their interests.`;
        const userPrompt = `Based on this career assessment data, recommend the TOP 3 best career matches:\n\nUser's Answer Pattern:\n${JSON.stringify(answerSummary, null, 2)}\n\nCategory Scores:\n${JSON.stringify(Object.fromEntries(sortedCategories), null, 2)}\n\nFrequently Mentioned Careers:\n${JSON.stringify(topMentionedCareers, null, 2)}\n\nPlease provide EXACTLY 3 career recommendations in JSON format:\n{\n  \"careers\": [\n    {\n      \"career\": \"Career Title\",\n      \"match_percentage\": 95,\n      \"description\": \"2-3 sentence detailed explanation of why this career fits based on their specific answers and current market trends\",\n      \"category\": \"Primary Category\"\n    }\n  ],\n  \"summary\": \"Brief overall assessment of the user's career profile\"\n}\n\nFocus on practical, achievable careers that align with their demonstrated interests and capabilities.`;

        const result = await generateObject({
            model: perplexity("sonar"),
            schema,
            prompt: `${systemPrompt}\n\n${userPrompt}`,
        });

        if (result?.object) {
            aiCareers = (result.object.careers || [])
                .slice(0, 3)
                .map((career: any) => ({
                    career: career.career || "Unknown",
                    mentions: career.match_percentage || 0,
                    description: career.description || "",
                    category: career.category || "",
                }));
            summary = result.object.summary || "";
        }
    } catch (e: any) {
        console.log(e);
        // aiCareers = topMentionedCareers.slice(0, 3).map((career, i) => ({
        //     career,
        //     mentions: sortedCareers[i]?.[1] || 0,
        //     description:
        //         "Based on your answers, this career aligns well with your interests and skills.",
        //     category: sortedCategories[0]?.[0] || "",
        // }));
        // summary =
        //     "Your career profile shows strong alignment with these fields.";
    }

    // Get category information
    const topCategories = sortedCategories.slice(0, 3).map(([cat, score]) => ({
        category: cat,
        score,
        percentage:
            Math.round((score / Object.values(answers).length) * 1000) / 10,
        description: dataset.categories?.[cat]?.description || "",
    }));

    return NextResponse.json({
        categories: topCategories,
        careers: aiCareers,
        summary,
        total_questions: Object.values(answers).length,
        answers_breakdown: categoryScores,
    });
}
