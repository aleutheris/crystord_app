import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import type { ApolloClient } from '@apollo/client'
import { SIGN_IN_QUERY } from '../../api-contract/sign-in-query'
import type { SignInResponse } from '../../api-contract/sign-in-query'
import { mapAuthError } from '../../api-contract'
import { useAuth } from './AuthProvider'
import { GoogleSignInButton } from './GoogleSignInButton'
import { BrandPanel } from './BrandPanel'
import { DemoPanel } from './DemoPanel'
import { SignUpPanel } from './SignUpPanel'
import { PasswordResetPanel } from './PasswordResetPanel'
import { useBackoff } from './use-backoff'
import './sign-in-page.css'

/** Client-side back-off after a server rate-limit (REQ-CR-260026); the server enforces the real limit. */
const RATE_LIMIT_BACKOFF_SECONDS = 15

/** Tab order for the Sign In / Sign Up tablist — drives roving focus and ArrowLeft/Right navigation. */
const AUTH_TABS = ['signin', 'signup'] as const
type AuthTab = (typeof AUTH_TABS)[number]
const AUTH_TAB_LABELS: Record<AuthTab, string> = { signin: 'Sign In', signup: 'Sign Up' }

interface SignInPageProps {
  client: ApolloClient
  googleClientId?: string
}

export function SignInPage({ client, googleClientId }: SignInPageProps) {
  const { signIn } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const backoff = useBackoff()
  const tabRefs = useRef<Record<AuthTab, HTMLButtonElement | null>>({ signin: null, signup: null })

  function handleSuccess(token: string, demo = false) {
    signIn(token, demo)
  }

  // Interpret a raw error message via the central mapper: friendly text for known auth codes, else
  // the raw message. A rate-limit outcome opens a client-side back-off (REQ-CR-260026).
  function applyAuthMessage(raw: string, fallback: string) {
    const outcome = mapAuthError(raw)
    if (outcome.kind === 'rate-limit') backoff.trigger(RATE_LIMIT_BACKOFF_SECONDS)
    setError(outcome.code ? outcome.message : (raw || fallback))
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await client.query<SignInResponse>({
        query: SIGN_IN_QUERY,
        variables: { email: identifier, password },
        fetchPolicy: 'network-only',
      })
      if (!data?.signin) {
        setError('Sign-in failed: no token returned.')
        return
      }
      handleSuccess(data.signin)
    } catch (err) {
      applyAuthMessage(err instanceof Error ? err.message : '', 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  async function signInAsDemoUser() {
    setError(null)
    setDemoLoading(true)
    try {
      const { data } = await client.query<SignInResponse>({
        query: SIGN_IN_QUERY,
        variables: { email: 'demo@demo.invalid', password: 'crystord-demo' },
        fetchPolicy: 'network-only',
      })
      if (!data?.signin) {
        setError('Demo sign-in failed.')
        return
      }
      handleSuccess(data.signin, true)
    } catch (err) {
      applyAuthMessage(err instanceof Error ? err.message : '', 'Demo sign-in failed.')
    } finally {
      setDemoLoading(false)
    }
  }

  const isSignUp = mode === 'signup'
  const busy = loading || demoLoading || backoff.active

  function switchMode(next: 'signin' | 'signup' | 'reset') {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  // WAI-ARIA tab pattern: ArrowLeft/Right move (wrapping) between tabs with focus following selection.
  function handleTabKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const current: AuthTab = isSignUp ? 'signup' : 'signin'
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const next = AUTH_TABS[(AUTH_TABS.indexOf(current) + delta + AUTH_TABS.length) % AUTH_TABS.length]!
    switchMode(next)
    tabRefs.current[next]?.focus()
  }

  if (mode === 'reset') {
    return (
      <div className="sign-in-page theme-force-light">
        <BrandPanel />
        <div className="sign-in-page__auth">
          <div className="sign-in-page__form-wrap">
            <h2 className="sign-in-page__panel-title">Reset Password</h2>
            <PasswordResetPanel
              client={client}
              onComplete={() => { switchMode('signin'); setNotice('Your password was reset — please sign in.') }}
              onBack={() => switchMode('signin')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sign-in-page theme-force-light">
      <BrandPanel />
      <div className="sign-in-page__auth">
        <div className="sign-in-page__form-wrap">
          <div role="tablist" aria-label="Authentication" className="sign-in-page__tabs"
            onKeyDown={handleTabKeyDown}>
            {AUTH_TABS.map((tab) => {
              const selected = tab === (isSignUp ? 'signup' : 'signin')
              return (
                <button
                  key={tab}
                  ref={(el) => { tabRefs.current[tab] = el }}
                  id={`auth-tab-${tab}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="auth-tabpanel"
                  tabIndex={selected ? 0 : -1}
                  className="sign-in-page__tab"
                  onClick={() => switchMode(tab)}
                >
                  {AUTH_TAB_LABELS[tab]}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" id="auth-tabpanel" aria-labelledby={`auth-tab-${isSignUp ? 'signup' : 'signin'}`}>
            <h2 className="sign-in-page__panel-title">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>

            {notice && <p role="status" className="sign-in-page__notice">{notice}</p>}
            {error && <p role="alert" className="sign-in-page__error">{error}</p>}

            {isSignUp ? (
              <SignUpPanel client={client} onSuccess={(token) => handleSuccess(token)} />
            ) : (
              <form onSubmit={handleSignIn} className="sign-in-page__form">
                <div className="sign-in-page__field">
                  <label htmlFor="identifier" className="sign-in-page__label">Username or Email</label>
                  <input id="identifier" className="sign-in-page__input" type="text"
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    required autoComplete="username" />
                </div>
                <div className="sign-in-page__field">
                  <label htmlFor="password" className="sign-in-page__label">Password</label>
                  <input id="password" className="sign-in-page__input" type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                </div>
                <div className="sign-in-page__actions">
                  <button type="submit" disabled={busy} className="sign-in-page__btn-primary">
                    {loading
                      ? 'Signing in…'
                      : backoff.active
                        ? `Try again in ${backoff.remaining}s`
                        : 'Sign In'}
                  </button>
                </div>
                <p className="sign-in-page__forgot">
                  <button type="button" className="sign-in-page__switch-btn"
                    onClick={() => switchMode('reset')}>
                    Forgot password?
                  </button>
                </p>
              </form>
            )}

            <div className="sign-in-page__divider">
              <span>{isSignUp ? 'or sign up with' : 'or sign in with'}</span>
            </div>

            {/*
              Google is intentionally NOT disabled during the credential back-off: it is a separate
              auth path (signinGoogle), and the GIS button is SDK-rendered. If the backend limit is
              IP-wide, Google simply fails and surfaces its own mapped message.
            */}
            {googleClientId && (
              <div className="sign-in-page__google">
                <GoogleSignInButton client={client} googleClientId={googleClientId}
                  onSuccess={(token) => handleSuccess(token)}
                  onError={(message) => applyAuthMessage(message, 'Google sign-in failed.')} />
              </div>
            )}

            <DemoPanel onTryDemo={signInAsDemoUser} loading={demoLoading} disabled={busy} />

            <p className="sign-in-page__switch">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" className="sign-in-page__switch-btn"
                onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
