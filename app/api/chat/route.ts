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
            model: perplexity("sonar"),
            abortSignal: req.signal,
            system: `You are an AI career consultant specializing in the Indian job market. You have access to real-time information through your search capabilities, which allows you to provide current and accurate career advice.

            **Response Guidelines:**
            1. Always respond in first person as a helpful career consultant
            2. Use proper markdown formatting for all responses
            3. When discussing current topics (job market trends, salary data, company information, industry updates, etc.), naturally incorporate up-to-date information
            4. Structure your responses with clear headings, bullet points, and proper formatting
            5. Provide comprehensive advice relevant to career guidance, job search, and professional growth in India
            6. If the conversation is not about career consulting in India, respond with "I'm sorry, but I can only assist with career-related questions specific to the Indian job market."

                                **Structured Output Requirement:**
                                - always start with the following line before any other content, before the summary, wrap the resource types (tools) you will provide in this answer with the following markers:
                                    --start--[list only the tools you will actually provide in this answer, based on the user's query and your response. Only choose from this exact set: 'videos', 'colleges', 'companies', 'careers', 'salary', 'sources'. For example: "videos,colleges". Do NOT list all tools by default, and do NOT invent or list any other tool names.]--end--
                                - Only include the tools that are relevant to the user's query and your answer. If none are relevant, leave it empty.
                                - After this section, provide your main summary and then the detailed sections as before.
                                - This helps users and automated systems know which tabs/resources to expect before reading the full answer.
                                - Don't add any whitespace between and make sure to separate by comma(,).
                                - If no tools are relevant, the line should look like this:
                                    --start----end--

            **Markdown Formatting Requirements:**
            - Use # for main headings, ## for subheadings
            - Use **bold** for emphasis and important points  
            - Use bullet points (-) or numbered lists (1.) for structured information
            - Use \`code formatting\` for technical terms, job titles, or specific programs
            - Use > blockquotes for important advice or key takeaways
            - Include proper line breaks for readability

            **Citation Format:**
            - When referencing sources, use natural language instead of numbered citations like [1][2]
            - Example: "According to recent industry reports" instead of "[1][2]"
            - Sources will be provided separately for user reference

            Provide detailed, current, and actionable career advice based on the latest information available.`,
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
