export const maxDuration = 60;

const CAREER_AI_API = "https://career-ai-foe7.onrender.com/api";

interface CareerAnswer {
    questionId: string;
    optionId: string;
}

export async function POST(req: Request) {
    try {
        const { action, answers, questionId, optionId } = await req.json();

        // Get all questions
        if (action === "get_questions") {
            const response = await fetch(`${CAREER_AI_API}/questions`);
            const data = await response.json();

            return new Response(
                JSON.stringify({
                    questions: data.questions,
                    total: data.total_questions,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate answer
        if (action === "validate_answer") {
            const response = await fetch(`${CAREER_AI_API}/validate-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: questionId,
                    option_id: optionId,
                }),
            });
            const data = await response.json();

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get recommendations
        if (action === "get_recommendations") {
            // Convert answers array to the format expected by career-ai API
            const answersMap: Record<string, string> = {};
            if (Array.isArray(answers)) {
                answers.forEach((answer: CareerAnswer) => {
                    answersMap[answer.questionId] = answer.optionId;
                });
            }

            const response = await fetch(`${CAREER_AI_API}/recommendations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: answersMap,
                    top_n: 5,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    "Failed to get recommendations from career-ai API"
                );
            }

            const data = await response.json();

            return new Response(
                JSON.stringify({
                    recommendations: data.recommendations,
                    rawData: data,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Career Survey API Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process career survey request",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
