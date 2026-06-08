import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ApolloClient } from '@apollo/client'
import { useNavigate } from 'react-router'
import { SIGN_IN_QUERY } from '../../api-contract/sign-in-query'
import type { SignInResponse } from '../../api-contract/sign-in-query'
import { SIGN_UP_QUERY } from '../../api-contract/auth-queries'
import type { SignUpResponse } from '../../api-contract/auth-queries'
import { useAuth } from './AuthProvider'
import { GoogleSignInButton } from './GoogleSignInButton'
import { C_ERROR } from '../../styles/tokens'

interface SignInPageProps {
  client: ApolloClient
  googleClientId?: string
}

export function SignInPage({ client, googleClientId }: SignInPageProps) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
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
    navigate('/', { replace: true })
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
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto' }}>
      <h1>Crystord</h1>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="identifier">{isSignUp ? 'Email' : 'Username or Email'}</label>
          <br />
          <input
            id="identifier"
            type={isSignUp ? 'email' : 'text'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete={isSignUp ? 'email' : 'username'}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && (
          <p role="alert" style={{ color: C_ERROR }}>{error}</p>
        )}
        <button type="submit" disabled={busy} style={{ padding: '0.5rem 1.5rem' }}>
          {loading ? (isSignUp ? 'Signing up…' : 'Signing in…') : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
      {googleClientId && (
        <GoogleSignInButton
          client={client}
          googleClientId={googleClientId}
          onSuccess={(token) => handleSuccess(token)}
          onError={setError}
        />
      )}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={signInAsDemoUser}
          disabled={busy}
          aria-label="Try a Demo — sign in as the demo user"
          style={{
            background: 'none',
            border: `1px solid var(--color-border)`,
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          {demoLoading ? 'Loading demo…' : 'Try a Demo'}
        </button>
      </div>
    </div>
  )
}
