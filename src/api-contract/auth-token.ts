const AUTH_TOKEN_KEY = 'crystord-auth-token'

let currentToken: string | null = null

export function getAuthToken(): string | null {
  return currentToken
}

export function setAuthToken(token: string | null): void {
  currentToken = token
}

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
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
