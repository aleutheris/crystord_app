import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  it('renders confirmation with atom title', () => {
    render(
      <DeleteConfirmDialog
        atomTitle="My Atom"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/My Atom/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onConfirm when delete is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <DeleteConfirmDialog atomTitle="X" onConfirm={onConfirm} onCancel={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <DeleteConfirmDialog atomTitle="X" onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
