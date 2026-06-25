/**
 * Read-side authorization helper for schema 8.1.0 (BI-260061 / ADR-260059 / REQ-FR-260069).
 *
 * Maps the caller's EFFECTIVE access level on an atom (`AtomOutput.accessLevel`) to the affordances the
 * backend will actually accept, so the UI never offers an action the server would reject:
 *   - `change` (edit / bond-create) requires Editor-or-higher access
 *   - `destroy` (delete) is owner-only
 * (see `docs/user-guide.md` §Access, Ownership & Sharing).
 *
 * A missing/unknown level defaults to the most restrictive (read-only) per REQ-FR-260069 scenario 4.
 * This is the single gating module; features consume it rather than branching on the raw level.
 */
import type { EffectiveAccessLevel } from './graph-queries'

export interface AtomPermissions {
  /** May edit the atom (`change` update — Editor-or-higher). */
  canEdit: boolean
  /** May delete the atom (`destroy` — owner-only). */
  canDelete: boolean
  /** May create/remove a bond from this atom as the source (a `change` — Editor-or-higher). */
  canBond: boolean
}

const READ_ONLY: AtomPermissions = { canEdit: false, canDelete: false, canBond: false }

export function atomPermissions(level: EffectiveAccessLevel | null | undefined): AtomPermissions {
  switch (level) {
    case 'OWNER':
      return { canEdit: true, canDelete: true, canBond: true }
    case 'EDITOR':
      return { canEdit: true, canDelete: false, canBond: true }
    default:
      // VIEWER, null, undefined, or any unrecognized level → most restrictive.
      return READ_ONLY
  }
}
