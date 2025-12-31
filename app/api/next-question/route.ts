import { NextRequest, NextResponse } from "next/server";
import dataset from "@/data/dataset.json";

type UserAnswers = Record<
    string,
    { selected_option: string; category?: string }
>;

function getQuestionById(questionId: string) {
    // @ts-expect-error: dataset type is not strictly typed, but structure is known
    return dataset.questions[questionId];
}

function selectNextQuestionIntelligent(
    answeredQuestions: string[],
    userAnswers: UserAnswers
) {
    if (!answeredQuestions.length) {
        // @ts-expect-error: dataset type is not strictly typed, but structure is known
        return getQuestionById(dataset.start_question);
    }
    const lastQuestionId = answeredQuestions[answeredQuestions.length - 1];
    const lastAnswer = userAnswers[lastQuestionId];
    const lastQuestion = getQuestionById(lastQuestionId);
    if (!lastQuestion || !lastAnswer) return null;
    const selectedOption = lastAnswer.selected_option;
    const suggestedNext =
        lastQuestion.options[selectedOption]?.next_questions || [];
    const availableNext = suggestedNext.filter(
        (qId: string) => !answeredQuestions.includes(qId)
    );
    const categoryScores: Record<string, number> = {};
    Object.values(userAnswers).forEach((answer) => {
        if (answer.category) {
            categoryScores[answer.category] =
                (categoryScores[answer.category] || 0) + 1;
        }
    });
    const dominantCategory = Object.entries(categoryScores).sort(
        (a, b) => b[1] - a[1]
    )[0]?.[0];
    function scoreQuestion(qId: string) {
        const question = getQuestionById(qId);
        if (!question) return 0;
        let score = 0;
        const optionCategories = Object.values(question.options).map(
            (opt: any) => opt.category
        );
        if (dominantCategory && optionCategories.includes(dominantCategory))
            score += 2;
        score += optionCategories.length;
        return score;
    }
    const bestNext = availableNext.sort(
        (a: string, b: string) => scoreQuestion(b) - scoreQuestion(a)
    )[0];
    return getQuestionById(bestNext) || null;
}

export async function POST(req: NextRequest) {
    const { answered_questions, user_answers } = await req.json();
    const nextQuestion = selectNextQuestionIntelligent(
        answered_questions,
        user_answers
    );
    if (!nextQuestion) {
        return NextResponse.json(
            { error: "No next question found" },
            { status: 404 }
        );
    }
    return NextResponse.json(nextQuestion);
}
