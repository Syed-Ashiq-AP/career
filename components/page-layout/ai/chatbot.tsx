"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    MonitorIcon,
    Paperclip,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
} from "lucide-react";
import {
    FaGraduationCap,
    FaNewspaper,
    FaRegCalendarAlt,
    FaRegChartBar,
} from "react-icons/fa";
import { FaListCheck } from "react-icons/fa6";
import {
    LuSquareSplitHorizontal,
    LuClipboard,
    LuMicVocal,
} from "react-icons/lu";
import { PiBookOpen, PiBriefcase, PiExam, PiScrollFill } from "react-icons/pi";
import { IoDocumentOutline } from "react-icons/io5";

import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import UseChatbot from "@/hooks/use-chatbot";
import ChatBox from "./chatBox";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    containerClassName?: string;
    showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, containerClassName, showRing = true, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className={cn("relative", containerClassName)}>
                <textarea
                    className={cn(
                        "border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm",
                        "transition-all duration-200 ease-in-out",
                        "placeholder:text-muted-foreground",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        showRing
                            ? "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                            : "",
                        className
                    )}
                    ref={ref}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {showRing && isFocused && (
                    <motion.span
                        className="ring-primary/30 pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}

                {props.onChange && (
                    <div
                        className="bg-primary absolute right-2 bottom-2 h-2 w-2 rounded-full opacity-0"
                        style={{
                            animation: "none",
                        }}
                        id="textarea-ripple"
                    />
                )}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

export default function ChatBot() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        {
            icon: <MonitorIcon className="h-4 w-4" />,
            label: "Overview",
            description:
                "Shows a quick summary of B.Tech—what it is, branches, eligibility",
            prefix: "/overview",
        },
        {
            icon: <FaGraduationCap className="h-4 w-4" />,
            label: "Colleges",
            description:
                "Lists top colleges and allows filters (location, fees, rank)",
            prefix: "/colleges",
        },
        {
            icon: <LuSquareSplitHorizontal className="h-4 w-4" />,
            label: "Compare",
            description: "Compares two branches or colleges side-by-side",
            prefix: "/compare",
        },
        {
            icon: <PiExam className="h-4 w-4" />,
            label: "Exams",
            description: "Lists main entrance exams and details for each",
            prefix: "/exams",
        },
        {
            icon: <FaRegCalendarAlt className="h-4 w-4" />,
            label: "Deadlines",
            description: "Displays upcoming application/exam dates",
            prefix: "/deadlines",
        },
        {
            icon: <PiScrollFill className="h-4 w-4" />,
            label: "Scholarships",
            description: "Lists scholarships and eligibility requirements",
            prefix: "/scholarships",
        },
        {
            icon: <PiBookOpen className="h-4 w-4" />, // Lucide BookOpen for study guide
            label: "Prepare",
            description: "Provides a study guide for entrance exams",
            prefix: "/prepare",
        },
        {
            icon: <PiBriefcase className="h-4 w-4" />, // Lucide Briefcase for career paths
            label: "Career Paths",
            description: "Shows job and higher study options after B.Tech",
            prefix: "/careerpaths",
        },
        {
            icon: <FaListCheck className="h-4 w-4" />,
            label: "Quiz",
            description: "Starts a branch/career aptitude quiz",
            prefix: "/quiz",
        },
        {
            icon: <FaRegChartBar className="h-4 w-4" />,
            label: "Progress",
            description: "Displays the user's application or learning status",
            prefix: "/progress",
        },
        {
            icon: <IoDocumentOutline className="h-4 w-4" />,
            label: "Resume",
            description: "Analyze or generate resume/CV for B.Tech admissions",
            prefix: "/resume",
        },
        {
            icon: <LuClipboard className="h-4 w-4" />,
            label: "Document Check",
            description:
                "Generates a checklist of required application documents",
            prefix: "/documentcheck",
        },
        {
            icon: <LuMicVocal className="h-4 w-4" />,
            label: "Interview Prep",
            description: "Shares interview tips and common questions",
            prefix: "/interviewprep",
        },
        {
            icon: <FaNewspaper className="h-4 w-4" />,
            label: "News",
            description: "Shows the latest career or admission news",
            prefix: "/news",
        },
    ];
    const { messages, addMessage, isTyping, setIsTyping } = UseChatbot();

    useEffect(() => {
        if (value.startsWith("/") && !value.includes(" ")) {
            setShowCommandPalette(true);

            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );

            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector(
                "[data-command-button]"
            );

            if (
                commandPaletteRef.current &&
                !commandPaletteRef.current.contains(target) &&
                !commandButton?.contains(target)
            ) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestion((prev) =>
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestion((prev) =>
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === "Tab" || e.key === "Enter") {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand =
                        commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + " ");
                    setShowCommandPalette(false);

                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = () => {
        if (value.trim() && !isTyping) {
            startTransition(() => {
                setIsTyping(true);
                addMessage(value);
                setValue("");
                // setTimeout(() => {
                //     setIsTyping(false);
                //     setValue("");
                //     adjustHeight(true);
                // }, 3000);
            });
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments((prev) => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + " ");
        setShowCommandPalette(false);

        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    return (
        <div className="flex w-screen overflow-x-hidden">
            <div className="text-foreground relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-transparent px-2">
                {messages.length === 0 && (
                    <div
                        className={
                            "absolute inset-0 h-full w-full overflow-hidden "
                        }
                    >
                        <div className="bg-primary/10 absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter" />
                        <div className="bg-secondary/10 absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full mix-blend-normal blur-[128px] filter delay-700" />
                        <div className="bg-primary/10 absolute top-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full mix-blend-normal blur-[96px] filter delay-1000" />
                    </div>
                )}
                {messages.length !== 0 && (
                    <motion.div
                        animate={{ opacity: 100, marginTop: 0 }}
                        initial={{ opacity: 0, marginBottom: "20px" }}
                        className="relative z-10 w-full max-h-[calc(100dvh-200px)] overflow-y-auto"
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <div className="w-full max-w-4xl mx-auto">
                            {messages.map((msg) => (
                                <ChatBox key={msg.id} message={msg} />
                            ))}
                        </div>
                    </motion.div>
                )}
                <motion.div
                    className={
                        "relative mx-auto  w-full max-w-4xl data-[shrink=true]:max-w-2xl data-[shrink=true]:my-auto data-[shrink=false]:mb-0  data-[shrink=false]:bg-background"
                    }
                    layout
                    data-shrink={messages.length === 0}
                >
                    <motion.div
                        className="relative z-10 space-y-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <AnimatePresence>
                            {messages.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 100, marginTop: 0 }}
                                    exit={{ opacity: 0, marginBottom: "20px" }}
                                    className="space-y-3 text-center"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.2,
                                            duration: 0.5,
                                        }}
                                        className="inline-block"
                                    >
                                        <h1 className="pb-1 text-3xl font-medium tracking-tight">
                                            How can I help today?
                                        </h1>
                                        <motion.div
                                            className="via-primary/50 h-px bg-gradient-to-r from-transparent to-transparent"
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{
                                                width: "100%",
                                                opacity: 1,
                                            }}
                                            transition={{
                                                delay: 0.5,
                                                duration: 0.8,
                                            }}
                                        />
                                    </motion.div>
                                    <motion.p
                                        className="text-muted-foreground text-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        Type a command or ask a question
                                    </motion.p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                        <motion.div
                            className={cn(
                                "border-border bg-card/80 relative rounded-2xl border shadow-2xl backdrop-blur-2xl",
                                messages.length === 0 && "mt-20"
                            )}
                            initial={{ scale: 0.98 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <AnimatePresence>
                                {isTyping && (
                                    <motion.div
                                        className="absolute -top-15 left-0 right-0 border-border bg-background/80 mx-auto rounded-full border px-4 py-2 shadow-lg backdrop-blur-2xl w-fit"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 flex h-7 w-8 items-center justify-center rounded-full text-center">
                                                <Sparkles className="text-primary h-4 w-4" />
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                                <span>Thinking</span>
                                                <TypingDots />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {showCommandPalette && (
                                    <motion.div
                                        ref={commandPaletteRef}
                                        className="border-border bg-background/90 absolute right-4 bottom-full left-4 z-50 mb-2 overflow-auto max-h-48 rounded-lg border shadow-lg backdrop-blur-xl"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="bg-background py-1">
                                            {commandSuggestions.map(
                                                (suggestion, index) => (
                                                    <motion.div
                                                        key={suggestion.prefix}
                                                        className={cn(
                                                            "flex cursor-pointer items-center gap-2 px-3 py-2 text-xs transition-colors",
                                                            activeSuggestion ===
                                                                index
                                                                ? "bg-primary/20 text-foreground"
                                                                : "text-muted-foreground hover:bg-primary/10"
                                                        )}
                                                        onClick={() =>
                                                            selectCommandSuggestion(
                                                                index
                                                            )
                                                        }
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{
                                                            delay: index * 0.03,
                                                        }}
                                                    >
                                                        <div className="text-primary flex h-5 w-5 items-center justify-center">
                                                            {suggestion.icon}
                                                        </div>
                                                        <div className="font-medium">
                                                            {suggestion.label}
                                                        </div>
                                                        <div className="text-muted-foreground ml-1 text-xs">
                                                            {suggestion.prefix}
                                                        </div>
                                                    </motion.div>
                                                )
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-4">
                                <Textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        adjustHeight();
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    placeholder="Ask a question..."
                                    containerClassName="w-full"
                                    className={cn(
                                        "w-full px-4 py-3",
                                        "resize-none",
                                        "bg-transparent",
                                        "border-none",
                                        "text-foreground text-sm",
                                        "focus:outline-none",
                                        "placeholder:text-muted-foreground",
                                        "min-h-[60px]"
                                    )}
                                    style={{
                                        overflow: "hidden",
                                    }}
                                    showRing={false}
                                />
                            </div>

                            <AnimatePresence>
                                {attachments.length > 0 && (
                                    <motion.div
                                        className="flex flex-wrap gap-2 px-4 pb-3"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        {attachments.map((file, index) => (
                                            <motion.div
                                                key={index}
                                                className="bg-primary/5 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                            >
                                                <span>{file}</span>
                                                <button
                                                    onClick={() =>
                                                        removeAttachment(index)
                                                    }
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <XIcon className="h-3 w-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="border-border flex items-center justify-between gap-4 border-t p-4">
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={handleAttachFile}
                                        whileTap={{ scale: 0.94 }}
                                        className="group text-muted-foreground hover:text-foreground relative rounded-lg p-2 transition-colors"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <motion.span
                                            className="bg-primary/10 absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                            layoutId="button-highlight"
                                        />
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        data-command-button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCommandPalette(
                                                (prev) => !prev
                                            );
                                        }}
                                        whileTap={{ scale: 0.94 }}
                                        className={cn(
                                            "group text-muted-foreground hover:text-foreground relative rounded-lg p-2 transition-colors",
                                            showCommandPalette &&
                                                "bg-primary/20 text-foreground"
                                        )}
                                    >
                                        <Command className="h-4 w-4" />
                                        <motion.span
                                            className="bg-primary/10 absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                            layoutId="button-highlight"
                                        />
                                    </motion.button>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isTyping || !value.trim()}
                                    className={cn(
                                        "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                        "flex items-center gap-2",
                                        value.trim()
                                            ? "bg-primary text-primary-foreground shadow-primary/10 shadow-lg"
                                            : "bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {isTyping ? (
                                        <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" />
                                    ) : (
                                        <SendIcon className="h-4 w-4" />
                                    )}
                                    <span>Send</span>
                                </motion.button>
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {messages.length === 0 ? (
                                <motion.div
                                    className="flex flex-wrap items-center justify-center gap-2 "
                                    initial={{ opacity: 100, marginTop: "0px" }}
                                    exit={{ opacity: 0, marginTop: "10px" }}
                                    data-hide={messages.length !== 0}
                                >
                                    {commandSuggestions.map(
                                        (suggestion, index) => (
                                            <motion.button
                                                key={suggestion.prefix}
                                                onClick={() =>
                                                    selectCommandSuggestion(
                                                        index
                                                    )
                                                }
                                                className="group bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: index * 0.1,
                                                }}
                                            >
                                                {suggestion.icon}
                                                <span>{suggestion.label}</span>
                                                <motion.div
                                                    className="border-border/50 absolute inset-0 rounded-lg border"
                                                    initial={false}
                                                    animate={{
                                                        opacity: [0, 1],
                                                        scale: [0.98, 1],
                                                    }}
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: "easeOut",
                                                    }}
                                                />
                                            </motion.button>
                                        )
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>

                {messages.length === 0 && inputFocused && (
                    <motion.div
                        className={
                            "from-primary via-primary/80 to-secondary pointer-events-none fixed z-0 h-[50rem] w-[50rem] rounded-full bg-gradient-to-r opacity-[0.02] blur-[96px]"
                        }
                        animate={{
                            x: mousePosition.x,
                            y: mousePosition.y,
                        }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 150,
                            mass: 0.5,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="ml-1 flex items-center">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="bg-primary mx-0.5 h-1.5 w-1.5 rounded-full"
                    initial={{ opacity: 0.3 }}
                    animate={{
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)",
                    }}
                />
            ))}
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}
