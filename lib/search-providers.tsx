export interface SearchResult {
    favicon: string;
    link: string;
    title: string;
}
const config = {
    numberOfPagesToScan: 10,
};

export async function serperSearch(
    message: string,
    numberOfPagesToScan = config.numberOfPagesToScan
): Promise<SearchResult[]> {
    const url = "https://google.serper.dev/search";
    const data = JSON.stringify({
        q: message,
    });
    const requestOptions: RequestInit = {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.SERPER_API as string,
            "Content-Type": "application/json",
        },
        body: data,
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(
                `Network response was not ok. Status: ${response.status}`
            );
        }
        const responseData = await response.json();
        if (!responseData.organic) {
            throw new Error("Invalid API response format");
        }
        const final = responseData.organic.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result: any): SearchResult => ({
                title: result.title,
                link: result.link,
                favicon: result.favicons?.[0] || "",
            })
        );
        return final;
    } catch (error) {
        console.error("Error fetching search results:", error);
        throw error;
    }
}

export async function getImages(
    message: string
): Promise<{ title: string; link: string }[]> {
    const url = "https://google.serper.dev/images";
    const data = JSON.stringify({
        q: message,
    });
    const requestOptions: RequestInit = {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.SERPER_API as string,
            "Content-Type": "application/json",
        },
        body: data,
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(
                `Network response was not ok. Status: ${response.status}`
            );
        }
        const responseData = await response.json();
        const validLinks = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseData.images.map(async (image: any) => {
                const link = image.imageUrl;
                if (typeof link === "string") {
                    try {
                        const imageResponse = await fetch(link, {
                            method: "HEAD",
                        });
                        if (imageResponse.ok) {
                            const contentType =
                                imageResponse.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.startsWith("image/")
                            ) {
                                return {
                                    title: image.title,
                                    link: link,
                                };
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching image link ${link}:`,
                            error
                        );
                    }
                }
                return null;
            })
        );
        const filteredLinks = validLinks.filter(
            (link): link is { title: string; link: string } => link !== null
        );
        return filteredLinks.slice(0, 9);
    } catch (error) {
        console.error("Error fetching images:", error);
        throw error;
    }
}

export async function getVideos(
    message: string
): Promise<{ imageUrl: string; link: string }[] | null> {
    const url = "https://google.serper.dev/videos";
    const data = JSON.stringify({
        q: message,
    });
    const requestOptions: RequestInit = {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.SERPER_API as string,
            "Content-Type": "application/json",
        },
        body: data,
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(
                `Network response was not ok. Status: ${response.status}`
            );
        }
        const responseData = await response.json();
        const validLinks = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responseData.videos.map(async (video: any) => {
                const imageUrl = video.imageUrl;
                if (typeof imageUrl === "string") {
                    try {
                        const imageResponse = await fetch(imageUrl, {
                            method: "HEAD",
                        });
                        if (imageResponse.ok) {
                            const contentType =
                                imageResponse.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.startsWith("image/")
                            ) {
                                return { imageUrl, link: video.link };
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching image link ${imageUrl}:`,
                            error
                        );
                    }
                }
                return null;
            })
        );
        const filteredLinks = validLinks.filter(
            (link): link is { imageUrl: string; link: string } => link !== null
        );
        return filteredLinks.slice(0, 9);
    } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
    }
}
