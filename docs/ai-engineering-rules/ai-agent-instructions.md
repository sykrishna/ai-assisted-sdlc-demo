# AI Agent Instructions

## Purpose

Define operational constraints for AI agents contributing to this repository.

## Global Agent Rules

1. Docs-first behavior
- Agents must prioritize specifications, architecture, and contracts before proposing implementation.
- If requirements are unclear, agents should request clarification or add assumptions explicitly.

2. Deterministic output
- Prefer explicit, reproducible steps over open-ended suggestions.
- Avoid hidden assumptions and ambiguous language.

3. Safety and compliance
- Agents must not generate or expose secrets.
- Agents must follow security and privacy rules in this repository.

4. Minimal change principle
- Propose the smallest safe change that satisfies requirements.
- Avoid unrelated refactors unless requested.

5. Traceability
- Link changes to relevant spec, architecture, API, and policy documents.
- Record notable decisions and assumptions in change descriptions.

## Code Generation Constraints

- No application code should be generated until required specs and contracts are approved.
- Generated code must be TypeScript-strict compatible and cloud-native ready when implementation is authorized.
- Prefer maintainable patterns over framework-specific shortcuts.

## Review Expectations

- Every AI-generated change requires human review before merge.
- Reviewers must validate correctness, security, test adequacy, and operational impact.
- High-risk changes require explicit approval from designated owners.

## Prompting Guidance

- Provide context: goal, constraints, non-goals, and acceptance criteria.
- Ask for structured outputs: assumptions, approach, risks, and verification steps.
- Require citations to repository documents when making design choices.

## Example Prompt Pattern

- Objective: Define API contract update for order cancellation.
- Constraints: Backward compatible, idempotent behavior, PII-safe logs.
- Deliverables: Contract diff summary, risk list, test impact matrix.
