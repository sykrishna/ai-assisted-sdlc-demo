# AWS Infrastructure Organization Guidance

## Purpose

Define how the Terraform scaffold in this repository should evolve into a production-ready AWS infrastructure codebase while preserving reusable modules, environment isolation, secure state handling, and clear ownership boundaries.

## Target Repository Structure

| Path                                             | Responsibility                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `infrastructure/backend.tf`                      | Shared remote state backend declaration kept partial and environment-configurable.                             |
| `infrastructure/providers.tf`                    | Shared AWS provider setup, default tags, and provider aliases if multi-region becomes necessary.               |
| `infrastructure/locals.tf`                       | Shared tags, naming conventions, and environment metadata helpers.                                             |
| `infrastructure/variables.tf`                    | Root module inputs that remain stable across environments.                                                     |
| `infrastructure/modules/network/`                | VPC, subnets, routing, NAT, security group primitives, and VPC endpoint composition.                           |
| `infrastructure/modules/security-baseline/`      | KMS, IAM boundaries, WAF hooks, guardrails, and security logging controls.                                     |
| `infrastructure/modules/observability-baseline/` | CloudWatch logs, alarms, dashboards, tracing collectors, and alerting primitives.                              |
| `infrastructure/modules/compute-baseline/`       | ECS cluster, task execution patterns, service modules, target groups, autoscaling, and ECR integration points. |
| `infrastructure/environments/dev/`               | Dev composition values and wrappers only.                                                                      |
| `infrastructure/environments/staging/`           | Staging composition values and wrappers only.                                                                  |
| `infrastructure/environments/production/`        | Production composition values and wrappers only.                                                               |

## Module Design Guidance

| Principle      | Guidance                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Reusability    | Modules should describe a reusable capability, not a single environment's instance.     |
| Clear Inputs   | Keep interfaces explicit and prefer typed variables over implicit naming magic.         |
| Safe Defaults  | Use secure defaults for encryption, logging, and network exposure.                      |
| Small Surfaces | Prefer smaller composable modules over large catch-all stacks.                          |
| Output Hygiene | Export only values needed by callers; avoid leaking secrets or unnecessary identifiers. |

## Recommended Module Expansion

| Module                    | Suggested Submodules or Responsibilities                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `network/`                | `vpc`, `subnets`, `nat`, `security-groups`, `alb-networking`, `vpc-endpoints`                   |
| `security-baseline/`      | `kms`, `iam-app-roles`, `iam-github-oidc`, `waf-baseline`, `secrets-access`                     |
| `observability-baseline/` | `log-groups`, `metric-alarms`, `dashboards`, `xray-or-otel`, `alb-access-logs`                  |
| `compute-baseline/`       | `ecs-cluster`, `ecs-service`, `task-definition`, `alb-routing`, `autoscaling`, `ecr-repository` |

## Terraform State Organization

| Topic          | Guidance                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| State Boundary | Use one state file per environment stack, and split further only when lifecycle or blast-radius concerns justify it. |
| Naming         | Use deterministic state key patterns such as `platform/<env>/core.tfstate`.                                          |
| Isolation      | Never reuse state keys, buckets, or lock scopes across environments.                                                 |
| Security       | Encrypt state, enable versioning, restrict access, and audit reads and writes.                                       |
| Recovery       | Document state restore procedures and require peer review for state surgery operations.                              |

## Environment Wrapper Guidance

| Rule           | Guidance                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Keep Thin      | Environment directories should wire modules together and provide values, not reimplement module logic. |
| No Secrets     | Use examples for non-sensitive defaults only; pull sensitive values from CI/CD or secret stores.       |
| Version Inputs | Keep environment-specific values reviewed in pull requests and tied to release context.                |
| Policy Parity  | Stage and production wrappers should remain structurally similar to reduce surprise during promotion.  |

## Variable Strategy

| Variable Type                          | Handling                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Stable global values                   | Prefer root variables and locals.                                                     |
| Environment-specific non-secret values | Keep in `terraform.tfvars` or CI-provided variable files per environment.             |
| Sensitive values                       | Pass via CI/CD-secured mechanisms or data-source lookups from Secrets Manager or SSM. |
| Derived naming and tags                | Compute in `locals.tf` to keep module interfaces smaller.                             |

## Tagging and Naming Guidance

| Area         | Guidance                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Tags         | Standardize `environment`, `service`, `owner`, `cost-center`, `managed-by`, and `data-classification` tags. |
| Names        | Use predictable patterns such as `<app>-<env>-<component>` to simplify CloudWatch, IAM, and ECS lookup.     |
| Traceability | Include deployment version and git SHA in service-level metadata where supported.                           |

## Secrets and Sensitive Data Guidance

| Topic         | Guidance                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Documentation | Do not record real secret names or values in docs that may outlive environment changes unless names are policy-approved. |
| Terraform     | Avoid storing secret payloads in state; prefer references to external secret objects.                                    |
| Modules       | Accept ARNs, names, or lookup paths rather than raw secret values.                                                       |
| Access        | Enforce least privilege from module outputs through IAM attachment points.                                               |

## Ownership Model

| Area                  | Primary Owner     | Reviewers                          |
| --------------------- | ----------------- | ---------------------------------- |
| Network modules       | Platform          | Security, SRE                      |
| Security modules      | Security/Platform | Platform, Compliance if applicable |
| Observability modules | SRE               | Platform, Application Engineering  |
| Compute modules       | Platform          | Application Engineering, Security  |
| Environment wrappers  | Platform          | Security, SRE, affected app teams  |

## Promotion and Change Safety Guidance

| Topic                  | Guidance                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Module Changes         | Promote module changes through dev and staging before production unless break-glass action is approved.  |
| State Changes          | Review state-impacting refactors carefully and avoid simultaneous structural and functional changes.     |
| Drift Detection        | Run `terraform plan` regularly in CI and before every deploy.                                            |
| Backward Compatibility | Add inputs with defaults when possible; avoid breaking module interfaces without coordinated migrations. |

## Operational Readiness Expectations

- Every deployable service should have matching compute, security, and observability module support.
- Every environment should expose documented health endpoints and monitoring hooks.
- Every new module should include usage examples, input descriptions, and expected outputs before broad reuse.
- Every production-facing module change should have an associated rollback approach.

## Suggested Next Terraform Additions

1. Expand `modules/network/` for multi-AZ VPC and ALB networking.
2. Expand `modules/compute-baseline/` for ECS cluster, task definition, and service deployment patterns.
3. Expand `modules/security-baseline/` for GitHub OIDC, IAM task roles, and Secrets Manager access policies.
4. Expand `modules/observability-baseline/` for CloudWatch log groups, dashboards, and alarms.
5. Add example compositions in `environments/staging/` and `environments/production/` using the same module contracts.
