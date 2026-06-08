import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'
import { triggerSessionExpired } from '../../api-contract/session-expired'

function TestConsumer() {
  const { isAuthenticated, signIn, signOut, token } = useAuth()
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'authed' : 'anon'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => signIn('test-token')}>sign in</button>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated when localStorage is empty', () => {
    renderProvider()
    expect(screen.getByTestId('auth')).toHaveTextContent('anon')
    expect(screen.getByTestId('token')).toHaveTextContent('none')
  })

  it('restores token from localStorage on mount', () => {
    localStorage.setItem('crystord-auth-token', 'stored-token')
    renderProvider()
    expect(screen.getByTestId('auth')).toHaveTextContent('authed')
    expect(screen.getByTestId('token')).toHaveTextContent('stored-token')
  })

  it('signIn sets isAuthenticated and persists token to localStorage', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByTestId('auth')).toHaveTextContent('authed')
    expect(localStorage.getItem('crystord-auth-token')).toBe('test-token')
  })

  it('signOut clears isAuthenticated and removes token from localStorage', async () => {
    const user = userEvent.setup()
    localStorage.setItem('crystord-auth-token', 'stored-token')
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByTestId('auth')).toHaveTextContent('anon')
    expect(localStorage.getItem('crystord-auth-token')).toBeNull()
  })

  it('triggerSessionExpired calls signOut and clears auth state', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByTestId('auth')).toHaveTextContent('authed')

    act(() => { triggerSessionExpired() })

    expect(screen.getByTestId('auth')).toHaveTextContent('anon')
    expect(localStorage.getItem('crystord-auth-token')).toBeNull()
  })

  it('useAuth throws when used outside AuthProvider', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider')
    err.mockRestore()
  })
})
