import { NextResponse } from "next/server";
import dataset from "../../../data/dataset.json";

export const POST = async (req: Request) => {
    const data = await req.json();
    const answers = data.answers;
    if (!answers) {
        return NextResponse.json({ error: "invalid req" }, { status: 400 });
    }

    const prompt = `
    You are a career counselor AI. You are to ask questions that can help suggest possible future career options. ${answers.length !== 0 && `Based on the user's previous answers: ${JSON.stringify(answers)}`}
    Suggest the next best question and have the options related to the answers (you don't have to have the options exactly from the dataset).
    If the user has answered enough questions then reply with 'evaluate' limit it to 30 questions
    If not reply with only {"question":"...","options":["option1","option2",...]}
    Below the sample dataset you can use to refer for what type of questions to ask to give your own question and option: ${JSON.stringify(dataset)}
    `;

    try {
        const response = await fetch("https://api.a4f.co/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.A4F_API_KEY}`,
            },
            body: JSON.stringify({
                model: "provider-3/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful career guide.",
                    },
                    { role: "user", content: prompt },
                ],
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: errorText }, { status: 500 });
        }
        const data = await response.json();
        const aiResponseText = data.choices[0].message.content;
        console.log(aiResponseText);
        try {
            console.log(aiResponseText);
            const question = JSON.parse(aiResponseText);
            return NextResponse.json(
                {
                    question,
                },
                { status: 200 }
            );
        } catch (e) {
            console.log("error!", JSON.stringify(e));
            return NextResponse.json({ error: e }, { status: 500 });
        }
    } catch (e) {
        console.log("error!", JSON.stringify(e));
        return NextResponse.json({ error: e }, { status: 500 });
    }
};
