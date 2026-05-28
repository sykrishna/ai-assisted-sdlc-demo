# Documentation Structure Guide

## Purpose

This guide defines how documentation is organized, authored, reviewed, and consumed for enterprise-grade, AI-assisted, spec-driven delivery.

## Folder Purposes and Expected Document Types

| Folder | Purpose | Expected Document Types |
|---|---|---|
| `docs/product-specs/` | Define product intent and delivery scope. | Product feature specs, user journeys, acceptance criteria, edge-case definitions, NFR references. |
| `docs/architecture/` | Define technical solution design and trade-offs. | Technical designs, architecture diagrams, decision records, failure mode analysis, scalability notes. |
| `docs/api-contracts/` | Define interface contracts before implementation. | API contract docs, OpenAPI specs, schema definitions, error models, versioning/deprecation notes. |
| `docs/implementation/` | Plan and govern delivery execution. | Implementation plans, sequencing plans, risk/rollback plans, release readiness checklists. |
| `docs/ai-engineering-rules/` | Define mandatory AI-assisted engineering controls. | Coding standards, security rules, testing standards, git workflow, agent instructions. |
| `docs/templates/` | Provide reusable authoring patterns. | Spec templates, design templates, API templates, task templates, NFR templates. |

## Naming Conventions

- Use lowercase kebab-case for all documentation filenames and folders.
- Use descriptive, domain-first names (for example: `authentication-technical-design.md`).
- Include artifact type in filename where useful (`-spec`, `-design`, `-contract`, `-plan`).
- Use stable IDs inside documents (for example: `AUTH-SPEC-001`, `AUTH-API-001`) for traceability.
- Avoid ambiguous names such as `notes.md`, `draft.md`, or `new-doc.md`.

## Ownership Expectations

| Document Area | Primary Owner | Required Reviewers | Approval Expectation |
|---|---|---|---|
| Product Specifications | Product Management | Engineering, Security, QA | Product + Engineering approval before implementation. |
| Architecture | Architecture/Backend Leads | Security, Platform, SRE | Architecture + Security approval before build. |
| API Contracts | Platform/API Team | Frontend, Backend, Security, QA | Contract approval before endpoint implementation. |
| Implementation Plans | Engineering Manager/Tech Lead | Platform, Security, QA, SRE | Delivery plan approval before execution. |
| AI Engineering Rules | Security + Engineering Leadership | Platform, QA | Policy approval required for rule changes. |

## Documentation Lifecycle

1. Draft: Author creates initial artifact using repository templates.
2. Review: Cross-functional reviewers validate correctness, security, and operability.
3. Approve: Required owners sign off.
4. Baseline: Approved document becomes implementation source of truth.
5. Update: Changes require version updates, rationale, and re-approval when impact is material.

## AI Agent Usage Rules

- Read in order: product spec -> architecture design -> API contract -> implementation plan -> AI engineering rules.
- Treat approved documents as authoritative constraints, not suggestions.
- Do not generate implementation output that conflicts with documented requirements.
- Cite impacted documents in change summaries and pull requests.
- If documentation conflicts or is incomplete, stop and surface assumptions/questions before proceeding.
- Prefer repository templates for new artifacts and preserve existing document structure.
- Never store secrets, credentials, or sensitive production data in documentation.

## Traceability Requirements

- Every implementation task must reference at least one spec, design, and contract artifact when applicable.
- Every API or behavior change must identify impacted documentation files and required updates.
- Pull requests must include links to source documentation and verification evidence.

## Minimum Quality Bar

A documentation change is acceptable only when:

- It is clear, testable, and unambiguous.
- It includes security and observability implications where relevant.
- It preserves backward compatibility expectations or documents breaking impact.
- It is reviewed by required owners and aligns with AI engineering rules.
