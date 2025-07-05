"use client";
import { FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useActions, readStreamableValue } from "ai/rsc";
import { type AI } from "./action";
import { ChatScrollAnchor } from "@/lib/hooks/chat-scroll-anchor";
import Textarea from "react-textarea-autosize";
import { useEnterSubmit } from "@/lib/hooks/use-enter-submit";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import SearchResultsComponent from "@/components/answer/SearchResultsComponent";
import UserMessageComponent from "@/components/answer/UserMessageComponent";
import FollowUpComponent from "@/components/answer/FollowUpComponent";
import InitialQueries from "@/components/answer/InitialQueries";
import CareerWelcome from "@/components/answer/CareerWelcome";
import LLMResponseComponent from "@/components/answer/LLMResponseComponent";
import ImagesComponent from "@/components/answer/ImagesComponent";
import VideosComponent from "@/components/answer/VideosComponent";
const MapComponent = dynamic(() => import("@/components/answer/Map"), {
    ssr: false,
});
import MapDetails from "@/components/answer/MapDetails";
import ShoppingComponent from "@/components/answer/ShoppingComponent";
import FinancialChart from "@/components/answer/FinancialChart";
import ImageGenerationComponent from "@/components/answer/ImageGenerationComponent";
import { ArrowUp, Paperclip } from "@phosphor-icons/react";
import RateLimit from "@/components/answer/RateLimit";
import { mentionToolConfig } from "./tools/mentionToolConfig";
interface SearchResult {
    favicon: string;
    link: string;
    title: string;
}
interface Message {
    falBase64Image: any;
    logo: string | undefined;
    semanticCacheKey: any;
    cachedData: string;
    id: number;
    type: string;
    content: string;
    userMessage: string;
    images: Image[];
    videos: Video[];
    followUp: FollowUp | null;
    isStreaming: boolean;
    searchResults?: SearchResult[];
    conditionalFunctionCallUI?: any;
    status?: string;
    places?: Place[];
    shopping?: Shopping[];
    ticker?: string | undefined;
    isolatedView: boolean;
}
interface StreamMessage {
    isolatedView: any;
    searchResults?: any;
    userMessage?: string;
    llmResponse?: string;
    llmResponseEnd?: boolean;
    images?: any;
    videos?: any;
    followUp?: any;
    conditionalFunctionCallUI?: any;
    status?: string;
    places?: Place[];
    shopping?: Shopping[];
    ticker?: string;
    cachedData?: string;
    semanticCacheKey?: any;
    falBase64Image?: any;
}
interface Image {
    link: string;
}
interface Video {
    link: string;
    imageUrl: string;
}
interface Place {
    cid: React.Key | null | undefined;
    latitude: number;
    longitude: number;
    title: string;
    address: string;
    rating: number;
    category: string;
    phoneNumber?: string;
    website?: string;
}
interface FollowUp {
    choices: {
        message: {
            content: string;
        };
    }[];
}
interface Shopping {
    type: string;
    title: string;
    source: string;
    link: string;
    price: string;
    shopping: any;
    position: number;
    delivery: string;
    imageUrl: string;
    rating: number;
    ratingCount: number;
    offers: string;
    productId: string;
}

const mentionTools = mentionToolConfig.useMentionQueries
    ? mentionToolConfig.mentionTools
    : [];

export default function Page() {
    const searchParams = useSearchParams();
    const [file, setFile] = useState("");
    const [mentionQuery, setMentionQuery] = useState("");
    const [selectedMentionTool, setSelectedMentionTool] = useState<
        string | null
    >(null);
    const [selectedMentionToolLogo, setSelectedMentionToolLogo] = useState<
        string | null
    >(null);
    const [showRAG, setShowRAG] = useState(false);
    const { myAction } = useActions<typeof AI>();
    const { formRef, onKeyDown } = useEnterSubmit();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentLlmResponse, setCurrentLlmResponse] = useState("");
    const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] =
        useState(false);
    const processedPromptRef = useRef(false);
    const [shouldProcessPrompt, setShouldProcessPrompt] = useState<
        string | null
    >(null);
    const handleFollowUpClick = useCallback(async (question: string) => {
        setCurrentLlmResponse("");
        await handleUserMessageSubmission({
            message: question,
            mentionTool: null,
            logo: null,
            file: file,
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/") {
                if (
                    e.target &&
                    ["INPUT", "TEXTAREA"].includes(
                        (e.target as HTMLElement).nodeName
                    )
                ) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (inputRef?.current) {
                    inputRef.current.focus();
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [inputRef]);
    const handleSubmit = async (payload: {
        message: string;
        mentionTool: string | null;
        logo: string | null;
        file: string;
    }) => {
        if (!payload.message) return;
        await handleUserMessageSubmission(payload);
    };
    const handleFormSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setInputValue("");

        const payload = {
            message: inputValue.trim(),
            mentionTool: selectedMentionTool,
            logo: selectedMentionToolLogo,
            file: file,
        };
        await handleSubmit(payload);
        setShowRAG(false);
        setSelectedMentionTool(null);
        setSelectedMentionToolLogo(null);
        setFile("");
    };
    const handleUserMessageSubmission = useCallback(
        async (payload: {
            logo: any;
            message: string;
            mentionTool: string | null;
            file: string;
        }): Promise<void> => {
            const newMessageId = Date.now();
            const newMessage = {
                id: newMessageId,
                type: "userMessage",
                userMessage: payload.message,
                mentionTool: payload.mentionTool,
                file: payload.file,
                logo: payload.logo,
                content: "",
                images: [],
                videos: [],
                followUp: null,
                isStreaming: true,
                searchResults: [] as SearchResult[],
                places: [] as Place[],
                shopping: [] as Shopping[],
                status: "",
                ticker: undefined,
                semanticCacheKey: null,
                cachedData: "",
                isolatedView: !!payload.mentionTool,
                falBase64Image: null,
            };
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            let lastAppendedResponse = "";
            try {
                const streamableValue = await myAction(
                    payload.message,
                    payload.mentionTool,
                    payload.logo,
                    payload.file
                );

                let llmResponseString = "";
                for await (const message of readStreamableValue(
                    streamableValue
                )) {
                    const typedMessage = message as StreamMessage;
                    setMessages((prevMessages) => {
                        const messagesCopy = [...prevMessages];
                        const messageIndex = messagesCopy.findIndex(
                            (msg) => msg.id === newMessageId
                        );
                        if (messageIndex !== -1) {
                            const currentMessage = messagesCopy[messageIndex];

                            currentMessage.status =
                                typedMessage.status === "rateLimitReached"
                                    ? "rateLimitReached"
                                    : currentMessage.status;

                            if (typedMessage.isolatedView) {
                                currentMessage.isolatedView = true;
                            }

                            if (
                                typedMessage.llmResponse &&
                                typedMessage.llmResponse !==
                                    lastAppendedResponse
                            ) {
                                currentMessage.content +=
                                    typedMessage.llmResponse;
                                lastAppendedResponse = typedMessage.llmResponse;
                            }

                            currentMessage.isStreaming =
                                typedMessage.llmResponseEnd
                                    ? false
                                    : currentMessage.isStreaming;
                            currentMessage.searchResults =
                                typedMessage.searchResults ||
                                currentMessage.searchResults;
                            currentMessage.images = typedMessage.images
                                ? [...typedMessage.images]
                                : currentMessage.images;
                            currentMessage.videos = typedMessage.videos
                                ? [...typedMessage.videos]
                                : currentMessage.videos;
                            currentMessage.followUp =
                                typedMessage.followUp ||
                                currentMessage.followUp;
                            currentMessage.semanticCacheKey =
                                messagesCopy[messageIndex];
                            currentMessage.falBase64Image =
                                typedMessage.falBase64Image;

                            if (typedMessage.conditionalFunctionCallUI) {
                                const functionCall =
                                    typedMessage.conditionalFunctionCallUI;
                                if (functionCall.type === "places")
                                    currentMessage.places = functionCall.places;
                                if (functionCall.type === "shopping")
                                    currentMessage.shopping =
                                        functionCall.shopping;
                                if (functionCall.type === "ticker")
                                    currentMessage.ticker = functionCall.data;
                            }

                            if (typedMessage.cachedData) {
                                const data = JSON.parse(
                                    typedMessage.cachedData
                                );
                                currentMessage.searchResults =
                                    data.searchResults;
                                currentMessage.images = data.images;
                                currentMessage.videos = data.videos;
                                currentMessage.content = data.llmResponse;
                                currentMessage.isStreaming = false;
                                currentMessage.semanticCacheKey =
                                    data.semanticCacheKey;
                                currentMessage.conditionalFunctionCallUI =
                                    data.conditionalFunctionCallUI;
                                currentMessage.followUp = data.followUp;

                                if (data.conditionalFunctionCallUI) {
                                    const functionCall =
                                        data.conditionalFunctionCallUI;
                                    if (functionCall.type === "places")
                                        currentMessage.places =
                                            functionCall.places;
                                    if (functionCall.type === "shopping")
                                        currentMessage.shopping =
                                            functionCall.shopping;
                                    if (functionCall.type === "ticker")
                                        currentMessage.ticker =
                                            functionCall.data;
                                }
                            }
                        }
                        return messagesCopy;
                    });
                    if (typedMessage.llmResponse) {
                        llmResponseString += typedMessage.llmResponse;
                        setCurrentLlmResponse(llmResponseString);
                    }
                }
            } catch (error) {
                console.error("Error streaming data for user message:", error);
            }
        },
        [myAction]
    );
    const handleFileUpload = (file: File) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            const base64File = e.target?.result;
            if (base64File) {
                setFile(String(base64File));
            }
        };
        fileReader.readAsDataURL(file);
    };

    useEffect(() => {
        const promptFromUrl = searchParams.get("prompt");
        if (
            promptFromUrl &&
            !hasProcessedInitialPrompt &&
            !processedPromptRef.current &&
            messages.length === 0
        ) {
            processedPromptRef.current = true;
            setHasProcessedInitialPrompt(true);
            setInputValue(promptFromUrl);
            setShouldProcessPrompt(promptFromUrl);

            const url = new URL(window.location.href);
            url.searchParams.delete("prompt");
            window.history.replaceState({}, "", url.toString());
            setInputValue("");
        }
    }, [searchParams, hasProcessedInitialPrompt, messages.length]);

    useEffect(() => {
        if (shouldProcessPrompt) {
            const timeoutId = setTimeout(async () => {
                const payload = {
                    message: shouldProcessPrompt,
                    mentionTool: null,
                    logo: null,
                    file: "",
                };

                try {
                    await handleUserMessageSubmission(payload);
                } catch (error) {
                    console.error("Error submitting initial prompt:", error);
                }

                setShouldProcessPrompt(null);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [shouldProcessPrompt, handleUserMessageSubmission]);

    return (
        <div>
            {messages.length > 0 && (
                <div className="flex flex-col">
                    {messages.map((message, index) => (
                        <div key={`message-${index}`}>
                            {message.isolatedView ? (
                                selectedMentionTool ===
                                    "fal-ai/stable-diffusion-v3-medium" ||
                                message.falBase64Image ? (
                                    <ImageGenerationComponent
                                        key={`image-${index}`}
                                        src={message.falBase64Image}
                                        query={message.userMessage}
                                    />
                                ) : (
                                    <LLMResponseComponent
                                        key={`llm-response-${index}`}
                                        llmResponse={message.content}
                                        currentLlmResponse={currentLlmResponse}
                                        index={index}
                                        semanticCacheKey={
                                            message.semanticCacheKey
                                        }
                                        isolatedView={true}
                                        logo={message.logo}
                                    />
                                )
                            ) : (
                                <div className="flex flex-col md:flex-row max-w-[1200px] mx-auto">
                                    <div className="w-full md:w-3/4 md:pr-2">
                                        {message.status &&
                                            message.status ===
                                                "rateLimitReached" && (
                                                <RateLimit />
                                            )}
                                        {message.type === "userMessage" && (
                                            <UserMessageComponent
                                                message={message.userMessage}
                                            />
                                        )}
                                        {message.ticker &&
                                            message.ticker.length > 0 && (
                                                <FinancialChart
                                                    key={`financialChart-${index}`}
                                                    ticker={message.ticker}
                                                />
                                            )}

                                        {message.searchResults && (
                                            <SearchResultsComponent
                                                key={`searchResults-${index}`}
                                                searchResults={
                                                    message.searchResults
                                                }
                                            />
                                        )}
                                        {message.places &&
                                            message.places.length > 0 && (
                                                <MapComponent
                                                    key={`map-${index}`}
                                                    places={message.places}
                                                />
                                            )}
                                        <LLMResponseComponent
                                            llmResponse={message.content}
                                            currentLlmResponse={
                                                currentLlmResponse
                                            }
                                            index={index}
                                            semanticCacheKey={
                                                message.semanticCacheKey
                                            }
                                            key={`llm-response-${index}`}
                                            isolatedView={false}
                                        />
                                        {message.followUp && (
                                            <div className="flex flex-col">
                                                <FollowUpComponent
                                                    key={`followUp-${index}`}
                                                    followUp={message.followUp}
                                                    handleFollowUpClick={
                                                        handleFollowUpClick
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full md:w-1/4 md:pl-2">
                                        {message.shopping &&
                                            message.shopping.length > 0 && (
                                                <ShoppingComponent
                                                    key={`shopping-${index}`}
                                                    shopping={message.shopping}
                                                />
                                            )}
                                        {message.images && (
                                            <ImagesComponent
                                                key={`images-${index}`}
                                                images={message.images}
                                            />
                                        )}
                                        {message.videos && (
                                            <VideosComponent
                                                key={`videos-${index}`}
                                                videos={message.videos}
                                            />
                                        )}
                                        {message.places &&
                                            message.places.length > 0 && (
                                                <MapDetails
                                                    key={`map-${index}`}
                                                    places={message.places}
                                                />
                                            )}
                                        {message.falBase64Image && (
                                            <ImageGenerationComponent
                                                key={`image-${index}`}
                                                src={message.falBase64Image}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div
                className={`px-2 fixed inset-x-0 bottom-0 w-full bg-gradient-to-b duration-300 ease-in-out animate-in dark:from-gray-900/10 dark:from-10% peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]] mb-4 bring-to-front fixed-bottom-container`}
            >
                <div className="mx-auto max-w-5xl sm:px-4 px-2">
                    {messages.length === 0 && !inputValue && (
                        <div className="mb-8 career-welcome-container career-scroll">
                            <CareerWelcome
                                handleFollowUpClick={handleFollowUpClick}
                            />
                            <div className="max-w-xl mx-auto">
                                <InitialQueries
                                    questions={[
                                        "What are the best engineering colleges in India for 2025?",
                                        "How to prepare for JEE Main 2025? Complete study plan needed",
                                        "What are the career options after B.Tech in Computer Science?",
                                        "Tell me about NEET 2025 exam pattern and top medical colleges",
                                        "What scholarships are available for SC/ST students in 2025?",
                                        "Compare B.E vs B.Tech - which is better for placement?",
                                    ]}
                                    handleFollowUpClick={handleFollowUpClick}
                                />
                            </div>
                        </div>
                    )}
                    {mentionQuery && (
                        <div className="">
                            <div className="flex items-center"></div>
                            <ul>
                                {mentionTools
                                    .filter((tool) =>
                                        tool.name
                                            .toLowerCase()
                                            .includes(
                                                mentionQuery.toLowerCase()
                                            )
                                    )
                                    .map((tool) => (
                                        <li
                                            key={tool.id}
                                            className="flex items-center cursor-pointer dark:bg-slate-800 bg-white shadow-lg rounded-lg p-3 md:p-4 mb-2"
                                            onClick={() => {
                                                setSelectedMentionTool(tool.id);
                                                setSelectedMentionToolLogo(
                                                    tool.logo
                                                );
                                                tool.enableRAG &&
                                                    setShowRAG(true);
                                                setMentionQuery("");
                                                setInputValue(" ");
                                            }}
                                        >
                                            {tool.logo ? (
                                                <img
                                                    src={tool.logo}
                                                    alt={tool.name}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                            ) : (
                                                <span
                                                    role="img"
                                                    aria-label="link"
                                                    className="mr-2 dark:text-white text-black"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 256 256"
                                                        fill="currentColor"
                                                        className="h-4 w-4"
                                                    >
                                                        <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"></path>
                                                    </svg>
                                                </span>
                                            )}

                                            <p className="ml-2 block sm:inline text-md sm:text-lg font-semibold dark:text-white text-black">
                                                @{tool.name}
                                            </p>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}
                    <form
                        ref={formRef}
                        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            handleFormSubmit(e);
                            setCurrentLlmResponse("");
                            if (window.innerWidth < 600) {
                                (e.target as HTMLFormElement)[
                                    "message"
                                ]?.blur();
                            }
                            const value = inputValue.trim();
                            setInputValue("");
                            if (!value) return;
                        }}
                    >
                        <div className="relative flex flex-col w-full overflow-hidden max-h-60 grow dark:bg-slate-800 bg-gray-100 border sm:px-2 rounded-lg">
                            {selectedMentionToolLogo && (
                                <img
                                    src={selectedMentionToolLogo}
                                    className="absolute left-2 top-4 w-8 h-8"
                                />
                            )}
                            {showRAG && (
                                <>
                                    <label
                                        htmlFor="fileInput"
                                        className="absolute left-12 top-5 w-6 h-6 -rotate-45 transition-transform duration-300 hover:rotate-0 "
                                    >
                                        <Paperclip size={28} />
                                    </label>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".doc,.docx,.pdf, .txt, .js, .tsx"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileUpload(file);
                                            }
                                        }}
                                    />
                                </>
                            )}
                            <Textarea
                                ref={inputRef}
                                tabIndex={0}
                                onKeyDown={onKeyDown}
                                placeholder="Ask about careers, colleges, courses, entrance exams, or study guidance..."
                                className={`w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm dark:text-white text-black pr-[45px] ${
                                    selectedMentionToolLogo ? "pl-10" : ""
                                }
                  ${showRAG ? "pl-20" : ""}
                  `}
                                autoFocus
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                name="message"
                                rows={1}
                                value={inputValue}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setInputValue(value);

                                    if (value.includes("@")) {
                                        const mentionIndex =
                                            value.lastIndexOf("@");
                                        const query = value.slice(
                                            mentionIndex + 1
                                        );
                                        setMentionQuery(query);
                                    } else {
                                        setMentionQuery("");
                                    }

                                    if (value.trim() === "") {
                                        setSelectedMentionTool(null);
                                        setSelectedMentionToolLogo(null);
                                        setShowRAG(false);
                                    }
                                }}
                            />
                            <ChatScrollAnchor trackVisibility={true} />
                            <div className="absolute right-5 top-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={inputValue === ""}
                                        >
                                            <ArrowUp />
                                            <span className="sr-only">
                                                Send message
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Send message
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="pb-[80px] pt-4 md:pt-10"></div>
        </div>
    );
}
