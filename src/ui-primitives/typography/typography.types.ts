import type { ReactNode } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps {
  level: HeadingLevel
  children: ReactNode
  muted?: boolean
  truncate?: boolean
}

export interface LabelProps {
  htmlFor?: string
  children: ReactNode
  required?: boolean
  disabled?: boolean
}

export type TextSize = 'sm' | 'md' | 'lg'

export interface BodyTextProps {
  children: ReactNode
  size?: TextSize
  muted?: boolean
  truncate?: boolean
}
