import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccountActions } from './use-account-actions'
import { DangerZoneSection } from './DangerZoneSection'

function makeActions(over: Partial<AccountActions> = {}): AccountActions {
  return {
    pending: false, feedback: null, passwordError: null, emailError: null, codeError: null,
    setPassword: vi.fn(), unlinkMethod: vi.fn(), linkGoogle: vi.fn(),
    requestEmailChange: vi.fn(), confirmEmailChange: vi.fn(),
    signOutEverywhere: vi.fn(), deleteAccount: vi.fn(), clearFeedback: vi.fn(),
    ...over,
  }
}

describe('DangerZoneSection', () => {
  it('asks for confirmation before signing out everywhere', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^sign out everywhere$/i }))
    expect(screen.getByRole('group', { name: /confirm sign out everywhere/i })).toBeInTheDocument()
    expect(actions.signOutEverywhere).not.toHaveBeenCalled()
  })

  it('signs out of every session after confirmation', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^sign out everywhere$/i }))
    await user.click(screen.getByRole('button', { name: /yes, sign out everywhere/i }))
    expect(actions.signOutEverywhere).toHaveBeenCalledOnce()
  })

  it('cancels the sign-out confirmation', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^sign out everywhere$/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('group', { name: /confirm sign out everywhere/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign out everywhere$/i })).toBeInTheDocument()
    expect(actions.signOutEverywhere).not.toHaveBeenCalled()
  })

  it('shows Signing out… while the sign-out is pending', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DangerZoneSection actions={makeActions()} />)
    await user.click(screen.getByRole('button', { name: /^sign out everywhere$/i }))
    rerender(<DangerZoneSection actions={makeActions({ pending: true })} />)
    expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled()
  })

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    expect(screen.getByRole('group', { name: /confirm account deletion/i })).toBeInTheDocument()
    expect(actions.deleteAccount).not.toHaveBeenCalled()
  })

  it('deletes after confirmation', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete my account/i }))
    expect(actions.deleteAccount).toHaveBeenCalledOnce()
  })

  it('cancels the delete confirmation', async () => {
    const user = userEvent.setup()
    const actions = makeActions()
    render(<DangerZoneSection actions={actions} />)
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('group', { name: /confirm account deletion/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^delete account$/i })).toBeInTheDocument()
    expect(actions.deleteAccount).not.toHaveBeenCalled()
  })

  it('disables controls while a request is pending', () => {
    render(<DangerZoneSection actions={makeActions({ pending: true })} />)
    expect(screen.getByRole('button', { name: /sign out everywhere/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^delete account$/i })).toBeDisabled()
  })

  it('shows Deleting… while the deletion is pending', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DangerZoneSection actions={makeActions()} />)
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    rerender(<DangerZoneSection actions={makeActions({ pending: true })} />)
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled()
  })
})
