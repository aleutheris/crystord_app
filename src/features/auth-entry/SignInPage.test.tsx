import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { AuthProvider } from './AuthProvider'
import { SignInPage } from './SignInPage'
import type { SignInResponse } from '../../api-contract/sign-in-query'
import type { SignUpResponse } from '../../api-contract/auth-queries'

function createMockClient(response: { data?: SignInResponse | SignUpResponse; error?: Error }) {
  const client = new ApolloClient({
    link: new HttpLink({ uri: 'http://test/graphql' }),
    cache: new InMemoryCache(),
  })
  if (response.error) {
    vi.spyOn(client, 'query').mockRejectedValue(response.error)
  } else {
    vi.spyOn(client, 'query').mockResolvedValue({
      data: response.data,
    } as Awaited<ReturnType<typeof client.query>>)
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
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /sign in/i }))

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

  it('switches to sign-up mode when clicking the sign-up link', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
  })

  it('sign-up email field is type="email" to enforce email format', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signup: 'token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email')
  })

  it('calls sign-up query in sign-up mode on success', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signup: 'signup-token' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'newpass')
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))

    expect(client.query).toHaveBeenCalledOnce()
  })

  it('does not render GoogleSignInButton when googleClientId is not provided', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })
})
