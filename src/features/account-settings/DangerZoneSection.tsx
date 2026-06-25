import { useState } from 'react'
import type { AccountActions } from './use-account-actions'

interface DangerZoneSectionProps {
  actions: AccountActions
}

/**
 * Destructive account controls in the account-settings modal (BI-260060): sign out of every session
 * and delete the account. Both are two-step (an explicit confirm), since each ends the current session:
 * sign-out-everywhere is recoverable but also drops every other device; deletion may additionally be
 * blocked by the server (still owns atoms / sole workspace admin) — that block reason is surfaced via
 * the shared feedback region by the actions hook.
 */
export function DangerZoneSection({ actions }: DangerZoneSectionProps) {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <section className="account-settings__section account-settings__section--danger" aria-labelledby="danger-zone-heading">
      <p id="danger-zone-heading" className="account-settings__term">Account</p>

      {!confirmingSignOut ? (
        <button
          type="button"
          className="account-settings__btn account-settings__btn--secondary"
          disabled={actions.pending}
          onClick={() => setConfirmingSignOut(true)}
        >
          Sign out everywhere
        </button>
      ) : (
        <div role="group" aria-label="Confirm sign out everywhere" className="account-settings__confirm">
          <p className="account-settings__desc">
            This signs you out on every device, including this one. You'll need to sign in again.
          </p>
          <div className="account-settings__actions">
            <button
              type="button"
              className="account-settings__btn account-settings__btn--secondary"
              disabled={actions.pending}
              onClick={() => void actions.signOutEverywhere()}
            >
              {actions.pending ? 'Signing out…' : 'Yes, sign out everywhere'}
            </button>
            <button
              type="button"
              className="account-settings__btn-text"
              disabled={actions.pending}
              onClick={() => setConfirmingSignOut(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!confirmingDelete ? (
        <button
          type="button"
          className="account-settings__btn account-settings__btn--danger"
          disabled={actions.pending}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete account
        </button>
      ) : (
        <div role="group" aria-label="Confirm account deletion" className="account-settings__confirm">
          <p className="account-settings__desc">
            This permanently deletes your account. This cannot be undone.
          </p>
          <div className="account-settings__actions">
            <button
              type="button"
              className="account-settings__btn account-settings__btn--danger"
              disabled={actions.pending}
              onClick={() => void actions.deleteAccount()}
            >
              {actions.pending ? 'Deleting…' : 'Yes, delete my account'}
            </button>
            <button
              type="button"
              className="account-settings__btn-text"
              disabled={actions.pending}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
