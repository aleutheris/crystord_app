# Deprecation Log

Track planned and active GraphQL deprecations with migration guidance and sunset timelines.

## Entry Template

- Date announced: <yyyy-mm-dd>
- Target removal release: <release>
- Schema element: <type.field | argument>
- Deprecation marker: <@deprecated reason>
- Migration path: <replacement field/approach>
- ICR reference: <id or n/a>
- Release note reference: <link or path>
- Status: Announced | Migrating | Removed

## Current Entries

- Date announced: 2026-06-23
- Target removal release: Schema 8.1.0 (already removed in the deployed backend)
- Schema element: `Mutation.signup(email, password)`
- Deprecation marker: removed — replaced by verify-first sign-up
- Migration path: `beginSignup(email)` → `completeSignup(email, code, password, username)`
- ICR reference: ICR-260001
- Release note reference: `crystord_api/docs/frontend-migration-notes.TEMP.md` §1; ADR-260055; BI-260055
- Status: Removed

> Note: 8.1.0 also removes the Facet/Category taxonomy ops and changes sharing to username/workspace
> keys. Those are out of scope for the Auth & Authz epic and will be logged with their own epics/ICRs.
