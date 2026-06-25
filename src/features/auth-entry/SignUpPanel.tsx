import type { ApolloClient } from '@apollo/client'
import { useSignUp } from './use-sign-up'
import type { SignUpController } from './use-sign-up'
import { AuthField } from './AuthField'

interface SignUpPanelProps {
  client: ApolloClient
  onSuccess: (token: string) => void
}

function EmailStep({ s }: { s: SignUpController }) {
  return (
    <form className="sign-in-page__form" onSubmit={(e) => { e.preventDefault(); void s.submitEmail() }}>
      <AuthField id="signup-email" label="Email" type="email" value={s.email} onChange={s.setEmail}
        autoComplete="email" error={s.fieldErrors.email} />
      {s.formError && <p role="alert" className="sign-in-page__error">{s.formError}</p>}
      <div className="sign-in-page__actions">
        <button type="submit" disabled={s.loading} className="sign-in-page__btn-primary">
          {s.loading ? 'Sending…' : 'Continue'}
        </button>
      </div>
    </form>
  )
}

function VerifyStep({ s }: { s: SignUpController }) {
  return (
    <form className="sign-in-page__form" onSubmit={(e) => { e.preventDefault(); void s.submitVerify() }}>
      <p className="sign-in-page__hint">
        If that email can be registered, we have sent a 6-digit code to <strong>{s.email}</strong>.
        Enter it below and choose a username and password.
      </p>
      <AuthField id="signup-code" label="Verification code" value={s.code} onChange={s.setCode}
        autoComplete="one-time-code" inputMode="numeric" error={s.fieldErrors.code} />
      <AuthField id="signup-username" label="Username" value={s.username} onChange={s.setUsername}
        autoComplete="username" error={s.fieldErrors.username} />
      <AuthField id="signup-password" label="Password" type="password" value={s.password}
        onChange={s.setPassword} autoComplete="new-password" error={s.fieldErrors.password} />
      {s.formError && <p role="alert" className="sign-in-page__error">{s.formError}</p>}
      <p className="sign-in-page__resend">
        <button type="button" className="sign-in-page__switch-btn"
          onClick={() => void s.resend()} disabled={s.resendCooldown > 0}>
          {s.resendCooldown > 0 ? `Resend code in ${s.resendCooldown}s` : 'Resend code'}
        </button>
      </p>
      {/* Announce only the discrete "now resendable" transition — not the per-second countdown. */}
      <span role="status" className="sign-in-page__sr-status">
        {s.resendCooldown > 0 ? '' : 'You can now request a new code.'}
      </span>
      <div className="sign-in-page__actions">
        <button type="submit" disabled={s.loading} className="sign-in-page__btn-primary">
          {s.loading ? 'Creating account…' : 'Create account'}
        </button>
      </div>
      <p className="sign-in-page__switch">
        <button type="button" className="sign-in-page__switch-btn" onClick={s.back}>
          ← Use a different email
        </button>
      </p>
    </form>
  )
}

export function SignUpPanel({ client, onSuccess }: SignUpPanelProps) {
  const s = useSignUp(client, onSuccess)
  return s.step === 'email' ? <EmailStep s={s} /> : <VerifyStep s={s} />
}
