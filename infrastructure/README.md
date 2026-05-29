# Infrastructure as Code

## Purpose

Provide an enterprise-grade, cloud-native Terraform scaffold for multi-environment delivery in this monorepo, with secure defaults and modular reuse.

## Structure

- `environments/dev/`: Development environment composition and backend/tfvars examples.
- `environments/staging/`: Staging environment composition and backend/tfvars examples.
- `environments/production/`: Production environment composition and backend/tfvars examples.
- `modules/network/`: Reusable network baseline module placeholder.
- `modules/security-baseline/`: Reusable security guardrail module placeholder.
- `modules/observability-baseline/`: Reusable telemetry/monitoring baseline placeholder.
- `modules/compute-baseline/`: Reusable compute baseline placeholder.
- `organization-guidance.md`: Recommended module, state, and ownership organization for AWS production evolution.
- `backend.tf`: Remote state backend declaration placeholder.
- `providers.tf`: AWS provider configuration with default tags.
- `locals.tf`: Shared tag strategy for consistent governance.

## Remote State Preparation

- Backend configuration is intentionally partial and uses `backend.hcl.example` files per environment.
- Create and secure state bucket + lock table outside this scaffold before first `terraform init`.
- Copy each `backend.hcl.example` to `backend.hcl` locally and provide real values.

## Environment Variable Strategy

- Keep non-sensitive defaults in `terraform.tfvars.example` files.
- Pass sensitive or deployment-specific values via CI/CD environment variables or secure secret managers.
- Use per-environment variables to avoid cross-environment drift.

## Secrets Handling Guidance

- Do not commit secrets, credentials, access keys, or backend real state configs.
- Prefer short-lived credentials (OIDC/assumed roles) for CI execution.
- Reference secret values from secure secret stores at runtime where possible.

## Quality and Security Defaults

- No AWS resources are provisioned in this bootstrap stage.
- Module boundaries are explicit and designed for future scale.
- Changes should be reviewed with security and platform ownership before promotion.
