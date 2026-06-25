# Claude Code Instructions

This project uses a structured governance system defined in `.github/`. Follow the rules below on every prompt.

## Mandatory Loading (Always-on)

Read these files at the start of every conversation before responding to any work-related prompt:

- [.github/copilot-instructions.md](.github/copilot-instructions.md) — repository-level governance, scope routing rules, and loading triggers
- [.github/project/project-instructions.md](.github/project/project-instructions.md) — project profile, architecture, quality gates, and the full loading matrix
- [.github/project/branding.md](.github/project/branding.md) — branding policy (required for all UI/design changes)

## Usually-Referenced (Load When Relevant)

Load these based on the task type as defined in `.github/copilot-instructions.md` and `.github/project/project-instructions.md` section 9:

- [.github/generic/process/llm-software-execution.md](.github/generic/process/llm-software-execution.md) — for design, architecture, risk-heavy, or tradeoff tasks
- [.github/project/evolution/requirements-index.md](.github/project/evolution/requirements-index.md) — for requirement-related tasks
- [.github/project/evolution/backlog-status.md](.github/project/evolution/backlog-status.md) — for backlog and planning tasks
- [.github/project/evolution/adr-index.md](.github/project/evolution/adr-index.md) — for decision-related tasks

## On-Demand (Load When Specifically Needed)

- `.github/project/evolution/requirements/*` — individual requirement files
- `.github/project/evolution/adr/*` — individual ADR files
- `.github/project/evolution/backlog-items/*` — individual backlog item files
- `.github/project/evolution/learnings/*` — individual learning records
- `.github/project/evolution/learnings-index.md` — learnings index
- `docs/backend-user-guide.md` — backend contract reference

## Bash Command Style

To keep allowlisted commands auto-approving, avoid shell expansions that defeat static permission analysis:

- No command substitution (`$(...)`, backticks) or parameter expansion (`${...}`, e.g. `${PIPESTATUS[0]}`) in Bash commands — the permission engine cannot statically verify expanded commands and will prompt regardless of allow rules.
- Prefer separate commands or literal values so allowlisted prefixes match.
- This is a default, not an absolute: use an expansion only when it is genuinely the clearest option.

## Scope Routing

Before applying any change, follow the routing rules in `.github/copilot-instructions.md`:
- State the interpreted scope (`project instructions`, `code`, `both`, or `generic instructions`)
- Never change `generic instructions` without explicit user consent
