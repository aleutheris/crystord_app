import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { SearchResultPanel } from './SearchResultPanel'
import type { Atom } from '../../api-contract/graph-queries'

function makeAtom(uuid: string, title: string, labels: string[]): Atom {
  return {
    labels,
    bonds: [],
    properties: {
      shellies: { uuid },
      nuclearies: { title, description: '', content: '', operation: null, constants: null },
    },
  }
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>)
}

const atoms: Atom[] = [
  makeAtom('a1', 'Alpha', ['Project']),
  makeAtom('a2', 'Beta', ['Task']),
]

describe('SearchResultPanel', () => {
  it('renders result list with atom titles and labels', () => {
    renderWithProvider(
      <SearchResultPanel atoms={atoms} selectedAtomId={null} onSelectAtom={vi.fn()} />,
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Task')).toBeInTheDocument()
  })

  it('calls onSelectAtom when a result is clicked', async () => {
    const onSelectAtom = vi.fn()
    const user = userEvent.setup()
    renderWithProvider(
      <SearchResultPanel atoms={atoms} selectedAtomId={null} onSelectAtom={onSelectAtom} />,
    )

    await user.click(screen.getByText('Beta'))
    expect(onSelectAtom).toHaveBeenCalledWith('a2')
  })

  it('highlights selected result with aria-current', () => {
    renderWithProvider(
      <SearchResultPanel atoms={atoms} selectedAtomId="a1" onSelectAtom={vi.fn()} />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-current', 'true')
    expect(buttons[1]).not.toHaveAttribute('aria-current')
  })

  it('shows empty message when no atoms match', () => {
    renderWithProvider(
      <SearchResultPanel atoms={[]} selectedAtomId={null} onSelectAtom={vi.fn()} />,
    )
    expect(screen.getByText('No matching atoms')).toBeInTheDocument()
  })
})
