const FEATURES = [
  'Interactive Graph Workspace',
  'Atom and Bond Management',
  'Search and Discovery',
  'Real-time Data View',
]

interface DemoPanelProps {
  onTryDemo: () => void
  loading: boolean
  disabled: boolean
}

export function DemoPanel({ onTryDemo, loading, disabled }: DemoPanelProps) {
  return (
    <div className="sign-in-page__demo">
      <h2 className="sign-in-page__demo-title">Try Demo</h2>
      <p className="sign-in-page__demo-subtitle">Explore all features with sample data</p>
      <ul className="sign-in-page__feature-list">
        {FEATURES.map((feature) => (
          <li key={feature} className="sign-in-page__feature-item">
            <span className="sign-in-page__feature-check" aria-hidden="true">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="sign-in-page__btn-primary"
        onClick={onTryDemo}
        disabled={disabled}
        aria-label="Try a Demo — sign in as the demo user"
      >
        {loading ? 'Loading demo…' : 'Try a Demo'}
      </button>
      <p className="sign-in-page__demo-note">No registration required</p>
    </div>
  )
}
