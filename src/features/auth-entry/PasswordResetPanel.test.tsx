import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApolloClient } from '@apollo/client'
import { PasswordResetPanel } from './PasswordResetPanel'

const VALID_PASSWORD = 'correct horse battery'

function makeClient(mutate: ReturnType<typeof vi.fn>): ApolloClient {
  return { mutate } as unknown as ApolloClient
}

function setup(mutate: ReturnType<typeof vi.fn>, onComplete = vi.fn(), onBack = vi.fn()) {
  const user = userEvent.setup({ delay: null })
  render(<PasswordResetPanel client={makeClient(mutate)} onComplete={onComplete} onBack={onBack} />)
  return { user, onComplete, onBack }
}

async function reachConfirmStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
  await user.click(screen.getByRole('button', { name: /send reset code/i }))
  await screen.findByLabelText(/reset code/i)
}

describe('PasswordResetPanel', () => {
  it('renders the request step first with anti-enumeration copy', () => {
    setup(vi.fn())
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email')
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
    expect(screen.getByText(/if that address is registered/i)).toBeInTheDocument()
  })

  it('"Back to sign in" calls onBack', async () => {
    const { user, onBack } = setup(vi.fn())
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('shows a form-level alert when the reset request is rate-limited', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { user } = setup(mutate)
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /send reset code/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i)
  })

  it('requests a reset and advances to the confirm step', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { requestPasswordReset: true } })
    const { user } = setup(mutate)
    await reachConfirmStep(user)

    expect(mutate).toHaveBeenCalledOnce()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByText(/enter the reset code from your email/i)).toBeInTheDocument()
  })

  it('shows an inline error for a weak new password without calling confirm', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { requestPasswordReset: true } })
    const { user } = setup(mutate)
    await reachConfirmStep(user)
    await user.type(screen.getByLabelText(/reset code/i), '123456')
    await user.type(screen.getByLabelText(/new password/i), 'short')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument()
    expect(mutate).toHaveBeenCalledOnce() // only the request ran
  })

  it('completes the reset and calls onComplete on success', async () => {
    const mutate = vi.fn()
      .mockResolvedValueOnce({ data: { requestPasswordReset: true } })
      .mockResolvedValueOnce({ data: { confirmPasswordReset: true } })
    const { user, onComplete } = setup(mutate)
    await reachConfirmStep(user)
    await user.type(screen.getByLabelText(/reset code/i), '123456')
    await user.type(screen.getByLabelText(/new password/i), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
  })

  it('shows a form-level alert for an invalid/expired token', async () => {
    const mutate = vi.fn()
      .mockResolvedValueOnce({ data: { requestPasswordReset: true } })
      .mockRejectedValueOnce(new Error('RESET-INVALID-OR-EXPIRED-TOKEN'))
    const { user } = setup(mutate)
    await reachConfirmStep(user)
    await user.type(screen.getByLabelText(/reset code/i), '000000')
    await user.type(screen.getByLabelText(/new password/i), VALID_PASSWORD)
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i)
  })

  it('returns to the request step via the back action', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { requestPasswordReset: true } })
    const { user } = setup(mutate)
    await reachConfirmStep(user)
    await user.click(screen.getByRole('button', { name: /use a different email/i }))

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/reset code/i)).not.toBeInTheDocument()
  })
})
