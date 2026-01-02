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
    Map,
    BookMarked,
    Target,
    Award,
    MessageSquare,
    Code,
    Book,
    MapPin,
    Trophy,
    IndianRupee,
    Timer,
    TriangleAlert,
    Sparkles,
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
    RoadmapPhase,
    Course,
    SkillCategory,
    Certification,
    InterviewTip,
    Project,
    Book as BookType,
} from "@/lib/UIMessage";
import { ChatStatus } from "ai";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

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
            roadmap: "provide_career_roadmap",
            courses: "suggest_courses",
            skills: "provide_required_skills",
            certifications: "suggest_certifications",
            interview: "provide_interview_tips",
            projects: "suggest_projects",
            books: "recommend_books",
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

    const getToolTabName = (toolKey: string): string => {
        const mapping: Record<string, string> = {
            provide_sources: "sources",
            suggest_videos: "videos",
            list_colleges: "colleges",
            suggest_related_careers: "careers",
            provide_salary_insights: "salary",
            list_companies: "companies",
            provide_career_roadmap: "roadmap",
            suggest_courses: "courses",
            provide_required_skills: "skills",
            suggest_certifications: "certifications",
            provide_interview_tips: "interview",
            suggest_projects: "projects",
            recommend_books: "books",
        };
        return mapping[toolKey] || toolKey;
    };

    const firstAvailableTab =
        Object.keys(tools).length > 0
            ? getToolTabName(Object.keys(tools)[0])
            : "summary";

    return (
        <div className="rounded-lg my-4 bg-card overflow-clip max-w-5xl mx-2 lg:mx-auto  ">
            <Tabs defaultValue={firstAvailableTab} className="gap-0">
                <div className="bg-accent p-1">
                    <div className="p-2 font-semibold max-h-10 truncate">
                        {userMessage}
                    </div>
                </div>
                <TabsList className="flex-wrap w-full h-auto sticky top-0 shadow-lg z-10 rounded-none py-2 rounded-b-lg mb-2">
                    <TabsTrigger value="summary">
                        <FileSpreadsheet className="size-5 mr-1" />
                        <span className="hidden md:inline">Summary</span>
                    </TabsTrigger>
                    {tools.provide_sources && (
                        <TabsTrigger value="sources">
                            <BookOpen className="size-5 mr-1" />
                            <span className="hidden md:inline">Sources</span>
                        </TabsTrigger>
                    )}
                    {tools.suggest_videos && (
                        <TabsTrigger value="videos">
                            <Play className="size-5 mr-1" />
                            <span className="hidden md:inline">Videos</span>
                        </TabsTrigger>
                    )}
                    {tools.list_colleges && (
                        <TabsTrigger value="colleges">
                            <GraduationCap className="size-5 mr-1" />
                            <span className="hidden md:inline">Colleges</span>
                        </TabsTrigger>
                    )}
                    {tools.suggest_related_careers && (
                        <TabsTrigger value="careers">
                            <Briefcase className="size-5 mr-1" />
                            <span className="hidden md:inline">
                                Related Careers
                            </span>
                        </TabsTrigger>
                    )}
                    {tools.provide_salary_insights && (
                        <TabsTrigger value="salary">
                            <DollarSign className="size-5 mr-1" />
                            <span className="hidden md:inline">
                                Salary Insights
                            </span>
                        </TabsTrigger>
                    )}
                    {tools.list_companies && (
                        <TabsTrigger value="companies">
                            <Building2 className="size-5 mr-1" />
                            <span className="hidden md:inline">Companies</span>
                        </TabsTrigger>
                    )}
                    {tools.provide_career_roadmap && (
                        <TabsTrigger value="roadmap">
                            <Map className="size-5 mr-1" />
                            <span className="hidden md:inline">Roadmap</span>
                        </TabsTrigger>
                    )}
                    {tools.suggest_courses && (
                        <TabsTrigger value="courses">
                            <BookMarked className="size-5 mr-1" />
                            <span className="hidden md:inline">Courses</span>
                        </TabsTrigger>
                    )}
                    {tools.provide_required_skills && (
                        <TabsTrigger value="skills">
                            <Target className="size-5 mr-1" />
                            <span className="hidden md:inline">Skills</span>
                        </TabsTrigger>
                    )}
                    {tools.suggest_certifications && (
                        <TabsTrigger value="certifications">
                            <Award className="size-5 mr-1" />
                            <span className="hidden md:inline">
                                Certifications
                            </span>
                        </TabsTrigger>
                    )}
                    {tools.provide_interview_tips && (
                        <TabsTrigger value="interview">
                            <MessageSquare className="size-5 mr-1" />
                            <span className="hidden md:inline">Interview</span>
                        </TabsTrigger>
                    )}
                    {tools.suggest_projects && (
                        <TabsTrigger value="projects">
                            <Code className="size-5 mr-1" />
                            <span className="hidden md:inline">Projects</span>
                        </TabsTrigger>
                    )}
                    {tools.recommend_books && (
                        <TabsTrigger value="books">
                            <Book className="size-5 mr-1" />
                            <span className="hidden md:inline">Books</span>
                        </TabsTrigger>
                    )}
                </TabsList>
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
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-semibold text-lg">
                                                    {college.name}
                                                </h3>
                                                {college.location && (
                                                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                        <MapPin size={18} />
                                                        {college.location}
                                                    </div>
                                                )}
                                                {college.ranking && (
                                                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                        <Trophy size={18} />
                                                        {college.ranking}
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
                                                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                        <IndianRupee
                                                            size={18}
                                                        />
                                                        {career.avgSalary}
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

                                                        {insight.location && (
                                                            <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                                <MapPin
                                                                    size={18}
                                                                />
                                                                {
                                                                    insight.location
                                                                }
                                                            </div>
                                                        )}
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
                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Building2 className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                    {company.name}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    🏢 {company.industry}{" "}
                                                    {company.companySize &&
                                                        `• ${company.companySize}`}
                                                </div>

                                                {company.location && (
                                                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                        <MapPin size={18} />
                                                        {company.location}
                                                    </div>
                                                )}
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

                {tools.provide_career_roadmap && (
                    <TabsContent value="roadmap" className="py-2 px-4">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-xl">
                                Career Roadmap:{" "}
                                {tools.provide_career_roadmap.career}
                            </h3>
                            {tools.provide_career_roadmap.phases.map(
                                (phase: RoadmapPhase, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-5 bg-gradient-to-r from-card to-accent/20 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                                    {idx + 1}
                                                </div>
                                                {idx <
                                                    (tools
                                                        .provide_career_roadmap
                                                        ?.phases.length ?? 0) -
                                                        1 && (
                                                    <div className="w-0.5 h-16 bg-primary/30 my-2"></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Map className="w-5 h-5 text-primary" />
                                                    <h4 className="font-semibold text-lg">
                                                        {phase.phase}
                                                    </h4>

                                                    <span className="flex gap-2 items-center text-sm text-muted-foreground ml-auto">
                                                        <Timer size={18} />
                                                        {phase.duration}
                                                    </span>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="flex gap-2 items-center font-medium text-sm mb-2">
                                                        <Target size={18} />
                                                        Skills to Develop:
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {phase.skills.map(
                                                            (
                                                                skill: string,
                                                                i: number
                                                            ) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="flex gap-2 items-center font-medium text-sm mb-2">
                                                        <Trophy size={18} />
                                                        Milestones:
                                                    </div>
                                                    <ul className="space-y-1 ml-4">
                                                        {phase.milestones.map(
                                                            (
                                                                milestone: string,
                                                                i: number
                                                            ) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-sm list-disc"
                                                                >
                                                                    {milestone}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="flex gap-2 items-center text-sm font-medium">
                                                        <IndianRupee
                                                            size={18}
                                                        />
                                                        Learning Resources:
                                                    </div>
                                                    <ul className="space-y-1 ml-4">
                                                        {phase.resources.map(
                                                            (
                                                                resource: string,
                                                                i: number
                                                            ) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-sm list-disc text-muted-foreground"
                                                                >
                                                                    {resource}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.suggest_courses && (
                    <TabsContent value="courses" className="py-2 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tools.suggest_courses.courses.map(
                                (course: Course, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer bg-card"
                                    >
                                        <div className="flex items-start gap-3">
                                            <BookMarked className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base mb-2">
                                                    {course.name}
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="font-medium">
                                                            Provider:
                                                        </span>
                                                        <span>
                                                            {course.provider}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                course.type ===
                                                                "certification"
                                                                    ? "bg-purple-500/10 text-purple-600"
                                                                    : course.type ===
                                                                        "bootcamp"
                                                                      ? "bg-orange-500/10 text-orange-600"
                                                                      : course.type ===
                                                                          "degree"
                                                                        ? "bg-blue-500/10 text-blue-600"
                                                                        : "bg-green-500/10 text-green-600"
                                                            }`}
                                                        >
                                                            {course.type}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                course.level ===
                                                                "beginner"
                                                                    ? "bg-green-500/10 text-green-600"
                                                                    : course.level ===
                                                                        "intermediate"
                                                                      ? "bg-yellow-500/10 text-yellow-600"
                                                                      : "bg-red-500/10 text-red-600"
                                                            }`}
                                                        >
                                                            {course.level}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-muted-foreground">
                                                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                            <Timer size={18} />
                                                            {course.duration}
                                                        </div>
                                                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                            <IndianRupee
                                                                size={18}
                                                            />
                                                            {course.cost}
                                                        </div>
                                                    </div>
                                                    {course.url && (
                                                        <a
                                                            href={course.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                                                        >
                                                            View Course{" "}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.provide_required_skills && (
                    <TabsContent value="skills" className="py-2 px-4">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-xl">
                                Skills for:{" "}
                                {tools.provide_required_skills.career}
                            </h3>
                            {tools.provide_required_skills.skillCategories.map(
                                (category: SkillCategory, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-5 hover:bg-accent/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Target className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg mb-3">
                                                    {category.category}
                                                </h4>

                                                <div className="mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex gap-2 items-center text-sm font-medium">
                                                            <TriangleAlert
                                                                size={18}
                                                            />
                                                            Required (Must-Have)
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {category.required.map(
                                                            (
                                                                skill: string,
                                                                i: number
                                                            ) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setSelectedItem(
                                                                            {
                                                                                type: "skill",
                                                                                title: skill,
                                                                                category:
                                                                                    category.category,
                                                                                required: true,
                                                                            }
                                                                        );
                                                                        setDialogOpen(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className="bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
                                                                >
                                                                    {skill}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex gap-2 items-center text-sm font-medium">
                                                            <Sparkles
                                                                size={18}
                                                            />
                                                            Recommended
                                                            (Good-to-Have)
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {category.recommended.map(
                                                            (
                                                                skill: string,
                                                                i: number
                                                            ) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setSelectedItem(
                                                                            {
                                                                                type: "skill",
                                                                                title: skill,
                                                                                category:
                                                                                    category.category,
                                                                                required: false,
                                                                            }
                                                                        );
                                                                        setDialogOpen(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 text-sm hover:bg-blue-500/20 transition-colors cursor-pointer"
                                                                >
                                                                    {skill}
                                                                </button>
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

                {tools.suggest_certifications && (
                    <TabsContent value="certifications" className="py-2 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tools.suggest_certifications.certifications.map(
                                (cert: Certification, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedItem({
                                                type: "certification",
                                                ...cert,
                                            });
                                            setDialogOpen(true);
                                        }}
                                        className="border rounded-lg p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer bg-card"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Award className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base mb-2">
                                                    {cert.name}
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="text-muted-foreground">
                                                        {cert.provider}
                                                    </div>
                                                    <p className="text-sm line-clamp-2">
                                                        {cert.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                cert.difficulty ===
                                                                "beginner"
                                                                    ? "bg-green-500/10 text-green-600"
                                                                    : cert.difficulty ===
                                                                        "intermediate"
                                                                      ? "bg-yellow-500/10 text-yellow-600"
                                                                      : "bg-red-500/10 text-red-600"
                                                            }`}
                                                        >
                                                            {cert.difficulty}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-muted-foreground">
                                                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                            <Timer size={18} />
                                                            {cert.duration}
                                                        </div>
                                                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                            <IndianRupee
                                                                size={18}
                                                            />
                                                            {cert.cost}
                                                        </div>
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

                {tools.provide_interview_tips && (
                    <TabsContent value="interview" className="py-2 px-4">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-xl">
                                Interview Tips for:{" "}
                                {tools.provide_interview_tips.position}
                            </h3>
                            {tools.provide_interview_tips.tips.map(
                                (tip: InterviewTip, idx: number) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-5 hover:bg-accent/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg mb-2">
                                                    {tip.category}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {tip.description}
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="font-medium text-sm">
                                                        Examples:
                                                    </div>
                                                    {tip.examples.map(
                                                        (
                                                            example: string,
                                                            i: number
                                                        ) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => {
                                                                    setSelectedItem(
                                                                        {
                                                                            type: "interview",
                                                                            category:
                                                                                tip.category,
                                                                            example,
                                                                            description:
                                                                                tip.description,
                                                                        }
                                                                    );
                                                                    setDialogOpen(
                                                                        true
                                                                    );
                                                                }}
                                                                className="bg-accent/50 p-3 rounded text-sm hover:bg-accent transition-colors cursor-pointer"
                                                            >
                                                                • {example}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.suggest_projects && (
                    <TabsContent value="projects" className="py-2 px-4">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-xl">
                                Project Ideas for:{" "}
                                {tools.suggest_projects.career}
                            </h3>
                            {tools.suggest_projects.projects.map(
                                (project: Project, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedItem({
                                                type: "project",
                                                ...project,
                                            });
                                            setDialogOpen(true);
                                        }}
                                        className="border rounded-lg p-5 hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer bg-gradient-to-r from-card to-accent/10"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Code className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-lg">
                                                        {project.title}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-xs font-medium ml-auto ${
                                                            project.difficulty ===
                                                            "beginner"
                                                                ? "bg-green-500/10 text-green-600"
                                                                : project.difficulty ===
                                                                    "intermediate"
                                                                  ? "bg-yellow-500/10 text-yellow-600"
                                                                  : "bg-red-500/10 text-red-600"
                                                        }`}
                                                    >
                                                        {project.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                    {project.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                                        <Timer size={18} />
                                                        {project.estimatedTime}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.techStack
                                                        .slice(0, 5)
                                                        .map(
                                                            (
                                                                tech: string,
                                                                i: number
                                                            ) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            )
                                                        )}
                                                    {project.techStack.length >
                                                        5 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +
                                                            {project.techStack
                                                                .length -
                                                                5}{" "}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}

                {tools.recommend_books && (
                    <TabsContent value="books" className="py-2 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tools.recommend_books.books.map(
                                (book: BookType, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedItem({
                                                type: "book",
                                                ...book,
                                            });
                                            setDialogOpen(true);
                                        }}
                                        className="border rounded-lg p-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer bg-card"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Book className="w-5 h-5 mt-1 shrink-0 text-primary" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base mb-1">
                                                    {book.title}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    by {book.author}
                                                </div>
                                                <p className="text-sm mb-3 line-clamp-2">
                                                    {book.description}
                                                </p>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        book.level ===
                                                        "beginner"
                                                            ? "bg-green-500/10 text-green-600"
                                                            : book.level ===
                                                                "intermediate"
                                                              ? "bg-yellow-500/10 text-yellow-600"
                                                              : "bg-red-500/10 text-red-600"
                                                    }`}
                                                >
                                                    {book.level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedItem?.type === "skill" &&
                                selectedItem.title}
                            {selectedItem?.type === "certification" &&
                                selectedItem.name}
                            {selectedItem?.type === "interview" &&
                                selectedItem.category}
                            {selectedItem?.type === "project" &&
                                selectedItem.title}
                            {selectedItem?.type === "book" &&
                                selectedItem.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem?.type === "skill" && (
                                <div className="space-y-3 text-left mt-4">
                                    <div className="text-base">
                                        <strong>{selectedItem.title}</strong> is
                                        a{" "}
                                        {selectedItem.required
                                            ? "required"
                                            : "recommended"}{" "}
                                        skill in the {selectedItem.category}{" "}
                                        category.
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            About this skill:
                                        </h4>
                                        <div className="text-sm">
                                            {selectedItem.required
                                                ? `This is a must-have skill for this career. Employers expect candidates to have solid proficiency in ${selectedItem.title}. Focus on building strong fundamentals and practical experience.`
                                                : `While not strictly required, ${selectedItem.title} is highly valued by employers and can give you a competitive edge. Consider learning this skill to expand your opportunities.`}
                                        </div>
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            How to learn:
                                        </h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>
                                                Start with online courses
                                                (Coursera, Udemy, freeCodeCamp)
                                            </li>
                                            <li>
                                                Practice through hands-on
                                                projects
                                            </li>
                                            <li>
                                                Join communities and forums for
                                                guidance
                                            </li>
                                            <li>
                                                Build a portfolio showcasing
                                                this skill
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {selectedItem?.type === "certification" && (
                                <div className="space-y-3 text-left mt-4">
                                    <div className="text-base">
                                        {selectedItem.description}
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Benefits:
                                        </h4>
                                        <div className="text-sm">
                                            {selectedItem.benefits}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong>Duration:</strong>{" "}
                                            {selectedItem.duration}
                                        </div>
                                        <div>
                                            <strong>Cost:</strong>{" "}
                                            {selectedItem.cost}
                                        </div>
                                        <div>
                                            <strong>Level:</strong>{" "}
                                            {selectedItem.difficulty}
                                        </div>
                                    </div>
                                    {selectedItem.url && (
                                        <a
                                            href={selectedItem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-primary hover:underline mt-2"
                                        >
                                            Learn More{" "}
                                            <ExternalLink className="size-5" />
                                        </a>
                                    )}
                                </div>
                            )}
                            {selectedItem?.type === "interview" && (
                                <div className="space-y-3 text-left mt-4">
                                    <div className="text-base">
                                        {selectedItem.description}
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Example Response:
                                        </h4>
                                        <div className="text-sm italic">
                                            {selectedItem.example}
                                        </div>
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Tips:
                                        </h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>
                                                Be specific and provide concrete
                                                examples
                                            </li>
                                            <li>
                                                Use the STAR method (Situation,
                                                Task, Action, Result)
                                            </li>
                                            <li>
                                                Practice your response out loud
                                            </li>
                                            <li>
                                                Keep your answer concise (2-3
                                                minutes)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {selectedItem?.type === "project" && (
                                <div className="space-y-3 text-left mt-4">
                                    <div className="text-base">
                                        {selectedItem.description}
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Learning Outcomes:
                                        </h4>
                                        <div className="text-sm">
                                            {selectedItem.outcomes}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Tech Stack:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.techStack?.map(
                                                (tech: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="bg-primary/10 text-primary px-3 py-1 rounded text-sm"
                                                    >
                                                        {tech}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <strong>Estimated Time:</strong>{" "}
                                        {selectedItem.estimatedTime}
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Getting Started:
                                        </h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>
                                                Break the project into smaller
                                                milestones
                                            </li>
                                            <li>
                                                Set up version control
                                                (Git/GitHub)
                                            </li>
                                            <li>
                                                Document your progress and
                                                learnings
                                            </li>
                                            <li>
                                                Deploy and share your project
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {selectedItem?.type === "book" && (
                                <div className="space-y-3 text-left mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        by {selectedItem.author}
                                    </div>
                                    <div className="text-base">
                                        {selectedItem.description}
                                    </div>
                                    <div className="bg-accent/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">
                                            Key Takeaways:
                                        </h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            {selectedItem.keyTakeaways?.map(
                                                (
                                                    takeaway: string,
                                                    i: number
                                                ) => (
                                                    <li key={i}>{takeaway}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div className="text-sm">
                                        <strong>Level:</strong>{" "}
                                        {selectedItem.level}
                                    </div>
                                    {selectedItem.link && (
                                        <a
                                            href={selectedItem.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-primary hover:underline mt-2"
                                        >
                                            View Book{" "}
                                            <ExternalLink className="size-5" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}
