import { NextResponse } from "next/server";
import axios from "axios";

export const POST = async (req: Request) => {
    const { search } = await req.json();
    const result = await axios.get(
        `https://autom.dev/api/v1/brave/search?query=${search}`,
        {
            headers: {
                Accept: "applications/json",
                "x-api-key": process.env.BRAVE_API_KEY,
            },
        }
    );
    console.log(result.data);
    return NextResponse.json(result.data);
};
