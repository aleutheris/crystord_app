import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BondNameDialog } from './BondNameDialog'

describe('BondNameDialog', () => {
  it('renders with source and target titles', () => {
    render(
      <BondNameDialog
        sourceTitle="Alpha"
        targetTitle="Beta"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Alpha → Beta/)).toBeInTheDocument()
    expect(screen.getByLabelText(/bond name/i)).toHaveValue('RELATES_TO')
  })

  it('calls onConfirm with the bond name', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <BondNameDialog
        sourceTitle="A"
        targetTitle="B"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    const input = screen.getByLabelText(/bond name/i)
    await user.clear(input)
    await user.type(input, 'DEPENDS_ON')
    await user.click(screen.getByRole('button', { name: /create/i }))
    expect(onConfirm).toHaveBeenCalledWith('DEPENDS_ON')
  })

  it('calls onCancel when cancelled', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <BondNameDialog sourceTitle="A" targetTitle="B" onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
