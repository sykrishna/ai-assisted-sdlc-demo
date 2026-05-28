# Monorepo Bootstrap Notes

## Runtime Requirements

- Node.js >= 20.10.0
- pnpm >= 9.0.0

## Quickstart

1. Verify local tooling: `pnpm doctor`
2. Run setup flow: `pnpm setup`
3. Start host workflows: `pnpm dev`
4. Or start container workflow: `pnpm docker:up`

See [docs/implementation/local-development-environment.md](docs/implementation/local-development-environment.md) for full standards, environment strategy, troubleshooting, and Docker guidance.

## Scope

This bootstrap includes foundational scaffolding only. No business features are implemented.
