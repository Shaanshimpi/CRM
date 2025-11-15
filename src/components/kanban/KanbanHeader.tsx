import React, { useState, useEffect, useCallback } from 'react'
import { PipelineModal } from './PipelineModal'

interface Pipeline {
  id: string
  name: string
  isActive: boolean
  description?: string
  color?: string
}

interface KanbanHeaderProps {
  selectedPipelineId: string | null
  onPipelineChange: (pipelineId: string) => void
  onPipelineCreated?: () => void
  onStagesManage?: () => void
  apiUrl?: string
}

export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  selectedPipelineId,
  onPipelineChange,
  onPipelineCreated,
  onStagesManage,
  apiUrl = '/api',
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreatePipeline, setShowCreatePipeline] = useState(false)

  const fetchPipelines = useCallback(async () => {
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
  }, [apiUrl, selectedPipelineId, onPipelineChange])

  useEffect(() => {
    fetchPipelines()
  }, [fetchPipelines])

  const handleCreatePipeline = async (pipelineData: Omit<Pipeline, 'id'>) => {
    try {
      const response = await fetch(`${apiUrl}/pipelines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pipelineData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create pipeline' }))
        throw new Error(error.message || 'Failed to create pipeline')
      }

      const created = await response.json()
      await fetchPipelines()
      onPipelineChange(created.doc.id)
      setShowCreatePipeline(false)
      onPipelineCreated?.()
    } catch (error) {
      throw error
    }
  }

  return (
    <>
      <div className="kanban-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {selectedPipelineId && onStagesManage && (
            <button
              type="button"
              onClick={onStagesManage}
              className="kanban-button kanban-button-secondary"
              title="Manage Stages"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Manage Stages
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreatePipeline(true)}
            className="kanban-button kanban-button-primary"
            title="Create Pipeline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Pipeline
          </button>
        </div>
      </div>

      {showCreatePipeline && (
        <PipelineModal
          isOpen={showCreatePipeline}
          onClose={() => setShowCreatePipeline(false)}
          onSave={handleCreatePipeline}
          apiUrl={apiUrl}
        />
      )}
    </>
  )
}

