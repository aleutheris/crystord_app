import { useState, useMemo, useCallback } from 'react'
import type { Atom } from '../../api-contract/graph-queries'

export interface SearchFilters {
  labelQuery: string
  selectedLabels: string[]
}

export interface SearchState {
  filters: SearchFilters
  setLabelQuery: (query: string) => void
  toggleLabel: (label: string) => void
  clearFilters: () => void
  submitSearch: () => void
  commitLabelFromInput: () => void
  removeLastLabel: () => void
  hasSubmitted: boolean
  filteredAtoms: Atom[]
  availableLabels: string[]
  querySummary: string
  isActive: boolean
}

export function useSearch(atoms: Atom[], onSubmitSearch?: (labels: string[]) => Promise<void>): SearchState {
  const [labelQuery, setLabelQuery] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedLabels, setSubmittedLabels] = useState<string[]>([])

  const availableLabels = useMemo(() => {
    const all = new Set<string>()
    for (const atom of atoms) {
      for (const label of atom.labels) {
        all.add(label)
      }
    }
    return Array.from(all).sort()
  }, [atoms])

  const toggleLabel = useCallback((label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    )
  }, [])

  const clearFilters = useCallback(() => {
    setLabelQuery('')
    setSelectedLabels([])
    setHasSubmitted(false)
    setSubmittedLabels([])
  }, [])

  const submitSearch = useCallback(() => {
    const text = labelQuery.trim()
    const finalLabels = text.length > 0 && !selectedLabels.includes(text)
      ? [...selectedLabels, text]
      : [...selectedLabels]
    if (text.length > 0) {
      setLabelQuery('')
      if (!selectedLabels.includes(text)) {
        setSelectedLabels(finalLabels)
      }
    }
    setSubmittedLabels(finalLabels)
    setHasSubmitted(true)
    void onSubmitSearch?.(finalLabels)
  }, [labelQuery, selectedLabels, onSubmitSearch])

  const commitLabelFromInput = useCallback(() => {
    const text = labelQuery.trim()
    if (text.length > 0 && !selectedLabels.includes(text)) {
      setSelectedLabels((prev) => [...prev, text])
    }
    setLabelQuery('')
  }, [labelQuery, selectedLabels])

  const removeLastLabel = useCallback(() => {
    if (selectedLabels.length > 0) {
      setSelectedLabels((prev) => prev.slice(0, -1))
    }
  }, [selectedLabels])

  const filters: SearchFilters = { labelQuery, selectedLabels }

  const isActive = labelQuery.trim().length > 0 || selectedLabels.length > 0

  const filteredAtoms = useMemo(() => {
    if (!isActive) return atoms

    return atoms.filter((atom) => {
      const query = labelQuery.trim().toLowerCase()
      const matchesQuery = query.length === 0 || atom.labels.some(
        (l) => l.toLowerCase().includes(query),
      )

      const matchesSelected = selectedLabels.length === 0 || atom.labels.some(
        (l) => selectedLabels.includes(l),
      )

      return matchesQuery && matchesSelected
    })
  }, [atoms, labelQuery, selectedLabels, isActive])

  const querySummary = useMemo(() => {
    if (!hasSubmitted || submittedLabels.length === 0) return ''
    return `Labels: ${submittedLabels.join(', ')}`
  }, [hasSubmitted, submittedLabels])

  return {
    filters,
    setLabelQuery,
    toggleLabel,
    clearFilters,
    submitSearch,
    commitLabelFromInput,
    removeLastLabel,
    hasSubmitted,
    filteredAtoms,
    availableLabels,
    querySummary,
    isActive,
  }
}
