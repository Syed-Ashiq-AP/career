import { ConversationMessage } from "@/lib/generated/prisma";
import React, { useMemo, useState } from "react";
import Markdown from "react-markdown";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: string | React.ReactNode | any;
};
export interface Metadata {
    tabs?: TabData[];
}

const getTabTemplate = (data: TabData, message: ConversationMessage): Tab => {
    const tabType = data.type;
    switch (tabType) {
        case "summary":
            return {
                title: "Summary",
                value: "summary",
                content: (
                    <div
                        key={`search-${message.id}-${tabType}`}
                        className="markdown-content"
                    >
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {data.items[0].content || ""}
                        </Markdown>
                    </div>
                ),
            };
        case "images":
            return {
                title: "Images",
                value: "images",
                content: (
                    <div
                        key={`images-${message.id}-${tabType}`}
                        className="flex flex-wrap"
                    >
                        <Images images={data.items as ImageResult[]} />
                    </div>
                ),
            };

        case "videos":
            return {
                title: "Videos",
                value: "videos",
                content: (
                    <div
                        key={`videos-${message.id}-${tabType}`}
                        className="flex flex-wrap"
                    >
                        <Videos videos={data.items as VideoResult[]} />
                    </div>
                ),
            };

        case "search":
            return {
                title: "Sources",
                value: "sources",
                content: (
                    <div
                        key={`sources-${message.id}-${tabType}`}
                        className="flex flex-wrap"
                    >
                        <Sources />
                    </div>
                ),
            };
    }
};

const ChatBox = ({ message }: { message: ConversationMessage }) => {
    const metadata = message.metadata as Metadata;
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

    const tabContent = useMemo(
        () =>
            tabs
                .map((tab) => getTabTemplate(tab, message))
                .filter((msg) => msg),
        [tabs, message]
    );

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
                className={cn("mt-12 ")}
            />
        </div>
    );

    // const responseLength = message.response?.length || 0;
    // const imagesLength =
    //     (message.searchResult as { images?: ImageResult[] })?.images?.length ||
    //     0;
    // const videosLength =
    //     (message.searchResult as { videos?: VideoResult[] })?.videos?.length ||
    //     0;

    // const forceUpdateKey = `${responseLength}-${imagesLength}-${videosLength}`;

    // const tabs: Tab[] = [
    //     {
    //         title: "Summary",
    //         value: "summary",
    //         content: (
    //             <div
    //                 key={`search-${message.id}-${responseLength}`}
    //                 className="markdown-content"
    //             >
    //                 <Markdown remarkPlugins={[remarkGfm]}>
    //                     {message.response || ""}
    //                 </Markdown>
    //             </div>
    //         ),
    //     },
    //     {
    //         title: "Images",
    //         value: "images",
    //         content: (
    //             <div
    //                 key={`images-${message.id}-${imagesLength}`}
    //                 className="flex flex-wrap"
    //             >
    //                 <Images
    //                     images={
    //                         (message.searchResult as { images?: ImageResult[] })
    //                             ?.images
    //                     }
    //                 />
    //             </div>
    //         ),
    //     },
    //     {
    //         title: "Videos",
    //         value: "videos",
    //         content: (
    //             <div
    //                 key={`videos-${message.id}-${videosLength}`}
    //                 className="flex flex-wrap"
    //             >
    //                 <Videos
    //                     videos={
    //                         (message.searchResult as { videos?: VideoResult[] })
    //                             ?.videos
    //                     }
    //                 />
    //             </div>
    //         ),
    //     },
    // ];

    // return (
    //     <div className="w-full flex flex-col items-stretch space-y-4 ">
    //         <Tabs
    //             query={message.query}
    //             tabs={tabs}
    //             id={message.id}
    //             forceUpdateKey={forceUpdateKey}
    //         />
    //     </div>
    // );
};

export default ChatBox;
