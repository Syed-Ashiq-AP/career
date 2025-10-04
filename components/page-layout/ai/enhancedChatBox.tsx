import { Tab, Tabs } from "@/components/ui/tabs";
import { ConversationMessage } from "@/lib/generated/prisma";
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Images, { ImageResult } from "./images";
import Videos, { VideoResult } from "./videos";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EnhancedChatBox = ({ message }: { message: ConversationMessage }) => {
    const searchResult =
        message.metadata && typeof message.metadata === "object"
            ? (message.metadata as {
                  images?: ImageResult[];
                  videos?: VideoResult[];
                  search?: Record<string, unknown>;
              })
            : null;

    const imagesLength = searchResult?.images?.length || 0;
    const videosLength = searchResult?.videos?.length || 0;
    const hasSearchResults =
        imagesLength > 0 || videosLength > 0 || searchResult?.search;

    const forceUpdateKey = `${message.content.length}-${imagesLength}-${videosLength}`;

    const tabs: Tab[] = [
        {
            title: "Response",
            value: "response",
            content: (
                <div className="p-6 text-sm leading-relaxed markdown-content">
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </Markdown>
                </div>
            ),
        },
    ];

    if (imagesLength > 0) {
        tabs.push({
            title: `Images (${imagesLength})`,
            value: "images",
            content: <Images images={searchResult!.images!} />,
        });
    }

    if (videosLength > 0) {
        tabs.push({
            title: `Videos (${videosLength})`,
            value: "videos",
            content: <Videos videos={searchResult!.videos!} />,
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 last:mb-0"
        >
            <div className="space-y-4">
                {/* User Message */}
                {message.role === "user" && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end"
                    >
                        <div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl px-4 py-3 shadow-sm">
                            <div className="text-sm leading-relaxed">
                                {message.content}
                            </div>
                            <div className="mt-2 text-xs opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Assistant Message */}
                {message.role === "assistant" && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-start"
                    >
                        <div
                            className={cn(
                                "max-w-[90%] w-full",
                                hasSearchResults
                                    ? "bg-card border rounded-2xl shadow-sm overflow-hidden"
                                    : "bg-muted/50 rounded-2xl px-4 py-3 shadow-sm"
                            )}
                        >
                            {hasSearchResults ? (
                                <Tabs
                                    id={message.id}
                                    query={message.content.slice(0, 100)}
                                    tabs={tabs}
                                    forceUpdateKey={forceUpdateKey}
                                />
                            ) : (
                                <div>
                                    <div className="text-sm leading-relaxed markdown-content">
                                        <Markdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </Markdown>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {new Date(
                                                message.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        {message.model && (
                                            <span className="capitalize">
                                                {message.model.replace(
                                                    "provider-3/",
                                                    ""
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* System Message (if any) */}
                {message.role === "system" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center"
                    >
                        <div className="bg-muted/30 text-muted-foreground rounded-full px-3 py-1 text-xs">
                            System: {message.content}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default EnhancedChatBox;
