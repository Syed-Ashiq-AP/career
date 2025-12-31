import { AIMessage } from "@/lib/UIMessage";
import { UserContext } from "@/providers/user-provider";
import { useCallback, useContext } from "react";

export function useUserData() {
    const {
        isSubscribed,
        chatId,
        setChatId,
        user,
        conversations,
        messages,
        orders,
    } = useContext(UserContext);

    const initiateConversation = useCallback(
        async (title: string) => {
            const response = await fetch(`/api/user-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) {
                throw new Error(
                    `Failed to load conversations: ${response.statusText}`
                );
            }

            const { id } = await response.json();
            setChatId(id);
            window.history.replaceState(null, "", `/${id}`);
            return id;
        },
        [setChatId]
    );

    const updateMessages = useCallback(
        async (
            { messages: newMessages }: { messages: AIMessage[] },
            force?: string[]
        ) => {
            const ID = chatId.current;

            const messageIDs = messages.map((m) => m.id);
            const toUpdateMessages = newMessages.filter(
                (m) => !messageIDs.includes(m.id) || force?.includes(m.id)
            );
            const uploadMessage = async () => {
                const response = await fetch(`/api/user-chat/${ID}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: toUpdateMessages,
                        update: force !== undefined ? true : false,
                    }),
                });
                if (!response.ok) {
                    throw new Error(
                        `Failed to load conversations: ${response.statusText}`
                    );
                }
            };
            uploadMessage();
            // setMessages(messages);
        },
        [chatId, messages]
    );

    return {
        chatId,
        user,
        conversations,
        messages,
        updateMessages,
        initiateConversation,
        isSubscribed,
        orders,
    };
}
