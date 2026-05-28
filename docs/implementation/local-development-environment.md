# Local Development Environment and Docker Strategy

## Goal

Standardize local development for this monorepo with repeatable onboarding, cross-platform workflows, secure defaults, and development-focused containerization.

## Audience

- Engineers onboarding to the repository
- AI agents executing implementation tasks
- Platform engineers maintaining local developer tooling

## Local Development Standard

### Runtime Baseline

- Node.js >= 20
- pnpm >= 9
- Docker Desktop (optional for host-only workflows)

### Onboarding Flow

1. Run `pnpm setup`.
2. Copy `.env.example` to `.env` if needed (automated by setup/bootstrap).
3. Run `pnpm doctor` to verify local prerequisites.
4. Run `pnpm env:validate`.
5. Start host workflow: `pnpm dev`.
6. Start container workflow: `pnpm docker:up`.

### pnpm and TurboRepo Workflows

- `pnpm dev`: runs monorepo watch mode via TurboRepo.
- `pnpm dev:web`: runs frontend app only.
- `pnpm dev:api`: runs backend API only.
- `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm typecheck`: monorepo task fan-out.

TurboRepo remains the single orchestration layer for consistent local execution and future scaling.

### Local Dependency Management

- Single lockfile (`pnpm-lock.yaml`) controls deterministic dependency resolution.
- Workspace dependencies use `workspace:*` to avoid version drift.
- Bootstrap installs dependencies once at the workspace root.
- Docker workflows persist pnpm store with named volumes for faster rebuilds.

## Docker Strategy (Development Only)

## Scope

These containers are explicitly for local development and hot reload. They are not production deployment images.

### Containers

- Frontend container: [apps/web/Dockerfile](apps/web/Dockerfile)
- Backend container: [apps/api/Dockerfile](apps/api/Dockerfile)

### Orchestration

- Compose file: [docker-compose.yml](docker-compose.yml)
- Services: `web`, `api`
- Features:
  - Hot reload with bind-mounted source
  - Health checks for both services
  - Named volumes for node_modules and pnpm store
  - Service dependency ordering (`web` waits for healthy `api`)

### Lightweight Container Principles

- Base image: `node:20-alpine`
- Shared dependency layer using package manifests and lockfile
- Build context excludes non-essential artifacts via [.dockerignore](.dockerignore)
- No production hardening steps included yet (intentionally deferred)

## Environment Management Standard

### Files

- Local baseline template: [.env.example](.env.example)
- CI baseline template: [.env.ci.example](.env.ci.example)
- Local runtime file (untracked): `.env`

### Validation

- Local validation: `pnpm env:validate`
- CI validation: `pnpm env:validate:ci`
- Validator script: [scripts/validate-env.mjs](scripts/validate-env.mjs)

Validation blocks missing required variables and obvious placeholder-like secret values.

### Secrets Handling Guidance

- Never commit `.env` files containing real credentials.
- Keep production secrets in managed secret stores, not in repository files.
- Use least-privilege local values for developer workflows.
- Rotate any key/token if exposure is suspected.

### Local vs CI Separation

- Local runs source values from `.env`.
- CI runs from injected environment variables (pipeline settings).
- Example values are documented in `.env.ci.example` for reproducibility without storing secrets.

## Health Check Guidance

- API health endpoint: `GET /api/v1/health`
- Web health check: root page (`/`)
- Container health is surfaced through Compose healthchecks.

If health checks fail:

1. Run `pnpm docker:logs`.
2. Confirm `.env` variables with `pnpm env:validate`.
3. Rebuild containers: `pnpm docker:down && pnpm docker:up`.
4. Verify local ports `3000` and `3001` are not occupied.

## Cross-Platform Compatibility

- Bootstrap/setup/doctor/env validation are Node.js scripts to avoid shell-specific behavior.
- Commands are compatible with macOS, Linux, and Windows (with Node + pnpm installed).
- Docker workflow depends on Docker Desktop-compatible Compose v2 command (`docker compose`).

## AI-Friendly and Cloud-Native Readiness

- Clear script entry points for AI agent execution (`setup`, `doctor`, `env:validate`, `docker:up`).
- Monorepo task orchestration uses TurboRepo for scalable build graph execution.
- Environment separation and validation align with cloud-native pipeline practices.
- Development containers mirror service boundaries (`web`, `api`) without committing to production deployment topology.

## Troubleshooting Quick Reference

### Dependency issues

- Run `pnpm doctor` then `pnpm bootstrap`.
- Remove workspace `node_modules` only if lockfile is unchanged and install is corrupted.

### Turbo cache confusion

- Local cache is intentionally untracked.
- If behavior seems stale, run `pnpm turbo run build --force` or remove local `.turbo`.

### Docker hot reload not updating

- Ensure `CHOKIDAR_USEPOLLING` is enabled in Compose environment.
- Restart stack with `pnpm docker:down` and `pnpm docker:up`.

### Port conflicts

- Change local bindings in [docker-compose.yml](docker-compose.yml) or stop conflicting processes.
