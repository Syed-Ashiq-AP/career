"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ConversationMessage } from "@/lib/generated/prisma";

type StreamEvent = {
    type: "token" | "message_start" | "message_complete" | "error";
    data: {
        content?: string;
        messageId?: string;
        conversationId?: string;
        error?: string;
    };
};

interface ChatState {
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
    onError?: (error: Error) => void;
    onMessageComplete?: (message: ConversationMessage) => void;
    onConversationIdChange?: (conversationId: string) => void;
}

interface SendMessageOptions {
    message: string;
    stream?: boolean;
}

export function useChat(options: UseChatOptions) {
    const {
        userId,
        initialConversationId,
        apiEndpoint = "/api/v2/conversations",
        streamEndpoint = "/api/v2/chat/stream",
        onError,
        onMessageComplete,
        onConversationIdChange,
    } = options;

    const [state, setState] = useState<ChatState>({
        conversationId: initialConversationId,
        messages: [],
        isLoading: false,
        isStreaming: false,
        error: null,
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadedConversationRef = useRef<string | null>(null);

    const loadConversation = useCallback(
        async (conversationId: string) => {
            // Prevent duplicate loads
            if (loadedConversationRef.current === conversationId) {
                return;
            }

            loadedConversationRef.current = conversationId;
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(
                    `${apiEndpoint}?conversationId=${conversationId}`,
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
                onError?.(err);
                // Reset ref on error so retry is possible
                loadedConversationRef.current = null;
            }
        },
        [apiEndpoint, onError]
    );

    // Load initial conversation - inline to avoid dependency issues
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
                onError?.(err);
                // Reset ref on error so retry is possible
                loadedConversationRef.current = null;
            }
        };

        loadInitialConversation();
    }, [initialConversationId, apiEndpoint, onError]);

    useEffect(() => {
        const eventSource = eventSourceRef.current;
        const abortController = abortControllerRef.current;

        return () => {
            if (eventSource) {
                eventSource.close();
            }
            if (abortController) {
                abortController.abort();
            }
        };
    }, []);

    // Handle conversation ID changes
    useEffect(() => {
        if (state.conversationId && onConversationIdChange) {
            onConversationIdChange(state.conversationId);
        }
    }, [state.conversationId, onConversationIdChange]);

    const sendMessageStream = useCallback(
        async (message: string) => {
            setState((prev) => ({ ...prev, isStreaming: true, error: null }));

            const tempUserMessage: ConversationMessage = {
                id: `temp-${Date.now()}`,
                conversationId: state.conversationId || "",
                role: "user",
                content: message,
                metadata: null,
                tokenCount: null,
                model: null,
                finishReason: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, tempUserMessage],
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
                                                            model: null,
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
                                        onError?.(error);
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
                onError?.(err);
            }
        },
        [
            state.conversationId,
            streamEndpoint,
            onError,
            onMessageComplete,
            userId,
        ]
    );

    const sendMessage = useCallback(
        async (message: string) => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const response = await fetch(apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId: state.conversationId,
                        message,
                    }),
                });

                if (!response.ok) {
                    throw new Error(
                        `Send message failed: ${response.statusText}`
                    );
                }

                const data = await response.json();

                setState((prev) => ({
                    ...prev,
                    conversationId: data.conversationId,
                    messages: [
                        ...prev.messages,
                        data.userMessage,
                        data.assistantMessage,
                    ],
                    isLoading: false,
                }));

                onMessageComplete?.(data.assistantMessage);
            } catch (error) {
                const err =
                    error instanceof Error ? error : new Error("Send failed");
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err.message,
                }));
                onError?.(err);
            }
        },
        [state.conversationId, apiEndpoint, onError, onMessageComplete]
    );

    const send = useCallback(
        async (options: SendMessageOptions | string) => {
            const { message, stream = true } =
                typeof options === "string"
                    ? { message: options, stream: true }
                    : options;

            if (stream) {
                await sendMessageStream(message);
            } else {
                await sendMessage(message);
            }
        },
        [sendMessageStream, sendMessage]
    );

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
        setState({
            conversationId: undefined,
            messages: [],
            isLoading: false,
            isStreaming: false,
            error: null,
        });
    }, []);

    return {
        // State
        conversationId: state.conversationId,
        messages: state.messages,
        isLoading: state.isLoading,
        isStreaming: state.isStreaming,
        error: state.error,

        send,
        sendMessage,
        sendMessageStream,
        loadConversation,
        cancel,
        reload,
        clear,
    };
}
