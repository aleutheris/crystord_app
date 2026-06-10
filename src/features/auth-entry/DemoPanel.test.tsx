import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoPanel } from './DemoPanel'

function renderPanel(overrides: Partial<Parameters<typeof DemoPanel>[0]> = {}) {
  const defaults = {
    onTryDemo: vi.fn(),
    loading: false,
    disabled: false,
  }
  return render(<DemoPanel {...defaults} {...overrides} />)
}

describe('DemoPanel', () => {
  it('renders the demo description', () => {
    renderPanel()
    expect(screen.getByText(/explore all features with sample data/i)).toBeInTheDocument()
  })

  it('renders the "No registration required" note', () => {
    renderPanel()
    expect(screen.getByText(/no registration required/i)).toBeInTheDocument()
  })

  it('renders "Try a Demo" button in idle state', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /try a demo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try a demo/i })).not.toBeDisabled()
  })

  it('shows "Loading demo…" label when loading', () => {
    renderPanel({ loading: true })
    expect(screen.getByRole('button', { name: /try a demo/i })).toHaveTextContent('Loading demo…')
  })

  it('disables the button when disabled=true', () => {
    renderPanel({ disabled: true })
    expect(screen.getByRole('button', { name: /try a demo/i })).toBeDisabled()
  })

  it('calls onTryDemo when button is clicked', async () => {
    const user = userEvent.setup()
    const onTryDemo = vi.fn()
    renderPanel({ onTryDemo })

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(onTryDemo).toHaveBeenCalledOnce()
  })

  it('does not call onTryDemo when disabled', async () => {
    const user = userEvent.setup()
    const onTryDemo = vi.fn()
    renderPanel({ onTryDemo, disabled: true })

    await user.click(screen.getByRole('button', { name: /try a demo/i }))

    expect(onTryDemo).not.toHaveBeenCalled()
  })
})
