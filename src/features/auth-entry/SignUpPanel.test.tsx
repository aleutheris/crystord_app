import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApolloClient } from '@apollo/client'
import { SignUpPanel } from './SignUpPanel'
import { RESEND_COOLDOWN_SECONDS } from './use-sign-up'

const VALID_USERNAME = 'demo.user'
const VALID_PASSWORD = 'correct horse battery'

function makeClient(mutate: ReturnType<typeof vi.fn>): ApolloClient {
  return { mutate } as unknown as ApolloClient
}

function setup(mutate: ReturnType<typeof vi.fn>, onSuccess = vi.fn()) {
  const user = userEvent.setup({ delay: null })
  render(<SignUpPanel client={makeClient(mutate)} onSuccess={onSuccess} />)
  return { user, onSuccess }
}

async function reachVerifyStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
  await user.click(screen.getByRole('button', { name: /continue/i }))
  await screen.findByLabelText(/verification code/i)
}

async function fillVerify(user: ReturnType<typeof userEvent.setup>, username = VALID_USERNAME) {
  await user.type(screen.getByLabelText(/verification code/i), '123456')
  await user.type(screen.getByLabelText(/^username$/i), username)
  await user.type(screen.getByLabelText(/^password$/i), VALID_PASSWORD)
}

describe('SignUpPanel', () => {
  it('renders the email step first', () => {
    setup(vi.fn())
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email')
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('calls beginSignup and advances to the verify step', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { user } = setup(mutate)
    await reachVerifyStep(user)

    expect(mutate).toHaveBeenCalledOnce()
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    // Anti-enumeration copy (REQ-CR-260024)
    expect(screen.getByText(/if that email can be registered/i)).toBeInTheDocument()
    // Resend starts on cooldown
    expect(screen.getByRole('button', { name: /resend code in \d+s/i })).toBeDisabled()
  })

  it('shows an inline field error for an invalid username without calling completeSignup', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { user } = setup(mutate)
    await reachVerifyStep(user)
    await fillVerify(user, 'ab') // too short
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText(/3–30 characters/i)).toBeInTheDocument()
    expect(mutate).toHaveBeenCalledOnce() // only beginSignup ran
  })

  it('completes sign-up and reports the token on success', async () => {
    const mutate = vi.fn()
      .mockResolvedValueOnce({ data: { beginSignup: true } })
      .mockResolvedValueOnce({ data: { completeSignup: 'tok-abc' } })
    const { user, onSuccess } = setup(mutate)
    await reachVerifyStep(user)
    await fillVerify(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('tok-abc'))
  })

  it('shows a form-level alert on the email step when beginSignup is rate-limited', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('AUTH-RATE-LIMITED'))
    const { user } = setup(mutate)
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i)
  })

  it('shows a form-level alert for an invalid/expired code', async () => {
    const mutate = vi.fn()
      .mockResolvedValueOnce({ data: { beginSignup: true } })
      .mockRejectedValueOnce(new Error('SIGNUP-INVALID-OR-EXPIRED-CODE'))
    const { user } = setup(mutate)
    await reachVerifyStep(user)
    await fillVerify(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i)
  })

  it('allows resending the code once the cooldown elapses', async () => {
    // fireEvent (synchronous, no timer binding) keeps this deterministic under fake timers.
    vi.useFakeTimers()
    try {
      const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
      render(<SignUpPanel client={makeClient(mutate)} onSuccess={vi.fn()} />)
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'new@example.com' } })
      fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!)
      // Flush beginSignup so the verify step renders (cooldown starts active).
      await act(async () => { await vi.advanceTimersByTimeAsync(0) })
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
      // Run the cooldown down to zero, then the button re-enables.
      await act(async () => { await vi.advanceTimersByTimeAsync((RESEND_COOLDOWN_SECONDS + 1) * 1000) })
      fireEvent.click(screen.getByRole('button', { name: /^resend code$/i }))
      await act(async () => { await vi.advanceTimersByTimeAsync(0) })
      expect(mutate).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns to the email step via the back action', async () => {
    const mutate = vi.fn().mockResolvedValue({ data: { beginSignup: true } })
    const { user } = setup(mutate)
    await reachVerifyStep(user)
    await user.click(screen.getByRole('button', { name: /use a different email/i }))

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument()
  })
})
