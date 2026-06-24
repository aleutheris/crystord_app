import { gql } from '@apollo/client'

export const SIGN_IN_GOOGLE_QUERY = gql`
  query SignInGoogle($idToken: String!) {
    signinGoogle(idToken: $idToken)
  }
`

export interface SignInGoogleResponse {
  signinGoogle: string
}

// The old single-step `signup` mutation was removed in schema 8.1.0 — replaced by the verify-first
// flow (`beginSignup` / `completeSignup`) in `auth-operations.ts` (BI-260055 / ADR-260055).
