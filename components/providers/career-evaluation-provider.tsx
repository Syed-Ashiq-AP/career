"use client";

import UseChatbot from "@/hooks/use-chat";
import { useRouter } from "next/navigation";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { toast } from "sonner";

export type Question = {
    question: string;
    options: string[];
};

export type Career = {
    title: string;
    description: string;
    match_percentage: number;
};

export type Answer = Question & { answer: string };

type evaluateContextType = {
    getQuestion: null | ((answer?: string, index?: number) => Promise<void>);
    currentQuestion: Question | null;
    answers: Answer[];
    careers: Career[] | null;
    setCurrentQuestion: null | ((data: Question) => void);
    enquireCareer: ((career: string) => Promise<void>) | null;
    submitTimer: number | null;
    startTimer: () => void;
};

const evaluateContext = createContext<evaluateContextType>({
    getQuestion: null,
    currentQuestion: null,
    setCurrentQuestion: null,
    careers: null,
    answers: [],
    enquireCareer: null,
    submitTimer: null,
    startTimer: () => {},
});

export const EvaluateContextProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const router = useRouter();

    const [careers, setCareers] = useState<Career[] | null>(null);

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
        null
    );
    const [answers, setAnswers] = useState<Answer[]>([]);

    const [submitTimer, setSubmitTimer] = useState<number | null>(null);

    const startTimer = () => {
        setSubmitTimer(5);
        const timer = setInterval(() => {
            setSubmitTimer((prev) => {
                if (!prev) {
                    clearInterval(timer);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const { setUpConversation } = UseChatbot();

    const evaluateCareer = useCallback(
        async (answers: Answer[]): Promise<Career[] | null> => {
            let retryCount = 0;
            const maxRetries = 50;

            const attemptFetch = async (): Promise<Career[] | null> => {
                try {
                    const request = await fetch("/api/career-ai/evaluate", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            answers: answers,
                        }),
                    });

                    if (request.status === 429) {
                        retryCount++;
                        if (retryCount === 1) {
                            toast(
                                "Rate limit exceeded. Automatically retrying..."
                            );
                        }

                        if (retryCount >= maxRetries) {
                            toast(
                                "Maximum retry attempts reached. Please try again later."
                            );
                            return null;
                        }

                        await new Promise((resolve) =>
                            setTimeout(resolve, 5000)
                        );
                        return attemptFetch();
                    }

                    if (!request.ok) {
                        const errorData = await request
                            .json()
                            .catch(() => ({}));
                        toast(errorData.error || "Failed to evaluate careers");
                        return null;
                    }

                    const res = await request.json();
                    if (!res || !res.careers) {
                        toast("Invalid response from server");
                        return null;
                    }

                    if (retryCount > 0) {
                        toast("Successfully retrieved career evaluation!");
                    }

                    return res.careers;
                } catch (error) {
                    console.error("Career evaluation error:", error);
                    toast("An error occurred while evaluating careers");
                    return null;
                }
            };

            return attemptFetch();
        },
        []
    );

    const fetchQuestion = useCallback(
        async (answers: Answer[]): Promise<Question | null> => {
            let retryCount = 0;
            const maxRetries = 50;

            const attemptFetch = async (): Promise<Question | null> => {
                try {
                    const request = await fetch("/api/career-ai", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            answers: answers,
                        }),
                    });

                    if (request.status === 429) {
                        retryCount++;
                        if (retryCount === 1) {
                            toast(
                                "Rate limit exceeded. Automatically retrying..."
                            );
                        }

                        if (retryCount >= maxRetries) {
                            toast(
                                "Maximum retry attempts reached. Please try again later."
                            );
                            return null;
                        }

                        await new Promise((resolve) =>
                            setTimeout(resolve, 5000)
                        );
                        return attemptFetch();
                    }

                    if (!request.ok) {
                        const errorData = await request
                            .json()
                            .catch(() => ({}));
                        toast(errorData.error || "Failed to get next question");
                        return null;
                    }

                    const res = await request.json();
                    if (!res || !res.question) {
                        toast("Invalid response from server");
                        return null;
                    }

                    if (retryCount > 0) {
                        toast("Successfully retrieved next question!");
                    }

                    return res.question;
                } catch (error) {
                    console.error("Question fetch error:", error);
                    toast("An error occurred while fetching question");
                    return null;
                }
            };

            return attemptFetch();
        },
        []
    );
    const getQuestion = useCallback(
        async (answer?: string, index?: number) => {
            const newAnswers: Answer[] = answer
                ? index !== undefined
                    ? answers
                          .map((answered, i) =>
                              i === index
                                  ? ({ ...currentQuestion, answer } as Answer)
                                  : answered
                          )
                          .filter((_, i) => i <= index)
                    : ([...answers, { ...currentQuestion, answer }] as Answer[])
                : [];
            if (newAnswers.length >= 15) {
                const careers = await evaluateCareer(newAnswers);
                if (careers) {
                    setCareers(careers);
                }
            } else {
                const question = await fetchQuestion(newAnswers);
                if (question) {
                    setCurrentQuestion(question);
                }
            }
            if (!answer || currentQuestion !== null) setAnswers(newAnswers);
        },
        [answers, currentQuestion, evaluateCareer, fetchQuestion]
    );

    const enquireCareer = useCallback(
        async (career: string) => {
            const id = await setUpConversation(career);
            router.push(`/chat/${id}`);
        },
        [setUpConversation, router]
    );

    useEffect(() => {
        if (!currentQuestion) getQuestion();
    }, [getQuestion, currentQuestion]);

    const value = useMemo(
        () => ({
            getQuestion,
            currentQuestion,
            answers,
            setCurrentQuestion,
            careers,
            enquireCareer,
            startTimer,
            submitTimer,
        }),
        [
            getQuestion,
            currentQuestion,
            answers,
            careers,
            enquireCareer,
            submitTimer,
        ]
    );

    return (
        <evaluateContext.Provider value={value}>
            {children}
        </evaluateContext.Provider>
    );
};

export const useEvaluator = () => {
    const evaluatecontext = useContext(evaluateContext);
    if (!evaluateContext) throw new Error("wrap under EvaluateContextProvider");

    return evaluatecontext;
};
