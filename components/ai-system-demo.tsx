"use client";

import { useState } from "react";
import { useChat } from "@/hooks/use-chat-v2";
import { useConversations } from "@/hooks/use-conversations";

export default function AISystemDemo() {
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | undefined
    >();

    // Enhanced chat hook
    const {
        messages,
        isStreaming,
        isLoading,
        error,
        send,
        conversationId,
        cancel,
        clear,
    } = useChat({
        initialConversationId: selectedConversationId,
        onError: (error) => console.error("Chat error:", error),
        onMessageComplete: (message) =>
            console.log("Message completed:", message),
    });

    // Conversations management hook
    const {
        conversations,
        isLoading: conversationsLoading,
        refresh: refreshConversations,
    } = useConversations({
        onError: (error) => console.error("Conversations error:", error),
    });

    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim() || isStreaming || isLoading) return;

        await send(input);
        setInput("");
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="w-80 border-r border-border p-4 overflow-y-auto">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Conversations</h2>
                        <button
                            onClick={refreshConversations}
                            disabled={conversationsLoading}
                            className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                            {conversationsLoading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedConversationId(undefined);
                            clear();
                        }}
                        className="w-full p-3 text-left bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                        <div className="font-medium">+ New Chat</div>
                        <div className="text-sm text-muted-foreground">
                            Start a new conversation
                        </div>
                    </button>

                    <div className="space-y-2">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() =>
                                    setSelectedConversationId(conversation.id)
                                }
                                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                                    conversationId === conversation.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card border-border hover:bg-muted"
                                }`}
                            >
                                <div className="font-medium truncate">
                                    {conversation.title}
                                </div>
                                <div className="text-sm opacity-70">
                                    {conversation.messageCount} messages •{" "}
                                    {new Date(
                                        conversation.updatedAt
                                    ).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b border-border p-4 bg-card/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Enhanced AI Chat
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Production-grade chat with streaming, memory
                                management, and rate limiting
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {isStreaming && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Streaming...
                                    <button
                                        onClick={cancel}
                                        className="text-red-500 hover:text-red-600 underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {conversationId && (
                                <span className="px-2 py-1 bg-muted rounded text-xs">
                                    ID: {conversationId.slice(-8)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🤖</div>
                            <h2 className="text-2xl font-semibold mb-2">
                                Ready to Chat!
                            </h2>
                            <p className="text-muted-foreground">
                                This is the enhanced AI system with:
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li>✅ Real-time streaming</li>
                                <li>✅ Conversation memory</li>
                                <li>✅ MongoDB persistence</li>
                                <li>✅ Rate limiting</li>
                                <li>✅ Multi-provider support</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-4 ${
                                            message.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
                                            <span>
                                                {message.role === "user"
                                                    ? "You"
                                                    : "AI"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(
                                                    message.createdAt
                                                ).toLocaleTimeString()}
                                            </span>
                                            {message.tokenCount && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {message.tokenCount}{" "}
                                                        tokens
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="whitespace-pre-wrap">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-border p-4 bg-card/50">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message... (Press Enter to send)"
                            disabled={isStreaming || isLoading}
                            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isStreaming || isLoading || !input.trim()}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isStreaming || isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                "Send"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
