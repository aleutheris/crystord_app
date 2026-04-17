import { Link } from 'react-router'

export function AdminPlaceholder() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
      <h1>Administration</h1>
      <p>This area is planned for a future release.</p>
      <Link to="/">Back to workspace</Link>
    </div>
  )
}
