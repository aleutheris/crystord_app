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

describe('DetailPanel — edit mode', () => {
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

describe('DetailPanel — creation mode', () => {
  it('shows "Create New Atom" heading when isCreationMode is true', () => {
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('heading', { name: /create new atom/i })).toBeInTheDocument()
  })

  it('has accessible label "Create atom" in creation mode', () => {
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('complementary', { name: /create atom/i })).toBeInTheDocument()
  })

  it('starts with empty form fields in creation mode', () => {
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByLabelText(/title/i)).toHaveValue('')
    expect(screen.getByLabelText(/labels/i)).toHaveValue('')
    expect(screen.getByLabelText(/description/i)).toHaveValue('')
    expect(screen.getByLabelText(/content/i)).toHaveValue('')
  })

  it('shows "Create" button instead of "Save" in creation mode', () => {
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument()
  })

  it('does not show Delete button in creation mode', () => {
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('calls onCreate with form values when Create is clicked', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <DetailPanel isCreationMode={true} onCreate={onCreate} onClose={vi.fn()} />,
    )

    await user.type(screen.getByLabelText(/title/i), 'New Node')
    await user.type(screen.getByLabelText(/labels/i), 'Tag1, Tag2')
    await user.type(screen.getByLabelText(/description/i), 'My description')
    await user.type(screen.getByLabelText(/content/i), 'My content')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    expect(onCreate).toHaveBeenCalledOnce()
    const [title, labels, description, content] = onCreate.mock.calls[0]!
    expect(title).toBe('New Node')
    expect(labels).toEqual(['Tag1', 'Tag2'])
    expect(description).toBe('My description')
    expect(content).toBe('My content')
  })

  it('calls onClose when close button is clicked in creation mode', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <DetailPanel isCreationMode={true} onCreate={vi.fn()} onClose={onClose} />,
    )
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows "Creating…" on submit button while saving', async () => {
    let resolveCreate!: () => void
    const onCreate = vi.fn().mockImplementation(
      () => new Promise<void>((res) => { resolveCreate = res }),
    )
    const user = userEvent.setup()

    render(
      <DetailPanel isCreationMode={true} onCreate={onCreate} onClose={vi.fn()} />,
    )

    await user.type(screen.getByLabelText(/title/i), 'Test')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    resolveCreate()
  })
})
