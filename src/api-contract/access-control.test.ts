import { describe, it, expect } from 'vitest'
import { atomPermissions } from './access-control'

describe('atomPermissions', () => {
  it('OWNER may edit, delete, and bond', () => {
    expect(atomPermissions('OWNER')).toEqual({ canEdit: true, canDelete: true, canBond: true })
  })

  it('EDITOR may edit and bond but not delete (destroy is owner-only)', () => {
    expect(atomPermissions('EDITOR')).toEqual({ canEdit: true, canDelete: false, canBond: true })
  })

  it('VIEWER is read-only', () => {
    expect(atomPermissions('VIEWER')).toEqual({ canEdit: false, canDelete: false, canBond: false })
  })

  it('defaults a missing level (null/undefined) to read-only', () => {
    expect(atomPermissions(null)).toEqual({ canEdit: false, canDelete: false, canBond: false })
    expect(atomPermissions(undefined)).toEqual({ canEdit: false, canDelete: false, canBond: false })
  })
})
