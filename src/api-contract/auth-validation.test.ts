import { describe, it, expect } from 'vitest'
import { validateUsername, validatePassword } from './auth-validation'

describe('validateUsername', () => {
  it('accepts a valid username', () => {
    expect(validateUsername('demo.user')).toBeNull()
    expect(validateUsername('abc')).toBeNull()
    expect(validateUsername('a1_b-c')).toBeNull()
  })

  it('rejects too-short and too-long usernames', () => {
    expect(validateUsername('ab')).toMatch(/3–30 characters/)
    expect(validateUsername('a'.repeat(31))).toMatch(/3–30 characters/)
  })

  it('requires it to start with a letter', () => {
    expect(validateUsername('1abc')).toMatch(/start with a letter/)
    expect(validateUsername('_abc')).toMatch(/start with a letter/)
  })

  it('rejects disallowed characters', () => {
    expect(validateUsername('ab cd')).toMatch(/only letters, digits/)
    expect(validateUsername('ab@cd')).toMatch(/only letters, digits/)
  })

  it('rejects a trailing separator', () => {
    expect(validateUsername('abc-')).toMatch(/cannot end with/)
    expect(validateUsername('abc.')).toMatch(/cannot end with/)
  })

  it('rejects consecutive separators', () => {
    expect(validateUsername('a--b')).toMatch(/consecutive/)
    expect(validateUsername('a._b')).toMatch(/consecutive/)
  })

  it('rejects reserved usernames (case-insensitive)', () => {
    expect(validateUsername('admin')).toMatch(/reserved/)
    expect(validateUsername('api')).toMatch(/reserved/)
    expect(validateUsername('System')).toMatch(/reserved/)
  })
})

describe('validatePassword', () => {
  it('accepts a password of at least 12 characters', () => {
    expect(validatePassword('correct horse battery')).toBeNull()
    expect(validatePassword('a'.repeat(12))).toBeNull()
  })

  it('rejects a password shorter than 12 characters', () => {
    expect(validatePassword('short')).toMatch(/at least 12/)
    expect(validatePassword('a'.repeat(11))).toMatch(/at least 12/)
  })

  it('rejects a password longer than 72 bytes', () => {
    expect(validatePassword('a'.repeat(73))).toMatch(/too long/)
  })

  it('counts bytes, not characters, for the max length', () => {
    // 25 multi-byte chars (4 bytes each = 100 bytes) exceeds 72 even though length < 72.
    expect(validatePassword('😀'.repeat(25))).toMatch(/too long/)
  })
})
