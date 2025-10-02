"use client";
import { Chat, Message } from "@/lib/generated/prisma";
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
    useState,
} from "react";
import { IconType } from "react-icons/lib";

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

type ChatBotContextProps = {
    messages: Message[];
    addMessage: (content: Message["query"]) => void;
    chatId: string | undefined;
    isTyping: boolean;
    setIsTyping: (isTyping: boolean) => void;
    menu: Group[];
};

const chatBotContext = React.createContext<ChatBotContextProps | null>(null);

type BasicMessage = {
    query: string;
};

type ChatMessage = BasicMessage | Message;

const UseChatbot = () => {
    const context = React.useContext(chatBotContext);
    if (!context) {
        throw new Error("UseChatbot must be used within a ChatBotProvider.");
    }

    return context;
};

export const ChatBotProvider = ({
    userId,
    chatId: initialID,
    children,
}: {
    children: ReactNode;
    userId: string;
    chatId?: string;
}) => {
    const [isTyping, setIsTyping] = useState(false);

    const [chatId, setChatId] = useState(initialID);

    const [chats, setChats] = useState<Chat[]>([]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (initialID) {
                const response = await axios.get(`/api/ai/chat/${initialID}`);
                const { messages } = response.data;
                if (messages) setMessages(messages);
            }
        };
        fetchMessages();
    }, [initialID]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [toBeUpdatedmessage, setToBeUpdatedMessage] = useState<{
        message: BasicMessage | Message;
    } | null>(null);

    const fetchResponse = async (messages: Message[]) => {
        messages.forEach(async (message) => {
            const result = await axios.post("/api/ai", {
                query: message.query,
                id: message.id,
            });
            const { id: runId } = result.data;
            const isComplete = setInterval(async () => {
                const result = await axios.post("/api/ai/status", {
                    id: runId,
                });
                const { data } = result.data;

                if (data[0] && data[0].status === "Completed") {
                    const response = await axios.get(
                        `/api/ai/message/${message.id}`
                    );
                    const { data: responseMessage } = response;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === responseMessage.id
                                ? responseMessage
                                : msg
                        )
                    );
                    setIsTyping(false);
                    clearInterval(isComplete);
                }
            }, 2000);
        });
    };
    const saveMessage = useCallback(
        async (sendMessage: ChatMessage) => {
            const response = await axios.post(
                `/api/ai/chat${chatId ? `/${chatId}` : ""}`,
                {
                    messages: [sendMessage],
                    userId,
                }
            );
            const { data } = response;
            const shouldUpdateUrl = !chatId;
            if (shouldUpdateUrl) {
                setChatId(data.chatId);
            }

            const updatedMessages = data.messages as Message[];
            await fetchResponse(updatedMessages);

            if (shouldUpdateUrl) {
                window.history.replaceState(null, "", `/ai/${data.chatId}`);
            }

            const newMessages =
                messages.length === 0
                    ? updatedMessages
                    : [
                          ...messages.map((message) => {
                              const updated = updatedMessages.find(
                                  (m) => m.id === message.id
                              );
                              return updated ? updated : message;
                          }),
                          ...updatedMessages.filter(
                              (updated) =>
                                  !messages.some((msg) => msg.id === updated.id)
                          ),
                      ];
            return newMessages;
        },
        [messages, chatId, userId]
    );

    useEffect(() => {
        const updateMessages = async () => {
            if (toBeUpdatedmessage) {
                const updatedMessages = await saveMessage(
                    toBeUpdatedmessage.message
                );
                setMessages(updatedMessages);
                setToBeUpdatedMessage(null);
            }
        };
        updateMessages();
    }, [toBeUpdatedmessage, saveMessage]);

    const addMessage = useCallback(
        (query: Message["query"]) => {
            const message = { query, chatId } as ChatMessage;
            setToBeUpdatedMessage({ message });
        },
        [chatId]
    );

    useEffect(() => {
        if (!userId) return;
        const fetchChats = async () => {
            const result = await axios.get(`/api/ai/user/${userId}/chats`);
            const { chats } = result.data;
            setChats(chats);
        };
        fetchChats();
    }, [userId]);

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
                                ...chats.map((chat) => ({
                                    href: `/ai/${chat.id}`,
                                    label: chat.title,
                                })),
                            ],
                        },
                        {
                            href: "/evaluate",
                            label: "Surveys",
                            icon: Bookmark,
                            // submenus: [],
                        },
                    ],
                },
            ] as Group[],
        [chats]
    );

    const value = useMemo(
        () => ({ messages, addMessage, chatId, isTyping, setIsTyping, menu }),
        [messages, addMessage, chatId, isTyping, setIsTyping, menu]
    );

    return (
        <chatBotContext.Provider value={value}>
            {children}
        </chatBotContext.Provider>
    );
};

export default UseChatbot;
