# Testing Standards

## Purpose

Define deterministic testing expectations for AI-assisted delivery of TypeScript cloud-native systems.

## Test Pyramid Requirements

1. Unit tests
- Required for business logic and utility functions.
- Must run fast and deterministically.

2. Integration tests
- Required for persistence, messaging, and external service boundaries.
- Use controlled test environments and reproducible fixtures.

3. Contract tests
- Required for API and event compatibility guarantees.
- Must validate backward compatibility for non-breaking releases.

4. End-to-end tests
- Required for critical business journeys only.
- Keep scope minimal and stable to avoid flakiness.

## Enforceable Rules

- Flaky tests are treated as defects and prioritized for immediate fix.
- Non-deterministic dependencies (real time, random values, external state) must be controlled.
- Every defect fix should include a regression test when technically feasible.
- Pull requests must include evidence of relevant test execution.

## Coverage Expectations

- Minimum thresholds should be defined per service and enforced in CI.
- Coverage is a guardrail, not a substitute for risk-based test design.

## AI-Assisted Testing Controls

- AI-generated tests require human review for false confidence and missing edge cases.
- Generated assertions must be meaningful, not snapshot noise.
- Prompt and expected behavior should be documented for complex generated tests.

## Examples

Good:
- Explicit test names describing behavior and expected outcome.
- Stable fixtures with seeded data.

Avoid:
- Assertions that only check non-null values.
- Tests depending on execution order or wall-clock timing.
