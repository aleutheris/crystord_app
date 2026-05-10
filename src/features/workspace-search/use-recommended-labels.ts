import { useState, useEffect } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { LIST_LABELS_QUERY } from '../../api-contract/graph-queries'

export function useRecommendedLabels(): string[] {
  const client = useApolloClient()
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    void client
      .query<{ list_labels: string[] }>({
        query: LIST_LABELS_QUERY,
        variables: { prefix: '' },
        fetchPolicy: 'cache-first',
      })
      .then(({ data }) => {
        setLabels(data?.list_labels ?? [])
      })
      .catch(() => {
        // best-effort: recommendations silently absent on failure
      })
  }, [client])

  return labels
}
