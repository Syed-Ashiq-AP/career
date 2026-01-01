import { convertToModelMessages, streamText } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { AIMessage } from "@/lib/UIMessage";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import {
    validateRequestBody,
    createErrorResponse,
    addSecurityHeaders,
    checkRequestSize,
    detectSuspiciousInput,
} from "@/lib/security/middleware";

export const maxDuration = 60;

// Validation schema for chat messages
const messageSchema = z.object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(z.any()).optional(),
    metadata: z.any().optional(),
});

const chatRequestSchema = z.object({
    messages: z.array(messageSchema).min(1).max(50), // Limit message history
});

export async function POST(req: Request) {
    // Apply rate limiting (more restrictive for AI calls)
    const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.AI_CHAT);
    if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);

    // Check request size (limit to 500KB for chat)
    const sizeCheck = await checkRequestSize(req, 500 * 1024);
    if (sizeCheck) return addSecurityHeaders(sizeCheck);

    try {
        // Validate request body
        const validation = await validateRequestBody(req, chatRequestSchema);
        if (!validation.success) {
            return addSecurityHeaders(validation.error);
        }

        const { messages } = validation.data;

        const { messages } = validation.data;

        // Check for suspicious content in messages
        for (const msg of messages) {
            const content = JSON.stringify(msg.parts || []);
            if (detectSuspiciousInput(content)) {
                return addSecurityHeaders(
                    createErrorResponse(
                        "Suspicious content detected in messages",
                        400
                    )
                );
            }
        }

        const modelMessages = await convertToModelMessages(
            messages as AIMessage[]
        );

        const filteredMessages = [];
        let lastRole = "system";

        for (const msg of modelMessages) {
            if (msg.role === "system") {
                continue;
            }
            if (msg.role !== lastRole) {
                filteredMessages.push(msg);
                lastRole = msg.role;
            }
        }

        const result = streamText({
            model: perplexity("sonar-pro"),
            abortSignal: req.signal,
            system: `You are an AI career consultant for the Indian job market. Keep responses short, clear, and actionable.

            **Critical: Response Format**
            1. Start with: --start--[comma-separated tool list]--end--
            2. Then provide 3-5 concise paragraphs (max 150 words total)
            3. Use markdown: **bold**, bullet points, proper headings

            **Available Tools** (select relevant ones only):
            sources, videos, colleges, careers, salary, companies, roadmap, courses, skills, certifications, interview, projects, books

            **Tool Usage:**
            - sources: References, articles, research
            - videos: Video tutorials, online courses
            - colleges: Educational institutions
            - careers: Alternative career paths
            - salary: Compensation data
            - companies: Hiring companies
            - roadmap: Career progression path
            - courses: Specific courses/certifications
            - skills: Required skills breakdown
            - certifications: Professional certifications
            - interview: Interview preparation tips
            - projects: Portfolio project ideas
            - books: Recommended reading

            **Response Style:**
            - Keep it SHORT (150 words max)
            - Be CLEAR and DIRECT
            - Use simple language
            - Focus on actionable advice
            - If not career-related: "I only help with Indian career advice."
            - No numbered citations like [1][2]

            Provide concise, current, actionable advice.`,
            messages: filteredMessages,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return addSecurityHeaders(
            createErrorResponse("Failed to process chat request", 500)
        );
    }
}
