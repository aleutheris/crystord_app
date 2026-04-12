# Product Backlog (User-Outcome Oriented)

Use this backlog to plan future work from user and product-value perspective.

## Why This Exists

- Requirements log captures what changed.
- ADR captures why key decisions were made.
- Backlog captures what should be built next and why it matters to users.

## Single Source Of Truth Rule

- Keep item lifecycle state in one dedicated project status index file.
- Do not duplicate item status in overview/process documents.
- Treat backlog item files as stable requirement definitions, not live status trackers.

## Workflow States

- Idea: Candidate item, not yet refined.
- Refined: Problem and value clarified.
- Ready: Prioritized and clear enough to implement.
- In Progress: Actively being delivered.
- Done: Implemented and verified.
- Observed: Released and measured in real usage.

## Prioritization Policy

Prioritize by user outcome, risk reduction, and strategic fit, not implementation convenience.

Use a lightweight score per item:

- User value: 1-5
- Urgency: 1-5
- Risk reduction / learning value: 1-5
- Effort: 1-5 (lower is better)
- Priority score: `(User value + Urgency + Risk reduction) / Effort`

## Review Cadence

- Weekly: Reprioritize top backlog items.
- Per release: Confirm outcome metrics and close-loop learning.
- Monthly: Remove stale items with no clear user value.
