import { z } from "zod";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import {
    validateRequestBody,
    createErrorResponse,
    createSuccessResponse,
    addSecurityHeaders,
    detectSuspiciousInput,
    sanitizeString,
} from "@/lib/security/middleware";

export const maxDuration = 60;

const CAREER_AI_API = "https://career-ai-foe7.onrender.com/api";

interface CareerAnswer {
    questionId: string;
    optionId: string;
}

// Validation schemas
const getQuestionsSchema = z.object({
    action: z.literal("get_questions"),
});

const validateAnswerSchema = z.object({
    action: z.literal("validate_answer"),
    questionId: z.string().min(1).max(100),
    optionId: z.string().min(1).max(100),
});

const getRecommendationsSchema = z.object({
    action: z.literal("get_recommendations"),
    answers: z
        .array(
            z.object({
                questionId: z.string().min(1).max(100),
                optionId: z.string().min(1).max(100),
            })
        )
        .max(50), // Limit to 50 answers max
});

const requestSchema = z.union([
    getQuestionsSchema,
    validateAnswerSchema,
    getRecommendationsSchema,
]);

export async function POST(req: Request) {
    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_STANDARD);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    try {
        // Validate request body
        const validation = await validateRequestBody(req, requestSchema);
        if (!validation.success) {
            return addSecurityHeaders(validation.error);
        }

        const { action, answers, questionId, optionId } =
            validation.data as any;

        // Get all questions
        if (action === "get_questions") {
            const response = await fetch(`${CAREER_AI_API}/questions`);

            if (!response.ok) {
                return addSecurityHeaders(
                    createErrorResponse(
                        "Failed to fetch questions from career-ai API",
                        502
                    )
                );
            }

            const data = await response.json();

            return addSecurityHeaders(
                createSuccessResponse({
                    questions: data.questions,
                    total: data.total_questions,
                })
            );
        }

        // Validate answer
        if (action === "validate_answer") {
            // Check for suspicious input
            if (
                detectSuspiciousInput(questionId) ||
                detectSuspiciousInput(optionId)
            ) {
                return addSecurityHeaders(
                    createErrorResponse("Invalid input detected", 400)
                );
            }

            const response = await fetch(`${CAREER_AI_API}/validate-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: sanitizeString(questionId),
                    option_id: sanitizeString(optionId),
                }),
            });

            if (!response.ok) {
                return addSecurityHeaders(
                    createErrorResponse("Failed to validate answer", 502)
                );
            }

            const data = await response.json();

            return addSecurityHeaders(createSuccessResponse(data));
        }

        // Get recommendations
        if (action === "get_recommendations") {
            // Convert answers array to the format expected by career-ai API
            const answersMap: Record<string, string> = {};
            if (Array.isArray(answers)) {
                answers.forEach((answer: CareerAnswer) => {
                    // Sanitize each answer
                    const cleanQuestionId = sanitizeString(answer.questionId);
                    const cleanOptionId = sanitizeString(answer.optionId);

                    if (
                        !detectSuspiciousInput(cleanQuestionId) &&
                        !detectSuspiciousInput(cleanOptionId)
                    ) {
                        answersMap[cleanQuestionId] = cleanOptionId;
                    }
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
                return addSecurityHeaders(
                    createErrorResponse(
                        "Failed to get recommendations from career-ai API",
                        502
                    )
                );
            }

            const data = await response.json();

            return addSecurityHeaders(
                createSuccessResponse({
                    recommendations: data.recommendations,
                    rawData: data,
                })
            );
        }

        return addSecurityHeaders(createErrorResponse("Invalid action", 400));
    } catch (error) {
        console.error("Career Survey API Error:", error);
        return addSecurityHeaders(
            createErrorResponse("Failed to process career survey request", 500)
        );
    }
}
