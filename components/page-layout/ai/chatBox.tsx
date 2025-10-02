import { Tab, Tabs } from "@/components/ui/tabs";
import { Message } from "@/lib/generated/prisma";
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Images, { ImageResult } from "./images";
import Videos, { VideoResult } from "./videos";

const ChatBox = ({ message }: { message: Message }) => {
    const responseLength = message.response?.length || 0;
    const imagesLength =
        (message.searchResult as { images?: ImageResult[] })?.images?.length ||
        0;
    const videosLength =
        (message.searchResult as { videos?: VideoResult[] })?.videos?.length ||
        0;

    const forceUpdateKey = `${responseLength}-${imagesLength}-${videosLength}`;

    const tabs: Tab[] = [
        {
            title: "Summary",
            value: "summary",
            content: (
                <div
                    key={`search-${message.id}-${responseLength}`}
                    className="markdown-content"
                >
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {message.response || ""}
                    </Markdown>
                </div>
            ),
        },
        {
            title: "Images",
            value: "images",
            content: (
                <div
                    key={`images-${message.id}-${imagesLength}`}
                    className="flex flex-wrap"
                >
                    <Images
                        images={
                            (message.searchResult as { images?: ImageResult[] })
                                ?.images
                        }
                    />
                </div>
            ),
        },
        {
            title: "Videos",
            value: "videos",
            content: (
                <div
                    key={`videos-${message.id}-${videosLength}`}
                    className="flex flex-wrap"
                >
                    <Videos
                        videos={
                            (message.searchResult as { videos?: VideoResult[] })
                                ?.videos
                        }
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="w-full flex flex-col items-stretch space-y-4 ">
            <Tabs
                query={message.query}
                tabs={tabs}
                id={message.id}
                forceUpdateKey={forceUpdateKey}
            />
        </div>
    );
};

export default ChatBox;
