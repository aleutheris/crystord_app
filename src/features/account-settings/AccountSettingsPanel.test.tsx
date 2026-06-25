import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccountInfoState } from './use-account-info'
import { AccountSettingsPanel } from './AccountSettingsPanel'

const { mockUseAccountInfo } = vi.hoisted(() => ({ mockUseAccountInfo: vi.fn() }))
vi.mock('./use-account-info', () => ({ useAccountInfo: () => mockUseAccountInfo() }))

function setState(state: Partial<AccountInfoState>) {
  mockUseAccountInfo.mockReturnValue({ account: null, loading: false, error: null, ...state })
}

beforeEach(() => { mockUseAccountInfo.mockReset() })

describe('AccountSettingsPanel', () => {
  it('shows a loading state', () => {
    setState({ loading: true })
    render(<AccountSettingsPanel onClose={vi.fn()} />)
    expect(screen.getByText(/loading your account/i)).toBeInTheDocument()
  })

  it('shows an error via role=alert', () => {
    setState({ error: 'Could not load your account details.' })
    render(<AccountSettingsPanel onClose={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i)
  })

  it('renders the identity overview with a verified badge and methods', () => {
    setState({ account: { username: 'demo.user', email: 'd@e.com', emailVerified: true, authMethods: ['password', 'google'] } })
    render(<AccountSettingsPanel onClose={vi.fn()} />)
    expect(screen.getByText('demo.user')).toBeInTheDocument()
    expect(screen.getByText(/d@e\.com/)).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText(/password, google/)).toBeInTheDocument()
  })

  it('shows Unverified and "None" methods when applicable', () => {
    setState({ account: { username: 'u', email: 'u@e.com', emailVerified: false, authMethods: [] } })
    render(<AccountSettingsPanel onClose={vi.fn()} />)
    expect(screen.getByText('Unverified')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('is an accessible labelled dialog', () => {
    setState({ account: { username: 'u', email: 'u@e.com', emailVerified: true, authMethods: ['password'] } })
    render(<AccountSettingsPanel onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: /account settings/i })).toHaveAttribute('aria-modal', 'true')
  })

  it('closes via the close button', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    render(<AccountSettingsPanel onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close account settings/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    render(<AccountSettingsPanel onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores non-Escape keys', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    render(<AccountSettingsPanel onClose={onClose} />)
    await userEvent.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on backdrop click', async () => {
    setState({ loading: true })
    const onClose = vi.fn()
    const { container } = render(<AccountSettingsPanel onClose={onClose} />)
    await userEvent.click(container.querySelector('.account-settings__backdrop')!)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
