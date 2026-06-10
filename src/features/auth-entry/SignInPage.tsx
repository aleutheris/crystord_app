import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ApolloClient } from '@apollo/client'
import { SIGN_IN_QUERY } from '../../api-contract/sign-in-query'
import type { SignInResponse } from '../../api-contract/sign-in-query'
import { SIGN_UP_QUERY } from '../../api-contract/auth-queries'
import type { SignUpResponse } from '../../api-contract/auth-queries'
import { useAuth } from './AuthProvider'
import { GoogleSignInButton } from './GoogleSignInButton'
import { BrandPanel } from './BrandPanel'
import { DemoPanel } from './DemoPanel'
import './sign-in-page.css'

interface SignInPageProps {
  client: ApolloClient
  googleClientId?: string
}

export function SignInPage({ client, googleClientId }: SignInPageProps) {
  const { signIn } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  // identifier holds username OR email for sign-in; always an email for sign-up
  // sent as `email` param to the backend in both cases (REQ-OR-260013 compatibility shim)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  function handleSuccess(token: string, demo = false) {
    signIn(token, demo)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data } = await client.query<SignUpResponse>({
          query: SIGN_UP_QUERY,
          variables: { email: identifier, password },
          fetchPolicy: 'network-only',
        })
        if (!data?.signup) {
          setError('Sign-up failed: no token returned.')
          return
        }
        handleSuccess(data.signup)
      } else {
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
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
        variables: { email: 'demo', password: 'demo' },
        fetchPolicy: 'network-only',
      })
      if (!data?.signin) {
        setError('Demo sign-in failed.')
        return
      }
      handleSuccess(data.signin, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.')
    } finally {
      setDemoLoading(false)
    }
  }

  const isSignUp = mode === 'signup'
  const busy = loading || demoLoading

  return (
    <div className="sign-in-page">
      <BrandPanel />
      <div className="sign-in-page__auth">
        <div className="sign-in-page__form-wrap">
          <div role="tablist" className="sign-in-page__tabs">
            <button
              role="tab"
              aria-selected={!isSignUp}
              className="sign-in-page__tab"
              onClick={() => { setMode('signin'); setError(null) }}
              type="button"
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={isSignUp}
              className="sign-in-page__tab"
              onClick={() => { setMode('signup'); setError(null) }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <div role="tabpanel">
            <h2 className="sign-in-page__panel-title">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>

            <form onSubmit={handleSubmit} className="sign-in-page__form">
              <div className="sign-in-page__field">
                <label htmlFor="identifier" className="sign-in-page__label">
                  {isSignUp ? 'Email' : 'Username or Email'}
                </label>
                <input
                  id="identifier"
                  className="sign-in-page__input"
                  type={isSignUp ? 'email' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'email' : 'username'}
                />
              </div>
              <div className="sign-in-page__field">
                <label htmlFor="password" className="sign-in-page__label">Password</label>
                <input
                  id="password"
                  className="sign-in-page__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>

              {error && (
                <p role="alert" className="sign-in-page__error">{error}</p>
              )}

              <div className="sign-in-page__actions">
                <button type="submit" disabled={busy} className="sign-in-page__btn-primary">
                  {loading
                    ? (isSignUp ? 'Signing up…' : 'Signing in…')
                    : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
              </div>
            </form>

            <div className="sign-in-page__divider">
              <span>{isSignUp ? 'or sign up with' : 'or sign in with'}</span>
            </div>

            {googleClientId && (
              <GoogleSignInButton
                client={client}
                googleClientId={googleClientId}
                onSuccess={(token) => handleSuccess(token)}
                onError={setError}
              />
            )}

            <DemoPanel
              onTryDemo={signInAsDemoUser}
              loading={demoLoading}
              disabled={busy}
            />

            <p className="sign-in-page__switch">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="sign-in-page__switch-btn"
                onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null) }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
