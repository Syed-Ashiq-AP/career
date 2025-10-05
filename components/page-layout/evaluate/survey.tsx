import React, { useCallback, useEffect, useState } from "react";
import OptionButton from "@/components/page-layout/evaluate/option-button";
import QuestionPagination from "@/components/page-layout/evaluate/pagination";
import Image from "next/image";
import {
    Question,
    useEvaluator,
} from "@/components/providers/career-evaluation-provider";
import { cn } from "@/lib/utils";
const Survey = () => {
    const evaluatorContext = useEvaluator();

    const {
        submitTimer,
        startTimer,
        answers,
        getQuestion,
        currentQuestion,
        setCurrentQuestion,
    } = evaluatorContext;

    const [toBeAnswered, setToBeAnswered] = useState<Question | null>(null);

    const [hasAnswered, setHasAnswered] = useState(false);

    useEffect(() => {
        setHasAnswered(false);
        const newPage = answers.length + 1;
        setCurrentPageNum(newPage);
    }, [answers]);

    const [currentPageNum, setCurrentPageNum] = useState(1);

    const setCurrentPage = (page: number) => {
        setCurrentPageNum(page);
    };

    const handlePageChange = useCallback(
        (page: number) => {
            if (!setCurrentQuestion) return;
            if (!toBeAnswered) setToBeAnswered(currentQuestion);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { answer: _, ...question } =
                answers[page - 1] ?? toBeAnswered;
            setCurrentQuestion(question);
        },
        [answers, setCurrentQuestion, currentQuestion, toBeAnswered]
    );

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const select = useCallback(
        (option: string) => {
            setSelectedOption(option === selectedOption ? null : option);
        },
        [selectedOption]
    );

    const answered = useCallback(async () => {
        if (!getQuestion || !selectedOption) return;
        setHasAnswered(true);
        await getQuestion(
            selectedOption,
            currentPageNum <= answers.length ? currentPageNum - 1 : undefined
        );
        startTimer();

        setToBeAnswered(null);
    }, [getQuestion, currentPageNum, answers, startTimer, selectedOption]);

    return (
        currentQuestion && (
            <>
                <div className="sm:w-[400px] sm:min-h-[650px] rounded-lg border bg-neutral-900 flex flex-col p-4 space-y-4">
                    <div className="p-2 bg-accent rounded w-fit text-sm">
                        Q{currentPageNum}
                    </div>
                    <h2 className="text-xl font-bold">
                        {currentQuestion?.question}
                    </h2>
                    <Image
                        src={"/temp.png"}
                        width={300}
                        height={300}
                        className="mx-auto"
                        alt={"temp"}
                    />
                    {currentQuestion?.options.map((option, i) => (
                        <OptionButton
                            onClick={() => select(option)}
                            className={cn(
                                selectedOption === option && "bg-accent"
                            )}
                            disabled={hasAnswered}
                            key={i}
                        >
                            {option}
                        </OptionButton>
                    ))}

                    <OptionButton
                        onClick={() => {
                            answered();
                        }}
                        disabled={
                            !!submitTimer || !selectedOption || hasAnswered
                        }
                        className="mt-5 bg-accent"
                    >
                        Submit
                        {submitTimer !== null && ` (${submitTimer}s)`}
                    </OptionButton>
                </div>
                <div className="fixed bottom-0">
                    <QuestionPagination
                        currentPage={currentPageNum}
                        setCurrentPage={setCurrentPage}
                        totalPages={answers.length + 1}
                        onPageChange={handlePageChange}
                    />
                </div>
            </>
        )
    );
};

export default Survey;
