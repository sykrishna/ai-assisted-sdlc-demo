# Health Check Guidance

## Objective

Define a consistent health check strategy for services in this monorepo, including liveness, readiness, and startup semantics that support local development, CI validation, and cloud-native deployment readiness.

## Endpoint Model

Each deployable backend service should expose:

- liveness endpoint
- readiness endpoint
- version/build metadata endpoint (recommended)

Suggested API paths (versioned):

- /api/v1/health/live
- /api/v1/health/ready
- /api/v1/health/metadata

Existing endpoints may be supported temporarily for compatibility while migrating.

## Semantics

### Liveness

Purpose:

- Indicates the process is alive and not deadlocked.

Rules:

- Must not depend on external systems.
- Should return success when application process and event loop are responsive.

### Readiness

Purpose:

- Indicates the service can handle traffic safely.

Rules:

- May depend on critical upstream dependencies.
- Should fail when required dependencies are unavailable or initialization incomplete.
- Should include minimal structured detail for operators (without secrets).

### Metadata

Purpose:

- Provide version/build and runtime metadata useful during incident triage.

Fields (recommended):

- service
- version
- commit_sha
- environment
- startup_timestamp

## Response Contract Guidance

Return structured JSON with stable fields.

Example shape:

- status: ok | degraded | fail
- service: service name
- checks: dependency status map for readiness
- timestamp: ISO 8601 UTC
- correlation_id: optional for request-scoped diagnostics

## Status Code Guidance

- Healthy liveness/readiness: 200
- Readiness dependency failure: 503
- Unexpected internal error during health evaluation: 500

## Dependency Check Strategy

Classify dependencies for readiness evaluation:

- critical: service cannot safely process requests without it
- optional: degraded behavior possible, but service may remain ready

Readiness should fail only on critical dependency failures.

## Timeouts and Performance

- Health endpoints should be lightweight and fast.
- Keep dependency probes bounded with short timeouts.
- Avoid expensive queries in readiness handlers.

## Observability Integration

- Log health transitions (ready to not-ready and back) at WARN/INFO levels.
- Emit counters for readiness failures by dependency.
- Emit latency metrics for health handlers.

## CI/CD Validation Guidance

In pipeline validation:

- verify liveness and readiness endpoints exist
- verify expected status codes for healthy state
- verify readiness failure behavior in controlled failure tests when feasible

## Local Development Guidance

- Local compose and host workflows should validate readiness endpoint after startup.
- Troubleshooting sequence:
  1. check service logs
  2. check readiness response details
  3. check dependency availability and credentials

## Security Guidance

- Do not expose secrets, raw connection strings, or stack traces in health responses.
- Keep dependency identifiers high-level and non-sensitive.
- Rate-limit health endpoints if exposed beyond trusted network boundaries.

## Migration Notes for Current API

Current endpoint:

- /api/v1/health

Recommended migration path:

1. Keep /api/v1/health temporarily as a compatibility alias.
2. Introduce /api/v1/health/live and /api/v1/health/ready.
3. Update local orchestration and CI checks to use explicit endpoints.
4. Deprecate alias only after clients and automation migrate.
