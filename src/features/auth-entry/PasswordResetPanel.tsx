import type { ApolloClient } from '@apollo/client'
import { usePasswordReset } from './use-password-reset'
import type { PasswordResetController } from './use-password-reset'
import { AuthField } from './AuthField'

interface PasswordResetPanelProps {
  client: ApolloClient
  onComplete: () => void
  onBack: () => void
}

function RequestStep({ s, onBack }: { s: PasswordResetController; onBack: () => void }) {
  return (
    <form className="sign-in-page__form" onSubmit={(e) => { e.preventDefault(); void s.submitRequest() }}>
      <p className="sign-in-page__hint">
        Enter your account email and we will send a reset code if that address is registered.
      </p>
      <AuthField id="reset-email" label="Email" type="email" value={s.email} onChange={s.setEmail}
        autoComplete="email" error={s.fieldErrors.email} />
      {s.formError && <p role="alert" className="sign-in-page__error">{s.formError}</p>}
      <div className="sign-in-page__actions">
        <button type="submit" disabled={s.loading} className="sign-in-page__btn-primary">
          {s.loading ? 'Sending…' : 'Send reset code'}
        </button>
      </div>
      <p className="sign-in-page__switch">
        <button type="button" className="sign-in-page__switch-btn" onClick={onBack}>
          ← Back to sign in
        </button>
      </p>
    </form>
  )
}

function ConfirmStep({ s }: { s: PasswordResetController }) {
  return (
    <form className="sign-in-page__form" onSubmit={(e) => { e.preventDefault(); void s.submitConfirm() }}>
      <p className="sign-in-page__hint">
        Enter the reset code from your email and choose a new password. This signs you out everywhere.
      </p>
      <AuthField id="reset-token" label="Reset code" value={s.token} onChange={s.setToken}
        autoComplete="one-time-code" inputMode="numeric" error={s.fieldErrors.token} />
      <AuthField id="reset-password" label="New password" type="password" value={s.newPassword}
        onChange={s.setNewPassword} autoComplete="new-password" error={s.fieldErrors.newPassword} />
      {s.formError && <p role="alert" className="sign-in-page__error">{s.formError}</p>}
      <div className="sign-in-page__actions">
        <button type="submit" disabled={s.loading} className="sign-in-page__btn-primary">
          {s.loading ? 'Resetting…' : 'Reset password'}
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

export function PasswordResetPanel({ client, onComplete, onBack }: PasswordResetPanelProps) {
  const s = usePasswordReset(client, onComplete)
  return s.step === 'request' ? <RequestStep s={s} onBack={onBack} /> : <ConfirmStep s={s} />
}
