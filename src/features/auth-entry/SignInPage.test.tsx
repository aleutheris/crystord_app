import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { AuthProvider } from './AuthProvider'
import { SignInPage } from './SignInPage'
import type { SignInResponse } from '../../api-contract/sign-in-query'

// Stub the GIS-backed button so success and error wiring is testable without the SDK.
vi.mock('./GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onSuccess, onError }: {
    onSuccess: (token: string) => void
    onError: (message: string) => void
  }) => (
    <>
      <button type="button" onClick={() => onSuccess('google-token')}>Mock Google</button>
      <button type="button" onClick={() => onError('GraphQL error: AUTH-GOOGLE-NOT-LINKED')}>
        Fail Google sign-in
      </button>
    </>
  ),
}))

function createMockClient(response: { data?: SignInResponse; error?: Error }) {
  const client = new ApolloClient({
    link: new HttpLink({ uri: 'http://test/graphql' }),
    cache: new InMemoryCache(),
  })
  if (response.error) {
    vi.spyOn(client, 'query').mockRejectedValue(response.error)
    vi.spyOn(client, 'mutate').mockRejectedValue(response.error)
  } else {
    vi.spyOn(client, 'query').mockResolvedValue({
      data: response.data,
    } as Awaited<ReturnType<typeof client.query>>)
    vi.spyOn(client, 'mutate').mockResolvedValue({
      data: response.data,
    } as Awaited<ReturnType<typeof client.mutate>>)
  }
  return client
}

function renderSignIn(
  client: ReturnType<typeof createMockClient>,
  googleClientId?: string,
) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignInPage client={client} googleClientId={googleClientId} />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('SignInPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders sign-in form with "Username or Email" label by default', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByLabelText(/username or email/i)).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('sign-in identifier field is type="text" to accept plain usernames', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByLabelText(/username or email/i)).toHaveAttribute('type', 'text')
  })

  it('calls sign-in query and redirects on success with plain username', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'test-token-123' } })
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'demo')
    await user.type(screen.getByLabelText(/password/i), 'demo')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(client.query).toHaveBeenCalledOnce()
    const firstCall = (client.query as ReturnType<typeof vi.fn>).mock.calls[0] as [{ variables: { email: string } }]
    expect(firstCall[0].variables.email).toBe('demo')
  })

  it('shows error on sign-in failure', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ error: new Error('Invalid credentials') })
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'someuser')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('shows error when no token returned', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: '' } })
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'someuser')
    await user.type(screen.getByLabelText(/password/i), 'anypass')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('no token returned')
  })

  it('switches to sign-up mode when clicking the Sign Up tab', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('switches to sign-up mode when clicking the switch link', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /^sign up$/i }))

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('sign-up email field is type="email" to enforce email format', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email')
  })

  it('sign-up tab shows the verify-first email step (no password field yet)', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('sign-up email step advances to verification via beginSignup', async () => {
    const user = userEvent.setup({ delay: null })
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(client.mutate).toHaveBeenCalledOnce()
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('renders "Try a Demo" button', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByRole('button', { name: /try a demo/i })).toBeInTheDocument()
  })

  it('"Try a Demo" sends hardcoded demo credentials and does not persist token', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'demo-token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(client.query).toHaveBeenCalledOnce()
    const firstCall = (client.query as ReturnType<typeof vi.fn>).mock.calls[0] as [{ variables: { email: string; password: string } }]
    expect(firstCall[0].variables.email).toBe('demo@demo.invalid')
    expect(firstCall[0].variables.password).toBe('crystord-demo')
    expect(localStorage.getItem('crystord-auth-token')).toBeNull()
  })

  it('"Try a Demo" shows error on failure', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ error: new Error('Demo unavailable') })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Demo unavailable')
  })

  it('"Try a Demo" shows error when no token returned', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: '' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Demo sign-in failed')
  })

  it('does not render GoogleSignInButton when googleClientId is not provided', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })

  // ── Layout / ARIA structure (BI-260052 / REQ-CR-260022) ─────────────────────

  it('renders a tablist with Sign In and Sign Up tabs', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^sign up$/i })).toBeInTheDocument()
  })

  it('Sign In tab is selected by default', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByRole('tab', { name: /^sign in$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /^sign up$/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('Sign Up tab becomes selected after switching', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.getByRole('tab', { name: /^sign up$/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /^sign in$/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('renders tabpanel region', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('renders feature highlights in brand panel', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByText('Interactive Graph Workspace')).toBeInTheDocument()
    expect(screen.getByText('Atom and Bond Management')).toBeInTheDocument()
    expect(screen.getByText('Search and Discovery')).toBeInTheDocument()
    expect(screen.getByText('Real-time Data View')).toBeInTheDocument()
  })

  it('renders "No registration required" note in demo panel', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByText(/no registration required/i)).toBeInTheDocument()
  })

  it('clears error when switching tabs', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ error: new Error('Bad credentials') })
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'x')
    await user.type(screen.getByLabelText(/password/i), 'x')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await screen.findByRole('alert')

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows divider with "or sign in with" text in sign-in mode', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByText(/or sign in with/i)).toBeInTheDocument()
  })

  it('shows divider with "or sign up with" text in sign-up mode', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))

    expect(screen.getByText(/or sign up with/i)).toBeInTheDocument()
  })

  it('switches back to sign-in mode from switch link in sign-up mode', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('returns to sign-in by clicking the Sign In tab', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))
    await user.click(screen.getByRole('tab', { name: /^sign in$/i }))

    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  })

  it('completes verify-first sign-up through the page and persists the session token', async () => {
    const user = userEvent.setup({ delay: null })
    const client = createMockClient({ data: { signin: 'token' } })
    const mutate = client.mutate as unknown as ReturnType<typeof vi.fn>
    mutate.mockReset()
    mutate
      .mockResolvedValueOnce({ data: { beginSignup: true } })
      .mockResolvedValueOnce({ data: { completeSignup: 'signup-session-token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.type(await screen.findByLabelText(/verification code/i), '123456')
    await user.type(screen.getByLabelText(/^username$/i), 'demo.user')
    await user.type(screen.getByLabelText(/^password$/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(localStorage.getItem('crystord-auth-token')).toBe('signup-session-token'),
    )
  })

  it('shows the fallback message when sign-in rejects with a non-Error', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    ;(client.query as unknown as ReturnType<typeof vi.fn>).mockReset().mockRejectedValue('weird')
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'x')
    await user.type(screen.getByLabelText(/password/i), 'y')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/authentication failed/i)
  })

  it('shows the fallback message when demo sign-in rejects with a non-Error', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    ;(client.query as unknown as ReturnType<typeof vi.fn>).mockReset().mockRejectedValue('weird')
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/demo sign-in failed/i)
  })

  it('Google sign-in success persists the session token', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client, 'google-client-id')

    await user.click(screen.getByRole('button', { name: /mock google/i }))

    await waitFor(() =>
      expect(localStorage.getItem('crystord-auth-token')).toBe('google-token'),
    )
  })

  it('maps AUTH-GOOGLE-NOT-LINKED to the link-in-settings recovery message', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client, 'google-client-id')

    await user.click(screen.getByRole('button', { name: /fail google sign-in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/link google in settings/i)
  })

  it('rate-limited sign-in shows the generic back-off message and disables submit', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ error: new Error('GraphQL error: AUTH-RATE-LIMITED') })
    renderSignIn(client)

    await user.type(screen.getByLabelText(/username or email/i), 'x')
    await user.type(screen.getByLabelText(/password/i), 'y')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i)
    // During the back-off the submit is disabled and shows a countdown instead of "Sign In".
    expect(screen.getByRole('button', { name: /try again in \d+s/i })).toBeDisabled()
  })

  it('"Forgot password?" opens the reset view', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /forgot password/i }))

    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
  })

  it('reset view "Back to sign in" returns to the sign-in form', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))

    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  })

  it('completing a reset returns to sign-in with a success notice', async () => {
    const user = userEvent.setup({ delay: null })
    const client = createMockClient({ data: { signin: 'token' } })
    const mutate = client.mutate as unknown as ReturnType<typeof vi.fn>
    mutate.mockReset()
    mutate
      .mockResolvedValueOnce({ data: { requestPasswordReset: true } })
      .mockResolvedValueOnce({ data: { confirmPasswordReset: true } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /send reset code/i }))
    await user.type(await screen.findByLabelText(/reset code/i), '123456')
    await user.type(screen.getByLabelText(/new password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/your password was reset/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument()
  })
})

describe('SignInPage — WAI-ARIA tab pattern (BI-260063 / REQ-QR-260002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  function render_() {
    return renderSignIn(createMockClient({ data: { signin: 'token' } }))
  }

  it('wires aria-controls and aria-labelledby between tabs and the panel', () => {
    render_()
    const signIn = screen.getByRole('tab', { name: /^sign in$/i })
    const signUp = screen.getByRole('tab', { name: /^sign up$/i })
    expect(signIn).toHaveAttribute('id', 'auth-tab-signin')
    expect(signIn).toHaveAttribute('aria-controls', 'auth-tabpanel')
    expect(signUp).toHaveAttribute('aria-controls', 'auth-tabpanel')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('id', 'auth-tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'auth-tab-signin')
  })

  it('uses roving tabindex (selected 0, others -1)', () => {
    render_()
    expect(screen.getByRole('tab', { name: /^sign in$/i })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: /^sign up$/i })).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowRight moves selection and focus to the next tab and relabels the panel', async () => {
    const user = userEvent.setup()
    render_()
    screen.getByRole('tab', { name: /^sign in$/i }).focus()
    await user.keyboard('{ArrowRight}')

    const signUp = screen.getByRole('tab', { name: /^sign up$/i })
    expect(signUp).toHaveAttribute('aria-selected', 'true')
    expect(signUp).toHaveFocus()
    expect(signUp).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: /^sign in$/i })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'auth-tab-signup')
  })

  it('ArrowLeft also moves between the two tabs (wrapping)', async () => {
    const user = userEvent.setup()
    render_()
    screen.getByRole('tab', { name: /^sign in$/i }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: /^sign up$/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowRight from the last tab wraps back to the first', async () => {
    const user = userEvent.setup()
    render_()
    await user.click(screen.getByRole('tab', { name: /^sign up$/i }))
    screen.getByRole('tab', { name: /^sign up$/i }).focus()
    await user.keyboard('{ArrowRight}')
    const signIn = screen.getByRole('tab', { name: /^sign in$/i })
    expect(signIn).toHaveAttribute('aria-selected', 'true')
    expect(signIn).toHaveFocus()
  })

  it('ignores non-arrow keys on the tablist', async () => {
    const user = userEvent.setup()
    render_()
    const signIn = screen.getByRole('tab', { name: /^sign in$/i })
    signIn.focus()
    await user.keyboard('a')
    expect(signIn).toHaveAttribute('aria-selected', 'true')
  })
})
