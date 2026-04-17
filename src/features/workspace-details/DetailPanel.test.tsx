import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DetailPanel } from './DetailPanel'
import type { Atom } from '../../api-contract/graph-queries'

function makeAtom(overrides?: Partial<Atom>): Atom {
  return {
    labels: ['Project'],
    bonds: [],
    properties: {
      shellies: { uuid: 'test-uuid-1' },
      nuclearies: {
        title: 'Test Atom',
        description: 'A test description',
        content: 'Some content',
        operation: null,
        constants: null,
      },
    },
    ...overrides,
  }
}

describe('DetailPanel', () => {
  it('renders atom details in editable form', () => {
    render(
      <DetailPanel
        atom={makeAtom()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Atom')
    expect(screen.getByLabelText(/description/i)).toHaveValue('A test description')
    expect(screen.getByLabelText(/content/i)).toHaveValue('Some content')
    expect(screen.getByLabelText(/labels/i)).toHaveValue('Project')
  })

  it('calls onUpdate with modified data on save', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <DetailPanel atom={makeAtom()} onUpdate={onUpdate} onDelete={vi.fn()} onClose={vi.fn()} />,
    )

    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onUpdate).toHaveBeenCalledOnce()
    const [uuid, atom] = onUpdate.mock.calls[0]!
    expect(uuid).toBe('test-uuid-1')
    expect(atom.properties.nuclearies.title).toBe('Updated Title')
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(
      <DetailPanel atom={makeAtom()} onUpdate={vi.fn()} onDelete={onDelete} onClose={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('test-uuid-1')
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <DetailPanel atom={makeAtom()} onUpdate={vi.fn()} onDelete={vi.fn()} onClose={onClose} />,
    )
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
