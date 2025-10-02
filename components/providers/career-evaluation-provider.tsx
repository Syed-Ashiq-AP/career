"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

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
    getQuestion: null | ((answer?: string, index?: number) => void);
    currentQuestion: Question | null;
    answers: Answer[];
    careers: Career[] | null;
    setCurrentQuestion: null | ((data: Question) => void);
};

const evaluateContext = createContext<evaluateContextType>({
    getQuestion: null,
    currentQuestion: null,
    setCurrentQuestion: null,
    careers: null,
    answers: [],
});

export const EvaluateContextProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [careers, setCareers] = useState<Career[] | null>(null);

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
        null
    );
    const [answers, setAnswers] = useState<Answer[]>([]);

    useEffect(() => {
        console.log(answers);
    }, [answers]);

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
            if (newAnswers.length === 15) {
                const request = await fetch("/api/career-ai/evaluate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        answers: newAnswers,
                    }),
                });
                if (request.status === 500) {
                }
                const res = await request.json();
                if (!res) return null;
                const careers = res.careers;
                setCareers(careers);
            } else {
                const request = await fetch("/api/career-ai", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        answers: newAnswers,
                    }),
                });
                const res = await request.json();
                if (!res) return null;
                const question = res.question;
                setCurrentQuestion(question);
            }
            if (!answer || currentQuestion !== null) setAnswers(newAnswers);
        },
        [answers, currentQuestion]
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
        }),
        [getQuestion, currentQuestion, answers, careers]
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
