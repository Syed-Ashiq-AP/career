import { NextResponse } from "next/server";
import { createLLMService } from "../../../../lib/ai/llm-service";
import { config } from "dotenv";
config();

export const POST = async (req: Request) => {
    try {
        const data = await req.json();
        const { options } = data;

        if (!options || !Array.isArray(options)) {
            return NextResponse.json(
                { error: "Invalid request: options array required" },
                { status: 400 }
            );
        }

        const systemPrompt = `You are a keyword generator AI. Given a list of career-related options or interests, generate a single relevant keyword for each option that can be used to search for representative images.
        The keyword should be concise, visual, and directly related to the option.
        Reply ONLY with a valid JSON array of strings, one keyword per option in the same order.
        Example: ["technology", "nature", "art", "sports"]`;

        const userPrompt = `Generate one visual keyword for each of these options: ${JSON.stringify(options)}`;

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

        console.log("AI Response:", aiResponseText);

        try {
            // Try to extract JSON from the response
            const jsonMatch = aiResponseText.match(/\[.*\]/s);
            const keywords = jsonMatch
                ? JSON.parse(jsonMatch[0])
                : JSON.parse(aiResponseText);

            if (!Array.isArray(keywords)) {
                throw new Error("Response is not an array");
            }

            return NextResponse.json({ keywords }, { status: 200 });
        } catch (e) {
            console.log("JSON parse error:", e);
            // Fallback: use option text as keywords
            const fallbackKeywords = options.map((opt: string) =>
                opt.split(" ")[0].toLowerCase()
            );
            return NextResponse.json(
                { keywords: fallbackKeywords, fallback: true },
                { status: 200 }
            );
        }
    } catch (e) {
        console.log("Error in keywords endpoint:", e);

        if (e instanceof Error && e.message.includes("429")) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded",
                    errorCode: "RATE_LIMIT_EXCEEDED",
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error: "An error occurred while generating keywords",
                errorCode: "INTERNAL_ERROR",
            },
            { status: 500 }
        );
    }
};
