import { useEffect } from 'react'
import { C_SUCCESS, C_TOAST_TEXT } from '../../styles/tokens'

const DISPLAY_MS = 5000

interface CreationNotificationProps {
  message: string
  onExpire: () => void
}

export function CreationNotification({ message, onExpire }: CreationNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onExpire, DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [onExpire])

  return (
    <div
      role="status"
      aria-label="Atom created"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: C_SUCCESS,
        color: C_TOAST_TEXT,
        padding: '0.75rem 1.5rem',
        borderRadius: 6,
        zIndex: 1200,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}
