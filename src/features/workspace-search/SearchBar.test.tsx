import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'
import type { SearchState } from './use-search'

function makeSearch(overrides: Partial<SearchState> = {}): SearchState {
  return {
    filters: { labelQuery: '', selectedLabels: [] },
    setLabelQuery: vi.fn(),
    toggleLabel: vi.fn(),
    clearFilters: vi.fn(),
    submitSearch: vi.fn(),
    filteredAtoms: [],
    availableLabels: ['Project', 'Task'],
    querySummary: '',
    isActive: false,
    ...overrides,
  }
}

describe('SearchBar', () => {
  it('renders search input and label chips', () => {
    render(<SearchBar search={makeSearch()} />)
    expect(screen.getByLabelText(/search labels/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Project' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Task' })).toBeInTheDocument()
  })

  it('calls setLabelQuery on input change', async () => {
    const setLabelQuery = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar search={makeSearch({ setLabelQuery })} />)

    await user.type(screen.getByLabelText(/search labels/i), 'pro')
    expect(setLabelQuery).toHaveBeenCalled()
  })

  it('calls toggleLabel when label chip is clicked', async () => {
    const toggleLabel = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar search={makeSearch({ toggleLabel })} />)

    await user.click(screen.getByRole('button', { name: 'Project' }))
    expect(toggleLabel).toHaveBeenCalledWith('Project')
  })

  it('shows clear button when search is active', () => {
    render(<SearchBar search={makeSearch({ isActive: true })} />)
    expect(screen.getByLabelText(/clear search/i)).toBeInTheDocument()
  })

  it('calls clearFilters when clear button is clicked', async () => {
    const clearFilters = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar search={makeSearch({ isActive: true, clearFilters })} />)

    await user.click(screen.getByLabelText(/clear search/i))
    expect(clearFilters).toHaveBeenCalledOnce()
  })

  it('calls submitSearch when form is submitted via Enter', async () => {
    const submitSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar search={makeSearch({ submitSearch })} />)

    await user.type(screen.getByLabelText(/search labels/i), 'proj')
    await user.keyboard('{Enter}')
    expect(submitSearch).toHaveBeenCalledOnce()
  })

  it('shows recommendedLabels as chips when no atoms are loaded (availableLabels empty)', () => {
    render(
      <SearchBar
        search={makeSearch({ availableLabels: [] })}
        recommendedLabels={['Finance', 'Legal']}
      />,
    )
    expect(screen.getByRole('button', { name: 'Finance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Legal' })).toBeInTheDocument()
  })

  it('shows availableLabels from loaded atoms over recommendedLabels once atoms are present', () => {
    render(
      <SearchBar
        search={makeSearch({ availableLabels: ['Project', 'Task'] })}
        recommendedLabels={['Finance', 'Legal']}
      />,
    )
    expect(screen.getByRole('button', { name: 'Project' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finance' })).not.toBeInTheDocument()
  })

  it('shows no chips when both availableLabels and recommendedLabels are empty', () => {
    render(
      <SearchBar
        search={makeSearch({ availableLabels: [] })}
        recommendedLabels={[]}
      />,
    )
    expect(screen.queryByRole('button', { name: /project|task/i })).not.toBeInTheDocument()
  })

  it('marks active label chips with aria-pressed', () => {
    render(<SearchBar search={makeSearch({ filters: { labelQuery: '', selectedLabels: ['Project'] } })} />)
    expect(screen.getByRole('button', { name: 'Project' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Task' })).toHaveAttribute('aria-pressed', 'false')
  })
})
