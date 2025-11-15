import React, { useState, useEffect } from 'react'

interface Pipeline {
  id: string
  name: string
  isActive: boolean
}

interface KanbanHeaderProps {
  selectedPipelineId: string | null
  onPipelineChange: (pipelineId: string) => void
  apiUrl?: string
}

export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  selectedPipelineId,
  onPipelineChange,
  apiUrl = '/api',
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPipelines = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${apiUrl}/pipelines?where[isActive][equals]=true&limit=100`)
        if (response.ok) {
          const data = await response.json()
          setPipelines(data.docs || [])
          
          // Auto-select first pipeline if none selected
          if (!selectedPipelineId && data.docs && data.docs.length > 0) {
            onPipelineChange(data.docs[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch pipelines:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPipelines()
  }, [apiUrl, selectedPipelineId, onPipelineChange])

  return (
    <div className="kanban-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className="kanban-header-title">Opportunities</h2>
        {!loading && pipelines.length > 0 && (
          <select
            value={selectedPipelineId || ''}
            onChange={(e) => onPipelineChange(e.target.value)}
            className="kanban-select"
          >
            <option value="">Select Pipeline</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        )}
        {loading && (
          <div className="kanban-spinner" />
        )}
      </div>
    </div>
  )
}

