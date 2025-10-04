import React from "react";
import EnhancedChatBot from "./enhancedChatbot";

interface EnhancedProvidersProps {
    userId: string;
    chatId?: string;
}

const EnhancedProviders: React.FC<EnhancedProvidersProps> = ({
    userId,
    chatId,
}) => {
    return (
        <div className="h-screen w-full">
            <EnhancedChatBot userId={userId} initialConversationId={chatId} />
        </div>
    );
};

export default EnhancedProviders;
