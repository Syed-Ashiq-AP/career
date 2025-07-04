"use client";
import {
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createContext } from "react";
import { useQuery } from "@tanstack/react-query";

export interface Question {
    id: number;
    question: string;
    options: {
        a: string;
        b: string;
        c: string;
        d: string;
    };
}
export type Option = "a" | "b" | "c" | "d";
type response = {
    question_id: number;
    option: Option;
};

type questionContextType = {
    question: Question | null;
    questionNumber: number;
    totalQuestions: number;
    isLoading: boolean;
    career: Career | null;
    isCareerLoading: boolean;
    respond: (id: number, option: Option) => void;
};

type Career = {
    careers: {
        career: string;
        justification: string;
        rank: number;
    }[];
    message: string;
};

const QuestionContext = createContext<questionContextType | null>(null);

export const QuestionProvider = ({ children }: { children: ReactNode }) => {
    const [progress, setProgress] = useState<number>(0);
    const [responses, setResponses] = useState<response[]>([]);

    const {
        data: question,
        refetch: refetchQuestion,

        isLoading,
    } = useQuery({
        queryKey: ["question", responses],
        queryFn: async () => {
            const res = await fetch("/api/question", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    responses,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return (await res.json()) as Question;
        },
        enabled: false,
    });

    const {
        data: career,
        isLoading: isCareerLoading,
        refetch: refetchCareer,
    } = useQuery({
        queryKey: ["career", responses],
        queryFn: async () => {
            const res = await fetch("/api/career", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    responses,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return (await res.json()) as Career;
        },
        enabled: false,
    });

    const getCareer = useCallback(() => {
        if (progress === 10) {
            refetchCareer();
        }
    }, [progress, refetchCareer]);

    useEffect(() => {
        if (progress === 10) {
            getCareer();
        }
    }, [progress, getCareer]);

    const didMount = useRef(false);

    useEffect(() => {
        if (didMount.current) return;
        refetchQuestion();
        didMount.current = false;
    }, [didMount]);

    useEffect(() => {
        refetchQuestion();
    }, [responses]);

    const value = useMemo(
        () => ({
            question: question || null,
            questionNumber: progress,
            totalQuestions: 10,
            career: career || null,
            isCareerLoading,
            respond: (id: number, option: Option) => {
                setResponses((prev) => [...prev, { question_id: id, option }]);
                setProgress((prev) => prev + 1);
            },
            isLoading,
        }),
        [question, progress, career, isCareerLoading, isLoading]
    );

    return (
        <QuestionContext.Provider value={value}>
            {children}
        </QuestionContext.Provider>
    );
};

export const useQuestion = () => {
    const questionContext = useContext(QuestionContext);
    if (questionContext === undefined) {
        throw new Error("useUser must be used within userProvider");
    }
    return questionContext;
};
