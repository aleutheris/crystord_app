import type { ReactNode } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: ReactNode
  padding?: CardPadding
  elevated?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export interface PanelProps {
  children: ReactNode
  title?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}
