# Software Project Instruction Framework (Reference)

This file contains detailed, usually-referenced guidance that complements `.github/generic/process/framework.md`.
Load this file for deeper design review, architecture tradeoff analysis, and quality verification planning.

## 1. SOLID Heuristic Detail

| Principle | Expected Behavior | Verification Signal |
| --- | --- | --- |
| SRP | Keep one reason to change per module/class | Cohesion review and change-scope analysis |
| OCP | Prefer extension paths over risky core rewrites | Diff review and extension points |
| LSP | Subtypes preserve expected behavior contracts | Contract tests across implementations |
| ISP | Avoid forcing consumers to depend on unused methods | Interface surface review |
| DIP | Depend on abstractions, not concrete details | Dependency direction checks |

## 2. Requirements Taxonomy Detail

- Functional behavior requirements: `FR-*`
- Quality attribute requirements: `QR-*`
- Operational requirements: `OR-*`
- Constraint/compliance requirements: `CR-*`

Canonical requirement record names should encode the taxonomy class as `REQ-FR-YYNNNN`, `REQ-QR-YYNNNN`, `REQ-OR-YYNNNN`, or `REQ-CR-YYNNNN`.
Use class-prefixed IDs as stable references inside backlog items, requirement records, and implementation artifacts.

## 3. Verification Planning Detail

Testing priority ladder:

1. Required: End-to-end behavior tests for critical user flows.
2. Required: Contract and integration tests at boundaries.
3. Recommended: Focused component/service tests for fault localization.
4. Optional: Unit tests for complex or high-risk internal logic.

Rule: If behavior tests fail, use lower-level tests to isolate failure location quickly.

## 4. Quality Gate Check Detail

Use these deeper checks during architecture/design review:

- Portability: Build and run in intended targets without hidden assumptions.
- Maintainability: Clear ownership boundaries and low-friction change paths.
- Observability: Logs, metrics, and traces diagnose critical flows.
- Contract stability: No unapproved interface changes.
- Readability: Code and docs understandable with minimal context switching.
