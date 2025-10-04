import { inngest } from "@/inngest/client";
import { getImages, getVideos, serperSearch } from "@/lib/search-providers";
import axios from "axios";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    const { query, id } = await req.json();
    const search = await serperSearch(query);
    const images = await getImages(query);
    const videos = await getVideos(query);
    const inngestID = await inngest.send({
        name: "llm-model",
        data: {
            searchInput: query,
            searchResult: { search, images, videos },
            id,
        },
    });

    return NextResponse.json({ id: inngestID.ids[0] }, { status: 200 });
};
