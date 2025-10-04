import React from "react";
import { motion } from "framer-motion";
import { ConversationMessage } from "@/lib/generated/prisma";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { User, Bot, Clock } from "lucide-react";

interface ChatBoxV2Props {
    message: ConversationMessage;
}

const ChatBoxV2: React.FC<ChatBoxV2Props> = ({ message }) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const isSystem = message.role === "system";

    const formatTimestamp = (date: Date | string) => {
        const messageDate = typeof date === "string" ? new Date(date) : date;
        return messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getMessageIcon = () => {
        if (isUser) return <User className="h-4 w-4" />;
        if (isAssistant) return <Bot className="h-4 w-4" />;
        return <Clock className="h-4 w-4" />;
    };

    const getMessageLabel = () => {
        if (isUser) return "You";
        if (isAssistant) return "AI Assistant";
        return "System";
    };

    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-4"
            >
                <div className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-full text-xs">
                    {message.content}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex gap-4 p-6 group",
                isUser ? "bg-transparent" : "bg-muted/20"
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm",
                    isUser ? "bg-blue-500" : "bg-emerald-500"
                )}
            >
                {getMessageIcon()}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                        {getMessageLabel()}
                    </span>
                    <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTimestamp(message.createdAt)}
                    </span>

                    {/* Metadata badges */}
                    {message.metadata &&
                        typeof message.metadata === "object" && (
                            <div className="flex gap-1 ml-auto">
                                {message.tokenCount && (
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                                        {message.tokenCount} tokens
                                    </span>
                                )}
                                {message.model && (
                                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                                        {message.model}
                                    </span>
                                )}
                            </div>
                        )}
                </div>

                {/* Message text */}
                <div
                    className={cn(
                        "prose prose-sm max-w-none",
                        isUser ? "text-foreground" : "text-foreground/90"
                    )}
                >
                    {isUser ? (
                        <div className="whitespace-pre-wrap break-words">
                            {message.content}
                        </div>
                    ) : (
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: ({
                                        children,
                                        className,
                                        ...props
                                    }) => {
                                        const isInline = !className;
                                        if (isInline) {
                                            return (
                                                <code
                                                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return (
                                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                                <code
                                                    className="text-sm font-mono"
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            </pre>
                                        );
                                    },
                                    blockquote: ({ children, ...props }) => (
                                        <blockquote
                                            className="border-l-4 border-primary/30 pl-4 italic"
                                            {...props}
                                        >
                                            {children}
                                        </blockquote>
                                    ),
                                    ul: ({ children, ...props }) => (
                                        <ul
                                            className="list-disc ml-6 space-y-1"
                                            {...props}
                                        >
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children, ...props }) => (
                                        <ol
                                            className="list-decimal ml-6 space-y-1"
                                            {...props}
                                        >
                                            {children}
                                        </ol>
                                    ),
                                    h1: ({ children, ...props }) => (
                                        <h1
                                            className="text-xl font-bold mt-6 mb-3"
                                            {...props}
                                        >
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children, ...props }) => (
                                        <h2
                                            className="text-lg font-semibold mt-5 mb-2"
                                            {...props}
                                        >
                                            {children}
                                        </h2>
                                    ),
                                    h3: ({ children, ...props }) => (
                                        <h3
                                            className="text-base font-semibold mt-4 mb-2"
                                            {...props}
                                        >
                                            {children}
                                        </h3>
                                    ),
                                    p: ({ children, ...props }) => (
                                        <p
                                            className="mb-3 last:mb-0"
                                            {...props}
                                        >
                                            {children}
                                        </p>
                                    ),
                                    a: ({ children, href, ...props }) => (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-600 underline"
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    ),
                                    table: ({ children, ...props }) => (
                                        <div className="overflow-x-auto">
                                            <table
                                                className="min-w-full border-collapse border border-muted"
                                                {...props}
                                            >
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({ children, ...props }) => (
                                        <th
                                            className="border border-muted bg-muted/50 px-3 py-2 text-left font-semibold"
                                            {...props}
                                        >
                                            {children}
                                        </th>
                                    ),
                                    td: ({ children, ...props }) => (
                                        <td
                                            className="border border-muted px-3 py-2"
                                            {...props}
                                        >
                                            {children}
                                        </td>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer with additional info */}
                {message.finishReason && isAssistant && (
                    <div className="text-muted-foreground text-xs mt-2 opacity-50">
                        Completed • {message.finishReason}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChatBoxV2;
