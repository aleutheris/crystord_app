import { useState } from 'react'
import { C_WARNING, C_TEXT, C_SURFACE_ALT } from '../styles/tokens'

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 1rem',
        background: C_SURFACE_ALT,
        borderBottom: `2px solid ${C_WARNING}`,
        color: C_TEXT,
        fontSize: '0.85rem',
        lineHeight: 1.4,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>
        <strong style={{ color: C_WARNING }}>Beta version.</strong>{' '}
        Crystord is still under active development and may contain bugs. Things might
        break, behave unexpectedly, or change without notice. Please explore, experiment,
        and report anything that looks off. Your feedback helps us improve. Thank you!
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss beta notice"
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          color: C_TEXT,
          cursor: 'pointer',
          fontSize: '1rem',
          padding: '0 0.25rem',
        }}
      >
        ✕
      </button>
    </div>
  )
}
