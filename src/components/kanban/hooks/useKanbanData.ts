import { useState, useEffect, useCallback, useRef } from 'react'
import type { KanbanData } from '../../../endpoints/opportunities/kanban'

const buildKanbanUrl = (apiUrl: string, pipelineId: string | null, ownerId?: string | null) => {
  const params = new URLSearchParams({
    pipeline: String(pipelineId || ''), // Ensure it's a string
  })

  if (ownerId) {
    params.append('assignedTo', ownerId)
  }

  return `${apiUrl}/kanban/opportunities?${params.toString()}`
}

export function useKanbanData(
  pipelineId: string | null,
  apiUrl: string = '/api',
  ownerId: string | null = null,
) {
  const [data, setData] = useState<KanbanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!pipelineId) {
      setData(null)
      return
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const abortController = new AbortController()
    abortRef.current = abortController

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildKanbanUrl(apiUrl, pipelineId, ownerId), {
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Kanban data')
      }

      const result: KanbanData = await response.json()
      // Only apply result if this request is the latest and not aborted
      if (!abortController.signal.aborted && fetchId === fetchIdRef.current) {
        setData(result)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      if (abortRef.current === abortController) {
        abortRef.current = null
      }
    }
  }, [apiUrl, ownerId, pipelineId])

  useEffect(() => {
    void fetchData()
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }
  }, [fetchData])

  const refetch = async () => {
    if (!pipelineId) return
    await fetchData()
  }

  return { data, loading, error, refetch }
}

