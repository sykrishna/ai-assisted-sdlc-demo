# Architecture Principles

## Purpose

Establish non-negotiable architecture principles for scalable, secure, cloud-native TypeScript systems.

## Core Principles

1. Domain-oriented design.
- Organize services and modules by business capability, not by framework layer.

2. Contract-first integration.
- Define and review API/event contracts before implementation.
- Treat contracts as versioned products.

3. Stateless and horizontally scalable services.
- Services should be disposable and scale-out friendly.
- Persist state in managed data stores, not process memory.

4. Reliability by design.
- Timeouts, retries with backoff, and idempotency are required for network calls.
- Use circuit-breaking patterns for unstable dependencies.

5. Security and least privilege.
- Every component must run with minimal permissions.
- Secrets must come from managed secret stores.

6. Observable systems.
- Standardize logs, metrics, and traces across services.
- Correlation IDs must flow across boundaries.

7. Change safety.
- Prefer backward-compatible contract changes.
- Rollouts should support progressive delivery and fast rollback.

## AI-Assisted Architecture Rules

- AI suggestions are advisory; architecture decisions require human approval.
- Significant trade-offs must be recorded as ADRs.
- Generated diagrams and docs must align with implemented contracts.

## Example Decision Checks

Before approving a design, verify:
- Failure mode behavior is explicit.
- Data ownership boundaries are clear.
- Multi-region and disaster recovery assumptions are documented.
- Cost and performance trade-offs are stated.
