import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'
import { triggerSessionExpired } from '../../api-contract/session-expired'

function TestConsumer() {
  const { isAuthenticated, signIn, signOut, token, isDemoSession } = useAuth()
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'authed' : 'anon'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="demo">{isDemoSession ? 'demo' : 'real'}</span>
      <button onClick={() => signIn('test-token')}>sign in</button>
      <button onClick={() => signIn('demo-token', true)}>sign in demo</button>
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
    expect(screen.getByTestId('demo')).toHaveTextContent('real')
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

    await user.click(screen.getByRole('button', { name: /^sign in$/ }))

    expect(screen.getByTestId('auth')).toHaveTextContent('authed')
    expect(localStorage.getItem('crystord-auth-token')).toBe('test-token')
    expect(screen.getByTestId('demo')).toHaveTextContent('real')
  })

  it('demo signIn sets isDemoSession=true and does NOT persist token', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign in demo/i }))

    expect(screen.getByTestId('auth')).toHaveTextContent('authed')
    expect(screen.getByTestId('demo')).toHaveTextContent('demo')
    expect(localStorage.getItem('crystord-auth-token')).toBeNull()
  })

  it('signOut clears isAuthenticated and removes token from localStorage', async () => {
    const user = userEvent.setup()
    localStorage.setItem('crystord-auth-token', 'stored-token')
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByTestId('auth')).toHaveTextContent('anon')
    expect(localStorage.getItem('crystord-auth-token')).toBeNull()
  })

  it('signOut resets isDemoSession to false', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: /sign in demo/i }))
    expect(screen.getByTestId('demo')).toHaveTextContent('demo')

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(screen.getByTestId('demo')).toHaveTextContent('real')
  })

  it('triggerSessionExpired calls signOut and clears auth state', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: /^sign in$/ }))
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

  describe('URL token handoff', () => {
    let replaceState: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
    })

    it('signs in automatically when ?token= is present in the URL', async () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?token=platform-token', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
      renderProvider()
      await vi.waitFor(() => {
        expect(screen.getByTestId('auth')).toHaveTextContent('authed')
        expect(screen.getByTestId('token')).toHaveTextContent('platform-token')
      })
    })

    it('persists the URL token to localStorage', async () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?token=platform-token', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
      renderProvider()
      await vi.waitFor(() => {
        expect(localStorage.getItem('crystord-auth-token')).toBe('platform-token')
      })
    })

    it('strips the token param from the URL after consuming it', async () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?token=platform-token', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
      renderProvider()
      await vi.waitFor(() => {
        expect(replaceState).toHaveBeenCalledWith(null, '', '/')
      })
    })

    it('overrides an existing localStorage session with the URL token', async () => {
      localStorage.setItem('crystord-auth-token', 'old-token')
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?token=new-token', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
      renderProvider()
      await vi.waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('new-token')
        expect(localStorage.getItem('crystord-auth-token')).toBe('new-token')
      })
    })

    it('does not sign in or modify URL when no token param is present', () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '', pathname: '/', hash: '' },
        writable: true,
        configurable: true,
      })
      renderProvider()
      expect(screen.getByTestId('auth')).toHaveTextContent('anon')
      expect(replaceState).not.toHaveBeenCalled()
    })
  })
})
