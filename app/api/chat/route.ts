import { convertToModelMessages, streamText } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { AIMessage } from "@/lib/UIMessage";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages }: { messages: AIMessage[] } = await req.json();

        const modelMessages = await convertToModelMessages(messages);

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
        return new Response(
            JSON.stringify({ error: "Failed to process chat request" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
