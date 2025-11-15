import React, { useState, useEffect } from 'react'
import { StageModal } from './StageModal'

interface Stage {
  id: string
  name: string
  description?: string
  color?: string
  order: number
  isDefault: boolean
  isClosedStage: boolean
  closedType?: 'won' | 'lost'
  pipeline: string
}

interface StageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  pipelineId: string
  onStagesUpdated?: () => void
  apiUrl?: string
}

export const StageManagementModal: React.FC<StageManagementModalProps> = ({
  isOpen,
  onClose,
  pipelineId,
  onStagesUpdated,
  apiUrl = '/api',
}) => {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | undefined>(undefined)
  const [showCreateStage, setShowCreateStage] = useState(false)
  const [reordering, setReordering] = useState<string | null>(null)

  const fetchStages = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${apiUrl}/stages?where[pipeline][equals]=${pipelineId}&sort=order&limit=100`
      )
      if (response.ok) {
        const data = await response.json()
        setStages(data.docs || [])
      }
    } catch (error) {
      console.error('Failed to fetch stages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && pipelineId) {
      fetchStages()
    }
  }, [isOpen, pipelineId, apiUrl])

  const handleSaveStage = async (stageData: Omit<Stage, 'id'>) => {
    try {
      if (editingStage) {
        // Update existing stage
        const response = await fetch(`${apiUrl}/stages/${editingStage.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stageData),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to update stage' }))
          throw new Error(error.message || 'Failed to update stage')
        }
      } else {
        // Create new stage
        const response = await fetch(`${apiUrl}/stages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stageData),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to create stage' }))
          throw new Error(error.message || 'Failed to create stage')
        }
      }

      await fetchStages()
      setEditingStage(undefined)
      setShowCreateStage(false)
      onStagesUpdated?.()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Are you sure you want to delete this stage? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}/stages/${stageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete stage' }))
        throw new Error(error.message || 'Failed to delete stage')
      }

      await fetchStages()
      onStagesUpdated?.()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete stage')
    }
  }

  const handleMoveStage = async (stageId: string, direction: 'up' | 'down') => {
    const currentIndex = stages.findIndex((s) => s.id === stageId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= stages.length) return

    setReordering(stageId)

    // Create new order
    const newStages = [...stages]
    const [moved] = newStages.splice(currentIndex, 1)
    newStages.splice(newIndex, 0, moved)

    // Update orders
    const updatedOrders = newStages.map((stage, index) => ({
      id: stage.id,
      order: index,
    }))

    try {
      // Update all stages with new orders
      await Promise.all(
        updatedOrders.map(({ id, order }) =>
          fetch(`${apiUrl}/stages/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order }),
          })
        )
      )

      await fetchStages()
      onStagesUpdated?.()
    } catch (error) {
      console.error('Failed to reorder stages:', error)
      alert('Failed to reorder stages. Please try again.')
    } finally {
      setReordering(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="kanban-modal-overlay" onClick={onClose}>
        <div className="kanban-modal kanban-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="kanban-modal-header">
            <h3 className="kanban-modal-title">Manage Stages</h3>
            <button
              className="kanban-modal-close"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="kanban-modal-content">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingStage(undefined)
                  setShowCreateStage(true)
                }}
                className="kanban-button kanban-button-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Stage
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="kanban-spinner" />
              </div>
            ) : stages.length === 0 ? (
              <div className="kanban-empty-state">
                <p>No stages found. Create your first stage to get started.</p>
              </div>
            ) : (
              <div className="kanban-stage-list">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="kanban-stage-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div className="kanban-stage-reorder-controls">
                        <button
                          type="button"
                          onClick={() => handleMoveStage(stage.id, 'up')}
                          disabled={index === 0 || reordering === stage.id}
                          className="kanban-reorder-button"
                          title="Move up"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStage(stage.id, 'down')}
                          disabled={index === stages.length - 1 || reordering === stage.id}
                          className="kanban-reorder-button"
                          title="Move down"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>
                      <div
                        className="kanban-stage-color-indicator"
                        style={{ backgroundColor: stage.color || '#6b7280', width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong>{stage.name}</strong>
                          {stage.isDefault && (
                            <span className="kanban-stage-badge" title="Default stage">Default</span>
                          )}
                          {stage.isClosedStage && (
                            <span className="kanban-stage-badge kanban-stage-badge-closed" title="Closed stage">
                              {stage.closedType === 'won' ? 'Won' : 'Lost'}
                            </span>
                          )}
                        </div>
                        {stage.description && (
                          <div style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text) / 0.6)', marginTop: '0.25rem' }}>
                            {stage.description}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.5)', marginRight: '0.5rem' }}>
                        Order: {stage.order}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStage(stage)
                          setShowCreateStage(false)
                        }}
                        className="kanban-button kanban-button-small"
                        title="Edit stage"
                        disabled={reordering === stage.id}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(stage.id)}
                        className="kanban-button kanban-button-small kanban-button-danger"
                        title="Delete stage"
                        disabled={reordering === stage.id}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(showCreateStage || editingStage) && (
        <StageModal
          isOpen={showCreateStage || !!editingStage}
          onClose={() => {
            setShowCreateStage(false)
            setEditingStage(undefined)
          }}
          onSave={handleSaveStage}
          stage={editingStage}
          pipelineId={pipelineId}
          apiUrl={apiUrl}
        />
      )}
    </>
  )
}

