import { gql } from '@apollo/client'

export const SIGN_IN_QUERY = gql`
  query SignIn($email: String!, $password: String!) {
    signin(email: $email, password: $password)
  }
`

export interface SignInResponse {
  signin: string
}
