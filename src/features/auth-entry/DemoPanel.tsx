interface DemoPanelProps {
  onTryDemo: () => void
  loading: boolean
  disabled: boolean
}

export function DemoPanel({ onTryDemo, loading, disabled }: DemoPanelProps) {
  return (
    <div className="sign-in-page__demo-section">
      <p className="sign-in-page__demo-eyebrow">Demo</p>
      <p className="sign-in-page__demo-desc">Explore all features with sample data</p>
      <div className="sign-in-page__demo-row">
        <button
          type="button"
          className="sign-in-page__btn-demo"
          onClick={onTryDemo}
          disabled={disabled}
          aria-label="Try a Demo — sign in as the demo user"
        >
          {loading ? 'Loading demo…' : 'Try a Demo'}
        </button>
        <span className="sign-in-page__demo-note">No registration required</span>
      </div>
    </div>
  )
}
