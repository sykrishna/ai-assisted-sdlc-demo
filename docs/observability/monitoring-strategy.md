# Monitoring Strategy

## Objective

Define foundational monitoring standards for the monorepo with Prometheus-compatible metrics design, CloudWatch-compatible naming practices, and alerting/dashboard readiness without adopting a specific monitoring vendor at this stage.

## Monitoring Outcomes

- Detect failures quickly.
- Reduce mean time to detect and resolve incidents.
- Provide actionable service health and performance insights.
- Prepare for scalable cloud-native operations.

## Metrics Strategy

### Metric Taxonomy

Define metric families:

- availability metrics
- latency metrics
- throughput metrics
- error metrics
- resource saturation metrics
- business journey metrics (high-level)

### Prometheus-Compatible Conventions

- snake_case metric names.
- Base units in metric names where applicable (\_seconds, \_bytes, \_total).
- Counter names end with \_total.
- Histogram for request durations.
- Avoid high-cardinality labels (user_id, raw path, request_id).

### Label Conventions

Allowed low-cardinality labels:

- service
- environment
- route_template
- method
- status_family
- dependency

Avoid unbounded labels:

- dynamic IDs
- full URLs with query params
- raw exception stack text

## CloudWatch Compatibility Guidance

- Keep naming human-readable and unit-consistent for easy namespace mapping.
- Preserve dimensions that map cleanly to CloudWatch dimensions.
- Keep total label count constrained to avoid cost and query complexity.
- Use environment and service as baseline dimensions.

## Alerting Preparation Standards

### Alert Classes

- availability alerts: service down or health endpoint failures
- latency alerts: sustained p95/p99 degradation
- error-rate alerts: elevated 5xx or client-side failure spikes
- dependency alerts: upstream/downstream timeout or failure surge
- saturation alerts: CPU/memory/event-loop pressure thresholds

### Alert Design Rules

- Alert on symptoms first, causes second.
- Define clear severity levels (critical, high, medium, low).
- Add runbook links to every alert definition.
- Include correlation hints in alert context (service, route, environment).
- Avoid flapping with evaluation windows and burn-rate style thresholds.

## Dashboard Guidance

### Backend Operational Dashboard

Minimum panels:

- request rate by route and status family
- p50/p95/p99 latency by route
- error count by error.code
- dependency call latency and failure ratio
- process resource saturation

### Frontend Operational Dashboard

Minimum panels:

- frontend runtime error count and top error signatures
- route load performance trend
- API call failure rate by endpoint group
- PWA lifecycle anomalies (worker install/update failures)

### Executive Service Health View

- service status summary
- 24-hour error/latency trends
- incident count and MTTR trend

## Frontend Monitoring Guidance

- Capture global runtime errors and unhandled rejections.
- Capture API failure telemetry with endpoint grouping.
- Capture route-level performance and web-vitals-ready metrics.
- Capture offline/online transitions for PWA behavior analysis.

## API Failure Logging Strategy

When API failures happen in frontend:

- log endpoint group (not full URL with sensitive params)
- log HTTP status family
- include correlation_id if available
- include retry attempt count
- avoid logging full response bodies

## PWA Monitoring Considerations

- Service worker registration failures
- Cache update/install failures
- Offline fallback invocation rate
- Background sync failure tracking (if implemented)
- Version mismatch or stale asset detection

## Operational Readiness and SLO Preparation

- Define service-level indicators (SLIs) now:
  - availability
  - latency
  - error rate
- Define initial service-level objectives (SLOs) before production launch.
- Map alerts to SLO burn conditions.

## CI/CD Monitoring Integration Preparation

- Add pipeline checks ensuring health endpoints remain present.
- Validate metric naming conventions during build/test.
- Track deployment metadata for dashboard annotations (commit SHA, version, environment).
- Keep instrumentation flags configurable per environment profile.

## Implementation Phasing (Vendor-Neutral)

1. Standardize metric names, labels, and health endpoints.
2. Add in-process metrics instrumentation wrappers.
3. Add exporter adapters and scraping/ingestion configuration.
4. Add alert rules and dashboards.
5. Tune thresholds from production traffic behavior.
