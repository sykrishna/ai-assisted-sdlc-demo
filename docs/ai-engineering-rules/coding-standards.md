# Coding Standards

## Purpose

Define deterministic coding expectations for AI-assisted development of modern TypeScript cloud-native systems.

## Scope

Applies to all future TypeScript services, libraries, infrastructure support tooling, and generated code changes.

## Enforceable Rules

1. TypeScript strict mode is required.
- `strict: true` must be enabled.
- `any` is forbidden unless explicitly documented with owner approval.

2. Runtime input validation is mandatory at trust boundaries.
- Validate all external inputs (HTTP, queue messages, config, env vars).
- Compile-time types alone are not sufficient for untrusted data.

3. Public interfaces must be explicit and versioned.
- Exported contracts must use named types/interfaces.
- Breaking changes require version bump and migration note.

4. Error handling must be structured.
- Throw typed errors or standardized error objects.
- Never swallow exceptions.
- Log with contextual metadata and correlation ID.

5. Async behavior must be explicit.
- All promises must be awaited or intentionally handled.
- Floating promises are not allowed.

6. Determinism over cleverness.
- Prefer simple, predictable control flow.
- Avoid hidden side effects and implicit global state.

7. Observability by default.
- Add structured logs at key boundaries.
- Emit metrics around critical workflows and failure paths.

## Naming and Layout

- Use kebab-case for files and folders.
- Use PascalCase for types/classes and camelCase for variables/functions.
- One domain concept per module unless cohesion requires grouping.

## AI-Assisted Development Controls

- AI-generated code must include type-safe signatures and clear boundaries.
- Human reviewer must verify correctness, security, and test coverage before merge.
- Prompts used for complex generated changes should be documented in pull requests.

## Examples

Good:
- `parseUserEvent(input): Result<UserEvent, ValidationError>`
- `logger.info({ correlationId, orderId }, "order accepted")`

Avoid:
- `function parse(input: any) { return input as UserEvent; }`
- Silent `catch` blocks without logging or rethrow
