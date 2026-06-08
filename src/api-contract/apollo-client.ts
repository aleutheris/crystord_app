import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { getAuthToken } from './auth-token'
import { triggerSessionExpired } from './session-expired'

export function createApolloClient(graphqlEndpoint: string): ApolloClient {
  const httpLink = new HttpLink({ uri: graphqlEndpoint })

  const authLink = new ApolloLink((operation, forward) => {
    const token = getAuthToken()
    if (token) {
      operation.setContext({
        headers: { authorization: `Bearer ${token}` },
      })
    }
    return forward(operation)
  })

  const errorLink = new ErrorLink(({ error }) => {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 401) {
      triggerSessionExpired()
      return
    }
    if (CombinedGraphQLErrors.is(error)) {
      const hasUnauthenticated = error.errors.some(
        (e) => e.extensions?.['code'] === 'UNAUTHENTICATED',
      )
      if (hasUnauthenticated) {
        triggerSessionExpired()
      }
    }
  })

  return new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            retrieve: {
              merge(_existing, incoming) {
                return incoming
              },
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
