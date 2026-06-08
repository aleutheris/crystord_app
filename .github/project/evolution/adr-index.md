# ADR Index

Canonical index of all Crystord Web architecture decision records.

Status lifecycle used here: Proposed | Accepted | Superseded.

| ADR ID | Title | Status | Date | Supersedes | Superseded By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-260001 | MVP Product Goal and Primary User Definition | Accepted | 2026-04-13 | - | - | Foundational product-direction decision. |
| ADR-260002 | MVP Boundary and Product Surfaces for Graph Workspace | Accepted | 2026-04-13 | - | - | Defines MVP scope and workspace boundaries. |
| ADR-260003 | Secondary Users and Backend Contract Definition | Accepted | 2026-04-13 | - | - | Defines secondary users and backend contract stance. |
| ADR-260013 | GraphQL Schema Compatibility Handshake and Deprecation Governance | Accepted | 2026-04-13 | - | - | Introduces startup schema compatibility checks. |
| ADR-260014 | User Experience Model for Graph Workspace MVP | Accepted | 2026-04-17 | - | ADR-260023 (C1 only) | Covers entry flow and core workspace UX model. |
| ADR-260015 | Visualization and Interaction Model for Graph Workspace MVP | Accepted | 2026-04-17 | - | - | Defines graph canvas interaction model. |
| ADR-260016 | Search, Query, and Discoverability Model for MVP | Accepted | 2026-04-17 | - | - | Defines hybrid search model and boundaries. |
| ADR-260017 | Information Architecture Baseline for MVP Workspace Application | Accepted | 2026-04-17 | - | - | Defines module/shell ownership boundaries. |
| ADR-260018 | Frontend Architecture Baseline for MVP | Accepted | 2026-04-17 | - | - | Defines frontend architecture constraints. |
| ADR-260019 | Stack Selection Criteria and MVP Concrete Stack | Accepted | 2026-04-17 | - | - | Records stack baseline and rejection rules. |
| ADR-260020 | Delivery and Quality Baseline for MVP | Accepted | 2026-04-17 | - | - | Defines release/quality baseline and gates. |
| ADR-260021 | Evolution and Extensibility Baseline | Accepted | 2026-04-17 | - | - | Defines growth boundaries and evolution seams. |
| ADR-260022 | Branding Governance as a First-Class Constraint | Accepted | 2026-04-17 | - | - | Elevates branding to governance-level constraint. |
| ADR-260023 | Blank-First Workspace Entry Supersedes Bootstrap Search on Load | Accepted | 2026-05-08 | ADR-260014 (C1 only) | - | Replaces implicit preload entry with explicit search activation model. |
| ADR-260027 | Always-Fresh Search Fetching and Auto-Chip on Enter | Accepted | 2026-05-11 | - | - | Guarantees fresh backend fetch on every search and auto-converts incomplete text to chip on Enter. |
| ADR-260028 | Dual Graph View Scope and UX Baseline | Accepted | 2026-05-12 | - | - | Defines Network/Flow view model, Network-first default, shared dataset rendering, and shell-preserving scope boundary. |
| ADR-260029 | Network View Circle Node and Connector Interaction Baseline | Superseded | 2026-05-12 | - | ADR-260036 | Defines circle nodes, visible connector handles, and nearest-edge anchoring for Network view relationships. |
| ADR-260030 | Dual-View Shared State and Large-Graph Degrade Behavior Baseline | Accepted | 2026-05-12 | - | - | Defines shared dataset/selection state, centralized mutation reflection, and large-result degrade thresholds. |
| ADR-260031 | Dual-View Accessibility and Usability Baseline | Accepted | 2026-05-12 | - | - | Defines keyboard navigation, ARIA tab semantics, focus visibility, non-color state cues, and legend/tooltip guidance. |
| ADR-260032 | Dual-View Delivery, Validation, and Rollout Baseline | Accepted | 2026-05-12 | - | - | Defines required test layers, performance targets, and feature-flag rollout/rollback policy. |
| ADR-260033 | Geometric Closest-Point Bond Anchoring for Network View | Accepted | 2026-05-13 | - | - | Refines Network-view bond anchoring to geometric nearest-boundary points and preserves optional label seam. |
| ADR-260034 | Directional Arrowheads for Network-View Bonds | Accepted | 2026-05-13 | - | - | Establishes target-end arrowheads as baseline directional cue and keeps label rendering optional/off-by-default seam. |
| ADR-260035 | Force-Directed Automatic Layout for Network View | Accepted | 2026-05-13 | - | - | Selects d3-force as layout engine, synchronous iteration-capped pre-render, drag-position preservation, and grid fallback above 400 nodes. |
| ADR-260036 | Network View Outer-Circumference Edge Initiation and Selection Affordance | Accepted | 2026-05-13 | ADR-260029 (D2 only) | - | Replaces side connector-dot initiation with full-ring initiation while preserving circle nodes and boundary anchoring semantics. |
| ADR-260037 | Network View Connection Preview and Ring Token Semantics Hardening | Accepted | 2026-05-14 | - | - | Separates non-compliance correction from scope evolution and formalizes straight preview plus tokenized ring semantics. |
| ADR-260038 | Network View Target-Attach Activation and Selected-State Ring Visibility Refinement | Accepted | 2026-05-14 | ADR-260036 (D2 only) | - | Refines attach activation boundary, drag snap geometry expectations, and selected-state ring visibility policy. |
| ADR-260039 | Flow View Directional Projection, Relayout Contract, and Visual Grammar Baseline | Accepted | 2026-05-19 | - | ADR-260040 (D1 only) | Defines Flow-view projection filtering, left-to-right relayout contract, and Flow-specific edge/handle grammar. |
| ADR-260040 | Flow View Projection Mode Toggle and Non-Flow Atom Visibility Refinement | Accepted | 2026-05-19 | ADR-260039 (D1 only) | - | Adds a binary Flow-view projection mode so non-flow atoms can be included for authoring while retaining focused-mode default. |
| ADR-260046 | Explicit Atom Creation via Modal Sidebar | Accepted | 2026-06-05 | - | - | Replaces implicit double-click creation with a dedicated Create Atom button and modal DetailPanel creation mode. |
| ADR-260047 | CSS Custom Property Token System and Dark Mode | Accepted | 2026-06-06 | - | - | Centralizes brand colors as CSS custom properties with light/dark theming, typed JS constants, ThemeProvider context, and ESLint hex-color guard. |
| ADR-260048 | Token-Based Authentication and Session Management | Accepted | 2026-06-08 | - | - | Formalizes JWT auth with email/password, Google Sign-In, localStorage persistence, pub/sub 401 auto-signout, and env-var gateway for Google Client ID. |
| ADR-260049 | Add Username/Password Authentication | Accepted | 2026-06-08 | - | - | Extends sign-in form to accept username or email via type="text" input; sends identifier as email param to backend as temporary compatibility shim. |
| ADR-260049 | Add Username/Password Authentication | Accepted | 2026-06-08 | - | - | Adds username/password authentication to supplement Google Sign-In. |
