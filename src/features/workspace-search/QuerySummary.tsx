import { C_BORDER_SUBTLE, C_SURFACE, C_TEXT_SECONDARY, C_TEXT_MUTED } from '../../styles/tokens'

interface QuerySummaryProps {
  summary: string
  resultCount: number
}

export function QuerySummary({ summary, resultCount }: QuerySummaryProps) {
  if (!summary) return null

  return (
    <div
      role="status"
      aria-label="Active query summary"
      style={{
        padding: '0.3rem 1rem',
        borderBottom: `1px solid ${C_BORDER_SUBTLE}`,
        background: C_SURFACE,
        fontSize: '0.8rem',
        color: C_TEXT_SECONDARY,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{summary}</span>
      <span style={{ color: C_TEXT_MUTED }}>{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
    </div>
  )
}
