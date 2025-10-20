import { ConversationMessage } from "@/lib/generated/prisma";
import React, { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Images, { ImageResult } from "./images";
import Videos, { VideoResult } from "./videos";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FadeInDiv } from "@/components/ui/tabs";
import Sources from "./sources";

interface TabData {
    type: "search" | "images" | "videos" | "summary";
    title: string;
    items: Array<{
        title?: string;
        link?: string;
        favicon?: string;
        imageUrl?: string;
        content?: string;
    }>;
}

export type Tab = {
    title: string;
    value: string;
    content?: string | React.ReactNode;
};

export interface Metadata {
    tabs?: TabData[];
    sources?: Array<{
        title?: string;
        link?: string;
        favicon?: string;
    }>;
    videos?: Array<{
        title?: string;
        link?: string;
        imageUrl?: string;
    }>;
    images?: Array<{
        title?: string;
        link?: string;
    }>;
    // Perplexity response fields
    citations?: string[];
    searchResults?: Array<{
        title: string;
        url: string;
        date?: string;
    }>;
}

const ChatBox = ({ message }: { message: ConversationMessage }) => {
    const metadata = message.metadata as Metadata;

    const getTabTemplate = useCallback((): Tab[] => {
        // Extract metadata from the message - handle both direct sources and Perplexity format
        const sources =
            metadata?.sources ||
            metadata?.searchResults?.map((result) => ({
                title: result.title,
                link: result.url,
                favicon: "",
            })) ||
            [];

        // Handle Perplexity videos format - videos might be in different structures
        const perplexityVideos = metadata?.videos || [];

        // Also check if videos are mentioned in the content and extract YouTube URLs
        const contentVideos = [];
        if (metadata?.tabs) {
            const summaryTab = metadata.tabs.find(
                (tab) => tab.type === "summary"
            );
            const responseContent = summaryTab?.items?.[0]?.content || "";

            // Extract YouTube URLs with titles from response content
            // Look for patterns like: "Title - https://youtube.com/watch?v=..." or "[Title](https://youtube.com/watch?v=...)"

            // Pattern 1: Markdown links [title](url)
            const markdownRegex =
                /\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#\s)]+))\)/g;
            let match;
            while ((match = markdownRegex.exec(responseContent)) !== null) {
                const title = match[1];
                const url = match[2];
                const videoId = match[3];
                contentVideos.push({
                    title: title,
                    imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    link: url,
                    url: url,
                });
            }

            // Pattern 2: Title followed by URL (common in lists)
            const titleUrlRegex =
                /(?:^|\n)\s*(?:\d+\.?\s*)?([^-\n]+?)\s*[-–—]\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#\s]+))/gm;
            while ((match = titleUrlRegex.exec(responseContent)) !== null) {
                const title = match[1].trim();
                const url = match[2];
                const videoId = match[3];
                // Avoid duplicates
                if (!contentVideos.some((v) => v.url === url)) {
                    contentVideos.push({
                        title: title,
                        imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                        link: url,
                        url: url,
                    });
                }
            }

            // Pattern 3: Just URLs without explicit titles (fallback)
            const urlOnlyRegex =
                /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#\s]+))/g;
            while ((match = urlOnlyRegex.exec(responseContent)) !== null) {
                const url = match[1];
                const videoId = match[2];
                // Avoid duplicates
                if (!contentVideos.some((v) => v.url === url)) {
                    contentVideos.push({
                        title: "YouTube Video", // Generic title for URLs without context
                        imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                        link: url,
                        url: url,
                    });
                }
            }
        }

        // Combine Perplexity videos with content-extracted videos
        const allVideos = [...perplexityVideos, ...contentVideos];
        const images = metadata?.images || [];

        // Convert videos to VideoResult format - handle Perplexity format
        const videoResults: VideoResult[] = allVideos.map((video, index) => {
            // Handle Perplexity video format which may have different property names
            const videoData = video as {
                imageUrl?: string;
                link?: string;
                thumbnail_url?: string;
                url?: string;
                title?: string;
            };

            // For YouTube URLs, generate thumbnail URL with fallback options
            const generateYouTubeThumbnail = (url: string): string => {
                const videoId = url.match(
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
                )?.[1];
                if (!videoId) return "";

                // Try maxresdefault first (high quality), fallback to mqdefault if needed
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            };

            let thumbnailUrl =
                videoData.imageUrl || videoData.thumbnail_url || "";
            const videoUrl = videoData.link || videoData.url || "";
            const videoTitle = videoData.title || `Video ${index + 1}`;

            // If imageUrl contains a video URL instead of thumbnail, generate proper thumbnail
            if (
                thumbnailUrl &&
                (thumbnailUrl.includes("youtube.com/watch") ||
                    thumbnailUrl.includes("youtu.be"))
            ) {
                thumbnailUrl = generateYouTubeThumbnail(thumbnailUrl);
            } else if (
                videoUrl &&
                (videoUrl.includes("youtube.com/watch") ||
                    videoUrl.includes("youtu.be"))
            ) {
                thumbnailUrl = generateYouTubeThumbnail(videoUrl);
            } else if (videoUrl && videoUrl.includes("vimeo.com")) {
                thumbnailUrl = ""; // Will fallback to placeholder in Videos component
            }

            return {
                imageUrl: thumbnailUrl,
                link: videoUrl,
                title: videoTitle,
            };
        });

        // Convert images to ImageResult format
        const imageResults: ImageResult[] = images.map((img) => ({
            title: img.title || "Image",
            link: img.link || "",
        }));

        // Get the response content from the summary tab (created by chatbot.tsx)
        const summaryTab = metadata?.tabs?.find(
            (tab) => tab.type === "summary"
        );
        const responseContent = summaryTab?.items?.[0]?.content || "";

        // Process response content to handle citations properly
        const processedContent = responseContent.replace(/\[(\d+)\]/g, "");

        return [
            {
                title: "Response",
                value: "response",
                content: (
                    <div
                        className={cn(
                            "prose prose-zinc max-w-none dark:prose-invert w-full",
                            "prose-headings:mt-6 prose-headings:mb-4",
                            "prose-p:mb-4 prose-p:leading-7",
                            "prose-ul:my-4 prose-li:my-2",
                            "prose-ol:my-4",
                            "prose-blockquote:my-6 prose-blockquote:border-l-4",
                            "prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-gray-800",
                            "prose-pre:my-6 prose-pre:p-4 prose-pre:rounded-lg prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800",
                            "space-y-4"
                        )}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                pre: ({ children, ...props }) => (
                                    <pre
                                        className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"
                                        {...props}
                                    >
                                        {children}
                                    </pre>
                                ),
                                code: ({ children, ...props }) => (
                                    <code
                                        className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm"
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                ),
                                p: ({ children, ...props }) => (
                                    <p className="mb-4 leading-7" {...props}>
                                        {children}
                                    </p>
                                ),
                                h1: ({ children, ...props }) => (
                                    <h1
                                        className="text-2xl font-bold mt-6 mb-4"
                                        {...props}
                                    >
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children, ...props }) => (
                                    <h2
                                        className="text-xl font-semibold mt-6 mb-4"
                                        {...props}
                                    >
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children, ...props }) => (
                                    <h3
                                        className="text-lg font-medium mt-4 mb-3"
                                        {...props}
                                    >
                                        {children}
                                    </h3>
                                ),
                                ul: ({ children, ...props }) => (
                                    <ul
                                        className="list-disc pl-6 my-4 space-y-2"
                                        {...props}
                                    >
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children, ...props }) => (
                                    <ol
                                        className="list-decimal pl-6 my-4 space-y-2"
                                        {...props}
                                    >
                                        {children}
                                    </ol>
                                ),
                                li: ({ children, ...props }) => (
                                    <li className="my-1 leading-6" {...props}>
                                        {children}
                                    </li>
                                ),
                                blockquote: ({ children, ...props }) => (
                                    <blockquote
                                        className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-6 italic"
                                        {...props}
                                    >
                                        {children}
                                    </blockquote>
                                ),
                            }}
                        >
                            {processedContent}
                        </ReactMarkdown>
                    </div>
                ),
            },
            // Only include tabs that have content
            ...(sources.length > 0
                ? [
                      {
                          title: `Sources (${sources.length})`,
                          value: "sources",
                          content: <Sources sources={sources} />,
                      },
                  ]
                : []),
            ...(videoResults.length > 0
                ? [
                      {
                          title: `Videos (${videoResults.length})`,
                          value: "videos",
                          content: <Videos videos={videoResults} />,
                      },
                  ]
                : []),
            ...(imageResults.length > 0
                ? [
                      {
                          title: `Images (${imageResults.length})`,
                          value: "images",
                          content: <Images images={imageResults} />,
                      },
                  ]
                : []),
        ];
    }, [metadata]);

    const tabs: TabData[] = useMemo(
        () =>
            metadata?.tabs || [
                {
                    type: "summary",
                    title: "Summary",
                    items: [{ content: "" }],
                },
            ],
        [metadata?.tabs]
    );

    const tabContent = useMemo(() => getTabTemplate(), [getTabTemplate]);

    const [activeTab, setActiveTab] = useState<Tab>(tabContent[0]);

    return (
        <div className="w-full flex flex-col items-stretch space-y-4 ">
            <div className="sticky top-0 z-15 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-b-xl">
                <p className="capitalize text-lg font-semibold mb-4 w-8/12 text-center lg:text-left lg:w-full truncate mx-auto">
                    {message.content}
                </p>

                <div className="flex flex-row items-center justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-4">
                    {tabContent.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "relative px-4 py-2 rounded-full mr-2 transition-colors",
                                activeTab.value === tab.value
                                    ? "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white"
                                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                            )}
                        >
                            {activeTab.value === tab.value && (
                                <motion.div
                                    layoutId={`tab-indicator-${message.id}`}
                                    transition={{
                                        type: "spring",
                                        bounce: 0.3,
                                        duration: 0.6,
                                    }}
                                    className="absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full"
                                />
                            )}
                            <span className="relative">{tab.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            <FadeInDiv
                id={message.id}
                active={activeTab}
                tabs={tabContent}
                key={`${activeTab.value}-${tabs.length}`}
                className={cn("mt-12")}
            />
        </div>
    );
};

export default ChatBox;
