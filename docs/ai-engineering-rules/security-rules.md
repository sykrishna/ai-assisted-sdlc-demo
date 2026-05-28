# Security Rules

## Purpose

Define mandatory security controls for AI-assisted engineering in cloud-native TypeScript environments.

## Mandatory Controls

1. Secrets handling
- Never hardcode secrets, credentials, or tokens.
- Use managed secret stores and short-lived credentials.
- Rotate secrets according to platform policy.

2. Dependency hygiene
- Lock dependencies and scan for vulnerabilities continuously.
- Critical vulnerabilities block merges until resolved or formally accepted.

3. Input and output protection
- Validate and sanitize untrusted input.
- Encode output for its rendering context.
- Prevent injection classes (SQL, command, template, prompt injection).

4. Authentication and authorization
- Require strong identity for service-to-service and user access.
- Enforce least privilege through scoped roles/claims.
- Deny by default for unknown or missing permissions.

5. Data protection
- Encrypt data in transit and at rest.
- Classify data and apply retention/deletion controls.
- Restrict sensitive data in logs and telemetry.

6. AI-specific controls
- Do not send regulated or sensitive data to unapproved models.
- Treat model output as untrusted until validated.
- Apply prompt-injection defenses and output policy checks.

7. Auditability
- Security-relevant actions must be logged with actor, action, resource, and timestamp.
- Preserve tamper-evident audit trails per compliance requirements.

## Merge Gates

A change must not merge if it:
- Introduces hardcoded secrets.
- Disables required authz checks.
- Adds critical unresolved vulnerabilities.
- Expands sensitive data exposure without approval.

## Examples

Allowed:
- Reading API keys from a managed secret provider at runtime.

Not allowed:
- Embedding credentials in source, tests, docs, or prompts.
