import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { getAuthToken } from './auth-token'
import { triggerSessionExpired } from './session-expired'
import { isReauthMessage } from './error-codes'

/**
 * Decide whether an Apollo link error means the session is gone and the user must re-authenticate.
 *
 * Detects three signals:
 *  - HTTP 401 (transport-level),
 *  - the legacy `extensions.code === 'UNAUTHENTICATED'`, and
 *  - schema-8.1.0's `AUTHZ-AUTHENTICATION-REQUIRED`, carried in the GraphQL error *message*
 *    (BI-260054 / REQ-FR-260064). The previous detector missed the message form, silently failing on
 *    8.1.0.
 */
export function resolveLinkErrorReauth(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode
  if (statusCode === 401) {
    return true
  }
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      (e) => e.extensions?.['code'] === 'UNAUTHENTICATED' || isReauthMessage(e.message),
    )
  }
  return false
}

/**
 * Build the link that attaches `Authorization: Bearer <token>` to every operation when a session
 * token is present (BI-260054 / REQ-FR-260068 — token on all gated operations). No token → forwarded
 * unchanged so public ops (schemaInfo, signin, …) work pre-auth.
 */
export function createAuthLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const token = getAuthToken()
    if (token) {
      operation.setContext({
        headers: { authorization: `Bearer ${token}` },
      })
    }
    return forward(operation)
  })
}

/** Glue: on a re-auth signal, fire the session-expired channel (which routes the user to sign-in). */
export function handleLinkError(error: unknown, onReauth: () => void): void {
  if (resolveLinkErrorReauth(error)) {
    onReauth()
  }
}

/** ErrorLink callback: route a re-auth signal to the shared session-expired channel. */
export function onLinkError({ error }: { error: unknown }): void {
  handleLinkError(error, triggerSessionExpired)
}

/** Cache merge for `retrieve`: replace, don't merge — each search returns a fresh, authoritative set. */
export function mergeRetrieve<T>(_existing: T, incoming: T): T {
  return incoming
}

export function createApolloClient(graphqlEndpoint: string): ApolloClient {
  const httpLink = new HttpLink({ uri: graphqlEndpoint })
  const authLink = createAuthLink()
  const errorLink = new ErrorLink(onLinkError)

  return new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            retrieve: {
              merge: mergeRetrieve,
            },
          },
        },
        Atom: {
          keyFields: ['properties', ['shellies', 'uuid']],
        },
      },
    }),
  })
}
