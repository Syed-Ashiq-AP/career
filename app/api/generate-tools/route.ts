import { generateObject } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, toolType } = await req.json();

    const schemas: Record<string, any> = {
      sources: z.object({
        sources: z.array(
          z.object({
            title: z.string(),
            url: z.string(),
            description: z.string(),
            type: z.enum(["article", "report", "research", "website", "news"]),
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
    };

    const prompts: Record<string, string> = {
      sources: `Find relevant sources, articles, reports, and research papers about: ${query}. Focus on credible Indian sources and recent 2024-2025 data.`,
      videos: `Suggest educational videos, online courses, and tutorials about: ${query}. Include popular platforms like YouTube, Coursera, Udemy that are accessible in India.`,
      colleges: `List top colleges and educational institutions in India for: ${query}. Include location, programs, and ranking information.`,
      careers: `Suggest related alternative career paths for someone interested in: ${query}. Explain why they're related and include salary ranges in India.`,
      salary: `Provide detailed salary insights for: ${query} in India. Break down by experience level (Entry, Mid, Senior) and major cities. Include top companies.`,
      companies: `List companies in India that hire for: ${query}. Include industry, roles, locations, and company size.`,
    };

    if (!schemas[toolType]) {
      return Response.json({ error: "Invalid tool type" }, { status: 400 });
    }

    const result = await generateObject({
      model: perplexity("sonar"),
      schema: schemas[toolType],
      prompt: prompts[toolType],
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Generate Tools Error:", error);
    return Response.json(
      { error: "Failed to generate structured data" },
      { status: 500 }
    );
  }
}
