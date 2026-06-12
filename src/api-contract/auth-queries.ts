import { gql } from '@apollo/client'

export const SIGN_IN_GOOGLE_QUERY = gql`
  query SignInGoogle($idToken: String!) {
    signinGoogle(idToken: $idToken)
  }
`

export interface SignInGoogleResponse {
  signinGoogle: string
}

export const SIGN_UP_QUERY = gql`
  mutation SignUp($email: String!, $password: String!) {
    signup(email: $email, password: $password)
  }
`

export interface SignUpResponse {
  signup: string
}
