import { useState } from 'react'
import type { AccountInfo } from '../../api-contract'
import type { AccountActions } from './use-account-actions'
import { LabeledField } from '../../ui-primitives/inputs'
import { GoogleCredentialButton } from '../../ui-primitives/buttons'

interface AuthMethodsSectionProps {
  account: AccountInfo
  actions: AccountActions
  googleClientId?: string
}

/** Account-settings styling applied to the shared {@link LabeledField} (BI-260065). */
const SETTINGS_FIELD_CLASSES = {
  label: 'account-settings__term',
  input: 'account-settings__input',
  error: 'account-settings__field-error',
}

/**
 * Auth-method management controls in the account-settings modal (BI-260059): set/replace password,
 * remove a linked method (the server blocks the last one), and link Google.
 */
export function AuthMethodsSection({ account, actions, googleClientId }: AuthMethodsSectionProps) {
  const [newPassword, setNewPassword] = useState('')
  const hasGoogle = account.authMethods.includes('google')
  const isOnlyMethod = account.authMethods.length === 1

  return (
    <section className="account-settings__section" aria-labelledby="auth-methods-heading">
      <p id="auth-methods-heading" className="account-settings__term">Sign-in &amp; password</p>

      <form className="account-settings__form" onSubmit={(e) => { e.preventDefault(); void actions.setPassword(newPassword) }}>
        <LabeledField
          id="new-password"
          label="Set a password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          error={actions.passwordError ?? undefined}
          classNames={SETTINGS_FIELD_CLASSES}
        />
        <button type="submit" disabled={actions.pending} className="account-settings__btn">
          {actions.pending ? 'Saving…' : 'Update password'}
        </button>
      </form>

      <div className="account-settings__row">
        <p className="account-settings__term">Sign-in methods</p>
        <ul className="account-settings__methods">
          {account.authMethods.map((method) => (
            <li key={method} className="account-settings__method">
              <span>{method}</span>
              <button
                type="button"
                className="account-settings__btn-text"
                disabled={actions.pending || isOnlyMethod}
                title={isOnlyMethod ? 'You cannot remove your only sign-in method.' : undefined}
                onClick={() => void actions.unlinkMethod(method)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {googleClientId && !hasGoogle && (
          <div className="account-settings__link-google">
            <span className="account-settings__desc">Link Google to this account:</span>
            <GoogleCredentialButton googleClientId={googleClientId} onCredential={(idToken) => void actions.linkGoogle(idToken)} />
          </div>
        )}
      </div>
    </section>
  )
}
