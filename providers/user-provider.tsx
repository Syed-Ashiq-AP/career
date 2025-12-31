import { authClient } from "@/lib/auth-client";
import { Chat, Message } from "@/lib/generated/prisma/client";
import { AIMessage } from "@/lib/UIMessage";
import { User } from "better-auth";
import { usePathname, useRouter } from "next/navigation";
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
    isSubscribed: RefObject<boolean>;
    orders: Order[];
};

export type UserProviderProps = {
    children: ReactNode;
    id: string | null;
};

export type Order = { id: string; name: string; description: string | null };

export const UserContext = createContext({} as unknown as UserContextType);

export const UserProvider = ({ children, id }: UserProviderProps) => {
    const router = useRouter();
    const pathname = usePathname();

    const { data: session } = authClient.useSession();
    const [conversations, setConversations] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Chat | null>(
        null
    );
    const chatId = useRef<string | null>(null);

    const isSubscribed = useRef(false);
    const fetchedOrders = useRef(false);

    const [orders, setOrders] = useState<Order[]>([]);

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

        const fetchSubscriptions = async () => {
            const { data } = await authClient.customer.orders.list({
                query: {
                    page: 1,
                    limit: 10,
                },
            });
            if (!data) return;
            const { items } = data.result;
            const orders = items.map((item: any) => ({
                id: item.id,
                name: item.product.name,
                description: item.product.description,
            }));
            setOrders(orders);
            if (items.length !== 0) {
                isSubscribed.current = true;
            }
            fetchedOrders.current = true;
        };

        fetchChats();
        fetchSubscriptions();
    }, []);

    useEffect(() => {
        if (
            fetchedOrders.current &&
            orders.length === 0 &&
            pathname.includes("survey")
        ) {
            router.push("/checkout");
        }
    }, [fetchedOrders, orders, router, id, pathname]);

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
            isSubscribed,
            orders,
        };
    }, [
        chatId,
        session,
        conversations,
        messages,
        currentConversation,
        isSubscribed,
        orders,
    ]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
