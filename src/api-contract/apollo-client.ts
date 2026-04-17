import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

export function createApolloClient(graphqlEndpoint: string): ApolloClient {
  return new ApolloClient({
    link: new HttpLink({ uri: graphqlEndpoint }),
    cache: new InMemoryCache(),
  })
}
