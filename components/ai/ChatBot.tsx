"use client";

import {
    PromptInput,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputFooter,
    type PromptInputMessage,
    PromptInputProvider,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from "@/components/ai/prompt-input";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Conversation } from "./Conversation";
import { useUserData } from "@/hooks/use-user";
import { AIMessage, MetaData } from "@/lib/UIMessage";
import { DefaultChatTransport } from "ai";
import { useSurvey } from "@/hooks/use-survey";

const ChatBot = () => {
    const {
        wait,
        chatId,
        messages: initMessages,
        updateMessages,
        initiateConversation,
    } = useUserData();

    const { messages, sendMessage, setMessages, status, error } =
        useChat<AIMessage>({
            transport: new DefaultChatTransport({
                api: "/api/chat",
            }),
            onError: (error) => {
                console.error("Chat error:", error);
            },
        });

    useSurvey({ sendMessage });

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSendMessage = useCallback(
        async (message: PromptInputMessage) => {
            if (!chatId || !chatId.current) {
                await initiateConversation(message.text);
            }
            sendMessage(message);
        },
        [chatId, initiateConversation, sendMessage]
    );

    const handleSubmit = (message: PromptInputMessage) => {
        const hasText = Boolean(message.text);
        const hasAttachments = Boolean(message.files?.length);

        if (!(hasText || hasAttachments)) {
            return;
        }
        handleSendMessage(message);
    };

    useEffect(() => {
        setMessages(initMessages);
    }, [initMessages, setMessages]);

    const conversations = useMemo(() => {
        const objectSet: {
            user: AIMessage;
            response: AIMessage;
        }[] = [];
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const maybe_response = messages[i + 1];
            if (
                maybe_response &&
                message.role === "user" &&
                maybe_response.role === "assistant"
            ) {
                objectSet.push({ user: message, response: maybe_response });
                i++;
            }
        }
        return objectSet;
    }, [messages]);

    const setMetaData = useCallback(
        ({ metadata, id }: { id: string; metadata: MetaData }) => {
            const updateMessage: AIMessage[] = messages.map((m) => {
                if (m.id === id) {
                    return { ...m, metadata };
                }
                return m;
            });
            updateMessages({ messages: updateMessage }, [id]);
            setMessages(updateMessage);
        },
        [messages, setMessages, updateMessages]
    );

    return (
        <div className="flex flex-col items-stretch flex-1 overflow-y-auto">
            <div className="pb-40">
                {conversations.map((convo) => (
                    <Conversation
                        status={status}
                        setMetaData={setMetaData}
                        {...convo}
                        key={convo.response.id}
                    />
                ))}

                {error && (
                    <div className="mx-auto my-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
                        <p className="font-semibold">Error:</p>
                        <p>{error.message}</p>
                    </div>
                )}
            </div>
            <div className="fixed left-0 right-0 bottom-0 p-5 bg-linear-to-t from-background  to-transparent ">
                <PromptInputProvider>
                    <PromptInput
                        globalDrop
                        multiple
                        onSubmit={handleSubmit}
                        className="max-w-5xl mx-auto bg-background"
                    >
                        <PromptInputAttachments>
                            {(attachment) => (
                                <PromptInputAttachment data={attachment} />
                            )}
                        </PromptInputAttachments>
                        <PromptInputBody>
                            <PromptInputTextarea ref={textareaRef} />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools></PromptInputTools>
                            <PromptInputSubmit
                                status={wait.current ? "submitted" : status}
                            />
                        </PromptInputFooter>
                    </PromptInput>
                </PromptInputProvider>
            </div>
        </div>
    );
};

export { ChatBot };
