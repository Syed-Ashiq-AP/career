import { generateObject } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { query, toolTypes } = await req.json(); // toolTypes: string[]

        const schemas: Record<string, any> = {
            sources: z.object({
                sources: z.array(
                    z.object({
                        title: z.string(),
                        url: z.string(),
                        description: z.string(),
                        type: z.enum([
                            "article",
                            "report",
                            "research",
                            "website",
                            "news",
                        ]),
                    })
                ),
            }),
            videos: z.object({
                videos: z.array(
                    z.object({
                        title: z.string(),
                        platform: z.string(),
                        url: z.string(),
                        description: z.string(),
                        duration: z.string().optional(),
                    })
                ),
            }),
            colleges: z.object({
                colleges: z.array(
                    z.object({
                        name: z.string(),
                        location: z.string(),
                        programs: z.array(z.string()),
                        ranking: z.string().optional(),
                        admissionInfo: z.string().optional(),
                    })
                ),
            }),
            careers: z.object({
                careers: z.array(
                    z.object({
                        title: z.string(),
                        description: z.string(),
                        similarity: z.string(),
                        avgSalary: z.string().optional(),
                    })
                ),
            }),
            salary: z.object({
                position: z.string(),
                insights: z.array(
                    z.object({
                        experienceLevel: z.string(),
                        salaryRange: z.string(),
                        location: z.string(),
                        topCompanies: z.array(z.string()).optional(),
                    })
                ),
            }),
            companies: z.object({
                companies: z.array(
                    z.object({
                        name: z.string(),
                        industry: z.string(),
                        roles: z.array(z.string()),
                        location: z.string(),
                        companySize: z.string().optional(),
                    })
                ),
            }),
            roadmap: z.object({
                career: z.string(),
                phases: z.array(
                    z.object({
                        phase: z.string(),
                        duration: z.string(),
                        skills: z.array(z.string()),
                        milestones: z.array(z.string()),
                        resources: z.array(z.string()),
                    })
                ),
            }),
            courses: z.object({
                courses: z.array(
                    z.object({
                        name: z.string(),
                        provider: z.string(),
                        type: z.enum([
                            "certification",
                            "course",
                            "bootcamp",
                            "degree",
                        ]),
                        duration: z.string(),
                        cost: z.string(),
                        level: z.enum(["beginner", "intermediate", "advanced"]),
                        url: z.string().optional(),
                    })
                ),
            }),
            skills: z.object({
                career: z.string(),
                skillCategories: z.array(
                    z.object({
                        category: z.string(),
                        required: z.array(z.string()),
                        recommended: z.array(z.string()),
                    })
                ),
            }),
            certifications: z.object({
                certifications: z.array(
                    z.object({
                        name: z.string(),
                        provider: z.string(),
                        description: z.string(),
                        duration: z.string(),
                        cost: z.string(),
                        difficulty: z.enum([
                            "beginner",
                            "intermediate",
                            "advanced",
                        ]),
                        benefits: z.string(),
                        url: z.string().optional(),
                    })
                ),
            }),
            interview: z.object({
                position: z.string(),
                tips: z.array(
                    z.object({
                        category: z.string(),
                        description: z.string(),
                        examples: z.array(z.string()),
                    })
                ),
            }),
            projects: z.object({
                career: z.string(),
                projects: z.array(
                    z.object({
                        title: z.string(),
                        description: z.string(),
                        difficulty: z.enum([
                            "beginner",
                            "intermediate",
                            "advanced",
                        ]),
                        techStack: z.array(z.string()),
                        outcomes: z.string(),
                        estimatedTime: z.string(),
                    })
                ),
            }),
            books: z.object({
                books: z.array(
                    z.object({
                        title: z.string(),
                        author: z.string(),
                        description: z.string(),
                        level: z.enum(["beginner", "intermediate", "advanced"]),
                        keyTakeaways: z.array(z.string()),
                        link: z.string().optional(),
                    })
                ),
            }),
        };

        const prompts: Record<string, string> = {
            sources: `Find relevant sources, articles, reports, and research papers about: ${query}. Focus on credible Indian sources and recent 2024-2025 data.`,
            videos: `Suggest educational videos, online courses, and tutorials about: ${query}. Include popular platforms like YouTube, Coursera, Udemy that are accessible in India.`,
            colleges: `List top colleges and educational institutions in India for: ${query}. Include location, programs, and ranking information.`,
            careers: `Suggest related alternative career paths for someone interested in: ${query}. Explain why they're related and include salary ranges in India.`,
            salary: `Provide detailed salary insights for: ${query} in India. Break down by experience level (Entry, Mid, Senior) and major cities. Include top companies.`,
            companies: `List companies in India that hire for: ${query}. Include industry, roles, locations, and company size.`,
            roadmap: `Create a detailed career roadmap for: ${query}. Include 3-4 phases (Beginner, Intermediate, Advanced, Expert) with skills to develop, milestones, typical duration, and learning resources for each phase. Focus on the Indian job market.`,
            courses: `Suggest specific courses and certifications for: ${query}. Include provider (Coursera, NPTEL, Udemy, etc.), type, duration, cost, difficulty level, and URLs if available. Focus on courses accessible in India.`,
            skills: `List required and recommended skills for: ${query}. Organize by categories like Technical Skills, Soft Skills, Tools & Technologies, Domain Knowledge. Separate must-have vs good-to-have skills. Focus on Indian job market requirements.`,
            certifications: `Suggest professional certifications for: ${query}. Include provider, description, duration, cost, difficulty level, career benefits, and URLs. Focus on certifications valued in India.`,
            interview: `Provide interview preparation tips for: ${query}. Organize by categories like Technical Questions, Behavioral Questions, Common Pitfalls. Include examples and best practices for Indian job interviews.`,
            projects: `Suggest portfolio project ideas for: ${query}. Include title, description, difficulty, tech stack, learning outcomes, and estimated time. Projects should be impressive for Indian employers.`,
            books: `Recommend books for learning about: ${query}. Include title, author, description, difficulty level, and key takeaways. Focus on books available in India or online.`,
        };

        if (!Array.isArray(toolTypes) || toolTypes.length === 0) {
            return Response.json(
                { error: "No tool types provided" },
                { status: 400 }
            );
        }

        // Run all tool generations in parallel
        const results = await Promise.all(
            toolTypes.map(async (toolType) => {
                if (!schemas[toolType])
                    return [toolType, { error: "Invalid tool type" }];
                try {
                    const result = await generateObject({
                        model: perplexity("sonar"),
                        schema: schemas[toolType],
                        prompt: prompts[toolType],
                    });
                    return [toolType, result.object];
                } catch (err) {
                    return [toolType, { error: "Failed to generate data" }];
                }
            })
        );

        // Build response object
        const responseObj: Record<string, any> = {};
        for (const [toolType, data] of results) {
            responseObj[toolType] = data;
        }

        return Response.json(responseObj);
    } catch (error) {
        console.error("Generate Tools Error:", error);
        return Response.json(
            { error: "Failed to generate structured data" },
            { status: 500 }
        );
    }
}
