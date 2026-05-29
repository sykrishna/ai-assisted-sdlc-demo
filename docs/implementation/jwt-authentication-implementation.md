# JWT Authentication Implementation Guide

**Version**: 1.0  
**Date**: May 29, 2026  
**Status**: Phase 1 - Complete (JWT foundations)

## Overview

This document describes the foundational JWT authentication layer for the NestJS API, including token generation, validation, revocation, and secure refresh token rotation.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                   AuthController                             │
│  POST /login, /logout, /refresh, GET /session               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   AuthService                                │
│  Login/logout/refresh/session business logic                │
│  Token validation and revocation coordination               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  JwtToken    │ │ JwtStrategy  │ │ JwtAuthGuard │
│  Service     │ │ (Passport)   │ │ (Endpoint    │
│ Generate/    │ │ Extracts &   │ │  Protection) │
│ Validate     │ │ Verifies JWT │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │
┌──────────────────────────────────────────────────────────────┐
│                  NestJS JwtModule                             │
│     Cryptographic token signing/verification                │
└──────────────────────────────────────────────────────────────┘
```

### Configuration

JWT configuration is loaded from environment variables:

```env
# JWT TTL values (in seconds)
JWT_ACCESS_TOKEN_TTL_SECONDS=900                    # 15 minutes
JWT_REFRESH_TOKEN_TTL_SECONDS=1209600               # 14 days

# Token secrets (must be >= 32 characters for 256-bit strength)
JWT_ACCESS_TOKEN_SECRET=<base64-256bit-secret>
JWT_REFRESH_TOKEN_SECRET=<base64-256bit-secret>

# Token metadata
JWT_ISSUER=ai-assisted-sdlc-demo                   # Token issuer
JWT_AUDIENCE=web-client                             # Token audience
```

## Token Lifecycle

### 1. Login Flow

```
POST /api/v1/auth/login
├─ Validate credentials (TODO: Phase 1)
├─ Generate JWT access token (15 min TTL)
├─ Generate JWT refresh token (14 day TTL)
├─ Create session record
└─ Return tokens + user context with roles
```

**Access Token Claims:**

```json
{
  "jti": "unique-token-id", // Token instance ID for revocation
  "sub": "user-id", // Subject (user identifier)
  "sessionId": "session-id", // Session for logout tracking
  "type": "access", // Token type validation
  "iat": 1234567890, // Issued at
  "exp": 1234568790, // Expiration
  "iss": "ai-assisted-sdlc-demo", // Issuer
  "aud": "web-client" // Audience
}
```

**Refresh Token Claims:**

```json
{
  "jti": "unique-token-id",
  "sub": "user-id",
  "sessionId": "session-id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1244568790, // 14 days later
  "iss": "ai-assisted-sdlc-demo",
  "aud": "web-client"
}
```

### 2. Token Validation

When requesting protected endpoints:

```
Request: GET /api/v1/auth/session
Header: Authorization: Bearer <access-token>

@UseGuards(JwtAuthGuard)  ← Validates token
├─ Extract JWT from Authorization header
├─ Verify signature with access token secret
├─ Verify expiration (exp < now fails)
├─ Verify issuer matches configured value
├─ Verify audience matches configured value
└─ If valid, attach TokenPayload to request.user
```

### 3. Refresh Flow

```
POST /api/v1/auth/refresh
├─ Validate refresh token (signature + expiration)
├─ Generate new access token
├─ Rotate refresh token (new jti, new exp)
└─ Return new token pair
```

### 4. Logout Flow

```
POST /api/v1/auth/logout
├─ Validate access token from Authorization header
├─ Revoke token jti (prevent immediate reuse)
├─ If allSessions: revoke all tokens for sessionId
└─ Return success + revoked count
```

## Security Characteristics

### Access Token Security

- **Short TTL (15 minutes)**: Minimizes exposure if token is stolen
- **Single use per request**: No persistent storage, verification on every request
- **Type validated**: Rejected if `type !== 'access'`
- **Signature validated**: Cryptographic proof of authenticity (HMAC-SHA256)
- **Expiration checked**: Automatic rejection after TTL

### Refresh Token Security

- **Long TTL (14 days)**: Supports extended sessions without requiring login
- **Rotation support**: TODO Phase 2 - detect replay via token family
- **Revocation tracked**: Immediate logout enforcement via in-memory store
- **Separate secret**: Uses distinct refresh token secret from access secret
- **Session-bound**: Revocation at session level (`allSessions` flag)

### Secret Management

- **Minimum 32 characters** (256 bits): Enforced at configuration load time
- **Environment-based**: Secrets never committed to source control
- **Development defaults**: Provided in .env for local testing
- **Production requirement**: Must be rotated in production environments

### No Sensitive Data in Tokens

**NOT included in JWT:**

- Passwords or secrets
- Credit card information
- Detailed user profiles
- API keys or credentials
- Session database IDs

**INSTEAD in JWT:**

- User ID for reference
- Session ID for tracking
- Standard claims (iss, aud, exp, iat)
- Token type for validation

_Rationale: JWTs are commonly decoded by intermediaries (networks, proxies, CDNs). Only non-sensitive data should be embedded._

## Generic Error Handling

Consistent with security best practices, authentication failures return generic error messages:

```
Status: 401 Unauthorized
{
  "type": "https://problem-details.example.com/auth-unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "code": "AUTH_UNAUTHORIZED",
  "detail": "Missing or invalid bearer token.",
  "correlationId": "corr-xyz",
  "retryable": false
}
```

**No token-specific error details** are exposed (e.g., "token expired" vs "token invalid"). This prevents attackers from determining token state without possession of the secret.

## Brute-Force Mitigation (Preparation)

TODO Phase 2:

- Rate limiting on `/login` endpoint
- Progressive backoff (exponential delay after failed attempts)
- Account lockout after N failed attempts
- IP-based tracking of login attempts
- Email alerts on suspicious activity

## Database Integration (TODO Phase 2)

Current implementation uses **in-memory storage** for refresh token metadata:

```typescript
private readonly refreshTokenStore = new Map<string, RefreshTokenMetadata>();
```

TODO Phase 2 transition:

- Persist `RefreshTokenMetadata` to Redis or database
- Support multi-instance deployments (load balancers)
- Enable cross-instance logout coordination
- Implement token rotation family tracking

## Guard Integration

To protect endpoints with JWT authentication:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get('resource')
  async getProtectedResource(@Request() req): Promise<any> {
    // req.user contains decoded TokenPayload
    const userId = req.user.sub;
    const sessionId = req.user.sessionId;
    return { resource: 'data', userId };
  }
}
```

## Testing

### Unit Test Coverage

- **JwtTokenService**: Token generation, validation, revocation
- **JwtStrategy**: Passport JWT extraction and validation
- **JwtAuthGuard**: Guard structure and integration points
- **AuthService**: Login/logout/refresh workflows with JWT operations
- **AuthController**: HTTP endpoint delegation

### Running Tests

```bash
# Run all tests
pnpm test

# Run auth module tests only
pnpm test -- auth

# Run specific test file
pnpm test -- jwt-token.service.spec.ts

# Watch mode
pnpm test -- --watch
```

### TODO Phase 2 Tests

- Integration tests with actual token generation
- Expiration edge cases (token expiring during request)
- Signature tampering detection
- Brute-force rate limiting verification
- Multi-instance revocation coordination

## Logging

All auth operations are logged with correlation IDs for traceability:

```typescript
logger.info('auth.token.access.generated', {
  correlationId: 'corr-xyz',
  jti: 'token-id-123',
  expiresIn: 900,
});

logger.warn('auth.token.access.validation_failed', {
  correlationId: 'corr-xyz',
  error: 'invalid signature',
});
```

**No sensitive data** in logs (tokens, secrets, passwords).

## Future Work (Phase 2+)

1. **Token Rotation**: Family-based replay detection
2. **JWKS Endpoint**: Public key distribution for verification
3. **RS256 Support**: Asymmetric keys for multi-service deployments
4. **Scope Support**: Permission-based token validation
5. **MFA Integration**: Multi-factor authentication flow
6. **Token Revocation List**: Redis-backed revocation tracking
7. **Rate Limiting**: Brute-force protection
8. **Audit Events**: Immutable login/logout history

## References

- [NestJS JWT Authentication](https://docs.nestjs.com/security/authentication)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [JWT.io - Debugger and Libraries](https://jwt.io/)
