# Backlog Status Tracker

Index of the current vertical backlog items and their traceability to requirements and design decisions.
Backlog IDs use the neutral `BI-YYNNNN` format; requirement taxonomy stays in the `Related Requirements` column.

| Backlog ID | Title | Status | Backlog Item | Related Requirements | Related ADRs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| BI-260001 | `<title>` | Idea / Refined / Ready / In Progress / Done / Observed | [BI-260001.md](backlog-items/BI-260001.md) | `REQ-FR-*`, `REQ-QR-*`, `REQ-OR-*`, `REQ-CR-*` as relevant | [ADR-260001](adr/ADR-260001.md) | `<brief description>` |
| BI-260002 | `<title>` | `<status>` | [BI-260002.md](backlog-items/BI-260002.md) | `<related requirement IDs or n/a>` | `<links or n/a>` | `<notes>` |

## Workflow States

- **Idea**: Candidate item, not yet refined.
- **Refined**: Problem and value clarified, ready for prioritization.
- **Ready**: Prioritized and clear enough to start implementation.
- **In Progress**: Actively being delivered.
- **Done**: Implemented and verified.
- **Observed**: Released and measured in real usage.

## Tracking Rules

1. Keep this file synchronized with `backlog-items/` folder contents.
2. Update status as items progress through workflow states.
3. Link to ADRs when decisions affect a requirement's design or scope.
4. Archive completed items by moving them to a historical section when the backlog becomes large.
