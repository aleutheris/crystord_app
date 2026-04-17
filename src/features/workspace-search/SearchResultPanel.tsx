import { useReactFlow } from '@xyflow/react'
import type { Atom } from '../../api-contract/graph-queries'

interface SearchResultPanelProps {
  atoms: Atom[]
  selectedAtomId: string | null
  onSelectAtom: (id: string) => void
}

export function SearchResultPanel({ atoms, selectedAtomId, onSelectAtom }: SearchResultPanelProps) {
  const reactFlow = useReactFlow()

  function handleClick(uuid: string) {
    onSelectAtom(uuid)
    reactFlow.fitView({ nodes: [{ id: uuid }], duration: 300, padding: 0.5 })
  }

  return (
    <aside
      aria-label="Search results"
      style={{
        width: 220,
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>
        Results
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {atoms.map((atom) => {
          const uuid = atom.properties.shellies.uuid
          const isSelected = uuid === selectedAtomId
          return (
            <li key={uuid}>
              <button
                type="button"
                onClick={() => handleClick(uuid)}
                aria-current={isSelected ? 'true' : undefined}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  borderBottom: '1px solid #eee',
                  background: isSelected ? '#e8f0fe' : 'transparent',
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {atom.properties.nuclearies.title}
                </div>
                {atom.labels.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 2 }}>
                    {atom.labels.join(', ')}
                  </div>
                )}
              </button>
            </li>
          )
        })}
        {atoms.length === 0 && (
          <li style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
            No matching atoms
          </li>
        )}
      </ul>
    </aside>
  )
}
