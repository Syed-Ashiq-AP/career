import { NextRequest, NextResponse } from "next/server";

import dataset from "@/data/dataset.json";

// Build a flat map of all questions by id from all groups
function buildQuestionsMap() {
    const map: Record<string, any> = {};
    for (const group of Object.values(dataset.question_groups)) {
        for (const q of (group as any).questions) {
            map[String(q.id)] = q;
        }
    }
    return map;
}
const questionsMap = buildQuestionsMap();

type Question = any;

type UserAnswers = Record<
    string,
    { selected_option: string; category?: string }
>;

function getQuestionById(questionId: string | number): Question | null {
    return questionsMap[String(questionId)] || null;
}

function selectNextQuestionIntelligent(
    answeredQuestions: number[],
    userAnswers: UserAnswers
): Question | null {
    // If no questions answered yet, start with the designated start question
    if (!answeredQuestions.length) {
        // @ts-expect-error: dataset type is not strictly typed, but structure is known
        return getQuestionById(dataset.start_question);
    }
    const lastQuestionId = answeredQuestions[answeredQuestions.length - 1];
    const lastAnswer = userAnswers[String(lastQuestionId)];
    const lastQuestion = getQuestionById(lastQuestionId);
    if (!lastQuestion || !lastAnswer) return null;
    const selectedOption = lastAnswer.selected_option;
    const suggestedNext =
        lastQuestion.options[selectedOption]?.next_questions || [];
    const availableNext = suggestedNext.filter(
        (qId: number) => !answeredQuestions.includes(Number(qId))
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
    function scoreQuestion(qId: number) {
        const question = getQuestionById(qId);
        if (!question) return 0;
        let score = 0;
        const optionCategories = Object.values(question.options).map(
            (opt: any) => opt.category
        );
        if (dominantCategory && optionCategories.includes(dominantCategory))
            score += 3;
        for (const cat of optionCategories) {
            if (!categoryScores[cat] || categoryScores[cat] < 2) score += 2;
        }
        // Check question group diversity
        const answeredGroups = new Set<string>();
        for (const ansQId of answeredQuestions) {
            const ansQ = getQuestionById(ansQId);
            if (ansQ) answeredGroups.add(ansQ.group || "");
        }
        if (!answeredGroups.has(question.group || "")) score += 4;
        return score;
    }
    if (availableNext.length) {
        const scoredQuestions = availableNext.map(
            (qId: number) => [qId, scoreQuestion(qId)] as [number, number]
        );
        scoredQuestions.sort(
            (a: [number, number], b: [number, number]) => b[1] - a[1]
        );
        return getQuestionById(scoredQuestions[0][0]);
    }
    // Fallback: if no suggested questions available, find any unanswered question
    const allQuestionIds = Object.keys(questionsMap).map((qId) =>
        parseInt(qId, 10)
    );
    const unanswered = allQuestionIds.filter(
        (qId) => !answeredQuestions.includes(qId)
    );
    if (unanswered.length) {
        const scoredQuestions = unanswered.map(
            (qId: number) => [qId, scoreQuestion(qId)] as [number, number]
        );
        scoredQuestions.sort((a, b) => b[1] - a[1]);
        return getQuestionById(scoredQuestions[0][0]);
    }
    return null;
}

export async function POST(_req: NextRequest) {
    // Use the start_question id from dataset, and ensure it exists in the questions map
    const startId =
        (dataset as any).start_question || Object.keys(questionsMap)[0];
    const firstQuestion = getQuestionById(startId);
    return NextResponse.json({
        question: firstQuestion || null,
        total_answered: 0,
    });
}
