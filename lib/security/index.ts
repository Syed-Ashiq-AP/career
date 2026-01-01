/**
 * Security Utilities Index
 * Central export point for all security-related utilities
 */

// Rate limiting
export {
    rateLimiter,
    RATE_LIMITS,
    getClientIp,
    applyRateLimit,
    addRateLimitHeaders,
} from "./rate-limiter";

// Middleware and validation
export {
    validateRequestBody,
    checkRequestSize,
    addSecurityHeaders,
    addCorsHeaders,
    handleCorsPreFlight,
    sanitizeString,
    sanitizeStringArray,
    createErrorResponse,
    createSuccessResponse,
    verifyAuth,
    logSecurityEvent,
    detectSuspiciousInput,
    validateContentType,
} from "./middleware";
