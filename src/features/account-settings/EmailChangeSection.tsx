import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AccountActions } from './use-account-actions'

interface EmailChangeSectionProps {
  actions: AccountActions
}

/**
 * Email-change controls in the account-settings modal (BI-260060): request a code to the new address,
 * then confirm it. The emailed code goes to the **new** address; confirming switches the login email
 * and keeps the current session (the server revokes the others).
 */
export function EmailChangeSection({ actions }: EmailChangeSectionProps) {
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')

  async function onRequest(e: FormEvent) {
    e.preventDefault()
    if (await actions.requestEmailChange(newEmail)) setStep('confirm')
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault()
    if (await actions.confirmEmailChange(code)) {
      setStep('request')
      setNewEmail('')
      setCode('')
    }
  }

  return (
    <section className="account-settings__section" aria-labelledby="email-change-heading">
      <p id="email-change-heading" className="account-settings__term">Change email</p>

      {step === 'request' ? (
        <form className="account-settings__form" onSubmit={onRequest}>
          <label htmlFor="new-email" className="account-settings__desc">New email address</label>
          <input
            id="new-email"
            type="email"
            className="account-settings__input"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            required
            aria-invalid={actions.emailError ? true : undefined}
            aria-describedby={actions.emailError ? 'new-email-error' : undefined}
          />
          {actions.emailError && (
            <p id="new-email-error" className="account-settings__field-error">{actions.emailError}</p>
          )}
          <button type="submit" disabled={actions.pending} className="account-settings__btn">
            {actions.pending ? 'Saving…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form className="account-settings__form" onSubmit={onConfirm}>
          <label htmlFor="email-code" className="account-settings__desc">Enter the code sent to {newEmail}</label>
          <input
            id="email-code"
            type="text"
            inputMode="numeric"
            className="account-settings__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="one-time-code"
            required
            aria-invalid={actions.codeError ? true : undefined}
            aria-describedby={actions.codeError ? 'email-code-error' : undefined}
          />
          {actions.codeError && (
            <p id="email-code-error" className="account-settings__field-error">{actions.codeError}</p>
          )}
          <div className="account-settings__actions">
            <button type="submit" disabled={actions.pending} className="account-settings__btn">
              {actions.pending ? 'Saving…' : 'Confirm change'}
            </button>
            <button
              type="button"
              className="account-settings__btn-text"
              disabled={actions.pending}
              onClick={() => { setStep('request'); setCode('') }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
