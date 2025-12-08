import React, { useState } from 'react'
import { PipelineModal } from './PipelineModal'

export interface Pipeline {
  id: string
  name: string
  isActive: boolean
  description?: string
  color?: string
}

interface UserOption {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

interface KanbanHeaderProps {
  selectedPipelineId: string | null
  onPipelineChange: (pipelineId: string) => void
  selectedOwnerId: string | null
  onOwnerChange: (ownerId: string | null) => void
  owners: UserOption[]
  ownersLoading?: boolean
  pipelines: Pipeline[]
  pipelinesLoading?: boolean
  onPipelineCreated?: () => void
  onStagesManage?: () => void
  onNewOpportunity?: () => void
  apiUrl?: string
}

export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
  selectedPipelineId,
  selectedOwnerId,
  onPipelineChange,
  onOwnerChange,
  pipelines,
  pipelinesLoading = false,
  owners,
  ownersLoading = false,
  onPipelineCreated,
  onStagesManage,
  onNewOpportunity,
  apiUrl = '/api',
}) => {
  const [showCreatePipeline, setShowCreatePipeline] = useState(false)

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="kanban-header-title">Opportunities</h2>
            {!pipelinesLoading && pipelines && Array.isArray(pipelines) && pipelines.length > 0 && (
              <select
                value={selectedPipelineId ? String(selectedPipelineId) : ''}
                onChange={(e) => {
                  const newPipelineId = e.target.value
                  const selectedPipeline = pipelines.find(p => String(p.id) === newPipelineId)
                  console.log('[KanbanHeader] Pipeline changed:', {
                    newPipelineId,
                    selectedPipelineName: selectedPipeline?.name,
                    availablePipelines: pipelines.map(p => ({ id: String(p.id), name: p.name })),
                  })
                  onPipelineChange(newPipelineId)
                }}
                className="kanban-select"
              >
                <option value="">Select Pipeline</option>
                {pipelines.map((pipeline) => {
                  const pipelineIdStr = String(pipeline.id)
                  const isSelected = selectedPipelineId && String(selectedPipelineId) === pipelineIdStr
                  return (
                    <option key={pipelineIdStr} value={pipelineIdStr}>
                      {pipeline.name}
                    </option>
                  )
                })}
              </select>
            )}
            {pipelinesLoading && (
              <div className="kanban-spinner" />
            )}
          </div>
          {selectedPipelineId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.8)' }}>
                Filter by owner
              </label>
              <select
                value={selectedOwnerId || ''}
                onChange={(e) => onOwnerChange(e.target.value || null)}
                className="kanban-select"
                style={{ minWidth: '220px' }}
              >
                <option value="">All owners</option>
                {owners.map((owner) => {
                  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim()
                  const label = name ? `${name} (${owner.email})` : owner.email
                  return (
                    <option key={owner.id} value={owner.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
              {ownersLoading && <div className="kanban-spinner" style={{ width: '18px', height: '18px' }} />}
              {selectedOwnerId && (
                <button
                  type="button"
                  onClick={() => onOwnerChange(null)}
                  className="kanban-button kanban-button-secondary"
                  style={{ padding: '0.35rem 0.75rem' }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {selectedPipelineId && onNewOpportunity && (
            <button
              type="button"
              onClick={onNewOpportunity}
              className="kanban-button kanban-button-primary"
              title="Create New Opportunity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Opportunity
            </button>
          )}
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
            className="kanban-button kanban-button-secondary"
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

