import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { setAuthToken } from '../../api-contract/auth-token'
import { readStoredToken, persistToken, clearStoredToken } from '../../api-contract/auth-token'
import { onSessionExpired } from '../../api-contract/session-expired'
import { useUrlTokenHandoff } from './use-url-token-handoff'

interface AuthState {
  token: string | null
  signIn: (token: string, demo?: boolean) => void
  signOut: () => void
  isAuthenticated: boolean
  isDemoSession: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [isDemoSession, setIsDemoSession] = useState(false)

  const signIn = useCallback((newToken: string, demo = false) => {
    if (!demo) persistToken(newToken)
    // Write the token the Apollo auth link reads SYNCHRONOUSLY, before the state update mounts any
    // authenticated view. Otherwise WorkspaceShell's first queries can fire before this lands, go out
    // without an Authorization header, and trigger a spurious re-auth bounce back to sign-in.
    setAuthToken(newToken)
    setIsDemoSession(demo)
    setToken(newToken)
  }, [])

  const signOut = useCallback(() => {
    clearStoredToken()
    setAuthToken(null)
    setIsDemoSession(false)
    setToken(null)
  }, [])

  useEffect(() => {
    onSessionExpired(signOut)
  }, [signOut])

  useUrlTokenHandoff(signIn)

  const value = useMemo<AuthState>(() => ({
    token,
    signIn,
    signOut,
    isAuthenticated: token !== null,
    isDemoSession,
  }), [token, signIn, signOut, isDemoSession])

  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
