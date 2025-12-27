import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const data = await req.json();
        const { keywords } = data;

        if (!keywords || !Array.isArray(keywords)) {
            return NextResponse.json(
                { error: "Invalid request: keywords array required" },
                { status: 400 }
            );
        }

        const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

        // If no API key, use picsum.photos as fallback
        if (!PEXELS_API_KEY) {
            console.log("No Pexels API key found, using picsum.photos fallback");
            const images = keywords.map((_: string, index: number) => ({
                url: `https://picsum.photos/seed/${Date.now() + index}/400/200`,
                alt: keywords[index],
            }));
            return NextResponse.json({ images }, { status: 200 });
        }

        // Fetch images from Pexels
        const imagePromises = keywords.map(async (keyword: string) => {
            try {
                const response = await fetch(
                    `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`,
                    {
                        headers: {
                            Authorization: PEXELS_API_KEY,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Pexels API error: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.photos && data.photos.length > 0) {
                    return {
                        url: data.photos[0].src.medium,
                        alt: keyword,
                    };
                } else {
                    // Fallback to picsum if no results
                    return {
                        url: `https://picsum.photos/seed/${keyword}/400/200`,
                        alt: keyword,
                    };
                }
            } catch (error) {
                console.error(`Error fetching image for ${keyword}:`, error);
                // Fallback to picsum
                return {
                    url: `https://picsum.photos/seed/${keyword}/400/200`,
                    alt: keyword,
                };
            }
        });

        const images = await Promise.all(imagePromises);

        return NextResponse.json({ images }, { status: 200 });
    } catch (error) {
        console.error("Error in images endpoint:", error);
        return NextResponse.json(
            {
                error: "An error occurred while fetching images",
                errorCode: "INTERNAL_ERROR",
            },
            { status: 500 }
        );
    }
};
