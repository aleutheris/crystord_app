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

  // Removing a label the last search ran with re-runs it without that label (EPIC-260094):
  // later category queries reuse the submitted labels, so a removal that stayed local would
  // keep narrowing them invisibly. Unsubmitted chips were never applied, so removing one
  // fires nothing — adding a label still needs an explicit submit.
  const unsubmitLabel = useCallback((label: string) => {
    if (!submittedLabels.includes(label)) return
    const remaining = submittedLabels.filter((l) => l !== label)
    setSubmittedLabels(remaining)
    void onSubmitSearch?.(remaining)
  }, [submittedLabels, onSubmitSearch])

  const toggleLabel = useCallback((label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== label))
      unsubmitLabel(label)
    } else {
      setSelectedLabels([...selectedLabels, label])
    }
  }, [selectedLabels, unsubmitLabel])

  const clearFilters = useCallback(() => {
    setLabelQuery('')
    setSelectedLabels([])
    setHasSubmitted(false)
    setSubmittedLabels([])
    if (submittedLabels.length > 0) void onSubmitSearch?.([])
  }, [submittedLabels, onSubmitSearch])

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
    const last = selectedLabels.at(-1)
    if (last === undefined) return
    setSelectedLabels(selectedLabels.slice(0, -1))
    unsubmitLabel(last)
  }, [selectedLabels, unsubmitLabel])

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
