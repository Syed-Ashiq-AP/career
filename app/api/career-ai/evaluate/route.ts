import { NextResponse } from "next/server";
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

    const prompt = `
    You are a career counselor AI. Based on the user's answers: ${JSON.stringify(answers)}, analyze their responses and suggest the top three career options that best match their interests, skills, and preferences.

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

    reply with only JSON alone
    `;

    try {
        const response = await fetch("https://api.a4f.co/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.A4F_API_KEY}`,
            },
            body: JSON.stringify({
                model: "provider-3/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful career guide.",
                    },
                    { role: "user", content: prompt },
                ],
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: errorText }, { status: 500 });
        }
        const data = await response.json();
        const aiResponseText = data.choices[0].message.content;

        // Sanitize and parse the AI response
        try {
            console.log("Raw AI response:", aiResponseText);

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
            console.log("JSON parsing error:", JSON.stringify(e));
            console.log("Failed to parse response:", aiResponseText);
            return NextResponse.json(
                {
                    error: "Failed to parse AI response",
                    details: e instanceof Error ? e.message : "Unknown error",
                },
                { status: 500 }
            );
        }
    } catch (e) {
        console.log("error!", JSON.stringify(e));
        return NextResponse.json({ error: e }, { status: 500 });
    }
};
