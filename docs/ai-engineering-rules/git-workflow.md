# Git Workflow

## Purpose

Define a controlled, auditable workflow for AI-assisted changes in enterprise repositories.

## Branching Rules

1. Main branch protection
- Direct pushes to main are prohibited.
- Changes require pull requests and passing checks.

2. Branch naming
- Use deterministic prefixes: `feature/`, `fix/`, `chore/`, `docs/`, `sec/`.
- Include work item or ticket ID when available.

3. Commit hygiene
- Small, atomic commits with clear intent.
- Commit messages should explain why, not only what.

## Pull Request Rules

- Link relevant specs, architecture docs, and contract references.
- Include test evidence and risk assessment.
- Declare AI assistance used and reviewer focus areas.
- Require at least one qualified human reviewer.

## Merge Rules

- Required checks must pass (lint, tests, security, policy).
- Rebase or merge strategy must preserve readable history.
- Squash is preferred for noisy iterative branches.

## Hotfix Rules

- Hotfixes require incident reference and post-merge review.
- Follow-up hardening tasks must be tracked before closure.

## AI-Assisted Workflow Controls

- Generated diffs must be reviewed line-by-line for correctness and security.
- Do not merge code you cannot explain.
- High-risk areas require secondary reviewer sign-off.

## Example Pull Request Checklist

- Scope aligns with approved documentation.
- Backward compatibility impact assessed.
- Observability and security impact assessed.
- Rollback plan included for risky changes.
