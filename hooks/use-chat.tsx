"use client";
import { Conversation, ConversationMessage } from "@/lib/generated/prisma";
import { JsonValue } from "@/lib/generated/prisma/runtime/library";
import axios from "axios";
import {
    Bookmark,
    LucideIcon,
    MessageCircleMore,
    SquarePen,
} from "lucide-react";
import React, {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { IconType } from "react-icons/lib";
import { toast } from "sonner";

type Submenu = {
    href: string;
    label: string;
    icon?: LucideIcon | IconType;
    active?: boolean;
};

type Menu = {
    href: string;
    label: string;
    active?: boolean;
    icon: LucideIcon | IconType;
    submenus?: Submenu[];
};

type Group = {
    groupLabel: string;
    menus: Menu[];
};

type StreamEvent = {
    type: "token" | "message_start" | "message_complete" | "error" | "metadata";
    data: {
        content?: string;
        messageId?: string;
        conversationId?: string;
        error?: string;
        metadata?: {
            tabs?: Array<{
                type: "search" | "images" | "videos";
                title: string;
                items: Array<{
                    title?: string;
                    link?: string;
                    favicon?: string;
                    imageUrl?: string;
                }>;
            }>;
        };
    };
};

interface ChatState {
    conversations: Conversation[];
    conversationId?: string;
    messages: ConversationMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
}

interface UseChatOptions {
    userId: string;
    initialConversationId?: string;
    apiEndpoint?: string;
    streamEndpoint?: string;
    onMessageComplete?: (message: ConversationMessage) => void;
    children: ReactNode;
}

type ChatBotContextProps = {
    menu: Group[];
    conversationId?: string;
    messages: ConversationMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sendMessageStream: (message: string) => Promise<void>;
    setUpConversation: (message: string) => Promise<string>;
    loadConversation: (conversationId: string) => Promise<void>;
    cancel: () => void;
    reload: () => void;
    clear: () => void;
};

const chatBotContext = React.createContext<ChatBotContextProps | null>(null);

const UseChatbot = () => {
    const context = React.useContext(chatBotContext);
    if (!context) {
        throw new Error("UseChatbot must be used within a ChatBotProvider.");
    }

    return context;
};

const apiEndpoint = "/api/v3/chat",
    streamEndpoint = "/api/v3/chat/stream",
    completionEndpoint = "/api/v3/chat/completion";
export const ChatBotProvider = ({
    userId,
    initialConversationId,
    onMessageComplete,
    children,
}: UseChatOptions) => {
    const [state, setState] = useState<ChatState>({
        conversations: [],
        conversationId: initialConversationId,
        messages: [],
        isLoading: false,
        isStreaming: false,
        error: null,
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadedConversationRef = useRef<string | null>(null);

    const loadConversation = useCallback(async (conversationId: string) => {
        if (loadedConversationRef.current === conversationId) return;

        loadedConversationRef.current = conversationId;
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = (await axios.get(
                `${apiEndpoint}?conversationId=${conversationId}`,
                { headers: { "Content-Type": "application/json" } }
            )) as {
                conversation: Conversation;
                messages: ConversationMessage[];
            };
            if (!response) {
                throw new Error("Failed to load conversation", response);
            }

            const { conversation, messages } = response;

            setState((prev) => ({
                ...prev,
                conversationId: conversation.id,
                messages: messages || [],
                isLoading: false,
            }));
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error("Unknown Error");
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: err.message,
            }));
            toast(err.message);
            loadedConversationRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (
            !initialConversationId ||
            loadedConversationRef.current === initialConversationId
        ) {
            return;
        }

        const loadInitialConversation = async () => {
            loadedConversationRef.current = initialConversationId;
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(
                    `${apiEndpoint}?conversationId=${initialConversationId}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load conversation: ${response.statusText}`
                    );
                }

                const data = await response.json();

                setState((prev) => ({
                    ...prev,
                    conversationId: data.conversation.id,
                    messages: data.messages || [],
                    isLoading: false,
                }));
            } catch (error) {
                const err =
                    error instanceof Error ? error : new Error("Unknown error");
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err.message,
                }));
                toast(err.message);
                loadedConversationRef.current = null;
            }
        };

        loadInitialConversation();
    }, [initialConversationId]);

    useEffect(() => {
        const eventSource = eventSourceRef.current;
        const abortController = abortControllerRef.current;

        const loadConversations = async () => {
            const response = await fetch(`${apiEndpoint}s`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(
                    `Failed to load conversations: ${response.statusText}`
                );
            }

            const data = await response.json();

            setState((prev) => ({
                ...prev,
                conversations: data.conversations,
            }));
        };
        loadConversations();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
            if (abortController) {
                abortController.abort();
            }
        };
    }, []);

    const onConversationIdChange = useCallback((convoId: string) => {
        window.history.replaceState(null, "", `/ai/${convoId}`);
    }, []);

    useEffect(() => {
        if (state.conversationId && onConversationIdChange) {
            onConversationIdChange(state.conversationId);
        }
    }, [state.conversationId, onConversationIdChange]);

    const sendMessageStream = useCallback(
        async (message: string) => {
            setState((prev) => ({ ...prev, isStreaming: true, error: null }));

            const pseudoUserMessage: ConversationMessage = {
                id: `temp-${Date.now()}`,
                conversationId: state.conversationId || "",
                role: "user",
                content: message,
                metadata: null,
                tokenCount: null,
                finishReason: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, pseudoUserMessage],
            }));

            try {
                abortControllerRef.current = new AbortController();

                const response = await fetch(streamEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId: state.conversationId,
                        message,
                        userId,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`Stream failed: ${response.statusText}`);
                }

                if (!response.body) {
                    throw new Error("No response body for streaming");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const eventData: StreamEvent = JSON.parse(
                                    line.slice(6)
                                );

                                switch (eventData.type) {
                                    case "message_start":
                                        if (eventData.data.conversationId) {
                                            setState((prev) => ({
                                                ...prev,
                                                conversationId:
                                                    eventData.data
                                                        .conversationId,
                                            }));
                                        }
                                        if (eventData.data.messageId) {
                                            setState((prev) => {
                                                const messages = [
                                                    ...prev.messages,
                                                ];
                                                const userMessageIndex =
                                                    messages.findIndex(
                                                        (m) =>
                                                            m.role === "user" &&
                                                            m.id.startsWith(
                                                                "temp-"
                                                            )
                                                    );
                                                if (userMessageIndex >= 0) {
                                                    messages[userMessageIndex] =
                                                        {
                                                            ...messages[
                                                                userMessageIndex
                                                            ],
                                                            id: eventData.data
                                                                .messageId!,
                                                        };
                                                }
                                                return { ...prev, messages };
                                            });
                                        }
                                        break;

                                    case "token":
                                        if (
                                            eventData.data.content &&
                                            eventData.data.messageId
                                        ) {
                                            setState((prev) => {
                                                const messages = [
                                                    ...prev.messages,
                                                ];
                                                const existingIndex =
                                                    messages.findIndex(
                                                        (m) =>
                                                            m.id ===
                                                            eventData.data
                                                                .messageId
                                                    );

                                                if (existingIndex >= 0) {
                                                    messages[existingIndex] = {
                                                        ...messages[
                                                            existingIndex
                                                        ],
                                                        content:
                                                            messages[
                                                                existingIndex
                                                            ].content +
                                                            eventData.data
                                                                .content,
                                                    };
                                                } else {
                                                    const newMessage: ConversationMessage =
                                                        {
                                                            id: eventData.data
                                                                .messageId!,
                                                            conversationId:
                                                                prev.conversationId ||
                                                                "",
                                                            role: "assistant",
                                                            content:
                                                                eventData.data
                                                                    .content ||
                                                                "",
                                                            metadata: null,
                                                            tokenCount: null,
                                                            finishReason: null,
                                                            createdAt:
                                                                new Date(),
                                                            updatedAt:
                                                                new Date(),
                                                        };
                                                    messages.push(newMessage);
                                                }

                                                return { ...prev, messages };
                                            });
                                        }
                                        break;

                                    case "message_complete":
                                        setState((prev) => {
                                            const completedMessage =
                                                prev.messages.find(
                                                    (m) =>
                                                        m.id ===
                                                        eventData.data.messageId
                                                );
                                            if (completedMessage) {
                                                onMessageComplete?.(
                                                    completedMessage
                                                );
                                            }

                                            return {
                                                ...prev,
                                                isStreaming: false,
                                            };
                                        });
                                        break;

                                    case "error":
                                        const error = new Error(
                                            eventData.data.error ||
                                                "Stream error"
                                        );
                                        setState((prev) => ({
                                            ...prev,
                                            isStreaming: false,
                                            error: error.message,
                                        }));
                                        toast(error.message);
                                        break;

                                    case "metadata":
                                        setState((prev) => {
                                            const messages = [...prev.messages];
                                            const existingIndex =
                                                messages.findIndex(
                                                    (m) =>
                                                        m.id ===
                                                            eventData.data
                                                                .messageId ||
                                                        m.id.startsWith("temp-")
                                                );

                                            if (existingIndex >= 0) {
                                                messages[existingIndex] = {
                                                    ...messages[existingIndex],
                                                    metadata: eventData.data
                                                        .metadata as unknown as JsonValue,
                                                };
                                            }

                                            return { ...prev, messages };
                                        });
                                        break;
                                }
                            } catch (parseError) {
                                console.warn(
                                    "Failed to parse stream event:",
                                    parseError
                                );
                            }
                        }
                    }
                }

                setState((prev) => ({ ...prev, isStreaming: false }));
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                const err =
                    error instanceof Error ? error : new Error("Stream failed");
                setState((prev) => ({
                    ...prev,
                    isStreaming: false,
                    error: err.message,
                }));
                toast(err.message);
            }
        },
        [state.conversationId, onMessageComplete, userId]
    );

    const setUpConversation = useCallback(
        async (careerField: string) => {
            const analysisPrompt = `I'm interested in pursuing a career as a ${careerField}. Please provide me with comprehensive career guidance including:

1. **Current Job Market Analysis** - What's the demand for ${careerField} roles in India right now?
2. **Required Skills & Technologies** - What technical and soft skills are essential?
3. **Career Path & Growth** - What are the typical career progression opportunities?
4. **Salary Expectations** - What salary ranges can I expect at different levels?
5. **Learning Resources** - What courses, certifications, or resources would you recommend?
6. **Job Opportunities** - Where can I find relevant job openings?
7. **Industry Trends** - What are the latest trends and future outlook for this field?

Please search for the most current information to provide accurate and up-to-date guidance for my career planning.`;

            const response = await fetch(completionEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: analysisPrompt,
                    userId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Setup failed failed: ${response.statusText}`);
            }

            const result = await response.json();

            return result.conversationId;
        },
        [userId]
    );

    // useEffect(() => {
    //     if (userId) setUpConversation("Full stack developer");
    // }, [userId, setUpConversation]);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setState((prev) => ({ ...prev, isStreaming: false, isLoading: false }));
    }, []);

    const reload = useCallback(() => {
        if (state.conversationId) {
            loadConversation(state.conversationId);
        }
    }, [state.conversationId, loadConversation]);

    const clear = useCallback(() => {
        setState((prev) => ({
            conversations: prev.conversations,
            conversationId: undefined,
            messages: [],
            isLoading: false,
            isStreaming: false,
            error: null,
        }));
    }, []);

    const menu = useMemo(
        () =>
            [
                {
                    groupLabel: "",
                    menus: [
                        {
                            href: "#",
                            label: "Chats",
                            icon: MessageCircleMore,
                            submenus: [
                                {
                                    href: "/ai",
                                    icon: SquarePen,
                                    label: "New Chat",
                                },
                                ...state.conversations.map((chat) => ({
                                    href: `/ai/${chat.id}`,
                                    label: chat.title,
                                })),
                            ],
                        },
                        {
                            href: "/evaluate",
                            label: "Survey",
                            icon: Bookmark,
                            // submenus: [],
                        },
                    ],
                },
            ] as Group[],
        [state.conversations]
    );

    // const value = useMemo(() => ({}), []);

    const value = useMemo(
        () => ({
            menu,
            conversationId: state.conversationId,
            messages: state.messages,
            isLoading: state.isLoading,
            isStreaming: state.isStreaming,
            error: state.error,
            sendMessageStream,
            loadConversation,
            cancel,
            reload,
            clear,
            setUpConversation,
        }),
        [
            cancel,
            clear,
            loadConversation,
            reload,
            sendMessageStream,
            state,
            menu,
            setUpConversation,
        ]
    );

    return (
        <chatBotContext.Provider value={value}>
            {children}
        </chatBotContext.Provider>
    );
};

export type { StreamEvent };
export default UseChatbot;
