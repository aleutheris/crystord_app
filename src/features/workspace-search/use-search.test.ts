import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './use-search'
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

const atoms: Atom[] = [
  makeAtom('a1', 'Alpha', ['Project', 'Active']),
  makeAtom('a2', 'Beta', ['Task']),
  makeAtom('a3', 'Gamma', ['Project']),
]

describe('useSearch', () => {
  it('returns all atoms when no filters are active', () => {
    const { result } = renderHook(() => useSearch(atoms))
    expect(result.current.isActive).toBe(false)
    expect(result.current.filteredAtoms).toEqual(atoms)
  })

  it('extracts and sorts available labels', () => {
    const { result } = renderHook(() => useSearch(atoms))
    expect(result.current.availableLabels).toEqual(['Active', 'Project', 'Task'])
  })

  it('filters atoms by label query (case-insensitive)', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('proj'))

    expect(result.current.isActive).toBe(true)
    expect(result.current.filteredAtoms).toHaveLength(2)
    expect(result.current.filteredAtoms.map((a) => a.properties.shellies.uuid)).toEqual(['a1', 'a3'])
  })

  it('filters atoms by selected labels', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.toggleLabel('Task'))

    expect(result.current.isActive).toBe(true)
    expect(result.current.filteredAtoms).toHaveLength(1)
    expect(result.current.filteredAtoms[0]!.properties.shellies.uuid).toBe('a2')
  })

  it('applies both label query and selected labels (AND)', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => {
      result.current.setLabelQuery('act')
      result.current.toggleLabel('Project')
    })

    expect(result.current.filteredAtoms).toHaveLength(1)
    expect(result.current.filteredAtoms[0]!.properties.shellies.uuid).toBe('a1')
  })

  it('toggles label off when toggled again', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.toggleLabel('Task'))
    expect(result.current.filters.selectedLabels).toEqual(['Task'])

    act(() => result.current.toggleLabel('Task'))
    expect(result.current.filters.selectedLabels).toEqual([])
    expect(result.current.isActive).toBe(false)
  })

  it('clears all filters', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => {
      result.current.setLabelQuery('proj')
      result.current.toggleLabel('Task')
    })
    expect(result.current.isActive).toBe(true)

    act(() => result.current.clearFilters())

    expect(result.current.isActive).toBe(false)
    expect(result.current.filters.labelQuery).toBe('')
    expect(result.current.filters.selectedLabels).toEqual([])
    expect(result.current.filteredAtoms).toEqual(atoms)
  })

  it('querySummary is empty before any submission', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('proj'))
    expect(result.current.querySummary).toBe('')
  })

  it('querySummary reflects submitted labels after submitSearch', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.submitSearch())

    expect(result.current.querySummary).toBe('Labels: Task')
  })

  it('querySummary is empty when submitted with no labels', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.submitSearch())

    expect(result.current.querySummary).toBe('')
  })

  it('querySummary resets to empty after clearFilters', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.submitSearch())
    expect(result.current.querySummary).toBe('Labels: Task')

    act(() => result.current.clearFilters())
    expect(result.current.querySummary).toBe('')
  })

  it('hasSubmitted is false before any submission', () => {
    const { result } = renderHook(() => useSearch(atoms))
    expect(result.current.hasSubmitted).toBe(false)
  })

  it('hasSubmitted becomes true after submitSearch', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.submitSearch())

    expect(result.current.hasSubmitted).toBe(true)
  })

  it('hasSubmitted resets to false after clearFilters', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.submitSearch())
    act(() => result.current.clearFilters())

    expect(result.current.hasSubmitted).toBe(false)
  })

  it('submitSearch auto-chips uncommitted text before executing', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith(['Task'])
    expect(result.current.filters.labelQuery).toBe('')
    expect(result.current.filters.selectedLabels).toContain('Task')
  })

  it('submitSearch includes both committed chips and auto-chipped text', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Project'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith(['Project', 'Task'])
    expect(result.current.filters.labelQuery).toBe('')
  })

  it('submitSearch does not duplicate auto-chip if text already in chips', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith(['Task'])
  })

  it('submitSearch with empty input uses existing chips only', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith(['Task'])
  })

  it('isActive remains false after empty submission with no chips or text', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.submitSearch())

    expect(result.current.isActive).toBe(false)
  })

  it('isActive is true after submitting with committed chips', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.submitSearch())

    expect(result.current.isActive).toBe(true)
  })

  it('submitSearch calls onSubmitSearch with empty array when no labels are selected', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith([])
  })

  it('submitSearch calls onSubmitSearch with committed label chips', () => {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useSearch(atoms, onSubmitSearch))

    act(() => result.current.setLabelQuery('Project'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.submitSearch())

    expect(onSubmitSearch).toHaveBeenCalledWith(['Project'])
  })

  it('submitSearch is a no-op when onSubmitSearch is not provided', () => {
    const { result } = renderHook(() => useSearch(atoms))
    expect(() => act(() => result.current.submitSearch())).not.toThrow()
  })

  it('commitLabelFromInput adds trimmed labelQuery to selectedLabels and clears input', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('  MyLabel  '))
    act(() => result.current.commitLabelFromInput())

    expect(result.current.filters.selectedLabels).toContain('MyLabel')
    expect(result.current.filters.labelQuery).toBe('')
  })

  it('commitLabelFromInput clears input without adding when labelQuery is blank', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('   '))
    act(() => result.current.commitLabelFromInput())

    expect(result.current.filters.selectedLabels).toEqual([])
    expect(result.current.filters.labelQuery).toBe('')
  })

  it('commitLabelFromInput does not duplicate an already-selected label', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('Project'))
    act(() => result.current.commitLabelFromInput())
    act(() => result.current.setLabelQuery('Project'))
    act(() => result.current.commitLabelFromInput())

    expect(result.current.filters.selectedLabels.filter((l) => l === 'Project')).toHaveLength(1)
  })

  it('removeLastLabel removes the last committed chip', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => {
      result.current.setLabelQuery('Alpha')
    })
    act(() => result.current.commitLabelFromInput())
    act(() => {
      result.current.setLabelQuery('Beta')
    })
    act(() => result.current.commitLabelFromInput())

    act(() => result.current.removeLastLabel())

    expect(result.current.filters.selectedLabels).toEqual(['Alpha'])
  })

  it('removeLastLabel is a no-op when no labels are selected', () => {
    const { result } = renderHook(() => useSearch(atoms))

    expect(() => act(() => result.current.removeLastLabel())).not.toThrow()
    expect(result.current.filters.selectedLabels).toEqual([])
  })

  it('returns empty array when no atoms match', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('zzz'))

    expect(result.current.filteredAtoms).toHaveLength(0)
  })
})

// EPIC-260094: later category queries reuse the submitted labels, so removing a submitted label
// must re-run the search without it; removing an unsubmitted chip must fire nothing.
describe('useSearch — removing a submitted label re-runs the search', () => {
  function submitted(labels: string[]) {
    const onSubmitSearch = vi.fn().mockResolvedValue(undefined)
    const hook = renderHook(() => useSearch(atoms, onSubmitSearch))
    for (const label of labels) {
      act(() => hook.result.current.setLabelQuery(label))
      act(() => hook.result.current.commitLabelFromInput())
    }
    act(() => hook.result.current.submitSearch())
    onSubmitSearch.mockClear()
    return { onSubmitSearch, result: hook.result }
  }

  it('chip × (toggleLabel) re-submits the remaining submitted labels', () => {
    const { onSubmitSearch, result } = submitted(['Project', 'Task'])

    act(() => result.current.toggleLabel('Project'))

    expect(onSubmitSearch).toHaveBeenCalledOnce()
    expect(onSubmitSearch).toHaveBeenCalledWith(['Task'])
    expect(result.current.querySummary).toBe('Labels: Task')
  })

  it('Backspace (removeLastLabel) re-submits the remaining submitted labels', () => {
    const { onSubmitSearch, result } = submitted(['Project', 'Task'])

    act(() => result.current.removeLastLabel())

    expect(onSubmitSearch).toHaveBeenCalledOnce()
    expect(onSubmitSearch).toHaveBeenCalledWith(['Project'])
    expect(result.current.querySummary).toBe('Labels: Project')
  })

  it('Clear (clearFilters) re-submits with no labels', () => {
    const { onSubmitSearch, result } = submitted(['Project'])

    act(() => result.current.clearFilters())

    expect(onSubmitSearch).toHaveBeenCalledOnce()
    expect(onSubmitSearch).toHaveBeenCalledWith([])
  })

  it('removing the last submitted label re-submits with no labels and empties the summary', () => {
    const { onSubmitSearch, result } = submitted(['Project'])

    act(() => result.current.toggleLabel('Project'))

    expect(onSubmitSearch).toHaveBeenCalledWith([])
    expect(result.current.querySummary).toBe('')
  })

  it('removing an unsubmitted chip fires nothing, on either removal path', () => {
    const { onSubmitSearch, result } = submitted(['Project'])
    act(() => result.current.toggleLabel('Task'))
    act(() => result.current.setLabelQuery('Active'))
    act(() => result.current.commitLabelFromInput())

    act(() => result.current.removeLastLabel())
    act(() => result.current.toggleLabel('Task'))

    expect(onSubmitSearch).not.toHaveBeenCalled()
    expect(result.current.filters.selectedLabels).toEqual(['Project'])
    expect(result.current.querySummary).toBe('Labels: Project')
  })

  it('re-submits only submitted labels — an unsubmitted chip is never sent by a removal', () => {
    const { onSubmitSearch, result } = submitted(['Project'])
    act(() => result.current.toggleLabel('Task'))

    act(() => result.current.toggleLabel('Project'))

    expect(onSubmitSearch).toHaveBeenCalledWith([])
    expect(result.current.filters.selectedLabels).toEqual(['Task'])
    expect(result.current.querySummary).toBe('')
  })

  it('adding a label never runs the search', () => {
    const { onSubmitSearch, result } = submitted([])

    act(() => result.current.toggleLabel('Task'))
    act(() => result.current.setLabelQuery('Project'))
    act(() => result.current.commitLabelFromInput())

    expect(onSubmitSearch).not.toHaveBeenCalled()
  })

  it('Clear fires nothing when no submitted label is applied — even after an empty submit', () => {
    // An empty submit leaves hasSubmitted true with no submitted labels: the state that tells
    // "a submitted label is applied" apart from "a search was ever run".
    const { onSubmitSearch, result } = submitted([])
    act(() => result.current.toggleLabel('Task'))

    act(() => result.current.clearFilters())

    expect(onSubmitSearch).not.toHaveBeenCalled()
  })

  it('removing a submitted label updates the summary even without an onSubmitSearch callback', () => {
    const { result } = renderHook(() => useSearch(atoms))
    act(() => result.current.setLabelQuery('Task'))
    act(() => result.current.submitSearch())

    expect(() => act(() => result.current.toggleLabel('Task'))).not.toThrow()
    expect(result.current.querySummary).toBe('')
  })
})
