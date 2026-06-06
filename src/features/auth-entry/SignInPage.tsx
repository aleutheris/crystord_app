import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ApolloClient } from '@apollo/client'
import { useNavigate } from 'react-router'
import { SIGN_IN_QUERY } from '../../api-contract/sign-in-query'
import type { SignInResponse } from '../../api-contract/sign-in-query'
import { useAuth } from './AuthProvider'
import { C_ERROR } from '../../styles/tokens'

interface SignInPageProps {
  client: ApolloClient
}

export function SignInPage({ client }: SignInPageProps) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data } = await client.query<SignInResponse>({
        query: SIGN_IN_QUERY,
        variables: { email, password },
        fetchPolicy: 'network-only',
      })

      if (!data?.signin) {
        setError('Sign-in failed: no token returned.')
        return
      }

      signIn(data.signin)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto' }}>
      <h1>Crystord</h1>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
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
            autoComplete="current-password"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && (
          <p role="alert" style={{ color: C_ERROR }}>{error}</p>
        )}
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.5rem' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
