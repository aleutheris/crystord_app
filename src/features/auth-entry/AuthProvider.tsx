import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

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
