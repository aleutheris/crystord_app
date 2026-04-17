import { useEffect, useState } from 'react'
import type { Atom, AtomBond } from '../../api-contract/graph-queries'

const UNDO_WINDOW_MS = 6000

export interface UndoEntry {
  type: 'atom' | 'bond'
  atom: Atom
  bond?: AtomBond
}

interface UndoNotificationProps {
  entry: UndoEntry
  onUndo: (entry: UndoEntry) => void
  onExpire: () => void
}

export function UndoNotification({ entry, onUndo, onExpire }: UndoNotificationProps) {
  const [remaining, setRemaining] = useState(UNDO_WINDOW_MS)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 200) {
          clearInterval(interval)
          onExpire()
          return 0
        }
        return prev - 200
      })
    }, 200)
    return () => clearInterval(interval)
  }, [onExpire])

  const label =
    entry.type === 'atom'
      ? `Atom "${entry.atom.properties.nuclearies.title}" deleted.`
      : `Bond "${entry.bond?.name}" removed.`

  const seconds = Math.ceil(remaining / 1000)

  return (
    <div
      role="status"
      aria-label="Undo deletion"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#323232',
        color: '#fff',
        padding: '0.75rem 1.25rem',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 1100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <span>{label} ({seconds}s)</span>
      <button
        type="button"
        onClick={() => onUndo(entry)}
        style={{
          background: 'transparent',
          color: '#8ab4f8',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          padding: '0.25rem 0.5rem',
        }}
      >
        Undo
      </button>
    </div>
  )
}
