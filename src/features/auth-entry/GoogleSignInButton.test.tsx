import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApolloClient } from '@apollo/client'
import { GoogleSignInButton } from './GoogleSignInButton'

// Stub the shared GIS primitive so we can fire a credential without the SDK.
vi.mock('../../ui-primitives/buttons', () => ({
  GoogleCredentialButton: ({ onCredential }: { onCredential: (t: string) => void }) => (
    <button type="button" onClick={() => onCredential('id-token')}>fire credential</button>
  ),
}))

function makeClient(query: ReturnType<typeof vi.fn>): ApolloClient {
  return { query } as unknown as ApolloClient
}

function renderButton(query: ReturnType<typeof vi.fn>) {
  const onSuccess = vi.fn()
  const onError = vi.fn()
  render(
    <GoogleSignInButton client={makeClient(query)} googleClientId="c" onSuccess={onSuccess} onError={onError} />,
  )
  return { onSuccess, onError }
}

describe('GoogleSignInButton', () => {
  it('exchanges the credential for a session and reports success', async () => {
    const user = userEvent.setup()
    const query = vi.fn().mockResolvedValue({ data: { signinGoogle: 'session-token' } })
    const { onSuccess, onError } = renderButton(query)
    await user.click(screen.getByRole('button', { name: /fire credential/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('session-token'))
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ variables: { idToken: 'id-token' } }))
    expect(onError).not.toHaveBeenCalled()
  })

  it('reports an error when no token is returned', async () => {
    const user = userEvent.setup()
    const { onError } = renderButton(vi.fn().mockResolvedValue({ data: { signinGoogle: null } }))
    await user.click(screen.getByRole('button', { name: /fire credential/i }))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/no token returned/i)))
  })

  it('surfaces a thrown Error message', async () => {
    const user = userEvent.setup()
    const { onError } = renderButton(vi.fn().mockRejectedValue(new Error('rate limited')))
    await user.click(screen.getByRole('button', { name: /fire credential/i }))
    await waitFor(() => expect(onError).toHaveBeenCalledWith('rate limited'))
  })

  it('falls back to a generic message for a non-Error rejection', async () => {
    const user = userEvent.setup()
    const { onError } = renderButton(vi.fn().mockRejectedValue('weird'))
    await user.click(screen.getByRole('button', { name: /fire credential/i }))
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/google sign-in failed/i)))
  })
})
