const FEATURES = [
  'Interactive Graph Workspace',
  'Atom and Bond Management',
  'Search and Discovery',
  'Real-time Data View',
]

export function BrandPanel() {
  return (
    <div className="sign-in-page__brand">
      <img src="/logo_negated.png" alt="Crystord" className="sign-in-page__logo" />
      <div className="sign-in-page__brand-headline">
        <h1 className="sign-in-page__brand-title">Your data, your control.</h1>
        <p className="sign-in-page__brand-sub">
          Build and explore knowledge graphs that stay yours — no lock-in, no hidden complexity.
        </p>
      </div>
      <ul className="sign-in-page__brand-features">
        {FEATURES.map((feature) => (
          <li key={feature} className="sign-in-page__brand-feature">
            <span className="sign-in-page__brand-check" aria-hidden="true">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
