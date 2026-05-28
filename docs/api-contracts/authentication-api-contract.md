# Authentication API Contract

## Document Control

| Field | Value |
|---|---|
| API Name | Authentication API |
| Contract ID | AUTH-API-001 |
| Version | 1.0.0 |
| Status (Draft/Review/Approved) | Draft |
| Owner | Platform API Team |
| Reviewers | Security, Architecture, SRE, QA |
| Last Updated | 2026-05-28 |
| Related Spec/Design IDs | AUTH-SPEC-001, AUTH-DESIGN-001 |

## Contract Summary

RESTful authentication contract for a TypeScript web/PWA client and cloud-native backend. Supports login, logout, token refresh, and current session validation. Access uses short-lived JWTs; refresh uses rotating refresh tokens with server-side session control and replay detection.

## Protocol and Style

| Field | Value |
|---|---|
| Interface Type | REST |
| Base Path | `/api/v1/auth` |
| Content Type | `application/json` |
| Versioning Strategy | URI major versioning (`/v1`), additive non-breaking evolution |
| Idempotency Strategy | `POST /logout` idempotent by session state; `POST /refresh` idempotent by outcome semantics |
| Correlation | `X-Correlation-Id` required on all requests/responses |

## Consumers and Dependencies

| Consumer | Use Case | Backward Compatibility Sensitivity |
|---|---|---|
| Web SPA | Interactive login and protected API access | High |
| PWA Client | Resume-safe session continuity and refresh behavior | High |
| API Gateway | Traffic shaping, TLS, and request metadata propagation | Medium |
| Identity Backend | Credential verification | High |

## Authentication and Authorization

| Area | Requirement |
|---|---|
| AuthN Mechanism | JWT Bearer access token for protected endpoints |
| Refresh Mechanism | Rotating refresh token tied to server-side session record |
| AuthZ Model | Role-ready claims in token (`roles`), deny-by-default for protected routes |
| Required Claims | `iss`, `aud`, `sub`, `iat`, `exp`, `jti`, `sid`, `roles` |

## Standard Headers

| Header | Direction | Required | Description |
|---|---|---|---|
| `X-Correlation-Id` | Request + Response | Yes | End-to-end observability correlation |
| `Authorization` | Request | Protected endpoints | `Bearer <access_token>` |
| `X-Client-Platform` | Request | Recommended | `web` or `pwa` for analytics and policy |

## Endpoints

| Operation ID | Method | Path | Description | Auth Required |
|---|---|---|---|---|
| authLogin | POST | `/api/v1/auth/login` | Authenticate user and issue access + refresh tokens | No |
| authLogout | POST | `/api/v1/auth/logout` | Revoke active refresh session/token family | Yes |
| authRefresh | POST | `/api/v1/auth/refresh` | Rotate refresh token and issue new access token | No (refresh token required) |
| authSession | GET | `/api/v1/auth/session` | Validate current access token and return session/user context | Yes |

---

## Endpoint Contract Details

### 1) POST `/api/v1/auth/login`

#### Request Schema

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `identifier` | string | Yes | 3-254 chars, normalized username/email format |
| `password` | string | Yes | 8-128 chars, non-empty, never logged |
| `deviceContext` | object | No | Optional metadata (`deviceId`, `userAgent`, `ipHint`) |

#### Response Schema (200)

| Field | Type | Required | Notes |
|---|---|---|---|
| `accessToken` | string | Yes | JWT, short TTL |
| `accessTokenExpiresIn` | integer | Yes | Seconds until expiration |
| `refreshToken` | string | Yes | Rotating token (or secure cookie strategy by policy) |
| `refreshTokenExpiresIn` | integer | Yes | Seconds until expiration |
| `tokenType` | string | Yes | Always `Bearer` |
| `session` | object | Yes | Includes `sessionId`, `issuedAt`, `expiresAt` |
| `user` | object | Yes | Includes `userId`, `displayName`, `roles` |

#### Validation Rules

- Reject malformed JSON with `400`.
- Reject invalid credentials with `401` without revealing account existence.
- Apply brute-force/rate-limit controls by identifier and source context.
- Require TLS-only transport.

#### Authentication Requirements

- Endpoint does not require existing token.

#### Authorization Expectations

- Not applicable for login itself.
- Returned token must include role-ready `roles` claim.

#### Error Responses and Status Codes

| Status | Error Code | Meaning |
|---|---|---|
| 400 | `AUTH_INVALID_REQUEST` | Schema or field validation failed |
| 401 | `AUTH_INVALID_CREDENTIALS` | Credential verification failed |
| 423 | `AUTH_ACCOUNT_LOCKED` | Account is temporarily locked |
| 429 | `AUTH_RATE_LIMITED` | Too many attempts |
| 500 | `AUTH_INTERNAL_ERROR` | Unexpected server failure |
| 503 | `AUTH_DEPENDENCY_UNAVAILABLE` | Identity backend unavailable |

#### Rate Limiting Considerations

- Default: 5 login attempts/minute per identifier, 30/minute per IP fingerprint.
- Progressive backoff on repeated failures.

#### Observability Events

- `auth.login.attempt`
- `auth.login.success`
- `auth.login.failure`
- `auth.login.rate_limited`

---

### 2) POST `/api/v1/auth/logout`

#### Request Schema

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `sessionId` | string | No | If provided, must match authenticated token context |
| `allSessions` | boolean | No | Default `false`; if `true`, policy-based broader revocation |

#### Response Schema (200)

| Field | Type | Required | Notes |
|---|---|---|---|
| `revoked` | boolean | Yes | `true` if session(s) revoked or already inactive |
| `revokedSessionCount` | integer | Yes | Count of sessions revoked by this call |
| `message` | string | Yes | Deterministic status summary |

#### Validation Rules

- Require valid Bearer access token.
- Ignore duplicate logout requests safely (idempotent outcome).

#### Authentication Requirements

- Access token required in `Authorization` header.

#### Authorization Expectations

- User may revoke own session(s) only.
- Admin session revocation behavior is future scope.

#### Error Responses and Status Codes

| Status | Error Code | Meaning |
|---|---|---|
| 400 | `AUTH_INVALID_REQUEST` | Invalid payload |
| 401 | `AUTH_UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `AUTH_FORBIDDEN` | Attempted revocation outside permitted scope |
| 429 | `AUTH_RATE_LIMITED` | Request throttled |
| 500 | `AUTH_INTERNAL_ERROR` | Unexpected server failure |

#### Rate Limiting Considerations

- Default: 60 requests/minute per user/session context.

#### Observability Events

- `auth.logout.requested`
- `auth.logout.completed`
- `auth.logout.denied`

---

### 3) POST `/api/v1/auth/refresh`

#### Request Schema

| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `refreshToken` | string | Yes* | Required if token not supplied via secure cookie |
| `sessionId` | string | No | Must match refresh token family context when present |

`*` Deployment policy may use HttpOnly secure cookie transport.

#### Response Schema (200)

| Field | Type | Required | Notes |
|---|---|---|---|
| `accessToken` | string | Yes | New JWT access token |
| `accessTokenExpiresIn` | integer | Yes | Seconds until expiration |
| `refreshToken` | string | Yes | New rotated refresh token |
| `refreshTokenExpiresIn` | integer | Yes | Remaining/renewed session window by policy |
| `tokenType` | string | Yes | Always `Bearer` |
| `session` | object | Yes | Updated session metadata |

#### Validation Rules

- Refresh token must exist, be unexpired, not revoked, and not previously used.
- Enforce token family replay detection; suspicious reuse revokes family.
- Deny on session mismatch.

#### Authentication Requirements

- Access token is not required.
- Valid refresh token required.

#### Authorization Expectations

- Refresh operation must only mint tokens for subject/session bound to refresh token.

#### Error Responses and Status Codes

| Status | Error Code | Meaning |
|---|---|---|
| 400 | `AUTH_INVALID_REQUEST` | Malformed request |
| 401 | `AUTH_REFRESH_INVALID` | Invalid/expired/revoked refresh token |
| 409 | `AUTH_REFRESH_REPLAY_DETECTED` | Replay detected; token family revoked |
| 429 | `AUTH_RATE_LIMITED` | Request throttled |
| 500 | `AUTH_INTERNAL_ERROR` | Unexpected server failure |
| 503 | `AUTH_DEPENDENCY_UNAVAILABLE` | Session backend unavailable |

#### Rate Limiting Considerations

- Default: 30 refresh requests/minute per session; burst control enabled.

#### Observability Events

- `auth.refresh.attempt`
- `auth.refresh.success`
- `auth.refresh.failure`
- `auth.refresh.replay_detected`

---

### 4) GET `/api/v1/auth/session`

#### Request Schema

No request body.

#### Response Schema (200)

| Field | Type | Required | Notes |
|---|---|---|---|
| `authenticated` | boolean | Yes | `true` when token valid |
| `user` | object | Yes | `userId`, `displayName`, `roles` |
| `session` | object | Yes | `sessionId`, `issuedAt`, `expiresAt` |
| `token` | object | Yes | `expiresAt`, `issuer`, `audience` |

#### Validation Rules

- Validate JWT signature, issuer, audience, expiry, and required claims.
- Enforce deny-by-default for missing mandatory claims.

#### Authentication Requirements

- Valid access token required.

#### Authorization Expectations

- Endpoint available to any authenticated user to validate own session context.

#### Error Responses and Status Codes

| Status | Error Code | Meaning |
|---|---|---|
| 401 | `AUTH_UNAUTHORIZED` | Missing/invalid/expired token |
| 429 | `AUTH_RATE_LIMITED` | Request throttled |
| 500 | `AUTH_INTERNAL_ERROR` | Unexpected server failure |

#### Rate Limiting Considerations

- Default: 120 requests/minute per user/session context.

#### Observability Events

- `auth.session.checked`
- `auth.session.invalid`

---

## Standard Error Model

All non-2xx responses use `application/problem+json`.

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | URI-like error type |
| `title` | string | Yes | Human-readable summary |
| `status` | integer | Yes | HTTP status code |
| `code` | string | Yes | Stable machine-readable code |
| `detail` | string | Yes | Safe client-facing details |
| `correlationId` | string | Yes | Matches `X-Correlation-Id` |
| `timestamp` | string | Yes | RFC 3339 UTC timestamp |
| `retryable` | boolean | Yes | Whether client may retry |

## PWA Compatibility Considerations

- Auth state transitions must be deterministic during app resume and reconnect.
- Clients should preemptively refresh before expiry threshold to reduce foreground failures.
- Offline mode should avoid blind refresh loops; retry with bounded backoff.
- Token storage and transport must follow secure platform policy (prefer HttpOnly cookie for refresh where feasible).

## Cloud-Native Compatibility Considerations

- Access-token validation path is stateless and horizontally scalable.
- Refresh state is externalized to managed session storage with TTL and conditional writes.
- API contract supports progressive rollout with backward-compatible additive fields.

## Security Considerations

- No credential or token secrets in logs.
- TLS mandatory.
- Token replay detection and session revocation required.
- Least-privilege service access and audited security events required.

## Observability and Monitoring Requirements

| Signal | Requirement | Alert Condition |
|---|---|---|
| Request Metrics | Success/failure/latency by endpoint and client platform | SLO burn or latency breach |
| Error Metrics | Error code cardinality and spikes | Elevated auth failures |
| Structured Logs | Correlation ID + actor/session outcome | Missing correlation or schema drift |
| Traces | End-to-end auth spans (gateway, auth, session store) | Missing critical path traces |

## Acceptance Criteria

| AC ID | Condition | Expected Outcome | Verification |
|---|---|---|---|
| AC-01 | Valid login request | Access and refresh tokens issued with expected claims/TTL | Contract + integration tests |
| AC-02 | Valid refresh request | Token rotation occurs and old refresh token is invalid | Security + integration tests |
| AC-03 | Logout request | Session revoked and repeated logout remains safe | Integration tests |
| AC-04 | Session validation request | Deterministic 200 or 401 with standard error model | Contract tests |
| AC-05 | Observability checks | Required auth events emitted with correlation ID | Telemetry validation |

## Open Questions

- Confirm policy decision for refresh token transport: JSON body vs secure HttpOnly cookie as primary mechanism.
- Confirm default multi-session policy for `allSessions=true` behavior.
- Confirm final per-environment rate-limit thresholds.
