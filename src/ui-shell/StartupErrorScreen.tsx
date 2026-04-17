interface StartupErrorProps {
  error: string
}

export function StartupErrorScreen({ error }: StartupErrorProps) {
  return (
    <div role="alert" style={{ padding: '2rem', maxWidth: '600px', margin: '4rem auto' }}>
      <h1>Startup Failed</h1>
      <p>The application could not start.</p>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>
      <button type="button" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  )
}
