import React, { useCallback, useEffect, useState } from "react";
import OptionButton from "@/components/page-layout/evaluate/option-button";
import QuestionPagination from "@/components/page-layout/evaluate/pagination";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdClose } from "react-icons/md";
import {
    Question,
    useEvaluator,
} from "@/components/providers/career-evaluation-provider";
const Survey = () => {
    const router = useRouter();

    const evaluatorContext = useEvaluator();

    const { answers, getQuestion, currentQuestion, setCurrentQuestion } =
        evaluatorContext;

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

    const answered = useCallback(
        (option: string) => {
            if (!getQuestion) return;
            setHasAnswered(true);
            getQuestion(
                option,
                currentPageNum <= answers.length
                    ? currentPageNum - 1
                    : undefined
            );
            setToBeAnswered(null);
        },
        [getQuestion, currentPageNum, answers]
    );
    return (
        currentQuestion && (
            <div className="w-full h-full flex items-center justify-center bg-neutral-950 px-2">
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
                            disabled={hasAnswered}
                            onClick={() => {
                                answered(option);
                            }}
                            key={i}
                        >
                            {option}
                        </OptionButton>
                    ))}
                </div>
                <div className="fixed bottom-0">
                    <QuestionPagination
                        currentPage={currentPageNum}
                        setCurrentPage={setCurrentPage}
                        totalPages={answers.length + 1}
                        onPageChange={handlePageChange}
                    />
                </div>
                <Button
                    variant={"ghost"}
                    className="fixed top-0 left-0 m-4"
                    onClick={() => {
                        router.push("/");
                    }}
                >
                    <MdClose />
                </Button>
            </div>
        )
    );
};

export default Survey;
