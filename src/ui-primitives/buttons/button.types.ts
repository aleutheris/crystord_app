import type { ReactNode, MouseEvent } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
  ariaLabel?: string
  type?: 'button' | 'submit' | 'reset'
}
