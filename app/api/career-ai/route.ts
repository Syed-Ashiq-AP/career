import { NextResponse } from "next/server";
import { createLLMService } from "../../../lib/ai/llm-service";
import { config } from "dotenv";
config();
import dataset from "../../../data/dataset.json";

export const POST = async (req: Request) => {
    const data = await req.json();
    const answers = data.answers;
    if (!answers) {
        return NextResponse.json({ error: "invalid req" }, { status: 400 });
    }

    const systemPrompt = `You are a career counselor AI. You are to ask questions that can help suggest possible future career options.
    Suggest the next best question and have the options related to the answers (you don't have to have the options exactly from the dataset).
    If the user has answered enough questions then reply with 'evaluate' limit it to 30 questions.
    If not reply with only {"question":"...","options":["option1","option2",...]}
    Below the sample dataset you can use to refer for what type of questions to ask to give your own question and option: ${JSON.stringify(dataset)}`;

    const userPrompt =
        answers.length !== 0
            ? `Based on the user's previous answers: ${JSON.stringify(answers)}. Please generate the next question.`
            : `This is the first question. Please generate an appropriate starting question.`;

    try {
        const llmService = createLLMService({
            baseUrl: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPEN_ROUTER,
            model: "openai/gpt-oss-20b:free",
        });

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

        console.log(aiResponseText);

        try {
            const question = JSON.parse(aiResponseText);
            return NextResponse.json(
                {
                    question,
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
