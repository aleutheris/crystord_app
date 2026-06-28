# CLAUDE.md

Governance for this project — for humans and any model — lives in
[`docs/governance/`](docs/governance/), not in `.github/`.

This project is worked on most often with Claude, so the **always-on governance core is
imported below** (Claude auto-loads `@`-imports; plain links are not). Everything else loads
on demand — do not preload it.

@docs/governance/README.md
@docs/governance/generic/process/framework.md

## Loading the rest (on demand)

The router (imported above) owns the scope-routing rules and loading triggers — follow them,
and load only what the task needs. The deeper tiers (`framework-reference.md`, `artifact-model.md`,
`epic-process.md`, `project/project-instructions.md`, templates, and individual records) are
**not** preloaded.

This file is a thin pointer plus the Claude import of the always-on core; the single source of
governance is `docs/governance/`.

## Bash Command Style

To keep allowlisted commands auto-approving, avoid shell expansions that defeat static permission analysis:

- No command substitution (`$(...)`, backticks) or parameter expansion (`${...}`, e.g. `${PIPESTATUS[0]}`) in Bash commands — the permission engine cannot statically verify expanded commands and will prompt regardless of allow rules.
- Prefer separate commands or literal values so allowlisted prefixes match.
- This is a default, not an absolute: use an expansion only when it is genuinely the clearest option.
