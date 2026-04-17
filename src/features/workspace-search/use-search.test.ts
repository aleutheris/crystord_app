import { describe, it, expect } from 'vitest'
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

  it('generates query summary text', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('proj'))
    expect(result.current.querySummary).toBe('Search: "proj"')

    act(() => result.current.toggleLabel('Task'))
    expect(result.current.querySummary).toBe('Search: "proj" · Labels: Task')

    act(() => result.current.setLabelQuery(''))
    expect(result.current.querySummary).toBe('Labels: Task')
  })

  it('returns empty array when no atoms match', () => {
    const { result } = renderHook(() => useSearch(atoms))

    act(() => result.current.setLabelQuery('zzz'))

    expect(result.current.filteredAtoms).toHaveLength(0)
  })
})
