import { describe, it, expect } from 'vitest'
import { print, type DocumentNode, type OperationDefinitionNode } from 'graphql'
import {
  BEGIN_SIGNUP_MUTATION,
  COMPLETE_SIGNUP_MUTATION,
  LOGOUT_MUTATION,
  REVOKE_ALL_SESSIONS_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  CONFIRM_PASSWORD_RESET_MUTATION,
  REQUEST_EMAIL_CHANGE_MUTATION,
  CONFIRM_EMAIL_CHANGE_MUTATION,
  ME_QUERY,
  SET_PASSWORD_MUTATION,
  UNLINK_AUTH_METHOD_MUTATION,
  LINK_GOOGLE_MUTATION,
  DELETE_MY_ACCOUNT_MUTATION,
} from './auth-operations'

interface Case {
  name: string
  doc: DocumentNode
  operation: 'mutation' | 'query'
  contains: string[]
}

const CASES: Case[] = [
  { name: 'beginSignup', doc: BEGIN_SIGNUP_MUTATION, operation: 'mutation', contains: ['beginSignup(email: $email)', '$email: String!'] },
  { name: 'completeSignup', doc: COMPLETE_SIGNUP_MUTATION, operation: 'mutation', contains: ['completeSignup(', '$code: String!', '$password: String!', '$username: String!'] },
  { name: 'logout', doc: LOGOUT_MUTATION, operation: 'mutation', contains: ['logout'] },
  { name: 'revokeAllSessions', doc: REVOKE_ALL_SESSIONS_MUTATION, operation: 'mutation', contains: ['revokeAllSessions'] },
  { name: 'requestPasswordReset', doc: REQUEST_PASSWORD_RESET_MUTATION, operation: 'mutation', contains: ['requestPasswordReset(email: $email)'] },
  { name: 'confirmPasswordReset', doc: CONFIRM_PASSWORD_RESET_MUTATION, operation: 'mutation', contains: ['confirmPasswordReset(token: $token, newPassword: $newPassword)'] },
  { name: 'requestEmailChange', doc: REQUEST_EMAIL_CHANGE_MUTATION, operation: 'mutation', contains: ['requestEmailChange(newEmail: $newEmail)'] },
  { name: 'confirmEmailChange', doc: CONFIRM_EMAIL_CHANGE_MUTATION, operation: 'mutation', contains: ['confirmEmailChange(code: $code)'] },
  { name: 'me', doc: ME_QUERY, operation: 'query', contains: ['me', 'username', 'email', 'emailVerified', 'authMethods'] },
  { name: 'setPassword', doc: SET_PASSWORD_MUTATION, operation: 'mutation', contains: ['setPassword(newPassword: $newPassword)'] },
  { name: 'unlinkAuthMethod', doc: UNLINK_AUTH_METHOD_MUTATION, operation: 'mutation', contains: ['unlinkAuthMethod(method: $method)'] },
  { name: 'linkGoogle', doc: LINK_GOOGLE_MUTATION, operation: 'mutation', contains: ['linkGoogle(idToken: $idToken)'] },
  { name: 'deleteMyAccount', doc: DELETE_MY_ACCOUNT_MUTATION, operation: 'mutation', contains: ['deleteMyAccount'] },
]

describe('auth-operations documents', () => {
  it('defines exactly the 13 schema-8.1.0 auth operations', () => {
    expect(CASES).toHaveLength(13)
  })

  it.each(CASES)('$name is a valid $operation document with the expected selection', ({ doc, operation, contains }) => {
    expect(doc.kind).toBe('Document')
    const def = doc.definitions[0] as OperationDefinitionNode
    expect(def.operation).toBe(operation)
    const printed = print(doc)
    for (const fragment of contains) {
      expect(printed).toContain(fragment)
    }
  })
})
