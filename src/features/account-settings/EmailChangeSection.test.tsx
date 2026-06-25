import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccountActions } from './use-account-actions'
import { EmailChangeSection } from './EmailChangeSection'

function makeActions(over: Partial<AccountActions> = {}): AccountActions {
  return {
    pending: false, feedback: null, passwordError: null, emailError: null, codeError: null,
    setPassword: vi.fn(), unlinkMethod: vi.fn(), linkGoogle: vi.fn(),
    requestEmailChange: vi.fn().mockResolvedValue(true),
    confirmEmailChange: vi.fn().mockResolvedValue(true),
    signOutEverywhere: vi.fn(), deleteAccount: vi.fn(), clearFeedback: vi.fn(),
    ...over,
  }
}

const NEW_EMAIL = 'new@example.com'

describe('EmailChangeSection', () => {
  it('requests a code and advances to the confirm step', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<EmailChangeSection actions={actions} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    expect(actions.requestEmailChange).toHaveBeenCalledWith(NEW_EMAIL)
    expect(screen.getByLabelText(/enter the code sent to/i)).toBeInTheDocument()
  })

  it('stays on the request step when the request fails', async () => {
    const user = userEvent.setup()
    const actions = makeActions({ requestEmailChange: vi.fn().mockResolvedValue(false) })
    render(<EmailChangeSection actions={actions} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    expect(screen.queryByLabelText(/enter the code/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/new email address/i)).toBeInTheDocument()
  })

  it('shows the inline email error', () => {
    render(<EmailChangeSection actions={makeActions({ emailError: 'That email is already in use.' })} />)
    const input = screen.getByLabelText(/new email address/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/already in use/i)).toBeInTheDocument()
  })

  it('confirms the change and returns to the request step', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<EmailChangeSection actions={actions} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(screen.getByLabelText(/enter the code sent to/i), '123456')
    await user.click(screen.getByRole('button', { name: /confirm change/i }))
    expect(actions.confirmEmailChange).toHaveBeenCalledWith('123456')
    // back on the request step with a cleared field
    expect(screen.getByLabelText(/new email address/i)).toHaveValue('')
  })

  it('stays on the confirm step when confirmation fails', async () => {
    const user = userEvent.setup()
    const actions = makeActions({ confirmEmailChange: vi.fn().mockResolvedValue(false) })
    render(<EmailChangeSection actions={actions} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(screen.getByLabelText(/enter the code sent to/i), '000000')
    await user.click(screen.getByRole('button', { name: /confirm change/i }))
    expect(screen.getByLabelText(/enter the code sent to/i)).toBeInTheDocument()
  })

  it('shows the inline code error on the confirm step', async () => {
    const user = userEvent.setup()
    render(<EmailChangeSection actions={makeActions({ codeError: 'That code is invalid or has expired.' })} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    const codeInput = screen.getByLabelText(/enter the code sent to/i)
    expect(codeInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument()
  })

  it('goes back to the request step via "Use a different email"', async () => {
    const user = userEvent.setup()
    render(<EmailChangeSection actions={makeActions()} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.click(screen.getByRole('button', { name: /use a different email/i }))
    expect(screen.getByLabelText(/new email address/i)).toBeInTheDocument()
  })

  it('disables the request submit and shows Saving while pending', () => {
    render(<EmailChangeSection actions={makeActions({ pending: true })} />)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('shows Saving on the confirm step while pending', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<EmailChangeSection actions={makeActions()} />)
    await user.type(screen.getByLabelText(/new email address/i), NEW_EMAIL)
    await user.click(screen.getByRole('button', { name: /send code/i }))
    rerender(<EmailChangeSection actions={makeActions({ pending: true })} />)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
