import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./config', () => ({
  getConfig: () => ({
    graphqlEndpoint: 'http://localhost:5665/graphql',
    supportedSchemaRange: '^1.0.0',
  }),
}))

vi.mock('./api-contract', async () => {
  const actual = await vi.importActual('./api-contract')
  return {
    ...actual,
    createApolloClient: vi.fn(),
  }
})

vi.mock('./bootstrap', () => ({
  runStartupCompatibilityCheck: vi.fn(),
}))

import { createApolloClient } from './api-contract'
import { runStartupCompatibilityCheck } from './bootstrap'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const mockCreateClient = vi.mocked(createApolloClient)
const mockStartupCheck = vi.mocked(runStartupCompatibilityCheck)

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockCreateClient.mockReturnValue(new ApolloClient({
      link: new HttpLink({ uri: 'http://test/graphql' }),
      cache: new InMemoryCache(),
    }))
  })

  it('shows loading screen initially', () => {
    mockStartupCheck.mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText(/starting crystord/i)).toBeInTheDocument()
  })

  it('shows sign-in page on compatible schema', async () => {
    mockStartupCheck.mockResolvedValue({
      compatible: true,
      schemaVersion: '1.2.0',
      supportedRange: '^1.0.0',
      message: 'Schema version 1.2.0 is compatible.',
    })

    render(<App />)
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error screen on incompatible schema', async () => {
    mockStartupCheck.mockResolvedValue({
      compatible: false,
      schemaVersion: '2.0.0',
      supportedRange: '^1.0.0',
      message: 'Backend schema version 2.0.0 is outside supported range ^1.0.0.',
    })

    render(<App />)
    expect(await screen.findByText(/incompatible backend/i)).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('2.0.0')
  })

  it('shows startup error on network failure', async () => {
    mockStartupCheck.mockRejectedValue(new Error('Failed to fetch'))

    render(<App />)
    expect(await screen.findByText(/startup failed/i)).toBeInTheDocument()
    expect(await screen.findByText(/failed to fetch/i)).toBeInTheDocument()
  })
})
