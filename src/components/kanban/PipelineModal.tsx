import React, { useState } from 'react'

interface Pipeline {
  id?: string
  name: string
  description?: string
  color?: string
  isActive: boolean
}

interface PipelineModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (pipeline: Omit<Pipeline, 'id'>) => Promise<void>
  pipeline?: Pipeline
  apiUrl?: string
}

export const PipelineModal: React.FC<PipelineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pipeline,
  apiUrl = '/api',
}) => {
  const [formData, setFormData] = useState<Omit<Pipeline, 'id'>>({
    name: pipeline?.name || '',
    description: pipeline?.description || '',
    color: pipeline?.color || '#6366f1',
    isActive: pipeline?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        color: pipeline.color || '#6366f1',
        isActive: pipeline.isActive,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        isActive: true,
      })
    }
    setError(null)
  }, [pipeline, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pipeline')
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
            {pipeline ? 'Edit Pipeline' : 'Create Pipeline'}
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
            <label htmlFor="pipeline-name" className="kanban-form-label">
              Name <span className="kanban-form-required">*</span>
            </label>
            <input
              id="pipeline-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="kanban-form-input"
              required
              placeholder="e.g., Sales Pipeline"
            />
          </div>

          <div className="kanban-form-field">
            <label htmlFor="pipeline-description" className="kanban-form-label">
              Description
            </label>
            <textarea
              id="pipeline-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="kanban-form-textarea"
              rows={3}
              placeholder="Brief description of this pipeline's purpose"
            />
          </div>

          <div className="kanban-form-field">
            <label htmlFor="pipeline-color" className="kanban-form-label">
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                id="pipeline-color"
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
                placeholder="#6366f1"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="kanban-form-field">
            <label className="kanban-form-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="kanban-form-checkbox"
              />
              <span>Active (only active pipelines are available for use)</span>
            </label>
          </div>

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
              disabled={saving || !formData.name.trim()}
            >
              {saving ? 'Saving...' : pipeline ? 'Update' : 'Create'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}

