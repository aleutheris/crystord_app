import { describe, it, expect } from 'vitest'
import { checkSchemaCompatibility } from './schema-compatibility'
import type { SchemaInfo } from './schema-info-query'

function makeSchemaInfo(overrides: Partial<SchemaInfo> = {}): SchemaInfo {
  return {
    schemaVersion: '1.2.0',
    schemaHash: 'abc123',
    releasedAt: '2026-04-13T00:00:00Z',
    ...overrides,
  }
}

describe('checkSchemaCompatibility', () => {
  it('returns compatible for version within range', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '1.5.0' }), '^1.0.0')
    expect(result.compatible).toBe(true)
    expect(result.schemaVersion).toBe('1.5.0')
  })

  it('returns compatible for exact lower bound', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '1.0.0' }), '^1.0.0')
    expect(result.compatible).toBe(true)
  })

  it('returns incompatible for version above range', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '2.0.0' }), '^1.0.0')
    expect(result.compatible).toBe(false)
    expect(result.message).toContain('outside supported range')
  })

  it('returns incompatible for version below range', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '0.9.0' }), '^1.0.0')
    expect(result.compatible).toBe(false)
    expect(result.message).toContain('outside supported range')
  })

  it('returns incompatible for invalid version string', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: 'not-semver' }), '^1.0.0')
    expect(result.compatible).toBe(false)
    expect(result.message).toContain('invalid schema version')
  })

  it('includes version and range in result', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '1.3.0' }), '>=1.0.0 <2.0.0')
    expect(result.schemaVersion).toBe('1.3.0')
    expect(result.supportedRange).toBe('>=1.0.0 <2.0.0')
  })

  it('handles patch versions within range', () => {
    const result = checkSchemaCompatibility(makeSchemaInfo({ schemaVersion: '1.0.1' }), '^1.0.0')
    expect(result.compatible).toBe(true)
  })
})
