import { useCallback } from 'react'
import type { SearchState } from './use-search'
import {
  C_BORDER,
  C_CARD_BG,
  C_CHIP_BG,
  C_CHIP_BORDER,
  C_CHIP_TEXT,
  C_CHIP_INACTIVE_BG,
  C_CHIP_INACTIVE_BORDER,
  C_CHIP_INACTIVE_TEXT,
  C_PRIMARY,
  C_TEXT_SECONDARY,
} from '../../styles/tokens'

interface SearchBarProps {
  search: SearchState
  recommendedLabels?: string[]
}

export function SearchBar({ search, recommendedLabels = [] }: SearchBarProps) {
  const labelsToShow = search.availableLabels.length > 0
    ? search.availableLabels
    : recommendedLabels

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === ':') {
      e.preventDefault()
      search.commitLabelFromInput()
    } else if (e.key === 'Backspace' && search.filters.labelQuery === '') {
      e.preventDefault()
      search.removeLastLabel()
    }
  }, [search])

  return (
    <form
      role="search"
      aria-label="Search atoms"
      onSubmit={(e) => { e.preventDefault(); search.submitSearch() }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.25rem',
          padding: '0.2rem 0.4rem',
          border: `1px solid ${C_BORDER}`,
          borderRadius: 4,
          minWidth: 180,
          background: C_CARD_BG,
        }}
      >
        {search.filters.selectedLabels.map((label) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.1rem 0.4rem',
              borderRadius: 12,
              background: C_CHIP_BG,
              border: `1px solid ${C_CHIP_BORDER}`,
              color: C_CHIP_TEXT,
              fontSize: '0.75rem',
            }}
          >
            {label}
            <button
              type="button"
              onClick={() => search.toggleLabel(label)}
              aria-label={`Remove ${label}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: C_CHIP_TEXT,
                fontSize: '0.75rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={search.filters.selectedLabels.length === 0 ? 'Search labels…' : ''}
          value={search.filters.labelQuery}
          onChange={(e) => search.setLabelQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search labels"
          style={{
            border: 'none',
            outline: 'none',
            padding: '0.1rem',
            fontSize: '0.85rem',
            flex: 1,
            minWidth: 60,
            background: 'transparent',
          }}
        />
      </div>
      <button
        type="submit"
        aria-label="Run search query"
        title="Run search query"
        style={{
          width: '2rem',
          height: '2rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
          border: `1px solid ${C_PRIMARY}`,
          background: C_PRIMARY,
          color: C_CARD_BG,
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ▶
      </button>
      {labelsToShow.length > 0 && (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {labelsToShow.map((label) => {
            const active = search.filters.selectedLabels.includes(label)
            return (
              <button
                key={label}
                type="button"
                onClick={() => search.toggleLabel(label)}
                aria-pressed={active}
                style={{
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: 12,
                  border: active ? `1px solid ${C_CHIP_BORDER}` : `1px solid ${C_CHIP_INACTIVE_BORDER}`,
                  background: active ? C_CHIP_BG : C_CHIP_INACTIVE_BG,
                  color: active ? C_CHIP_TEXT : C_CHIP_INACTIVE_TEXT,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
      {search.isActive && (
        <button
          type="button"
          onClick={search.clearFilters}
          aria-label="Clear search"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: C_TEXT_SECONDARY }}
        >
          ✕
        </button>
      )}
    </form>
  )
}
