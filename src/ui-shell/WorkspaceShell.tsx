import { useAuth } from '../features/auth-entry'

export function WorkspaceShell() {
  const { signOut } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Crystord</h1>
        <button type="button" onClick={signOut} style={{ padding: '0.25rem 0.75rem' }}>
          Sign Out
        </button>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Workspace ready — graph canvas will be added in BI-260012.</p>
      </main>
    </div>
  )
}
