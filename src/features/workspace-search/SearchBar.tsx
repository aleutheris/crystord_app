import { useCallback } from 'react'
import type { SearchState } from './use-search'

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
          border: '1px solid #ccc',
          borderRadius: 4,
          minWidth: 180,
          background: '#fff',
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
              background: '#e8f0fe',
              border: '1px solid #1a73e8',
              color: '#1a73e8',
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
                color: '#1a73e8',
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
                  border: active ? '1px solid #1a73e8' : '1px solid #ccc',
                  background: active ? '#e8f0fe' : '#f5f5f5',
                  color: active ? '#1a73e8' : '#333',
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#666' }}
        >
          ✕
        </button>
      )}
    </form>
  )
}
