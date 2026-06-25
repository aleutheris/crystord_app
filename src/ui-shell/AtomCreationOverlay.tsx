import { useRef } from 'react'
import { DetailPanel } from '../features/workspace-details'
import { useModalFocus } from '../a11y/use-modal-focus'
import { C_OVERLAY } from '../styles/tokens'

interface AtomCreationOverlayProps {
  onCreate: (title: string, labels: string[], description: string, content: string) => Promise<void>
  onClose: () => void
}

/**
 * The atom-creation overlay (BI-260046) wrapped with shared modal focus management (BI-260064):
 * focus moves into the panel on open, Tab/Shift+Tab are trapped within it, Escape closes it (scoped),
 * and focus returns to the trigger (the Create Atom button) on close.
 */
export function AtomCreationOverlay({ onCreate, onClose }: AtomCreationOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useModalFocus(dialogRef, onClose)

  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, background: C_OVERLAY, zIndex: 1000 }} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create atom"
        tabIndex={-1}
        style={{ position: 'fixed', right: 0, top: 0, height: '100%', zIndex: 1001, display: 'flex' }}
      >
        <DetailPanel isCreationMode={true} onCreate={onCreate} onClose={onClose} />
      </div>
    </>
  )
}
