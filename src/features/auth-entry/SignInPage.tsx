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

  function handleSuccess(token: string) {
    signIn(token)
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

  const isSignUp = mode === 'signup'

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
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.5rem' }}>
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
          onSuccess={handleSuccess}
          onError={setError}
        />
      )}
    </div>
  )
}
