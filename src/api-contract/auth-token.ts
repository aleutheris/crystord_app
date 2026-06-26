const AUTH_TOKEN_KEY = 'crystord-auth-token'

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

// Seeded synchronously at module load from any persisted session, so the Apollo auth link can attach
// the token to the very first authenticated request after a page reload — before any React effect
// runs. `signIn`/`signOut` keep this in sync thereafter (they call setAuthToken synchronously).
let currentToken: string | null = readStoredToken()

export function getAuthToken(): string | null {
  return currentToken
}

export function setAuthToken(token: string | null): void {
  currentToken = token
}

export function persistToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // localStorage unavailable
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // localStorage unavailable
  }
}
