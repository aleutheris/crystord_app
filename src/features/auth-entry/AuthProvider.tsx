import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { setAuthToken } from '../../api-contract/auth-token'

interface AuthState {
  token: string | null
  signIn: (token: string) => void
  signOut: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  const signIn = useCallback((newToken: string) => {
    setToken(newToken)
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
  }, [])

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  const value = useMemo<AuthState>(() => ({
    token,
    signIn,
    signOut,
    isAuthenticated: token !== null,
  }), [token, signIn, signOut])

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
