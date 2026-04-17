import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { AuthProvider } from './AuthProvider'
import { SignInPage } from './SignInPage'
import type { SignInResponse } from '../../api-contract/sign-in-query'

function createMockClient(response: { data?: SignInResponse; error?: Error }) {
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

function renderSignIn(client: ApolloClient) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignInPage client={client} />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('SignInPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders sign-in form with pre-filled demo credentials', () => {
    const client = createMockClient({ data: { signin: 'token' } })
    renderSignIn(client)

    expect(screen.getByLabelText(/email/i)).toHaveValue('demo')
    expect(screen.getByLabelText(/password/i)).toHaveValue('demo')
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls sign-in and updates auth on success', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ data: { signin: 'test-token-123' } })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(client.query).toHaveBeenCalledOnce()
  })

  it('shows error on sign-in failure', async () => {
    const user = userEvent.setup()
    const client = createMockClient({ error: new Error('Invalid credentials') })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('shows error when no token returned', async () => {
    const user = userEvent.setup()
    const client = createMockClient({
      data: { signin: '' },
    })
    renderSignIn(client)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('no token returned')
  })
})
