import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccountInfoState } from './use-account-info'
import type { AccountFeedback } from './use-account-actions'
import { AccountSettingsPanel } from './AccountSettingsPanel'

const { mockUseAccountInfo, actionsRef } = vi.hoisted(() => ({
  mockUseAccountInfo: vi.fn(),
  actionsRef: { feedback: null as AccountFeedback | null },
}))
vi.mock('./use-account-info', () => ({ useAccountInfo: () => mockUseAccountInfo() }))

// The actions hook + section components are unit-tested separately; stub them here so the panel test
// focuses on the shell, identity overview, shared feedback, and composition.
vi.mock('./use-account-actions', () => ({ useAccountActions: () => actionsRef }))
vi.mock('./AuthMethodsSection', () => ({ AuthMethodsSection: () => <div data-testid="auth-methods-section" /> }))
vi.mock('./EmailChangeSection', () => ({ EmailChangeSection: () => <div data-testid="email-change-section" /> }))
vi.mock('./DangerZoneSection', () => ({ DangerZoneSection: () => <div data-testid="danger-zone-section" /> }))

function setState(state: Partial<AccountInfoState>) {
  mockUseAccountInfo.mockReturnValue({ account: null, loading: false, error: null, refetch: vi.fn(), ...state })
}

const ACCOUNT = { username: 'demo.user', email: 'd@e.com', emailVerified: true, authMethods: ['password'] }

function renderPanel(props: { onClose?: () => void; onSessionEnded?: () => void; googleClientId?: string } = {}) {
  return render(<AccountSettingsPanel onClose={vi.fn()} onSessionEnded={vi.fn()} {...props} />)
}

beforeEach(() => {
  mockUseAccountInfo.mockReset()
  actionsRef.feedback = null
})

describe('AccountSettingsPanel', () => {
  it('shows a loading state', () => {
    setState({ loading: true })
    renderPanel()
    expect(screen.getByText(/loading your account/i)).toBeInTheDocument()
  })

  it('shows a load error via role=alert', () => {
    setState({ error: 'Could not load your account details.' })
    renderPanel()
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i)
  })

  it('renders the identity overview and all account sections', () => {
    setState({ account: ACCOUNT })
    renderPanel()
    expect(screen.getByText('demo.user')).toBeInTheDocument()
    expect(screen.getByText(/d@e\.com/)).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByTestId('auth-methods-section')).toBeInTheDocument()
    expect(screen.getByTestId('email-change-section')).toBeInTheDocument()
    expect(screen.getByTestId('danger-zone-section')).toBeInTheDocument()
  })

  it('shows an Unverified badge when the email is not verified', () => {
    setState({ account: { username: 'u', email: 'u@e.com', emailVerified: false, authMethods: [] } })
    renderPanel()
    expect(screen.getByText('Unverified')).toBeInTheDocument()
  })

  it('shows action success feedback as a status region', () => {
    setState({ account: ACCOUNT })
    actionsRef.feedback = { kind: 'success', message: 'Email updated.' }
    renderPanel()
    expect(screen.getByRole('status')).toHaveTextContent(/email updated/i)
  })

  it('shows an action error (e.g. a delete block reason) as an alert', () => {
    setState({ account: ACCOUNT })
    actionsRef.feedback = { kind: 'error', message: 'You still own atoms. Delete them first, then you can delete your account.' }
    renderPanel()
    expect(screen.getByRole('alert')).toHaveTextContent(/still own atoms/i)
  })

  it('is an accessible labelled dialog', () => {
    setState({ account: ACCOUNT })
    renderPanel()
    expect(screen.getByRole('dialog', { name: /account settings/i })).toHaveAttribute('aria-modal', 'true')
  })

  it('closes via the close button', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    renderPanel({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /close account settings/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    renderPanel({ onClose })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores non-Escape keys', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    renderPanel({ onClose })
    await userEvent.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on backdrop click', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    const { container } = renderPanel({ onClose })
    await userEvent.click(container.querySelector('.account-settings__backdrop')!)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
