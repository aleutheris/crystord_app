interface SchemaErrorProps {
  schemaVersion: string
  supportedRange: string
  message: string
}

export function SchemaErrorScreen({ schemaVersion, supportedRange, message }: SchemaErrorProps) {
  return (
    <div role="alert" style={{ padding: '2rem', maxWidth: '600px', margin: '4rem auto' }}>
      <h1>Incompatible Backend</h1>
      <p>{message}</p>
      <dl>
        <dt>Backend version</dt>
        <dd><code>{schemaVersion}</code></dd>
        <dt>Supported range</dt>
        <dd><code>{supportedRange}</code></dd>
      </dl>
      <p>
        Please contact your administrator or wait for a compatible update.
      </p>
      <button type="button" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  )
}
