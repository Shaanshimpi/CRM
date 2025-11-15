import { useState, useEffect } from 'react'
import type { KanbanData } from '../../../endpoints/opportunities/kanban'

export function useKanbanData(pipelineId: string | null, apiUrl: string = '/api') {
  const [data, setData] = useState<KanbanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pipelineId) {
      setData(null)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiUrl}/kanban/opportunities?pipeline=${pipelineId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch Kanban data')
        }

        const result: KanbanData = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pipelineId, apiUrl])

  const refetch = async () => {
    if (!pipelineId) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/kanban/opportunities?pipeline=${pipelineId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Kanban data')
      }

      const result: KanbanData = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

