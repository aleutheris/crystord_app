import type { ReactNode } from 'react'

export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: ReactNode
  size?: DialogSize
}

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastProps {
  message: string
  variant?: ToastVariant
  duration?: number
  onDismiss?: () => void
}

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: SpinnerSize
  label?: string
}
