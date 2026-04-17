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
        borderBottom: '1px solid #eee',
        background: '#fafafa',
        fontSize: '0.8rem',
        color: '#555',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{summary}</span>
      <span style={{ color: '#888' }}>{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
    </div>
  )
}
