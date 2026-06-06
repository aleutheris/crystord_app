import { useTheme } from './ThemeProvider'
import type { CSSProperties } from 'react'

const CYCLE: Record<string, 'light' | 'dark' | 'system'> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const LABELS: Record<string, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
}

const ICONS: Record<string, string> = {
  system: '⬤',
  light: '☀',
  dark: '☽',
}

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: 'inherit',
  lineHeight: '1.4',
  userSelect: 'none',
}

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  function handleClick() {
    setMode(CYCLE[mode])
  }

  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      aria-label={`Theme: ${LABELS[mode]}. Click to switch.`}
      title={`Theme: ${LABELS[mode]}`}
    >
      <span aria-hidden="true">{ICONS[mode]}</span>
      {LABELS[mode]}
    </button>
  )
}
