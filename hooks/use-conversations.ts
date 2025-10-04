"use client";

import { useState, useEffect, useCallback } from "react";

interface ConversationSummary {
    id: string;
    title: string;
    summary?: {
        summary: string;
        messageCount: number;
        lastSummarizedAt: string;
    } | null;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}

interface ConversationListState {
    conversations: ConversationSummary[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    total: number;
}

interface UseConversationsOptions {
    apiEndpoint?: string;
    initialLimit?: number;
    autoLoad?: boolean;
    onError?: (error: Error) => void;
}

export function useConversations(options: UseConversationsOptions = {}) {
    const {
        apiEndpoint = "/api/v2/conversations/list",
        initialLimit = 20,
        autoLoad = true,
        onError,
    } = options;

    const [state, setState] = useState<ConversationListState>({
        conversations: [],
        isLoading: false,
        error: null,
        hasMore: false,
        total: 0,
    });

    const [pagination, setPagination] = useState({
        limit: initialLimit,
        offset: 0,
    });

    const loadConversations = useCallback(
        async (
            limit: number = pagination.limit,
            offset: number = 0,
            append: boolean = false
        ) => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    offset: offset.toString(),
                });

                const response = await fetch(`${apiEndpoint}?${params}`, {
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
                    conversations: append
                        ? [...prev.conversations, ...data.conversations]
                        : data.conversations,
                    isLoading: false,
                    hasMore: data.pagination.hasMore,
                    total: data.pagination.total,
                }));

                setPagination({
                    limit: data.pagination.limit,
                    offset: data.pagination.offset,
                });
            } catch (error) {
                const err =
                    error instanceof Error ? error : new Error("Unknown error");
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err.message,
                }));
                onError?.(err);
            }
        },
        [apiEndpoint, pagination.limit, onError]
    );

    useEffect(() => {
        if (autoLoad) {
            loadConversations();
        }
    }, [autoLoad, loadConversations]);

    const refresh = useCallback(() => {
        loadConversations(pagination.limit, 0, false);
    }, [loadConversations, pagination.limit]);

    const loadMore = useCallback(() => {
        if (!state.isLoading && state.hasMore) {
            const newOffset = pagination.offset + pagination.limit;
            loadConversations(pagination.limit, newOffset, true);
        }
    }, [state.isLoading, state.hasMore, pagination, loadConversations]);

    const addConversation = useCallback((conversation: ConversationSummary) => {
        setState((prev) => ({
            ...prev,
            conversations: [conversation, ...prev.conversations],
            total: prev.total + 1,
        }));
    }, []);

    const updateConversation = useCallback(
        (conversationId: string, updates: Partial<ConversationSummary>) => {
            setState((prev) => ({
                ...prev,
                conversations: prev.conversations.map((conv) =>
                    conv.id === conversationId ? { ...conv, ...updates } : conv
                ),
            }));
        },
        []
    );

    const removeConversation = useCallback((conversationId: string) => {
        setState((prev) => ({
            ...prev,
            conversations: prev.conversations.filter(
                (conv) => conv.id !== conversationId
            ),
            total: Math.max(0, prev.total - 1),
        }));
    }, []);

    const searchConversations = useCallback(
        (query: string) => {
            if (!query.trim()) {
                refresh();
                return;
            }

            setState((prev) => ({
                ...prev,
                conversations: prev.conversations.filter(
                    (conv) =>
                        conv.title
                            .toLowerCase()
                            .includes(query.toLowerCase()) ||
                        conv.summary?.summary
                            .toLowerCase()
                            .includes(query.toLowerCase())
                ),
            }));
        },
        [refresh]
    );

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    return {
        // State
        conversations: state.conversations,
        isLoading: state.isLoading,
        error: state.error,
        hasMore: state.hasMore,
        total: state.total,

        currentLimit: pagination.limit,
        currentOffset: pagination.offset,

        loadConversations,
        refresh,
        loadMore,
        addConversation,
        updateConversation,
        removeConversation,
        searchConversations,
        clearError,
    };
}
