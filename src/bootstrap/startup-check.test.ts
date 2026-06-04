import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { runStartupCompatibilityCheck } from './startup-check'
import type { SchemaInfoResponse } from '../api-contract'

function createMockClient(data: SchemaInfoResponse) {
  const client = new ApolloClient({
    link: new HttpLink({ uri: 'http://test/graphql' }),
    cache: new InMemoryCache(),
  })
  vi.spyOn(client, 'query').mockResolvedValue({
    data,
  } as Awaited<ReturnType<typeof client.query>>)
  return client
}

function createFailingClient(error: Error) {
  const client = new ApolloClient({
    link: new HttpLink({ uri: 'http://test/graphql' }),
    cache: new InMemoryCache(),
  })
  vi.spyOn(client, 'query').mockRejectedValue(error)
  return client
}

describe('runStartupCompatibilityCheck', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns compatible when schema version matches range', async () => {
    const client = createMockClient({
      schemaInfo: { schemaVersion: '2.0.1', schemaHash: 'abc', releasedAt: '2026-05-27T00:00:00Z' },
    })

    const result = await runStartupCompatibilityCheck(client, '^2.0.0')
    expect(result.compatible).toBe(true)
    expect(result.schemaVersion).toBe('2.0.1')
  })

  it('returns incompatible when schema version is outside range', async () => {
    const client = createMockClient({
      schemaInfo: { schemaVersion: '1.9.0', schemaHash: 'abc', releasedAt: '2026-05-14T00:00:00Z' },
    })

    const result = await runStartupCompatibilityCheck(client, '^2.0.0')
    expect(result.compatible).toBe(false)
    expect(result.message).toContain('outside supported range')
  })

  it('propagates network errors', async () => {
    const client = createFailingClient(new Error('Network error'))
    await expect(runStartupCompatibilityCheck(client, '^2.0.0')).rejects.toThrow('Network error')
  })
})
