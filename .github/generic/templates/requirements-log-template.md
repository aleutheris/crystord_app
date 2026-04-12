# Requirements Evolution Log

Use this log to track requirement changes over time.

## Workflow

- This is the living record of evolving requirements.
- This is not the backlog. Future demand is managed in `.github/project/evolution/product-backlog.md`.
- Add an entry whenever a requirement is added, changed, deprecated, or removed.
- If a requirement change impacts interfaces/contracts, link the related ICR.
- If a requirement change triggers an architectural decision, link the related ADR.
- Link the originating backlog item when applicable.

## Entry Template

- Date: <yyyy-mm-dd>
- Requirement ID: <id>
- Change type: Added | Changed | Deprecated | Removed
- Summary: <what changed>
- Rationale: <why>
- Impacted modules/contracts: <list>
- Requires ICR: Yes | No
- Approval reference: <human decision record>
- Verification update: <tests/checks added or changed>
