"use client";

import React from "react";
import QuestionRenderer from "../question-renderer";
import { useQuestion } from "../question-context";
import CareerSuggest from "../career-suggest/career-suggest";

const Survey = () => {
    const questionContext = useQuestion();
    if (!questionContext) return;
    const { questionNumber, totalQuestions } = questionContext;

    return totalQuestions === questionNumber ? (
        <CareerSuggest />
    ) : (
        <QuestionRenderer />
    );
};

export default Survey;
