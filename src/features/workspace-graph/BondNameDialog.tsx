import { useState } from 'react'

interface BondNameDialogProps {
  sourceTitle: string
  targetTitle: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export function BondNameDialog({ sourceTitle, targetTitle, onConfirm, onCancel }: BondNameDialogProps) {
  const [name, setName] = useState('RELATES_TO')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div
      role="dialog"
      aria-label="Name this bond"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', maxWidth: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <h3 style={{ margin: '0 0 0.5rem' }}>Name this Bond</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#555' }}>
          {sourceTitle} → {targetTitle}
        </p>
        <input
          aria-label="Bond name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.4rem 1rem' }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: '0.4rem 1rem' }}>
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
