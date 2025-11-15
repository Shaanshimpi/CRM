import React, { useState, useEffect } from 'react'

interface Stage {
  id?: string
  name: string
  description?: string
  color?: string
  order: number
  isDefault: boolean
  isClosedStage: boolean
  closedType?: 'won' | 'lost'
  pipeline: string
}

interface Pipeline {
  id: string
  name: string
}

interface StageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (stage: Omit<Stage, 'id'>) => Promise<void>
  stage?: Stage
  pipelineId: string
  apiUrl?: string
}

export const StageModal: React.FC<StageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stage,
  pipelineId,
  apiUrl = '/api',
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [formData, setFormData] = useState<Omit<Stage, 'id'>>({
    name: stage?.name || '',
    description: stage?.description || '',
    color: stage?.color || '#6b7280',
    order: stage?.order ?? 0,
    isDefault: stage?.isDefault ?? false,
    isClosedStage: stage?.isClosedStage ?? false,
    closedType: stage?.closedType,
    pipeline: stage?.pipeline || pipelineId,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch pipelines for the dropdown
    const fetchPipelines = async () => {
      try {
        const response = await fetch(`${apiUrl}/pipelines?where[isActive][equals]=true&limit=100`)
        if (response.ok) {
          const data = await response.json()
          setPipelines(data.docs || [])
        }
      } catch (error) {
        console.error('Failed to fetch pipelines:', error)
      }
    }

    if (isOpen) {
      fetchPipelines()
    }
  }, [isOpen, apiUrl])

  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name,
        description: stage.description || '',
        color: stage.color || '#6b7280',
        order: stage.order,
        isDefault: stage.isDefault,
        isClosedStage: stage.isClosedStage,
        closedType: stage.closedType,
        pipeline: stage.pipeline,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#6b7280',
        order: 0,
        isDefault: false,
        isClosedStage: false,
        closedType: undefined,
        pipeline: pipelineId,
      })
    }
    setError(null)
  }, [stage, pipelineId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stage')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="kanban-modal-overlay" onClick={onClose}>
      <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kanban-modal-header">
          <h3 className="kanban-modal-title">
            {stage ? 'Edit Stage' : 'Create Stage'}
          </h3>
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
          <form onSubmit={handleSubmit} className="kanban-modal-form">
            {error && (
              <div className="kanban-modal-error">
                {error}
              </div>
            )}

            <div className="kanban-form-field">
              <label htmlFor="stage-pipeline" className="kanban-form-label">
                Pipeline <span className="kanban-form-required">*</span>
              </label>
              <select
                id="stage-pipeline"
                value={formData.pipeline}
                onChange={(e) => setFormData({ ...formData, pipeline: e.target.value })}
                className="kanban-form-select"
                required
                disabled={!!stage} // Can't change pipeline when editing
              >
                <option value="">Select Pipeline</option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="kanban-form-field">
              <label htmlFor="stage-name" className="kanban-form-label">
                Name <span className="kanban-form-required">*</span>
              </label>
              <input
              id="stage-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="kanban-form-input"
              required
              placeholder="e.g., New Lead, Qualified, Proposal"
            />
          </div>

          <div className="kanban-form-field">
            <label htmlFor="stage-description" className="kanban-form-label">
              Description
            </label>
            <textarea
              id="stage-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="kanban-form-textarea"
              rows={3}
              placeholder="Brief description of this stage"
            />
          </div>

          <div className="kanban-form-field">
            <label htmlFor="stage-color" className="kanban-form-label">
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                id="stage-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="kanban-form-color-input"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="kanban-form-input"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                placeholder="#6b7280"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="kanban-form-field">
            <label htmlFor="stage-order" className="kanban-form-label">
              Order
            </label>
            <input
              id="stage-order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="kanban-form-input"
              min="0"
              step="1"
              placeholder="0"
            />
            <small className="kanban-form-help">Lower numbers appear first in the pipeline</small>
          </div>

          <div className="kanban-form-field">
            <label className="kanban-form-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="kanban-form-checkbox"
              />
              <span>Default stage (for new opportunities in this pipeline)</span>
            </label>
          </div>

          <div className="kanban-form-field">
            <label className="kanban-form-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isClosedStage}
                onChange={(e) => setFormData({ ...formData, isClosedStage: e.target.checked })}
                className="kanban-form-checkbox"
              />
              <span>Closed stage (won or lost)</span>
            </label>
          </div>

          {formData.isClosedStage && (
            <div className="kanban-form-field">
              <label htmlFor="stage-closed-type" className="kanban-form-label">
                Closed Type
              </label>
              <select
                id="stage-closed-type"
                value={formData.closedType || ''}
                onChange={(e) => setFormData({ ...formData, closedType: e.target.value as 'won' | 'lost' | undefined })}
                className="kanban-form-select"
              >
                <option value="">Select type</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          )}

          <div className="kanban-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="kanban-button kanban-button-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="kanban-button kanban-button-primary"
              disabled={saving || !formData.name.trim() || !formData.pipeline}
            >
              {saving ? 'Saving...' : stage ? 'Update' : 'Create'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}

