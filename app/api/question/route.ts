import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(
            // "http://127.0.0.1:5000/get_question",
            "https://career-agent-py.vercel.app/get_question",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching question:", error);
        return NextResponse.json(
            { error: "Failed to fetch question" },
            { status: 500 }
        );
    }
}
