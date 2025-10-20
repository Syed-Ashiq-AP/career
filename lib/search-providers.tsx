// DEPRECATED: This file is no longer used since migrating to Perplexity
// Perplexity handles search natively through its API without requiring separate search providers
// Keeping this file for backward compatibility and potential future use

export interface SearchResult {
    favicon: string;
    link: string;
    title: string;
}

export interface ImageResource {
    title: string;
    link: string;
}

export interface VideoResource {
    imageUrl: string;
    link: string;
}

// Legacy functions - no longer used with Perplexity integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function serperSearch(_message: string): Promise<SearchResult[]> {
    console.warn(
        "serperSearch is deprecated - Perplexity handles search natively"
    );
    return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getImages(_message: string): Promise<ImageResource[]> {
    console.warn(
        "getImages is deprecated - Perplexity handles search natively"
    );
    return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getVideos(
    _message: string
): Promise<VideoResource[] | null> {
    console.warn(
        "getVideos is deprecated - Perplexity handles search natively"
    );
    return [];
}
