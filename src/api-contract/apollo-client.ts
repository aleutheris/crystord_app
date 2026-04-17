import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client'
import { getAuthToken } from './auth-token'

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

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })
}
