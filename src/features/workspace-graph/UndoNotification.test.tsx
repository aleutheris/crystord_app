import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UndoNotification } from './UndoNotification'
import type { UndoEntry } from './UndoNotification'
import type { Atom } from '../../api-contract/graph-queries'

function makeAtom(title: string): Atom {
  return {
    labels: ['Node'],
    bonds: [],
    properties: {
      shellies: { uuid: 'test-uuid' },
      nuclearies: { title, description: '', content: '', operation: null, constants: null },
    },
  }
}

describe('UndoNotification', () => {
  it('shows atom deletion message with undo button', () => {
    const entry: UndoEntry = { type: 'atom', atom: makeAtom('My Atom') }
    render(
      <UndoNotification entry={entry} onUndo={vi.fn()} onExpire={vi.fn()} />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/My Atom.*deleted/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })

  it('shows bond deletion message', () => {
    const entry: UndoEntry = {
      type: 'bond',
      atom: makeAtom('Source'),
      bond: { uuid: 'target-uuid', name: 'DEPENDS_ON', direction: 'from' },
    }
    render(
      <UndoNotification entry={entry} onUndo={vi.fn()} onExpire={vi.fn()} />,
    )
    expect(screen.getByText(/DEPENDS_ON.*removed/)).toBeInTheDocument()
  })

  it('calls onUndo when undo button is clicked', async () => {
    const onUndo = vi.fn()
    const user = userEvent.setup()
    const entry: UndoEntry = { type: 'atom', atom: makeAtom('X') }
    render(
      <UndoNotification entry={entry} onUndo={onUndo} onExpire={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /undo/i }))
    expect(onUndo).toHaveBeenCalledWith(entry)
  })
})
