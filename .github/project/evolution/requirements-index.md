# Requirements Index

Canonical index of all Crystord Web requirements.

Status lifecycle used here: Accepted | Deprecated | Removed.
When a requirement is deprecated, keep its row in this file and set `Status` to `Deprecated` instead of deleting it.

| Requirement ID | Title | Class | Status | Related ADRs | Related BIs |
| --- | --- | --- | --- | --- | --- |
| REQ-FR-260001 | Graph-First Control Surface for Backend-Supported Operations | FR | Accepted | ADR-260001 | BI-260001 |
| REQ-FR-260002 | Primary User Focus on Data Transparency and Relationship Understanding | FR | Accepted | ADR-260001 | BI-260001 |
| REQ-FR-260003 | Core Atom and Bond Manipulation in Graph Workspace | FR | Accepted | ADR-260002 | BI-260002 |
| REQ-FR-260004 | Label Search and Graph Inspection Experience | FR | Accepted | ADR-260002 | BI-260002 |
| REQ-FR-260005 | Backend Contract for Essential Atom and Bond Operations | FR | Accepted | ADR-260003 | BI-260003 |
| REQ-FR-260006 | Read-Only Label Querying and Metadata Inspection | FR | Accepted | ADR-260003 | BI-260003 |
| REQ-FR-260007 | Graph-First Interaction with Search Bootstrap | FR | Deprecated | ADR-260014 | BI-260011, BI-260020 |
| REQ-FR-260008 | Full Workspace Navigation and Side-Panel Editing | FR | Accepted | ADR-260014 | BI-260011 |
| REQ-FR-260009 | Canvas Visualization Modes and In-Workspace View Switching | FR | Accepted | ADR-260015 | BI-260012 |
| REQ-FR-260010 | Direct-Manipulation Primitives and Canvas-First Creation | FR | Accepted | ADR-260015 | BI-260012 |
| REQ-FR-260011 | MVP Search Controls and Query Transparency | FR | Accepted | ADR-260016 | BI-260013 |
| REQ-FR-260012 | Combined Graph and Side-Panel Search Result Presentation | FR | Accepted | ADR-260016 | BI-260013 |
| REQ-FR-260013 | MVP Top-Level Areas and Shell Routing Structure | FR | Accepted | ADR-260017 | BI-260014 |
| REQ-FR-260014 | Feature-Bounded Modules and Content Ownership Model | FR | Accepted | ADR-260017 | BI-260014 |
| REQ-FR-260015 | Feature-Sliced Frontend Architecture and Rendering Model | FR | Accepted | ADR-260018 | BI-260015 |
| REQ-FR-260016 | State Partitioning and Dependency-Boundary Enforcement | FR | Accepted | ADR-260018 | BI-260015 |
| REQ-FR-260017 | MVP Framework, Routing, and Runtime Stack Baseline | FR | Accepted | ADR-260019 | BI-260016 |
| REQ-FR-260018 | MVP Graph UI/Data/Test Stack Integration Baseline | FR | Accepted | ADR-260019 | BI-260016 |
| REQ-FR-260019 | MVP Critical End-to-End Acceptance Flows | FR | Accepted | ADR-260020 | BI-260017 |
| REQ-FR-260020 | Extensibility Seams for Anticipated Post-MVP Capabilities | FR | Accepted | ADR-260021 | BI-260018 |
| REQ-FR-260021 | Adapter-Based Resilience for Data Model Evolution | FR | Accepted | ADR-260021 | BI-260018 |
| REQ-FR-260022 | Blank-First Workspace Entry with Explicit Search Activation | FR | Accepted | ADR-260023 | BI-260020 |
| REQ-FR-260023 | Pre-Search Visibility of Recommended Labels | FR | Accepted | ADR-260016 | BI-260021 |
| REQ-FR-260024 | Search Execution on Enter Key | FR | Accepted | ADR-260023 | BI-260023 |
| REQ-FR-260025 | Multi-Label Chip Input with Space/Colon Delimiters | FR | Accepted | ADR-260023 | BI-260023 |
| REQ-FR-260026 | Fresh Backend-Executed Search Results on Submit | FR | Accepted | ADR-260016, ADR-260023 | BI-260024 |
| REQ-FR-260027 | No Graph Re-Scoping While Search Input Is Being Edited | FR | Accepted | ADR-260016, ADR-260023 | BI-260025 |
| REQ-FR-260028 | Auto-Chip Incomplete Text on Enter | FR | Accepted | ADR-260027 | BI-260027 |
| REQ-FR-260029 | Always-Fresh Backend Query on Every Search Submission | FR | Accepted | ADR-260027 | BI-260028 |
| REQ-FR-260030 | Dual Graph Views with Network-First Default and Shared Search Dataset | FR | Accepted | ADR-260028 | BI-260029 |
| REQ-FR-260031 | Network View Circle Nodes and Connector-Based Edge Creation | FR | Deprecated | ADR-260029 | BI-260030 |
| REQ-FR-260032 | Dual-View Shared Dataset and Cross-View Selection Consistency | FR | Accepted | ADR-260030 | BI-260031 |
| REQ-FR-260033 | Keyboard and Discoverability Support for Dual Graph Views | FR | Accepted | ADR-260031 | BI-260032 |
| REQ-FR-260034 | Dual-View Validation Coverage Must Include Unit, Integration, and E2E Paths | FR | Accepted | ADR-260032 | BI-260033 |
| REQ-FR-260035 | Network View Bonds Must Anchor at Geometrically Closest Circle Boundary Points | FR | Accepted | ADR-260033, ADR-260029 | BI-260034 |
| REQ-FR-260036 | Network View Bonds Must Show Direction with Arrowheads | FR | Accepted | ADR-260034 | BI-260035 |
| REQ-FR-260037 | Network View Must Apply Topology-Aware Automatic Layout | FR | Accepted | ADR-260035 | BI-260036 |
| REQ-FR-260038 | Network View Outer-Circumference Edge Initiation and Hover Selection Affordance | FR | Accepted | ADR-260036 | BI-260037, BI-260038 |
| REQ-FR-260039 | Network View Connection Drag Preview Must Render as a Straight Line | FR | Accepted | ADR-260037 | BI-260039 |
| REQ-FR-260040 | Network View Magnetic Attach Must Activate Only on Target Atom Hit Area | FR | Accepted | ADR-260038 | BI-260040 |
| REQ-FR-260041 | Network View Drag-Time Target Snap Must Use Nearest-Boundary Geometry | FR | Accepted | ADR-260038, ADR-260033 | BI-260041 |
| REQ-FR-260042 | Network View Selected-State Must Not Force Outer Initiation Ring Visibility | FR | Accepted | ADR-260038 | BI-260041 |
| REQ-FR-260043 | Bond-Name Dialog Keyboard Input Must Not Trigger Canvas Deletion Flows | FR | Accepted | ADR-260015, ADR-260031 | BI-260042 |
| REQ-FR-260044 | Flow View Directional Projection and Eligible-Bond Inclusion | FR | Deprecated | ADR-260039, ADR-260040 | BI-260044, BI-260045 |
| REQ-FR-260045 | Flow View Relayout Control and State Preservation | FR | Accepted | ADR-260039 | BI-260044 |
| REQ-FR-260046 | Flow View Edge and Handle Visual Grammar | FR | Accepted | ADR-260039 | BI-260044 |
| REQ-FR-260047 | Flow View Projection Mode Toggle and Non-Flow Atom Inclusion | FR | Accepted | ADR-260040 | BI-260045 |
| REQ-FR-260054 | User Sign-Up with Email and Password | FR | Accepted | ADR-260048 | BI-260048 |
| REQ-FR-260055 | User Sign-In with Email and Password | FR | Accepted | ADR-260048 | BI-260048 |
| REQ-FR-260056 | Google Sign-In Button Must Use Official GIS SDK | FR | Accepted | ADR-260048 | BI-260048 |
| REQ-FR-260057 | User Sign-In with Username or Email | FR | Proposed | ADR-260049 | BI-260049 |
| REQ-FR-260058 | Password-Based Sign-In Form | FR | Proposed | ADR-260049 | BI-260049 |
| REQ-OR-260001 | MVP Demo Sign-In Operating Model | OR | Accepted | ADR-260002, ADR-260014 | BI-260002, BI-260011 |
| REQ-OR-260002 | GraphQL Schema Stability and Versioning Contract | OR | Accepted | ADR-260013 | BI-260010 |
| REQ-OR-260003 | Frontend Contract Stability and Breaking-Change Control | OR | Accepted | ADR-260018 | BI-260015 |
| REQ-OR-260004 | Build, Tooling, and Auth-Evolution Operational Criteria | OR | Accepted | ADR-260019 | BI-260016 |
| REQ-OR-260005 | MVP Observability, Release Gate, and Rollback Operations | OR | Accepted | ADR-260020 | BI-260017 |
| REQ-OR-260006 | Evolution Governance and Change-Budget Discipline | OR | Accepted | ADR-260021 | BI-260018 |
| REQ-OR-260007 | Suggested Label Source Uses Existing list_labels Query (Temporary) | OR | Accepted | ADR-260016 | BI-260022 |
| REQ-OR-260008 | Search Filtering Delegates to Backend GraphQL Without Overfetch | OR | Accepted | ADR-260016, ADR-260023 | BI-260024 |
| REQ-OR-260009 | Bond Mutation Client Contract Must Match the Schema Selector Type | OR | Accepted | ADR-260003, ADR-260015 | BI-260026 |
| REQ-OR-260010 | Dual-View Mutation Reflection Must Be Centralized in Shared Graph State | OR | Accepted | ADR-260030 | BI-260031 |
| REQ-OR-260011 | Dual-View Rollout Must Be Feature-Flag Controlled with Immediate Fallback | OR | Accepted | ADR-260032 | BI-260033 |
| REQ-OR-260012 | Authentication Must Use JWTs Stored in localStorage | OR | Accepted | ADR-260048 | BI-260048 |
| REQ-OR-260013 | Temporary Authentication Compatibility | OR | Proposed | ADR-260049 | BI-260049 |
| REQ-CR-260001 | MVP Scope Exclusions for Graph Experience | CR | Accepted | ADR-260002 | BI-260002 |
| REQ-CR-260002 | Backend Error Handling and Resilience Baseline | CR | Accepted | ADR-260003 | BI-260003 |
| REQ-CR-260003 | Desktop-Only MVP and Minimal Placeholder Policy | CR | Accepted | ADR-260014 | BI-260011 |
| REQ-CR-260004 | MVP Deletion Safety Constraints for Graph Editing | CR | Accepted | ADR-260015 | BI-260012 |
| REQ-CR-260005 | Search Feature Deferral Boundaries | CR | Accepted | ADR-260016 | BI-260013 |
| REQ-CR-260006 | MVP Architecture Scope and Extension Constraints | CR | Accepted | ADR-260017 | BI-260014 |
| REQ-CR-260007 | MVP Frontend Architecture Boundary Constraints | CR | Accepted | ADR-260018 | BI-260015 |
| REQ-CR-260008 | Stack Rejection and Scope Constraints for MVP | CR | Accepted | ADR-260019 | BI-260016 |
| REQ-CR-260009 | MVP Placeholder and Fallback Trust Constraints | CR | Accepted | ADR-260020 | BI-260017 |
| REQ-CR-260010 | MVP Growth Boundary and Migration Safety Constraints | CR | Accepted | ADR-260021 | BI-260018 |
| REQ-CR-260011 | Branding Governance and Semantic Usage Constraint | CR | Accepted | ADR-260022 | BI-260019 |
| REQ-CR-260012 | Suggested Label Display Cap of Three (Temporary) | CR | Accepted | ADR-260016 | BI-260022 |
| REQ-CR-260013 | Autocomplete and Incremental Search Behaviors Are Deferred | CR | Accepted | ADR-260016, ADR-260023 | BI-260025 |
| REQ-CR-260014 | View-Switching Must Not Change Shell and Panel Contracts | CR | Accepted | ADR-260028 | BI-260029 |
| REQ-CR-260015 | Network View Must Use Circle Nodes with Visible Connector Handles | CR | Deprecated | ADR-260029 | BI-260030 |
| REQ-CR-260016 | Dual-View Tabs Must Follow ARIA Tab Pattern with Visible Focus | CR | Accepted | ADR-260031 | BI-260032 |
| REQ-CR-260017 | Network View Ring Visual Semantics Must Use Distinct Tokenized Colors | CR | Accepted | ADR-260037 | BI-260039 |
| REQ-CR-260018 | Atom Keyboard Deletion Must Be Delete-Key Only | CR | Accepted | ADR-260015, ADR-260031 | BI-260042 |
| REQ-QR-260001 | MVP Graph Interaction Performance Baseline | QR | Accepted | ADR-260015 | BI-260012 |
| REQ-QR-260002 | MVP Accessibility and Reliability Quality Baseline | QR | Accepted | ADR-260020 | BI-260017 |
| REQ-QR-260003 | Large-Graph Degrade Policy for Dual-View Rendering | QR | Accepted | ADR-260030 | BI-260031 |
| REQ-QR-260004 | Dual-View Visual States Must Be Contrast-Safe and Non-Color-Only | QR | Accepted | ADR-260031 | BI-260032 |
| REQ-QR-260005 | Dual-View Switch Performance Targets and Large-Render Gate Timing | QR | Accepted | ADR-260032 | BI-260033 |
| REQ-FR-260059 | Credential-Based Sign-Up and Sign-In | FR | Proposed | ADR-260050 | BI-260050 |
| REQ-FR-260060 | Passwordless Google Sign-In | FR | Proposed | ADR-260050 | BI-260050 |
| REQ-FR-260061 | One-Click Demo Mode | FR | Proposed | ADR-260050 | BI-260050 |
| REQ-OR-260014 | Authentication Backend Contract | OR | Proposed | ADR-260050 | BI-260050 |
| REQ-CR-260020 | Unified Authentication UI | CR | Proposed | ADR-260050 | BI-260050 |
| REQ-QR-260007 | Authentication Security and Reliability | QR | Proposed | ADR-260050 | BI-260050 |
