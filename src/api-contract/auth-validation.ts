/**
 * Client-side username & password validation mirroring the schema-8.1.0 server rules
 * (REQ-CR-260023). Each function returns a user-facing error message, or `null` when valid.
 *
 * The server remains authoritative — callers must still surface `USER-INVALID-USERNAME` /
 * `PASSWORD-*` from the response via `mapAuthError`. These checks exist to give immediate inline
 * feedback and avoid round-trips. Reused by sign-up, set-password, and password reset.
 */

const USERNAME_MIN = 3
const USERNAME_MAX = 30
const PASSWORD_MIN = 12
const PASSWORD_MAX_BYTES = 72
const RESERVED_USERNAMES = ['admin', 'support', 'api', 'me', 'root', 'system']

/** Validate a username; returns an error message or null. */
export function validateUsername(value: string): string | null {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  }
  if (!/^[A-Za-z]/.test(value)) {
    return 'Username must start with a letter.'
  }
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    return 'Use only letters, digits, and . _ -'
  }
  if (/[._-]$/.test(value)) {
    return 'Username cannot end with . _ or -'
  }
  if (/[._-]{2}/.test(value)) {
    return 'Username cannot contain consecutive . _ or -'
  }
  if (RESERVED_USERNAMES.includes(value.toLowerCase())) {
    return 'That username is reserved. Choose another.'
  }
  return null
}

/** Validate a password; returns an error message or null. (Common-password is server-side only.) */
export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
    return 'Password is too long.'
  }
  return null
}
