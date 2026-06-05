import { useEffect } from 'react'

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
        background: '#2E8B57',
        color: '#fff',
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
