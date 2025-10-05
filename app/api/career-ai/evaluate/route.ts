import { NextResponse } from "next/server";
import { createLLMService } from "../../../../lib/ai/llm-service";
import dataset from "../../../../data/dataset.json";

interface CareerOption {
    title: string;
    description: string;
    match_percentage: number;
}

export const POST = async (req: Request) => {
    const data = await req.json();
    const answers = data.answers;
    if (!answers) {
        return NextResponse.json({ error: "invalid req" }, { status: 400 });
    }

    const systemPrompt = `You are a career counselor AI. Based on user answers, analyze their responses and suggest the top three career options that best match their interests, skills, and preferences.

    Use the provided dataset as a reference to match career paths: ${JSON.stringify(dataset)}

    Provide your response in the following JSON format:
    {
        "careers": [
            {
                "title": "Career Title 1",
                "description": "Very short description of the career and why it matches the user",
                "match_percentage": percentage(e.g.:95)
            },
            {
                "title": "Career Title 2", 
                "description": "Very short description of the career and why it matches the user",
                "match_percentage": percentage(e.g.:95)
            },
            {
                "title": "Career Title 3",
                "description": "Very short description of the career and why it matches the user", 
                "match_percentage": percentage(e.g.:95)
            }
        ],
        "reasoning": "Brief explanation of how you analyzed their answers to arrive at these recommendations"
    }

    Reply with only JSON alone.`;

    const userPrompt = `Based on the user's answers: ${JSON.stringify(answers)}, analyze their responses and provide career recommendations.`;

    try {
        const llmService = createLLMService();

        const messages = [
            {
                role: "system" as const,
                content: systemPrompt,
                metadata: null,
                tokenCount: null,
                finishReason: null,
                id: "",
                conversationId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                role: "user" as const,
                content: userPrompt,
                metadata: null,
                tokenCount: null,
                finishReason: null,
                id: "",
                conversationId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const response = await llmService.generateCompletion(messages);
        const aiResponseText = response.content;

        console.log("Raw AI response:", aiResponseText);

        // Sanitize and parse the AI response
        try {
            // Clean up the response text - remove any markdown code blocks or extra formatting
            let cleanedResponse = aiResponseText.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse
                    .replace(/^```json\s*/, "")
                    .replace(/\s*```$/, "");
            } else if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse
                    .replace(/^```\s*/, "")
                    .replace(/\s*```$/, "");
            }

            const parsedResponse = JSON.parse(cleanedResponse);

            // Validate the response structure
            if (
                !parsedResponse.careers ||
                !Array.isArray(parsedResponse.careers)
            ) {
                throw new Error(
                    "Invalid response structure: missing or invalid careers array"
                );
            }

            // Sanitize each career object
            const sanitizedCareers: CareerOption[] = parsedResponse.careers.map(
                (career: Partial<CareerOption>, index: number) => ({
                    title: career.title || `Career Option ${index + 1}`,
                    description:
                        career.description || "No description available",
                    match_percentage: Math.min(
                        Math.max(career.match_percentage || 0, 0),
                        100
                    ), // Ensure percentage is between 0-100
                })
            );

            return NextResponse.json(
                {
                    careers: sanitizedCareers,
                    reasoning:
                        parsedResponse.reasoning ||
                        "Career recommendations based on your responses",
                },
                { status: 200 }
            );
        } catch (e) {
            console.log("JSON parse error:", JSON.stringify(e));
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }
    } catch (e) {
        console.log("LLM service error:", JSON.stringify(e));

        // Check if it's a rate limit error
        if (e instanceof Error && e.message.includes("429")) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. You have exceeded your current rate limit (RPM or RPD) for your plan. Please try again later.",
                    errorCode: "RATE_LIMIT_EXCEEDED",
                    status: 429,
                },
                { status: 429 }
            );
        }

        // Check for other specific HTTP errors
        if (e instanceof Error && e.message.includes("HTTP")) {
            const statusMatch = e.message.match(/(\d{3})/);
            const status = statusMatch ? parseInt(statusMatch[1]) : 500;

            return NextResponse.json(
                {
                    error: e.message,
                    errorCode: "API_ERROR",
                    status: status,
                },
                { status: status }
            );
        }

        // Generic error fallback
        return NextResponse.json(
            {
                error: "An error occurred while processing your request",
                errorCode: "INTERNAL_ERROR",
            },
            { status: 500 }
        );
    }
};
