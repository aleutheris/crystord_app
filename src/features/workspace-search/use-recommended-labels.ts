import { useState, useEffect } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { LIST_LABELS_QUERY } from '../../api-contract/graph-queries'
import type { ListLabelsResponse } from '../../api-contract/graph-queries'

const RECOMMENDATION_CAP = 3

function pickRandom(labels: string[], count: number): string[] {
  const shuffled = [...labels].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function useRecommendedLabels(): string[] {
  const client = useApolloClient()
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    void client
      .query<ListLabelsResponse>({
        query: LIST_LABELS_QUERY,
        variables: { prefix: '' },
        fetchPolicy: 'cache-first',
      })
      .then(({ data }) => {
        setLabels(pickRandom(data?.listLabels ?? [], RECOMMENDATION_CAP))
      })
      .catch(() => {
        // best-effort: recommendations silently absent on failure
      })
  }, [client])

  return labels
}
