import { authClient } from "@/lib/auth-client";
import { Chat, Message } from "@/lib/generated/prisma/client";
import { AIMessage } from "@/lib/UIMessage";
import { User } from "better-auth";
import {
    createContext,
    Dispatch,
    ReactNode,
    RefObject,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type UserContextType = {
    user: User | null;
    setCurrentConversation: Dispatch<SetStateAction<Chat | null>>;
    currentConversation: Chat | null;
    setConversations: Dispatch<SetStateAction<Chat[]>>;
    conversations: Chat[];
    setMessages: Dispatch<SetStateAction<AIMessage[]>>;
    chatId: RefObject<string | null>;
    setChatId: (id: string) => void;
    messages: AIMessage[];
};

export type UserProviderProps = {
    children: ReactNode;
    id: string | null;
};

export const UserContext = createContext({} as unknown as UserContextType);

export const UserProvider = ({ children, id }: UserProviderProps) => {
    const { data: session } = authClient.useSession();
    const [conversations, setConversations] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Chat | null>(
        null
    );
    const chatId = useRef<string | null>(null);

    useEffect(() => {
        const fetchChats = async () => {
            const response = await fetch(`/api/user-chat`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(
                    `Failed to load conversations: ${response.statusText}`
                );
            }

            const data = await response.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        };

        fetchChats();
    }, []);

    const fetchChatData = useCallback(
        (ID = chatId.current) => {
            if (!ID) return;
            const fetchMessages = async () => {
                const response = await fetch(`/api/user-chat/${ID}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (!response.ok) {
                    throw new Error(
                        `Failed to load conversations: ${response.statusText}`
                    );
                }

                const data = await response.json();
                if (data.messages) {
                    const uiMessages: AIMessage[] = data.messages.map(
                        (m: Message) => ({
                            id: m.id,
                            role: m.role,
                            metadata:
                                typeof m.metadata === "string"
                                    ? JSON.parse(m.metadata)
                                    : m.metadata,
                            parts:
                                typeof m.parts === "string"
                                    ? JSON.parse(m.parts)
                                    : m.parts,
                        })
                    );
                    setMessages(uiMessages);
                } else {
                    setMessages([]);
                }
            };
            fetchMessages();
        },
        [chatId]
    );

    // When 'id' changes, fetch chat data
    useEffect(() => {
        chatId.current = id;
        if (id) {
            fetchChatData(id);
        } else {
            setMessages([]);
        }
    }, [id, fetchChatData]);

    const value: UserContextType = useMemo(() => {
        const user = session ? session.user : null;

        return {
            user,
            currentConversation,
            setCurrentConversation,
            conversations,
            setConversations,
            messages,
            setMessages,
            chatId: chatId,
            setChatId: (id: string) => {
                chatId.current = id;
            },
        };
    }, [chatId, session, conversations, messages, currentConversation]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
