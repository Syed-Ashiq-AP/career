/**
 * Security Middleware Utilities
 * Provides validation, sanitization, and security headers for API routes
 */

import { z } from "zod";

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
    req: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
    try {
        const body = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return {
                success: false,
                error: new Response(
                    JSON.stringify({
                        error: "Invalid request body",
                        details: result.error.issues.map((issue) => ({
                            path: issue.path.join("."),
                            message: issue.message,
                        })),
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    }
                ),
            };
        }

        return { success: true, data: result.data };
    } catch {
        return {
            success: false,
            error: new Response(
                JSON.stringify({
                    error: "Invalid JSON",
                    message: "Request body must be valid JSON",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            ),
        };
    }
}

/**
 * Check if request body size is within limits
 */
export async function checkRequestSize(
    req: Request,
    maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<Response | null> {
    const contentLength = req.headers.get("content-length");

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return new Response(
            JSON.stringify({
                error: "Payload too large",
                message: `Request body must be less than ${maxSizeBytes / 1024 / 1024}MB`,
                maxSize: maxSizeBytes,
            }),
            {
                status: 413,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return null;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    // Prevent XSS attacks
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");

    // Content Security Policy
    headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );

    // Referrer Policy
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy
    headers.set(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()"
    );

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Add CORS headers for API responses
 */
export function addCorsHeaders(
    response: Response,
    allowedOrigins: string[] = ["*"]
): Response {
    const headers = new Headers(response.headers);

    // In production, replace '*' with specific origins
    headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
    headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400"); // 24 hours

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreFlight(): Response {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, "") // Remove potential HTML tags
        .slice(0, 10000); // Limit length
}

/**
 * Validate and sanitize array of strings
 */
export function sanitizeStringArray(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter((item) => typeof item === "string")
        .map((item) => sanitizeString(item))
        .slice(0, 100); // Limit array size
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
    message: string,
    status: number = 500,
    details?: Record<string, unknown>
): Response {
    const responseBody: {
        error: string;
        details?: Record<string, unknown>;
        timestamp: string;
    } = {
        error: message,
        timestamp: new Date().toISOString(),
    };

    if (details) {
        responseBody.details = details;
    }

    return new Response(JSON.stringify(responseBody), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
    data: T,
    status: number = 200
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

/**
 * Verify authentication from session
 */
export function verifyAuth(session: unknown): {
    isValid: boolean;
    userId?: string;
} {
    if (!session || typeof session !== "object") {
        return { isValid: false };
    }

    const sessionObj = session as { user?: { id?: string } };

    if (!sessionObj.user?.id) {
        return { isValid: false };
    }

    return { isValid: true, userId: sessionObj.user.id };
}

/**
 * Log security events (in production, send to logging service)
 */
export function logSecurityEvent(
    event: string,
    details: Record<string, unknown>
): void {
    console.warn(`[SECURITY] ${event}:`, {
        timestamp: new Date().toISOString(),
        ...details,
    });
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousInput(input: string): boolean {
    const suspiciousPatterns = [
        /<script/i, // XSS attempts
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers
        /eval\(/i,
        /union\s+select/i, // SQL injection
        /;\s*drop\s+table/i,
        /\.\.\//, // Path traversal
        /__proto__/, // Prototype pollution
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate content type
 */
export function validateContentType(
    req: Request,
    expected: string = "application/json"
): Response | null {
    const contentType = req.headers.get("content-type");

    if (!contentType?.includes(expected)) {
        return createErrorResponse(
            `Invalid Content-Type. Expected ${expected}`,
            415
        );
    }

    return null;
}
