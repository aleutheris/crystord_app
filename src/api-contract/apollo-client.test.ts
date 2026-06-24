import { describe, it, expect, vi, afterEach } from 'vitest'
import { ApolloClient } from '@apollo/client'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import {
  createApolloClient,
  resolveLinkErrorReauth,
  createAuthLink,
  handleLinkError,
  onLinkError,
  mergeRetrieve,
} from './apollo-client'
import { setAuthToken } from './auth-token'
import { onSessionExpired } from './session-expired'

afterEach(() => {
  vi.restoreAllMocks()
  setAuthToken(null)
})

/** Invoke an ApolloLink's request handler directly (no transport), capturing forward + context. */
function runLink(link: ReturnType<typeof createAuthLink>, operation: unknown, forward: unknown) {
  return (link as unknown as {
    request: (op: unknown, fwd: unknown) => unknown
  }).request(operation, forward)
}

describe('createApolloClient', () => {
  it('builds an ApolloClient for the given endpoint', () => {
    expect(createApolloClient('http://localhost:5665/graphql')).toBeInstanceOf(ApolloClient)
  })
})

describe('createAuthLink', () => {
  it('attaches an Authorization: Bearer header when a token is set, and forwards', () => {
    setAuthToken('tok-123')
    let context: Record<string, unknown> = {}
    const operation = { setContext: (next: Record<string, unknown>) => { context = { ...context, ...next } } }
    const forward = vi.fn().mockReturnValue('FORWARDED')

    const result = runLink(createAuthLink(), operation, forward)

    expect(context.headers).toEqual({ authorization: 'Bearer tok-123' })
    expect(forward).toHaveBeenCalledWith(operation)
    expect(result).toBe('FORWARDED')
  })

  it('forwards without setting a header when no token is present', () => {
    setAuthToken(null)
    const operation = { setContext: vi.fn() }
    const forward = vi.fn().mockReturnValue('FWD')

    runLink(createAuthLink(), operation, forward)

    expect(operation.setContext).not.toHaveBeenCalled()
    expect(forward).toHaveBeenCalledWith(operation)
  })
})

describe('handleLinkError', () => {
  it('fires the reauth callback on a re-auth signal', () => {
    const onReauth = vi.fn()
    handleLinkError({ statusCode: 401 }, onReauth)
    expect(onReauth).toHaveBeenCalledOnce()
  })

  it('does nothing for a non-reauth error', () => {
    const onReauth = vi.fn()
    handleLinkError({ statusCode: 500 }, onReauth)
    expect(onReauth).not.toHaveBeenCalled()
  })
})

describe('onLinkError', () => {
  it('routes a re-auth error to the session-expired channel', () => {
    const cb = vi.fn()
    onSessionExpired(cb)
    onLinkError({ error: { statusCode: 401 } })
    expect(cb).toHaveBeenCalledOnce()
  })

  it('leaves the session intact for a non-reauth error', () => {
    const cb = vi.fn()
    onSessionExpired(cb)
    onLinkError({ error: { statusCode: 500 } })
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('mergeRetrieve', () => {
  it('returns the incoming value (replace, not merge)', () => {
    expect(mergeRetrieve(['stale'], ['fresh'])).toEqual(['fresh'])
  })
})

describe('resolveLinkErrorReauth', () => {
  it('returns true for an HTTP 401 transport error', () => {
    expect(resolveLinkErrorReauth({ statusCode: 401 })).toBe(true)
  })

  it('returns false for a non-401, non-GraphQL error', () => {
    expect(resolveLinkErrorReauth({ statusCode: 500 })).toBe(false)
    expect(resolveLinkErrorReauth(new Error('network down'))).toBe(false)
  })

  it('returns true when a GraphQL error message carries AUTHZ-AUTHENTICATION-REQUIRED (8.1.0)', () => {
    vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(true)
    const error = { errors: [{ message: 'GraphQL error: AUTHZ-AUTHENTICATION-REQUIRED' }] }
    expect(resolveLinkErrorReauth(error)).toBe(true)
  })

  it('returns true for the legacy extensions.code === UNAUTHENTICATED', () => {
    vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(true)
    const error = { errors: [{ message: 'unauthenticated', extensions: { code: 'UNAUTHENTICATED' } }] }
    expect(resolveLinkErrorReauth(error)).toBe(true)
  })

  it('returns false for a GraphQL error that is not an auth-required signal', () => {
    vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(true)
    const error = { errors: [{ message: 'GraphQL error: PASSWORD-TOO-SHORT' }] }
    expect(resolveLinkErrorReauth(error)).toBe(false)
  })
})
