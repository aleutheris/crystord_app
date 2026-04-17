# Backlog Status Tracker

| Backlog ID | Title | Status | Backlog Item | Related Requirements | Related ADRs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| BI-260001 | Formalize MVP product definition baseline | Refined | .github/project/evolution/backlog-items/BI-260001.md | REQ-FR-260001, REQ-FR-260002 | ADR-260001 | A1/A2 accepted and encoded as foundational product-direction artifacts. |
| BI-260002 | Formalize MVP boundary and workspace surfaces | Refined | .github/project/evolution/backlog-items/BI-260002.md | REQ-FR-260003, REQ-FR-260004, REQ-OR-260001, REQ-CR-260001 | ADR-260002 | A4/A5/A6 accepted and encoded as MVP scope boundaries. |
| BI-260003 | Establish secondary-user personas and GraphQL backend contract | Refined | .github/project/evolution/backlog-items/BI-260003.md | REQ-FR-260005, REQ-FR-260006, REQ-CR-260002 | ADR-260003 | A3/B decisions except detailed B3 compatibility governance. |
| BI-260010 | Implement B3 schema compatibility contract | Done | .github/project/evolution/backlog-items/BI-260010.md | REQ-OR-260002 | ADR-260013 | Implemented: startup schemaInfo handshake, semver validation, fail-fast UI, 14 passing tests.
| BI-260011 | Formalize UX interaction and demo entry model | Done | .github/project/evolution/backlog-items/BI-260011.md | REQ-FR-260007, REQ-FR-260008, REQ-CR-260003, REQ-OR-260001 | ADR-260014 | Implemented: demo sign-in gate, auth state management, workspace shell layout, AuthGuard routing, 20 unit tests, 3 E2E tests, all quality gates pass.
| BI-260012 | Formalize visualization and interaction model for MVP | Ready | .github/project/evolution/backlog-items/BI-260012.md | REQ-FR-260009, REQ-FR-260010, REQ-CR-260004, REQ-QR-260001 | ADR-260015 | Ready for implementation of graph primitives, deletion safety, and performance targets.
| BI-260013 | Formalize search, query, and discoverability model | Ready | .github/project/evolution/backlog-items/BI-260013.md | REQ-FR-260011, REQ-FR-260012, REQ-CR-260005 | ADR-260016 | Ready for implementation of MVP search and result-scoping behaviors.
| BI-260014 | Formalize information architecture baseline | Refined | .github/project/evolution/backlog-items/BI-260014.md | REQ-FR-260013, REQ-FR-260014, REQ-CR-260006 | ADR-260017 | Encodes F1-F6 shell boundaries, module ownership model, and extension constraints.
| BI-260015 | Formalize frontend architecture baseline | Refined | .github/project/evolution/backlog-items/BI-260015.md | REQ-FR-260015, REQ-FR-260016, REQ-OR-260003, REQ-CR-260007 | ADR-260018 | Encodes G1-G5 architecture pattern, state model, modularity, and contract-stability controls.
| BI-260016 | Formalize stack selection criteria and concrete MVP stack | Refined | .github/project/evolution/backlog-items/BI-260016.md | REQ-FR-260017, REQ-FR-260018, REQ-OR-260004, REQ-CR-260008 | ADR-260019 | Encodes H1-H9 stack criteria, no-go constraints, runtime split decision, and concrete stack baseline.
| BI-260017 | Formalize delivery and quality baseline | Refined | .github/project/evolution/backlog-items/BI-260017.md | REQ-FR-260019, REQ-QR-260002, REQ-OR-260005, REQ-CR-260009 | ADR-260020 | Encodes I1-I6 release gates, reliability blockers, observability operations, rollback model, and fallback trust policy.
| BI-260018 | Formalize evolution and extensibility baseline | Refined | .github/project/evolution/backlog-items/BI-260018.md | REQ-FR-260020, REQ-FR-260021, REQ-OR-260006, REQ-CR-260010 | ADR-260021 | Encodes J1-J5 extensibility seams, growth constraints, adapter resilience, and migration safety controls.
| BI-260019 | Operationalize branding governance for UI changes | Refined | .github/project/evolution/backlog-items/BI-260019.md | REQ-CR-260011 | ADR-260022 | Ensures `.github/project/branding.md` is treated as mandatory source for UI/design decisions and review checks.

## Workflow States

- **Idea**: Candidate item, not yet refined.
- **Refined**: Problem and value clarified, ready for prioritization.
- **Ready**: Prioritized and clear enough to start implementation.
- **In Progress**: Actively being delivered.
- **Done**: Implemented and verified.
- **Observed**: Released and measured in real usage.
