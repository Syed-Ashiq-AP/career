# API Security Implementation

This document outlines the comprehensive security measures implemented across all API routes in the Career ISIT application.

## 🛡️ Security Features

### 1. Rate Limiting

- **Implementation**: IP-based rate limiting with in-memory store
- **Configurations**:
    - AI Generation: 10 requests/minute
    - AI Chat: 20 requests/minute
    - Standard API: 30 requests/minute
    - Read Operations: 60 requests/minute
    - Write Operations: 20 requests/minute
- **Headers**: Includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response**: Returns 429 status with `Retry-After` header when limit exceeded

### 2. Input Validation

- **Schema Validation**: Zod schemas validate all request bodies
- **Sanitization**: Removes potentially harmful characters and limits string lengths
- **Suspicious Pattern Detection**: Blocks common attack vectors:
    - XSS attempts (`<script>`, `javascript:`)
    - SQL injection (`UNION SELECT`, `DROP TABLE`)
    - Path traversal (`../`)
    - Prototype pollution (`__proto__`)

### 3. Authentication

- **User Chat Routes**: Verify user session before accessing conversations
- **Ownership Verification**: Ensure users can only access their own data
- **Session Validation**: Check for valid user ID in session

### 4. Request Size Limits

- **Chat API**: 500KB limit
- **Generate Tools API**: 100KB limit
- **User Chat Messages**: 1MB limit
- **Default**: 1MB for other endpoints

### 5. Security Headers

All responses include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`

### 6. Data Limits

- **Message History**: Limited to 50 messages per chat request
- **Conversations List**: Max 100 conversations returned
- **Messages Fetch**: Max 1000 messages per conversation
- **Tool Types**: Max 12 tool types per generation request
- **Survey Answers**: Max 50 answers per submission
- **Array Limits**: General 100-item limit on arrays

## 📂 Secured Routes

### `/api/career-survey` (POST)

- ✅ Rate limiting (30 req/min)
- ✅ Input validation with Zod schemas
- ✅ Suspicious input detection
- ✅ String sanitization
- ✅ Security headers
- **Actions**: `get_questions`, `validate_answer`, `get_recommendations`

### `/api/chat` (POST)

- ✅ Rate limiting (20 req/min)
- ✅ Request size limit (500KB)
- ✅ Message validation
- ✅ Suspicious content detection
- ✅ Security headers
- **Use**: AI-powered career consultation chat

### `/api/generate-tools` (POST)

- ✅ Rate limiting (10 req/min)
- ✅ Request size limit (100KB)
- ✅ Query sanitization
- ✅ Tool type validation
- ✅ Security headers
- **Features**: Generates structured career data (sources, videos, colleges, etc.)

### `/api/user-chat` (GET/POST)

- ✅ Rate limiting (60 req/min GET, 20 req/min POST)
- ✅ Authentication required
- ✅ Input validation
- ✅ Title sanitization
- ✅ Security headers
- **Features**: List and create user conversations

### `/api/user-chat/[id]` (GET/POST)

- ✅ Rate limiting (60 req/min GET, 20 req/min POST)
- ✅ Authentication required
- ✅ Request size limit (1MB for POST)
- ✅ Ownership verification
- ✅ ID sanitization
- ✅ Message validation
- ✅ Security headers
- **Features**: Get and update specific conversations

### `/api/auth/[...all]`

- ✅ Handled by Better Auth library
- ✅ Built-in security features

## 🔧 Usage Examples

### Applying Rate Limiting

```typescript
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";

const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.API_STANDARD);
if (rateLimitResponse) return addSecurityHeaders(rateLimitResponse);
```

### Validating Request Body

```typescript
import { validateRequestBody } from "@/lib/security/middleware";
import { z } from "zod";

const schema = z.object({
    query: z.string().min(1).max(500),
});

const validation = await validateRequestBody(req, schema);
if (!validation.success) {
    return addSecurityHeaders(validation.error);
}
```

### Checking Request Size

```typescript
import { checkRequestSize } from "@/lib/security/middleware";

const sizeCheck = await checkRequestSize(req, 500 * 1024); // 500KB
if (sizeCheck) return addSecurityHeaders(sizeCheck);
```

### Sanitizing Input

```typescript
import {
    sanitizeString,
    detectSuspiciousInput,
} from "@/lib/security/middleware";

const cleanInput = sanitizeString(userInput);
if (detectSuspiciousInput(cleanInput)) {
    return createErrorResponse("Invalid input detected", 400);
}
```

## 🚀 Best Practices

1. **Always apply rate limiting** at the start of route handlers
2. **Validate all inputs** with Zod schemas before processing
3. **Sanitize user data** before storing or using in queries
4. **Add security headers** to all responses
5. **Verify authentication** for protected routes
6. **Check ownership** before allowing data access
7. **Limit data returned** to prevent excessive responses
8. **Log security events** for monitoring and auditing

## 🔍 Monitoring

Security events are logged with:

- Event type
- IP address
- Timestamp
- Relevant details

In production, integrate with a logging service (e.g., DataDog, LogRocket, Sentry) for comprehensive monitoring.

## 🔄 Future Enhancements

Consider adding:

- [ ] Redis-based rate limiting for distributed systems
- [ ] IP allowlisting/blocklisting
- [ ] Request signing for API clients
- [ ] Enhanced CORS configuration
- [ ] Rate limiting per user (in addition to IP)
- [ ] Webhook signature verification
- [ ] API key authentication for third-party integrations
- [ ] Request throttling based on resource usage
- [ ] DDoS protection integration (e.g., Cloudflare)

## 📞 Security Contacts

For security concerns or vulnerability reports, please contact the development team.

---

**Last Updated**: January 1, 2026
**Version**: 1.0.0
