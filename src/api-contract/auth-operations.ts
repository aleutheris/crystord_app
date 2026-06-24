import { gql } from '@apollo/client'

/**
 * Schema-8.1.0 authentication & account-management GraphQL documents (BI-260054 / REQ-OR-260016).
 *
 * These documents are the contract surface consumed by later epic slices (sign-up, sessions, password
 * reset, account settings). Adding them here keeps `api-contract` the single GraphQL boundary; this
 * slice only defines them — the UI wiring lands in BI-260055…BI-260060.
 *
 * Return shapes follow the migration notes; operations whose payload is unspecified are modelled as
 * `boolean` acknowledgements and can be refined by the consuming slice without breaking callers.
 */

// --- Sign-up (verify-first) -------------------------------------------------

export const BEGIN_SIGNUP_MUTATION = gql`
  mutation BeginSignup($email: String!) {
    beginSignup(email: $email)
  }
`

export interface BeginSignupResponse {
  /** Always `true` (anti-enumeration) — never use it to infer account existence. */
  beginSignup: boolean
}

export const COMPLETE_SIGNUP_MUTATION = gql`
  mutation CompleteSignup($email: String!, $code: String!, $password: String!, $username: String!) {
    completeSignup(email: $email, code: $code, password: $password, username: $username)
  }
`

export interface CompleteSignupResponse {
  /** A session token. */
  completeSignup: string
}

// --- Sessions ---------------------------------------------------------------

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`

export interface LogoutResponse {
  logout: boolean
}

export const REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation RevokeAllSessions {
    revokeAllSessions
  }
`

export interface RevokeAllSessionsResponse {
  revokeAllSessions: boolean
}

// --- Password reset (public) ------------------------------------------------

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`

export interface RequestPasswordResetResponse {
  requestPasswordReset: boolean
}

export const CONFIRM_PASSWORD_RESET_MUTATION = gql`
  mutation ConfirmPasswordReset($token: String!, $newPassword: String!) {
    confirmPasswordReset(token: $token, newPassword: $newPassword)
  }
`

export interface ConfirmPasswordResetResponse {
  confirmPasswordReset: boolean
}

// --- Email change (auth required) -------------------------------------------

export const REQUEST_EMAIL_CHANGE_MUTATION = gql`
  mutation RequestEmailChange($newEmail: String!) {
    requestEmailChange(newEmail: $newEmail)
  }
`

export interface RequestEmailChangeResponse {
  requestEmailChange: boolean
}

export const CONFIRM_EMAIL_CHANGE_MUTATION = gql`
  mutation ConfirmEmailChange($code: String!) {
    confirmEmailChange(code: $code)
  }
`

export interface ConfirmEmailChangeResponse {
  confirmEmailChange: boolean
}

// --- Account & auth methods (auth required) ---------------------------------

export const ME_QUERY = gql`
  query Me {
    me {
      username
      email
      emailVerified
      authMethods
    }
  }
`

export interface AccountInfo {
  username: string
  email: string
  emailVerified: boolean
  authMethods: string[]
}

export interface MeResponse {
  me: AccountInfo
}

export const SET_PASSWORD_MUTATION = gql`
  mutation SetPassword($newPassword: String!) {
    setPassword(newPassword: $newPassword)
  }
`

export interface SetPasswordResponse {
  setPassword: boolean
}

export const UNLINK_AUTH_METHOD_MUTATION = gql`
  mutation UnlinkAuthMethod($method: String!) {
    unlinkAuthMethod(method: $method)
  }
`

export interface UnlinkAuthMethodResponse {
  unlinkAuthMethod: boolean
}

export const LINK_GOOGLE_MUTATION = gql`
  mutation LinkGoogle($idToken: String!) {
    linkGoogle(idToken: $idToken)
  }
`

export interface LinkGoogleResponse {
  linkGoogle: boolean
}

export const DELETE_MY_ACCOUNT_MUTATION = gql`
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`

export interface DeleteMyAccountResponse {
  deleteMyAccount: boolean
}
