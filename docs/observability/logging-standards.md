# Logging Standards

## Objective

Define enforceable logging conventions across backend and frontend applications to support debugging, auditing, security review, and future centralized log analytics.

## Logging Convention Summary

- Use structured logs with stable key names.
- Emit machine-parseable timestamps in ISO 8601 UTC.
- Include correlation_id in all request-bound logs.
- Avoid free-form multi-line logs except stack traces.
- Do not log secrets or sensitive payloads.

## Required Log Fields

Every application log event should include:

- timestamp
- level
- service
- environment
- message
- correlation_id (if request-scoped)
- trace_id and span_id (when tracing enabled)
- version (build or commit reference)

Backend request logs should additionally include:

- method
- route_template
- status_code
- duration_ms
- client_ip_masked (if captured)

Frontend error logs should additionally include:

- page_route
- user_agent_family (coarse)
- api_target (if relevant)
- network_state (online/offline)

## Log Levels

Use these levels consistently:

- DEBUG: high-detail internal state for local or short-lived diagnostics.
- INFO: normal lifecycle and business-relevant events.
- WARN: recoverable anomalies and degraded behavior.
- ERROR: failed operations that impact requests or user flows.
- FATAL: unrecoverable failures requiring process restart or immediate operator action.

### Level Selection Rules

- Do not log expected validation failures at ERROR unless operationally meaningful.
- Retries should log WARN for intermediate attempts and ERROR only on final failure.
- Security-relevant deny events should log WARN or ERROR depending on impact.

## Structured Logging Strategy

### Backend

- Prefer one event per semantic action.
- Log at request start and completion with shared correlation fields.
- Emit domain events for auth lifecycle milestones (login attempt, token refresh, revocation).
- Keep exception stack in a dedicated error.stack field when enabled.

### Frontend

- Capture runtime errors via global listeners.
- Capture API call failures with endpoint group and status family.
- Avoid verbose INFO logs in production browser contexts.

## Sensitive Data Masking Rules

### Never Log

- passwords
- raw tokens (JWT, refresh tokens, API keys)
- authorization headers
- session identifiers
- private keys
- full personal data payloads

### Masking Requirements

- Email addresses: partially mask local part.
- IP addresses: mask final octet for IPv4 and suffix groups for IPv6.
- Identifiers: mask all but last 4 characters unless required for audit.
- Query/body payloads: allowlist fields instead of blocklist when feasible.

### Redaction Behavior

- Redaction happens before serialization.
- Redaction function must be deterministic and test-covered.
- If uncertain whether data is sensitive, redact by default.

## Audit Logging Strategy

Audit logs are security and compliance records and should be separable from general application logs.

### Audit Event Categories

- authentication success/failure
- authorization deny/allow for privileged operations
- credential or key rotation actions
- role/permission changes
- account lock/unlock events
- security configuration changes

### Required Audit Fields

- timestamp
- actor_id (or system actor)
- action
- target_type
- target_id (masked if needed)
- outcome
- correlation_id
- source_channel (api, ui, batch)

### Audit Guardrails

- Immutable retention policy in downstream systems (future implementation).
- No destructive update of historical audit records.
- Explicit schema versioning for audit events.

## Centralized Error Handling and Logging

- Route all unhandled exceptions through a global error boundary.
- Emit a single canonical error event per failure.
- Include normalized error.code and retryability.
- Keep user-facing error messages generic; detailed internals stay in logs.

## Cloud-Native and Vendor-Neutral Guidance

- Keep log field names lowercase_snake_case for broad tool compatibility.
- Avoid vendor-specific log annotations in baseline code.
- Ensure log payload size remains bounded to prevent ingestion backpressure.

## Validation Readiness

- Add tests that assert required fields in representative log outputs.
- Validate masking behavior for sensitive fixtures.
- Add CI checks for prohibited keys in logged payload snapshots.

## Production Troubleshooting Guidance

- Filter first by correlation_id.
- Pivot by error.code and route_template.
- Compare with latency and error-rate metrics for timeframe alignment.
- Escalate with trace context if dependency boundaries are involved.
