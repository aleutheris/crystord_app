import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccountInfo } from '../../api-contract'
import type { AccountActions } from './use-account-actions'
import { AuthMethodsSection } from './AuthMethodsSection'

vi.mock('../../ui-primitives/buttons', () => ({
  GoogleCredentialButton: ({ onCredential }: { onCredential: (t: string) => void }) => (
    <button type="button" onClick={() => onCredential('id-token')}>Mock Link Google</button>
  ),
}))

const ACCOUNT: AccountInfo = { username: 'u', email: 'u@e.com', emailVerified: true, authMethods: ['password'] }

function makeActions(over: Partial<AccountActions> = {}): AccountActions {
  return {
    pending: false, feedback: null, passwordError: null, emailError: null, codeError: null,
    setPassword: vi.fn(), unlinkMethod: vi.fn(), linkGoogle: vi.fn(),
    requestEmailChange: vi.fn(), confirmEmailChange: vi.fn(),
    signOutEverywhere: vi.fn(), deleteAccount: vi.fn(), clearFeedback: vi.fn(),
    ...over,
  }
}

function renderSection(account = ACCOUNT, actions = makeActions(), googleClientId?: string) {
  render(<AuthMethodsSection account={account} actions={actions} googleClientId={googleClientId} />)
  return actions
}

describe('AuthMethodsSection', () => {
  it('submits a new password', async () => {
    const user = userEvent.setup()
    const actions = renderSection()
    await user.type(screen.getByLabelText(/set a password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(actions.setPassword).toHaveBeenCalledWith('correct horse battery')
  })

  it('shows the inline password error', () => {
    renderSection(ACCOUNT, makeActions({ passwordError: 'Password must be at least 12 characters.' }))
    expect(screen.getByText(/at least 12/i)).toBeInTheDocument()
  })

  it('unlinks a method', async () => {
    const user = userEvent.setup()
    const actions = renderSection({ ...ACCOUNT, authMethods: ['password', 'google'] })
    await user.click(screen.getAllByRole('button', { name: /^remove$/i })[0]!)
    expect(actions.unlinkMethod).toHaveBeenCalledWith('password')
  })

  it('links Google when a client id is set and Google is not yet linked', async () => {
    const user = userEvent.setup()
    const actions = renderSection(ACCOUNT, makeActions(), 'client-123')
    await user.click(screen.getByRole('button', { name: /mock link google/i }))
    expect(actions.linkGoogle).toHaveBeenCalledWith('id-token')
  })

  it('hides Link Google when Google is already linked', () => {
    renderSection({ ...ACCOUNT, authMethods: ['password', 'google'] }, makeActions(), 'client-123')
    expect(screen.queryByRole('button', { name: /mock link google/i })).not.toBeInTheDocument()
  })

  it('hides Link Google when no client id is configured', () => {
    renderSection(ACCOUNT, makeActions())
    expect(screen.queryByRole('button', { name: /mock link google/i })).not.toBeInTheDocument()
  })

  it('disables actions while a request is pending', () => {
    renderSection({ ...ACCOUNT, authMethods: ['password', 'google'] }, makeActions({ pending: true }))
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /^remove$/i })[0]!).toBeDisabled()
  })

  it('disables Remove for the only sign-in method', () => {
    renderSection({ ...ACCOUNT, authMethods: ['password'] })
    expect(screen.getByRole('button', { name: /^remove$/i })).toBeDisabled()
  })
})
