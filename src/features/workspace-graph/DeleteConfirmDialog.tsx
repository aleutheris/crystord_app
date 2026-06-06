import { C_OVERLAY, C_CARD_BG, C_CARD_SHADOW, C_ERROR } from '../../styles/tokens'

interface DeleteConfirmDialogProps {
  atomTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ atomTitle, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-label="Confirm deletion"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C_OVERLAY,
        zIndex: 1000,
      }}
    >
      <div style={{ background: C_CARD_BG, borderRadius: 8, padding: '1.5rem', maxWidth: 400, boxShadow: `0 4px 12px ${C_CARD_SHADOW}` }}>
        <h3 style={{ margin: '0 0 0.75rem' }}>Delete Atom?</h3>
        <p style={{ margin: '0 0 1rem' }}>
          Are you sure you want to delete <strong>{atomTitle}</strong>?
          This action can be undone briefly after deletion.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.4rem 1rem' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ padding: '0.4rem 1rem', background: C_ERROR, color: C_CARD_BG, border: 'none', borderRadius: 4 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
