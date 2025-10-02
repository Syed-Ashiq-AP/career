import axios from "axios";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { id } = await req.json();
    const result = await axios.get(
        `${process.env.INNGEST_SERVER}/v1/events/${id}/runs`,
        {
            headers: {
                Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
            },
        }
    );
    return NextResponse.json(result.data);
};
