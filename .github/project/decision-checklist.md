# Frontend Project Instantiation Decision Checklist

Decisions needed before building a new frontend project from scratch.
This checklist is intentionally stack-neutral. It is meant to drive decisions, not pre-answer them.
The backend guide remains a separate source of truth for backend behavior and data concepts.

Items marked `[x]` are resolved; items marked `[ ]` are open.

---

## A. Product Definition

- [ ] **A1. Product goal**: What is the primary job of this frontend?
- [ ] **A2. Primary users**: Who is the main user for v1?
- [ ] **A3. Secondary users**: Who may use it later but is not the main design target now?
- [ ] **A4. MVP boundary**: What is the minimum feature set that makes the product genuinely useful?
- [ ] **A5. Out-of-scope list**: What will explicitly not be part of v1?

---

## B. Domain & Backend Contract

- [ ] **B1. Backend contract source**: Which backend documents and schemas define the frontend contract?
- [ ] **B2. Data model coverage**: Which backend concepts must be editable in v1, and which are read-only or deferred?
- [ ] **B3. API compatibility rule**: How will frontend work stay aligned with backend schema changes?
- [ ] **B4. Query/mutation boundaries**: Which operations are essential for the first release?
- [ ] **B5. Error contract**: What kinds of backend failures must the frontend handle explicitly?

---

## C. User Experience Model

- [ ] **C1. Interaction style**: Is the product primarily graph-first, form-first, search-first, or hybrid?
- [ ] **C2. Workspace model**: Should the main experience be a full workspace, a document-like editor, or a traditional admin application?
- [ ] **C3. Navigation model**: How should users move between exploration, editing, administration, and settings?
- [ ] **C4. Editing model**: Should editing happen inline, in side panels, in dialogs, or in dedicated screens?
- [ ] **C5. Responsiveness target**: Desktop only for v1, or must the experience also support tablet/mobile?

---

## D. Visualization & Interaction

- [ ] **D1. Visualization modes**: What distinct views are required in v1?
- [ ] **D2. View switching**: How should users move between visualization modes?
- [ ] **D3. Interaction primitives**: Which interactions are required for v1: drag-and-drop, connect/disconnect, multi-select, zoom, pan, keyboard shortcuts?
- [ ] **D4. Creation flow**: How should users create new items and relationships?
- [ ] **D5. Deletion and safety**: What destructive actions need confirmation, undo, or soft-delete behavior?
- [ ] **D6. Performance target**: What dataset sizes and interaction latency are acceptable for v1?

---

## E. Search, Query, and Discoverability

- [ ] **E1. Search model**: Simple search, structured filters, query builder, or multiple modes?
- [ ] **E2. Discoverability**: Should the product expose a textual representation of queries or only visual controls?
- [ ] **E3. Autocomplete behavior**: Which fields or concepts need live suggestions?
- [ ] **E4. Result presentation**: Should results appear in the main workspace, side panels, lists, or combinations of these?
- [ ] **E5. Saved views or queries**: Are reusable searches or saved workspaces required in v1?

---

## F. Information Architecture

- [ ] **F1. Main areas**: What are the top-level product areas?
- [ ] **F2. Administration scope**: What belongs under administration in v1?
- [ ] **F3. Separation of concerns**: Which concerns must remain isolated as separate modules or bounded areas?
- [ ] **F4. Extension points**: Where should future capabilities plug in without major rewrites?
- [ ] **F5. Content hierarchy**: What entities, collections, and supporting objects need clear ownership relationships?

---

## G. Frontend Architecture

- [ ] **G1. Architectural style**: What frontend architecture pattern best fits the product?
- [ ] **G2. State strategy**: What categories of state exist, and how should local, shared, server, and transient UI state be separated?
- [ ] **G3. Rendering strategy**: What rendering model is needed for the main interaction surface?
- [ ] **G4. Modularity rule**: What are the initial module boundaries and dependency rules?
- [ ] **G5. Contract stability rule**: How will internal module interfaces be protected from casual breakage?

---

## H. Stack Selection Criteria

- [ ] **H1. Framework criteria**: What must the frontend framework support to be acceptable?
- [ ] **H2. Visualization criteria**: What capabilities are mandatory for the visualization/rendering layer?
- [ ] **H3. Component system criteria**: What is required from the UI component foundation?
- [ ] **H4. Testing criteria**: What must the test stack make easy and reliable?
- [ ] **H5. Build and tooling criteria**: What developer-experience and build constraints matter most?
- [ ] **H6. Rejection criteria**: What stack characteristics are unacceptable even if they are popular?

---

## I. Delivery & Quality

- [ ] **I1. Acceptance flows**: Which end-to-end user flows define success for v1?
- [ ] **I2. Accessibility baseline**: What accessibility standard is required?
- [ ] **I3. Observability baseline**: What logs, metrics, traces, or client diagnostics are required before release?
- [ ] **I4. Reliability expectations**: What failure modes are unacceptable?
- [ ] **I5. Release and rollback**: How will releases be validated and rolled back if needed?

---

## J. Evolution & Extensibility

- [ ] **J1. Future capabilities**: Which likely future features must be anticipated now?
- [ ] **J2. Growth boundaries**: Which future requirements should not distort v1 architecture prematurely?
- [ ] **J3. Data model evolution**: Which backend concepts are likely to expand and need UI flexibility?
- [ ] **J4. Collaboration model**: Is single-user operation enough for now, or should multi-user behavior be anticipated?
- [ ] **J5. Migration strategy**: If the first stack choice becomes wrong, what should make replacement easier?

---

## Decision Tracking

Once decisions are made, capture significant architectural choices as ADRs in `.github/project/evolution/adr/`.
Capture functional requirements as `REQ-FR-*`, quality requirements as `REQ-QR-*`, operational requirements as `REQ-OR-*`, and constraints as `REQ-CR-*` in `.github/project/evolution/requirements/`.
