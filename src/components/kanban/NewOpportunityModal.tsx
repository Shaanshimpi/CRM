'use client'

import React, { useEffect, useState } from 'react'
import type { Pipeline } from './KanbanHeader'

interface OwnerOption {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

interface NewOpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  pipelineId: string
  owners: OwnerOption[]
  pipelines: Pipeline[]
  apiUrl: string
  onCreated: () => void
  onPipelineChange?: (pipelineId: string) => void
}

// Helper to convert ID to correct type (number if numeric, string otherwise)
const convertId = (id: string | number): string | number => {
  if (typeof id === 'number') return id
  if (/^\d+$/.test(String(id))) return Number(id)
  return String(id)
}

export const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({
  isOpen,
  onClose,
  pipelineId,
  owners,
  pipelines,
  apiUrl,
  onCreated,
  onPipelineChange,
}) => {
  const [name, setName] = useState('')
  const [value, setValue] = useState<number | ''>('')
  const [currency, setCurrency] = useState('INR')
  const [assignedTo, setAssignedTo] = useState('')
  const [stageId, setStageId] = useState<string | number>('')
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelineId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stageOptions, setStageOptions] = useState<Array<{ id: string; name: string }>>([])
  const [stageLoading, setStageLoading] = useState(false)

  // Reset form when modal opens/closes or pipeline changes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setValue('')
      setCurrency('INR')
      setAssignedTo('')
      setStageId('')
      setStageOptions([])
      setError(null)
      return
    }

    // Ensure pipelineId is converted to string for consistency
    const pipelineIdStr = pipelineId ? String(pipelineId) : ''
    setSelectedPipelineId(pipelineIdStr)
    
    // Verify the pipeline exists in the pipelines array
    if (pipelineIdStr && pipelines.length > 0) {
      const pipelineExists = pipelines.some(p => String(p.id) === pipelineIdStr)
      if (!pipelineExists && pipelines.length > 0) {
        // If the provided pipelineId doesn't exist, use the first available pipeline
        console.warn('[NewOpportunityModal] Pipeline ID not found, using first available:', {
          providedPipelineId: pipelineIdStr,
          availablePipelines: pipelines.map(p => ({ id: String(p.id), name: p.name })),
        })
        setSelectedPipelineId(String(pipelines[0].id))
      }
    }
  }, [isOpen, pipelineId, pipelines])

  // Fetch stages for selected pipeline
  useEffect(() => {
    if (!isOpen || !selectedPipelineId) {
      setStageOptions([])
      setStageId('')
      return
    }

    const fetchStages = async () => {
      setStageLoading(true)
      try {
        const response = await fetch(
          `${apiUrl}/stages?where[pipeline][equals]=${selectedPipelineId}&sort=order&limit=100`,
        )
        if (!response.ok) {
          throw new Error('Failed to fetch stages for pipeline')
        }

        const data = await response.json()
        const docs = data.docs || []
        const mappedStages = docs.map((stage: { id: string; name: string }) => ({
          id: String(stage.id),
          name: stage.name,
        }))
        setStageOptions(mappedStages)
        setStageId(mappedStages[0]?.id || '')

        if (mappedStages.length === 0) {
          setError('No stages available for this pipeline. Please create stages first.')
        } else {
          setError(null)
        }
      } catch (err) {
        console.error('[NewOpportunityModal] Failed to fetch stages', err)
        setStageOptions([])
        setStageId('')
        setError('Unable to load stages for the selected pipeline.')
      } finally {
        setStageLoading(false)
      }
    }

    void fetchStages()
  }, [apiUrl, isOpen, selectedPipelineId])

  if (!isOpen) return null

  // Validate required fields
  const isValid = name.trim().length > 0 && stageId && assignedTo && selectedPipelineId

  const handleSubmit = async () => {
    // Clear previous errors
    setError(null)

    // Client-side validation
    if (!name.trim()) {
      setError('Deal name is required')
      return
    }

    if (!stageId) {
      setError('Stage is required')
      return
    }

    if (!assignedTo) {
      setError('Assigned user is required')
      return
    }

    if (!selectedPipelineId) {
      setError('Pipeline is required')
      return
    }

    // Verify selected pipeline exists in the pipelines array
    const selectedPipeline = pipelines.find(p => String(p.id) === String(selectedPipelineId))
    if (!selectedPipeline) {
      setError('Selected pipeline not found. Please select a valid pipeline.')
      return
    }

    setSaving(true)
    try {
      // Use the actual pipeline ID from the pipelines array to ensure consistency
      const actualPipelineId = selectedPipeline.id
      
      // Convert IDs to correct types
      const convertedPipelineId = convertId(actualPipelineId)
      const convertedStageId = convertId(stageId)
      const convertedAssignedTo = convertId(assignedTo)

      const payloadBody = {
        name: name.trim(),
        pipeline: convertedPipelineId,
        currentStage: convertedStageId,
        assignedTo: convertedAssignedTo,
        ...(value ? { value: Number(value) } : {}),
        currency: currency || 'INR',
      }

      console.log('[NewOpportunityModal] Creating opportunity:', {
        payloadBody,
        selectedPipelineName: selectedPipeline.name,
        selectedPipelineId: actualPipelineId,
        convertedPipelineId,
        convertedPipelineIdType: typeof convertedPipelineId,
      })

      const response = await fetch(`${apiUrl}/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadBody),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const errorMessage = err.errors 
          ? err.errors.map((e: { message?: string; path?: string }) => e.message || `${e.path}: invalid`).join(', ')
          : err.message || `Failed to create opportunity (${response.status})`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const createdOpportunity = result.doc || result
      
      // Verify the created opportunity has the correct pipeline
      const createdPipelineId = typeof createdOpportunity.pipeline === 'object' 
        ? createdOpportunity.pipeline?.id 
        : createdOpportunity.pipeline
      const createdPipelineName = typeof createdOpportunity.pipeline === 'object'
        ? createdOpportunity.pipeline?.name
        : pipelines.find(p => String(p.id) === String(createdPipelineId))?.name
      
      console.log('[NewOpportunityModal] Opportunity created successfully:', {
        opportunityId: createdOpportunity.id,
        opportunityName: createdOpportunity.name,
        pipelineId: createdPipelineId,
        pipelineName: createdPipelineName,
        expectedPipelineId: actualPipelineId,
        expectedPipelineName: selectedPipeline.name,
        match: String(createdPipelineId) === String(actualPipelineId),
      })
      
      if (String(createdPipelineId) !== String(actualPipelineId)) {
        console.error('[NewOpportunityModal] ⚠️ Pipeline mismatch detected!', {
          expected: { id: actualPipelineId, name: selectedPipeline.name },
          actual: { id: createdPipelineId, name: createdPipelineName },
        })
      }
      
      // Reset saving state before closing
      setSaving(false)
      onCreated()
      onClose()
    } catch (error) {
      console.error('[NewOpportunityModal] Create failed', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create opportunity'
      setError(errorMessage)
      setSaving(false)
    }
  }

  return (
    <div
      className="kanban-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'hsl(var(--theme-text) / 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="kanban-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'hsl(var(--theme-elevation-0))',
          border: '1px solid hsl(var(--theme-border-color))',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 10px 30px hsl(var(--theme-text) / 0.3)',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Quick Opportunity</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'hsl(var(--theme-text) / 0.6)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'hsl(var(--theme-error-500) / 0.1)',
                border: '1px solid hsl(var(--theme-error-500) / 0.3)',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--theme-error-500))',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {stageOptions.length === 0 && !stageLoading && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'hsl(var(--theme-warning-500) / 0.1)',
                border: '1px solid hsl(var(--theme-warning-500) / 0.3)',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--theme-warning-500))',
                fontSize: '0.875rem',
              }}
            >
              No stages found for this pipeline. Please create stages first.
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
              Pipeline <span style={{ color: 'hsl(var(--theme-error-500))' }}>*</span>
            </span>
            <select
              value={String(selectedPipelineId || '')}
              onChange={(e) => {
                const newPipelineId = e.target.value
                setSelectedPipelineId(newPipelineId)
                setError(null)
                // Reset stage when pipeline changes
                setStageId('')
                setStageOptions([])
                onPipelineChange?.(newPipelineId)
              }}
              required
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                backgroundColor: 'hsl(var(--theme-elevation-0))',
                fontSize: '0.95rem',
              }}
            >
              {!selectedPipelineId && <option value="">Select pipeline</option>}
              {pipelines.map((pipeline) => {
                const pipelineIdStr = String(pipeline.id)
                return (
                  <option key={pipelineIdStr} value={pipelineIdStr}>
                    {pipeline.name}
                  </option>
                )
              })}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
              Deal Name <span style={{ color: 'hsl(var(--theme-error-500))' }}>*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="Enter opportunity name"
              required
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                backgroundColor: 'hsl(var(--theme-elevation-0))',
                fontSize: '0.95rem',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>Value</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value ? Number(e.target.value) : '')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid hsl(var(--theme-border-color))',
                  backgroundColor: 'hsl(var(--theme-elevation-0))',
                  fontSize: '0.95rem',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
                Currency
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid hsl(var(--theme-border-color))',
                  backgroundColor: 'hsl(var(--theme-elevation-0))',
                  fontSize: '0.95rem',
                }}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
              Assign To <span style={{ color: 'hsl(var(--theme-error-500))' }}>*</span>
            </span>
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value)
                setError(null)
              }}
              required
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                backgroundColor: 'hsl(var(--theme-elevation-0))',
                fontSize: '0.95rem',
              }}
            >
              <option value="">Select teammate</option>
              {owners.map((owner) => {
                const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim()
                return (
                  <option key={owner.id} value={owner.id}>
                    {name || owner.email}
                  </option>
                )
              })}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--theme-text) / 0.7)' }}>
              Stage <span style={{ color: 'hsl(var(--theme-error-500))' }}>*</span>
            </span>
            <select
              value={String(stageId)}
              onChange={(e) => {
                setStageId(e.target.value)
                setError(null)
              }}
              required
              disabled={stageLoading || stageOptions.length === 0}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius)',
                border: '2px solid hsl(var(--firefist-primary, var(--theme-primary-500)))',
                backgroundColor:
                  stageLoading || stageOptions.length === 0
                    ? 'hsl(var(--theme-elevation-1))'
                    : 'hsl(var(--firefist-primary, var(--theme-primary-500)) / 0.1)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: stageLoading || stageOptions.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {stageLoading ? (
                <option value="">Loading stages…</option>
              ) : stageOptions.length === 0 ? (
                <option value="">No stages available</option>
              ) : (
                stageOptions.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="kanban-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="kanban-button kanban-button-primary"
            style={{
              backgroundColor: saving || !isValid
                ? 'hsl(var(--theme-elevation-2))'
                : 'hsl(var(--theme-success-500))',
              color: saving || !isValid ? 'hsl(var(--theme-text) / 0.5)' : '#fff',
              border: 'none',
              cursor: saving || !isValid ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}


