// Define types for each tool data structure

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Streamdown } from "streamdown";
import {
    ExternalLink,
    GraduationCap,
    Play,
    Briefcase,
    DollarSign,
    Building2,
    BookOpen,
    FileSpreadsheet,
} from "lucide-react";
import {
    AIMessage,
    Career,
    College,
    Company,
    MetaData,
    SalaryInsight,
    Source,
    Tools,
    Video,
} from "@/lib/UIMessage";
import { ChatStatus } from "ai";

export function Conversation({
    status,
    user,
    response,
    setMetaData,
}: {
    status: ChatStatus;
    user: AIMessage;
    response: AIMessage;
    setMetaData: ({ metadata, id }: { id: string; metadata: MetaData }) => void;
}) {
    const userMessage = user.parts.find((part) => part.type === "text")?.text;
    const [tool_calls_string, ...responseMessage] =
        response.parts
            .find((part) => part.type === "text")
            ?.text?.split("\n") ?? [];
    const [isEnriching, setIsEnriching] = useState(false);

    const generatedTools = useRef(false);

    const [tools, setTools] = useState<Tools>(
        typeof response.metadata === "object" &&
            response.metadata &&
            "tools" in response.metadata &&
            typeof response.metadata.tools === "object"
            ? (response.metadata.tools as Tools)
            : {}
    );
    const fetchingTools = useRef(false);

    const fetchTools = useCallback(async () => {
        const matches = /--start--(.*?)--end--/.exec(tool_calls_string);
        if (!matches) {
            fetchingTools.current = false;
            return;
        }
        const capture = (matches[1] ?? "").replace(/\s/g, "").split(",");
        if (capture.length === 0) {
            return;
        }
        const reqresponse = await fetch("/api/generate-tools", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                toolTypes: capture,
                query: userMessage,
            }),
        });

        if (!reqresponse.ok) {
            generatedTools.current = true;
            setTools({});
            return;
        }
        const data = await reqresponse.json();

        const toolTypeToName: Record<string, string> = {
            sources: "provide_sources",
            videos: "suggest_videos",
            colleges: "list_colleges",
            careers: "suggest_related_careers",
            salary: "provide_salary_insights",
            companies: "list_companies",
        };
        const toolsObj: Partial<Tools> = {};
        (Object.entries(data) as [keyof Tools, unknown][])
            .filter(([, value]) => {
                if (!value) return false;
                if (
                    typeof value === "object" &&
                    value !== null &&
                    "error" in value
                ) {
                    return !(value as { error?: boolean }).error;
                }
                return true;
            })
            .forEach(([type, value]) => {
                const key =
                    (toolTypeToName[type as string] as keyof Tools) || type;
                (toolsObj as Record<string, unknown>)[key as string] = value;
            });
        generatedTools.current = true;

        setTools(toolsObj as Tools);
    }, [tool_calls_string, userMessage]);

    useEffect(() => {
        if (fetchingTools.current || generatedTools.current) return;
        fetchingTools.current = true;
        if (
            response.metadata === undefined ||
            !(
                typeof response.metadata === "object" &&
                response.metadata &&
                "tools" in response.metadata &&
                typeof response.metadata.tools === "object"
            )
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsEnriching(true);
            fetchTools().then(() => {
                setIsEnriching(false);
            });
        }
    }, [generatedTools, fetchingTools, response, fetchTools]);

    useEffect(() => {
        if (
            status === "ready" &&
            response.metadata === undefined &&
            generatedTools.current
        ) {
            setMetaData({ metadata: { tools }, id: response.id });
        }
    }, [status, response, setMetaData, tools, generatedTools]);

    return (
        <div className="rounded-lg my-4 bg-card space-y-2 overflow-clip max-w-5xl mx-2 lg:mx-auto  ">
            <Tabs defaultValue="summary">
                <div className="bg-accent rounded-b-lg p-1 sticky top-0 shadow-lg z-10">
                    <div className="p-2 font-semibold max-h-10 truncate">
                        {userMessage}
                    </div>
                    <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="summary">
                            <FileSpreadsheet className="size-5 mr-1" />
                            <span className="hidden md:inline">Summary</span>
                        </TabsTrigger>
                        {tools.provide_sources && (
                            <TabsTrigger value="sources">
                                <BookOpen className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">
                                    Sources
                                </span>
                            </TabsTrigger>
                        )}
                        {tools.suggest_videos && (
                            <TabsTrigger value="videos">
                                <Play className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">Videos</span>
                            </TabsTrigger>
                        )}
                        {tools.list_colleges && (
                            <TabsTrigger value="colleges">
                                <GraduationCap className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">
                                    Colleges
                                </span>
                            </TabsTrigger>
                        )}
                        {tools.suggest_related_careers && (
                            <TabsTrigger value="careers">
                                <Briefcase className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">
                                    Related Careers
                                </span>
                            </TabsTrigger>
                        )}
                        {tools.provide_salary_insights && (
                            <TabsTrigger value="salary">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">
                                    Salary Insights
                                </span>
                            </TabsTrigger>
                        )}
                        {tools.list_companies && (
                            <TabsTrigger value="companies">
                                <Building2 className="w-4 h-4 mr-1" />
                                <span className="hidden md:inline">
                                    Companies
                                </span>
                                Companies
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>
                {isEnriching && (
                    <div className="mx-5 my-4 p-4 bg-accent/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        Loading additional resources...
                    </div>
                )}
                <TabsContent value="summary" className="py-2 px-4">
                    <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{responseMessage.join("\n")}</Streamdown>
                    </div>
                </TabsContent>

                {tools.provide_sources && (
                    <TabsContent value="sources" className="py-2 px-4">
                        <div className="space-y-4">
                            {tools.provide_sources.sources.map(
                                (source: Source, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <ExternalLink className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-primary hover:underline text-lg"
                                                >
                                                    {source.title}
                                                </a>
                                                <div className="text-xs text-muted-foreground mt-1 uppercase">
                                                    {source.type}
                                                </div>
                                                <p className="mt-2 text-sm">
                                                    {source.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.suggest_videos && (
                    <TabsContent value="videos" className="py-2 px-4">
                        <div className="space-y-4">
                            {tools.suggest_videos.videos.map(
                                (video: Video, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Play className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-primary hover:underline text-lg"
                                                >
                                                    {video.title}
                                                </a>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {video.platform}{" "}
                                                    {video.duration &&
                                                        `• ${video.duration}`}
                                                </div>
                                                <p className="mt-2 text-sm">
                                                    {video.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.list_colleges && (
                    <TabsContent value="colleges" className="py-2 px-4">
                        <div className="space-y-4">
                            {tools.list_colleges.colleges.map(
                                (college: College, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <GraduationCap className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">
                                                    {college.name}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    📍 {college.location}
                                                </div>
                                                {college.ranking && (
                                                    <div className="text-sm text-muted-foreground">
                                                        🏆 {college.ranking}
                                                    </div>
                                                )}
                                                <div className="mt-2">
                                                    <div className="font-medium text-sm mb-1">
                                                        Programs:
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {college.programs.map(
                                                            (
                                                                program: string,
                                                                i: number
                                                            ) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                                                                >
                                                                    {program}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                {college.admissionInfo && (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {college.admissionInfo}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.suggest_related_careers && (
                    <TabsContent value="careers" className="py-2 px-4">
                        <div className="space-y-4">
                            {tools.suggest_related_careers.careers.map(
                                (career: Career, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Briefcase className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">
                                                    {career.title}
                                                </h3>
                                                {career.avgSalary && (
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        💰 {career.avgSalary}
                                                    </div>
                                                )}
                                                <p className="mt-2 text-sm">
                                                    {career.description}
                                                </p>
                                                <div className="mt-2 text-sm text-muted-foreground italic">
                                                    <strong>
                                                        Why relevant:
                                                    </strong>{" "}
                                                    {career.similarity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.provide_salary_insights && (
                    <TabsContent value="salary" className="py-2 px-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-xl mb-4">
                                {tools.provide_salary_insights.position}
                            </h3>
                            {tools.provide_salary_insights.insights.map(
                                (insight: SalaryInsight, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <DollarSign className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {
                                                                insight.experienceLevel
                                                            }
                                                        </h4>
                                                        <div className="text-sm text-muted-foreground">
                                                            📍{" "}
                                                            {insight.location}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-lg text-primary">
                                                            {
                                                                insight.salaryRange
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                {insight.topCompanies &&
                                                    insight.topCompanies
                                                        .length > 0 && (
                                                        <div className="mt-2">
                                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                                                Top Companies:
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {insight.topCompanies.map(
                                                                    (
                                                                        company: string,
                                                                        i: number
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="bg-accent px-2 py-0.5 rounded text-xs"
                                                                        >
                                                                            {
                                                                                company
                                                                            }
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.list_companies && (
                    <TabsContent value="companies" className="py-2 px-4">
                        <div className="space-y-4">
                            {tools.list_companies.companies.map(
                                (company: Company, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Building2 className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">
                                                    {company.name}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    🏢 {company.industry}{" "}
                                                    {company.companySize &&
                                                        `• ${company.companySize}`}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    📍 {company.location}
                                                </div>
                                                <div className="mt-2">
                                                    <div className="font-medium text-sm mb-1">
                                                        Hiring for:
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {company.roles.map(
                                                            (
                                                                role: string,
                                                                i: number
                                                            ) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                                                                >
                                                                    {role}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
