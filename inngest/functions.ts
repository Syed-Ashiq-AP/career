import { PrismaClient } from "@/lib/generated/prisma";
import { inngest } from "./client";

export const llmodel = inngest.createFunction(
    { id: "llm-model" },
    { event: "llm-model" },
    async ({ event, step }) => {
        const aiResp = await step.ai.infer("generate-ai-llm-model-call", {
            model: step.ai.models.openai({
                model: "provider-3/gpt-4o-mini",
                apiKey: process.env.A4F_API_KEY,
                baseUrl: "https://api.a4f.co/v1",
            }),
            body: {
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a career consultant. Only answer career-related questions. If the query is not related to careers, reply with: 'Sorry, I can only assist with career-related questions.' Always respond in proper markdown format with only the answer. Use the provided search results to give comprehensive and accurate career advice.",
                    },
                    {
                        role: "user",
                        content: `User Question: ${event.data.searchInput}
                        
Search Results: ${JSON.stringify(event.data.searchResult)}

Please provide a comprehensive career-related answer to the user's question using the search results above. If the question is not career-related, respond with: 'Sorry, I can only assist with career-related questions.'`,
                    },
                ],
            },
        });

        await step.run("saveToDb", async () => {
            const choices = aiResp.choices;
            const response = choices[0].message.content;
            const prisma = new PrismaClient();
            try {
                await prisma.message.update({
                    where: {
                        id: event.data.id,
                    },
                    data: {
                        response: response,
                        searchResult: event.data.searchResult,
                    },
                });
                return aiResp;
            } catch (e) {
                console.log(e);
            } finally {
                await prisma.$disconnect();
            }
        });
    }
);
