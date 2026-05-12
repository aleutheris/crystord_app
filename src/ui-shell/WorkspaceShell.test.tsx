import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspaceShell } from './WorkspaceShell'

vi.mock('../features/auth-entry', () => ({
  useAuth: () => ({ signOut: vi.fn(), isAuthenticated: true }),
}))

const mockSearch = vi.fn()

vi.mock('../features/workspace-graph', () => ({
  useGraphData: () => ({
    atoms: [],
    loading: false,
    error: null,
    search: mockSearch,
    createAtom: vi.fn(),
    updateAtom: vi.fn(),
    deleteAtom: vi.fn(),
    addBond: vi.fn(),
    removeBond: vi.fn(),
  }),
  useGraphDegrade: () => ({ mode: 'full', confirmRender: vi.fn() }),
  GraphCanvas: () => <div data-testid="flow-canvas" />,
  NetworkCanvas: () => <div data-testid="network-canvas" />,
  DeleteConfirmDialog: () => null,
}))

vi.mock('../features/workspace-search', () => ({
  useSearch: () => ({
    filters: { labelQuery: '', selectedLabels: [] },
    setLabelQuery: vi.fn(),
    toggleLabel: vi.fn(),
    clearFilters: vi.fn(),
    submitSearch: vi.fn(),
    commitLabelFromInput: vi.fn(),
    removeLastLabel: vi.fn(),
    hasSubmitted: false,
    filteredAtoms: [],
    availableLabels: [],
    querySummary: '',
    isActive: false,
  }),
  useRecommendedLabels: () => ({ labels: [], loading: false }),
  SearchBar: () => <div data-testid="search-bar" />,
  QuerySummary: () => null,
  SearchResultPanel: () => <div data-testid="search-result-panel" />,
}))

vi.mock('../features/workspace-details', () => ({
  DetailPanel: () => <div data-testid="detail-panel" />,
}))

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('WorkspaceShell view switching', () => {
  it('renders Network view as the default after sign-in', () => {
    render(<WorkspaceShell />)
    expect(screen.getByRole('tab', { name: 'Network' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('network-canvas')).toBeInTheDocument()
  })

  it('does not render the Flow canvas by default', () => {
    render(<WorkspaceShell />)
    expect(screen.queryByTestId('flow-canvas')).not.toBeInTheDocument()
  })

  it('switches to Flow canvas when Flow tab is clicked', async () => {
    render(<WorkspaceShell />)
    await userEvent.click(screen.getByRole('tab', { name: 'Flow' }))
    expect(screen.getByTestId('flow-canvas')).toBeInTheDocument()
    expect(screen.queryByTestId('network-canvas')).not.toBeInTheDocument()
  })

  it('switches back to Network canvas when Network tab is re-clicked', async () => {
    render(<WorkspaceShell />)
    await userEvent.click(screen.getByRole('tab', { name: 'Flow' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Network' }))
    expect(screen.getByTestId('network-canvas')).toBeInTheDocument()
    expect(screen.queryByTestId('flow-canvas')).not.toBeInTheDocument()
  })

  it('does not invoke search when switching views', async () => {
    mockSearch.mockClear()
    render(<WorkspaceShell />)
    await userEvent.click(screen.getByRole('tab', { name: 'Flow' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Network' }))
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('header and search bar remain visible when switching views', async () => {
    render(<WorkspaceShell />)
    expect(screen.getByText('Crystord')).toBeInTheDocument()
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Flow' }))
    expect(screen.getByText('Crystord')).toBeInTheDocument()
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
  })

  it('view tabs are visible before any search is submitted', () => {
    render(<WorkspaceShell />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Network' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Flow' })).toBeInTheDocument()
  })
})
