import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthProvider, useAuth } from './AuthProvider'
import { AuthGuard } from './AuthGuard'
import { useEffect } from 'react'

function ForceSignIn({ children }: { children: React.ReactNode }) {
  const { signIn, isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isAuthenticated) {
      signIn('test-token')
    }
  }, [signIn, isAuthenticated])

  if (!isAuthenticated) return null
  return <>{children}</>
}

describe('AuthGuard', () => {
  it('redirects to sign-in when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/sign-in" element={<p>Sign-in page</p>} />
            <Route element={<AuthGuard />}>
              <Route path="/" element={<p>Workspace</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Sign-in page')).toBeInTheDocument()
  })

  it('renders child route when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ForceSignIn>
            <Routes>
              <Route path="/sign-in" element={<p>Sign-in page</p>} />
              <Route element={<AuthGuard />}>
                <Route path="/" element={<p>Workspace</p>} />
              </Route>
            </Routes>
          </ForceSignIn>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Workspace')).toBeInTheDocument()
  })
})
