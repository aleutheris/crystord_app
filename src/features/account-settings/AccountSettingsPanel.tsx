import { useEffect } from 'react'
import { useAccountInfo } from './use-account-info'
import { useAccountActions } from './use-account-actions'
import { AuthMethodsSection } from './AuthMethodsSection'
import './account-settings.css'

interface AccountSettingsPanelProps {
  onClose: () => void
  googleClientId?: string
}

/**
 * Account-settings modal (BI-260058/260059): identity overview from `me` plus auth-method management
 * (set password / unlink / link Google). Email change, sign-out-everywhere, and delete land in
 * BI-260060.
 */
export function AccountSettingsPanel({ onClose, googleClientId }: AccountSettingsPanelProps) {
  const { account, loading, error, refetch } = useAccountInfo()
  const actions = useAccountActions(refetch)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="account-settings__backdrop" aria-hidden="true" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="account-settings-title" className="account-settings">
        <div className="account-settings__header">
          <h2 id="account-settings-title" className="account-settings__title">Account Settings</h2>
          <button type="button" className="account-settings__close" aria-label="Close account settings"
            onClick={onClose}>×</button>
        </div>

        {loading && <p className="account-settings__status">Loading your account…</p>}
        {error && <p role="alert" className="account-settings__status">{error}</p>}

        {account && (
          <>
            <dl className="account-settings__list">
              <div className="account-settings__row">
                <dt className="account-settings__term">Username</dt>
                <dd className="account-settings__desc">{account.username}</dd>
              </div>
              <div className="account-settings__row">
                <dt className="account-settings__term">Email</dt>
                <dd className="account-settings__desc">
                  {account.email}{' '}
                  <span className={account.emailVerified
                    ? 'account-settings__badge account-settings__badge--verified'
                    : 'account-settings__badge account-settings__badge--unverified'}>
                    {account.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </dd>
              </div>
            </dl>
            <AuthMethodsSection account={account} actions={actions} googleClientId={googleClientId} />
          </>
        )}
      </div>
    </>
  )
}
