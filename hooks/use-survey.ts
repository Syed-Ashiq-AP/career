import { PromptInputMessage } from "@/components/ai/prompt-input";
import { useUserData } from "./use-user";

const sendQueryMessage = async (
    query: string,
    sendMessage: (message: PromptInputMessage) => void,
    initiateConversation: (initialMessage: string) => Promise<void>
) => {
    const message = {
        text: `I'm interested in pursuing a career as a ${query}. Please provide me with comprehensive career guidance`,
        files: [],
    };
    await initiateConversation(message.text);
    sendMessage(message);
};

export function useSurvey({
    sendMessage,
}: {
    sendMessage: (message: PromptInputMessage) => void;
}) {
    const { initiateConversation } = useUserData();
    if (typeof window !== "undefined") {
        const query = localStorage.getItem("survey-query");
        if (query) {
            sendQueryMessage(query, sendMessage, initiateConversation);
        }
        localStorage.removeItem("survey-query");
    }
}
