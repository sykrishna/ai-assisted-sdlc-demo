# Observability Architecture Standard

## Objective

Define a foundational, vendor-neutral observability architecture for the monorepo that supports local development, cloud-native evolution, and production troubleshooting without locking into a monitoring vendor.

## Scope

- Backend services under apps/api and future services
- Frontend applications under apps/web and future clients
- Cross-service telemetry conventions
- CI/CD observability readiness checks

## Architecture Principles

- Instrument once, export many: keep instrumentation standards stable while allowing backend exporter changes later.
- Correlate every signal: logs, traces, and metrics must share correlation identifiers.
- Shift-left observability: enforce telemetry conventions in local development and pull requests.
- Security by design: never emit sensitive values to telemetry streams.
- AI-friendly conventions: predictable field names and schemas to support automated diagnostics.

## Telemetry Layers

### Layer 1: Structured Events (Logs)

- Primary source for runtime decisions, domain events, and failure context.
- JSON structured logs only in non-local runtime profiles.
- Human-readable local mode logs are allowed but must preserve field parity.

### Layer 2: Distributed Traces

- Use W3C Trace Context headers as the baseline propagation format.
- Every inbound request starts or joins a trace span.
- Service-to-service calls must propagate traceparent and tracestate.

### Layer 3: Metrics

- Publish Prometheus-compatible metric names and label conventions.
- Design metric taxonomy now even if exporters are added later.
- Ensure compatibility with cloud metric sinks such as CloudWatch through naming hygiene and low-cardinality labels.

## Correlation ID Strategy

### Identifiers

- trace_id: globally unique trace identifier.
- span_id: operation-level identifier.
- correlation_id: request lifecycle identifier used in app logs and client-visible responses.
- request_id: infrastructure or edge-generated identifier when available.

### Rules

- If correlation_id exists at ingress, preserve it.
- If absent, generate a UUID v4 correlation_id at request entry.
- Include correlation_id in:
  - response headers
  - structured log fields
  - error payload metadata (non-sensitive)
- Never overload business identifiers as correlation identifiers.

## Request Tracing Approach

### Backend

- Add request middleware/interceptor to:
  - read or create correlation_id
  - bind context to logger scope
  - capture latency, status_code, method, path_template
- Add trace spans for:
  - HTTP request lifecycle
  - external API/database integrations
  - authentication and authorization checks

### Frontend

- Attach correlation_id and trace headers to API requests where allowed.
- Capture frontend route transition and API span timings as performance events.
- Propagate correlation metadata for API failures.

## OpenTelemetry Readiness

### Required Readiness Decisions

- Standardize semantic field names now (service.name, environment, deployment.version).
- Keep telemetry adapters behind thin internal wrappers.
- Isolate instrumentation bootstrap code in dedicated modules per app.
- Document default resource attributes for all services.

### Deferred (Intentionally)

- Specific telemetry collector vendor
- Production exporter endpoint selection
- Paid APM tooling integration

## Health Check Architecture

Health endpoints are part of observability and operations readiness.

- Liveness endpoint: process is running and event loop is responsive.
- Readiness endpoint: service can accept traffic and required dependencies are available.
- Startup endpoint (optional): initialization has completed.

See the detailed health standard in docs/observability/health-check-guidance.md.

## Centralized Error Handling Guidance

- Standardize error envelope schema:
  - code
  - message
  - correlation_id
  - timestamp
  - retryable
- Capture unhandled exceptions at a global boundary.
- Map internal exceptions to stable external error codes.
- Emit structured error logs with stack traces only in trusted environments.
- Track error class metrics by endpoint and service.

## Frontend Observability Baseline

- Capture unhandled JS runtime errors and unhandled promise rejections.
- Track API error rate by endpoint class (4xx vs 5xx).
- Collect core performance events:
  - route load time
  - API call latency distribution
  - web-vitals compatible measures (LCP, INP, CLS) when implemented
- Add PWA lifecycle event logging:
  - service worker install/activate failures
  - offline fallback usage
  - update available/apply events

## Operational Dashboard Guidance

Define dashboard templates early even before tooling selection:

- Golden signals per service:
  - latency
  - traffic
  - errors
  - saturation
- API dashboard panels:
  - p50/p95/p99 latency per route
  - request rate by status family
  - auth endpoint failure ratio
- Frontend dashboard panels:
  - client error count and top signatures
  - route load latency trend
  - API dependency failure trend

## Production Troubleshooting Baseline

- Start with correlation_id from user-facing error or support ticket.
- Traverse telemetry in sequence:
  - logs for symptom confirmation
  - traces for causal dependency chain
  - metrics for blast radius and trend
- Maintain runbook sections for:
  - auth failures
  - elevated latency
  - 5xx surges
  - dependency outages

## CI/CD Observability Readiness

- Validate that required log fields exist in unit/integration tests for key paths.
- Validate health endpoints for every deployable service.
- Validate metric naming conventions with lint-like checks where possible.
- Preserve artifact metadata (commit SHA, version, environment) for traceability.
