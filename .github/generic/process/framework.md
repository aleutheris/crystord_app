# Software Project Instruction Framework (Abstract)

This framework defines durable, stack-agnostic governance for software projects.

## 1. Scope

- Keep this file principle-level and stable.
- Put concrete stack, runtime, and project-shape details under `.github/project/`.

## 2. Non-Negotiable Values

- Human readability over cleverness.
- Stable contracts over local optimization.
- Small, reversible changes over risky rewrites.
- Observable behavior over assumptions.
- Long-term maintainability over short-term speed.
- Human oversight over autonomous drift.

## 3. Architectural Governance

### Module Boundaries

- Treat each module as an autonomous unit with explicit responsibilities.
- Keep orchestration explicit and prevent leaky abstractions.
- Prefer behavior-oriented architecture (vertical slices by capability) over broad technical buckets.

### Interface Change Control

The LLM has no authority to change interfaces without explicit human approval.
This applies to public APIs, service/module interfaces, database schema contracts, event contracts, and external configuration contracts.

Required workflow:
1. Propose an Interface Change Request (ICR).
2. Include impact analysis, compatibility strategy, and migration plan.
3. Wait for explicit approval.
4. Then implement and validate.

## 4. Design and Quality Heuristics

Use SOLID and clean code principles as heuristics, not dogma.

- Keep files cohesive; `<= 200` lines unless justified.
- Keep functions focused; `<= 30` lines where practical.
- Keep detailed rationale and examples in `.github/generic/process/framework-reference.md`.

## 5. Verification and Delivery

Quality is validated by behavior, not by test count.

- Use end-to-end and boundary contract checks as primary verification.
- Use component/service and unit checks to localize failures.
- Prefer short-lived branches, small commits, and frequent integration.
- Remove dead code and unnecessary complexity when safe.

## 6. Acceptance Gates

Define concrete acceptance checks for:
- portability,
- maintainability,
- observability,
- contract stability,
- readability, and
- requirement taxonomy clarity (`FR-*`, `QR-*`, `OR-*`, `CR-*`).

## 7. Governance Artifact Model

When a project is instantiated, its governance artifacts must follow a one-file-per-item model:
- `adr/` holds one ADR file per decision,
- `requirements/` holds one requirement file per requirement,
- `backlog-items/` holds one backlog item file per vertical delivery slice.

Required supporting indexes:
- one canonical ADR index,
- one canonical requirements index,
- one canonical backlog status/index file.

Artifact-role rules:
- ADRs and requirements are horizontal governance artifacts.
- Backlog items are vertical, behavior-oriented delivery slices.
- Requirement taxonomy must be encoded in requirement record names as `REQ-FR-YYNNNN`, `REQ-QR-YYNNNN`, `REQ-OR-YYNNNN`, or `REQ-CR-YYNNNN`; backlog filenames remain taxonomy-neutral.
- Workflow state should live in the canonical index/status file rather than being duplicated across overview documents.

Naming placeholders for instantiated projects:
- `ADR-YYNNNN.md`
- `REQ-XY-YYNNNN.md`
- `BI-YYNNNN.md`

## 8. Context Budget and Loading Policy

Loading tiers:
1. **Always-on**: only concise, high-authority governance files.
2. **Usually referenced**: project-shaping files needed often, but not every turn.
3. **On-demand**: large or fast-changing artifacts loaded only when relevant.

Budget guardrails:
- `.github/copilot-instructions.md` target: `<= 120` lines.
- Each always-on companion file target: `<= 120` lines.
- Split on-demand files when they exceed ~400 lines or become review bottlenecks.

Duplication rule:
- Keep one source of truth per concern.
- Always-on files should summarize and reference, not copy detailed policy blocks.

Loading defaults:
- **Always-on**: `.github/copilot-instructions.md`, `.github/generic/process/framework.md`
- **Usually referenced**: `framework-reference.md`, `llm-software-execution.md`, `project-instructions.md`
- **On-demand**: templates, evolution artifacts, and learnings

Template rule:
- Files under `.github/generic/templates/` are never loaded automatically.
- Load a template only when the task explicitly requires creating or filling one out.
