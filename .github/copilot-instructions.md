# Copilot Instructions For Software Target Projects

This file defines repository-level governance for software projects.

## Scope

- Keep reusable baseline policy in `.github/copilot-instructions.md` and `.github/generic/`.
- Keep project-specific policy in `.github/project/`.
- Keep product implementation changes in code and test files.

## Working Rules

- Optimize for human readability and maintainable software.
- Challenge weak assumptions with evidence-based reasoning.
- Prefer small, reversible changes and explicit rationale for decisions.

## Request Scope Routing (Mandatory)

Every user prompt must be interpreted across these change scopes:

- `generic instructions`: updates to reusable baseline policy in `.github/copilot-instructions.md` and `.github/generic/`.
- `project instructions`: updates under `.github/project/`.
- `code`: updates to implementation, tests, and runtime/configuration files.

Routing rules:

- Default assumption: a prompt may authorize `project instructions`, `code`, or both.
- Explicit consent required: never change `generic instructions` unless the user explicitly requests generic-instruction changes.
- If a request could require generic changes and explicit consent is missing, ask for confirmation before editing generic instructions.
- Before applying changes, state the interpreted scope (`project instructions`, `code`, `both`, or `generic instructions`).

Usually-referenced loading triggers:

- For design, architecture, risk-heavy, or tradeoff analysis tasks, load `.github/generic/process/llm-software-execution.md` and `.github/generic/process/project-instructions.md`.
- For project bootstrap, governance instantiation, or structure setup tasks, load `.github/generic/process/project-instructions.md`.
- When present, load `.github/project/project-instructions.md` for project-instantiated governance details.
- For prioritization and planning tasks, load `.github/generic/process/product-backlog.md`.

## Authority and Loading Note

- Keep this file concise and repository-generic.
- The canonical authority and loading policy lives in `.github/generic/process/framework.md`.
- Prefer referencing deeper governance files instead of restating their full hierarchy here.
