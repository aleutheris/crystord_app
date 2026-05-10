import type { SearchState } from './use-search'

interface SearchBarProps {
  search: SearchState
}

export function SearchBar({ search }: SearchBarProps) {
  return (
    <form
      role="search"
      aria-label="Search atoms"
      onSubmit={(e) => { e.preventDefault(); search.submitSearch() }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <input
        type="search"
        placeholder="Search labels…"
        value={search.filters.labelQuery}
        onChange={(e) => search.setLabelQuery(e.target.value)}
        aria-label="Search labels"
        style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: 4, width: 180 }}
      />
      {search.availableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {search.availableLabels.map((label) => {
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
