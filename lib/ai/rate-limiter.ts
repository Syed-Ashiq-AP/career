interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class InMemoryRateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 60 * 1000, maxRequests: number = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        setInterval(() => this.cleanup(), 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetTime < now) {
                this.store.delete(key);
            }
        }
    }

    check(identifier: string): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    } {
        const now = Date.now();
        const entry = this.store.get(identifier);

        if (!entry || entry.resetTime < now) {
            const resetTime = now + this.windowMs;
            this.store.set(identifier, { count: 1, resetTime });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime,
            };
        }

        if (entry.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        entry.count++;
        this.store.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    reset(identifier: string) {
        this.store.delete(identifier);
    }
}

export const chatRateLimiter = new InMemoryRateLimiter(60 * 1000, 30);
export const streamRateLimiter = new InMemoryRateLimiter(60 * 1000, 10);
export const apiRateLimiter = new InMemoryRateLimiter(60 * 1000, 100);

export function rateLimit(
    identifier: string,
    limiter: InMemoryRateLimiter = apiRateLimiter
): { allowed: boolean; remaining: number; resetTime: number } {
    return limiter.check(identifier);
}

export function getRateLimitIdentifier(
    request: Request,
    userId?: string
): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";

    return userId ? `${userId}:${ip}` : ip;
}

export function getRateLimitHeaders(result: {
    remaining: number;
    resetTime: number;
}): Record<string, string> {
    return {
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    };
}

export { InMemoryRateLimiter };
