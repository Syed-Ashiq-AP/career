/**
 * Rate Limiter Implementation
 * Provides IP-based rate limiting with configurable windows and max requests
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every 60 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    /**
     * Check if a request should be rate limited
     * @param key - Unique identifier (typically IP address)
     * @param limit - Maximum number of requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns Object with success status and remaining requests
     */
    check(
        key: string,
        limit: number,
        windowMs: number
    ): { success: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            // Create new entry or reset expired one
            this.store.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
            return {
                success: true,
                remaining: limit - 1,
                resetTime: now + windowMs,
            };
        }

        if (entry.count >= limit) {
            return {
                success: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        // Increment count
        entry.count++;
        this.store.set(key, entry);

        return {
            success: true,
            remaining: limit - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Remove expired entries from the store
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Clear all entries (useful for testing)
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Cleanup on shutdown
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
    // Strict limits for AI/expensive operations
    AI_GENERATION: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    AI_CHAT: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute

    // Moderate limits for data operations
    API_STANDARD: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute

    // More relaxed for read operations
    API_READ: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute

    // Strict limits for write operations
    API_WRITE: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute
} as const;

/**
 * Get client IP from request headers
 */
export function getClientIp(req: Request): string {
    // Check various headers that might contain the real IP
    const headers = new Headers(req.headers);

    return (
        headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") || // Cloudflare
        headers.get("x-client-ip") ||
        "unknown"
    );
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
    req: Request,
    config: { limit: number; windowMs: number }
): Response | null {
    const ip = getClientIp(req);
    const result = rateLimiter.check(ip, config.limit, config.windowMs);

    if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        return new Response(
            JSON.stringify({
                error: "Too many requests",
                message: "Rate limit exceeded. Please try again later.",
                retryAfter,
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": retryAfter.toString(),
                    "X-RateLimit-Limit": config.limit.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(
                        result.resetTime
                    ).toISOString(),
                },
            }
        );
    }

    return null; // No rate limit hit, continue processing
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
    response: Response,
    req: Request,
    config: { limit: number; windowMs: number }
): Response {
    const ip = getClientIp(req);
    const entry = rateLimiter["store"].get(ip);

    const headers = new Headers(response.headers);
    headers.set("X-RateLimit-Limit", config.limit.toString());

    if (entry) {
        const remaining = Math.max(0, config.limit - entry.count);
        headers.set("X-RateLimit-Remaining", remaining.toString());
        headers.set(
            "X-RateLimit-Reset",
            new Date(entry.resetTime).toISOString()
        );
    } else {
        headers.set("X-RateLimit-Remaining", config.limit.toString());
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
