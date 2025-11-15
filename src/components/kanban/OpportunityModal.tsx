'use client'

import React, { useState, useEffect } from 'react'
import type { KanbanOpportunity, KanbanColumn } from '../../endpoints/opportunities/kanban'

interface OpportunityModalProps {
  opportunity: KanbanOpportunity | null
  columns: KanbanColumn[]
  currentStageId: string
  onClose: () => void
  onStageChange: (opportunityId: string, newStageId: string) => Promise<void>
  apiUrl?: string
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  columns,
  currentStageId,
  onClose,
  onStageChange,
  apiUrl = '/api',
}) => {
  const [selectedStageId, setSelectedStageId] = useState(currentStageId)
  const [isUpdating, setIsUpdating] = useState(false)
  const [leadData, setLeadData] = useState<any>(null)
  const [loadingLead, setLoadingLead] = useState(false)

  useEffect(() => {
    setSelectedStageId(currentStageId)
    if (opportunity?.leadId) {
      // Fetch lead data if opportunity has a lead
      setLoadingLead(true)
      fetch(`${apiUrl}/leads/${opportunity.leadId}`)
        .then((res) => res.json())
        .then((data) => {
          setLeadData(data)
        })
        .catch((error) => {
          console.error('Failed to fetch lead data:', error)
        })
        .finally(() => {
          setLoadingLead(false)
        })
    } else {
      setLeadData(null)
    }
  }, [opportunity, currentStageId, apiUrl])

  if (!opportunity) return null

  const handleStageChange = async () => {
    if (selectedStageId === currentStageId) {
      onClose()
      return
    }

    setIsUpdating(true)
    try {
      console.log('[OpportunityModal] Updating stage...', {
        opportunityId: opportunity.id,
        currentStageId,
        newStageId: selectedStageId,
      })
      await onStageChange(opportunity.id, selectedStageId)
      console.log('[OpportunityModal] Stage updated successfully')
      onClose()
    } catch (error) {
      console.error('[OpportunityModal] Failed to update stage:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update stage. Please try again.'
      alert(`Failed to update stage: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatCurrency = (value?: number, currency?: string) => {
    if (!value) return 'N/A'
    const currencyCode = currency || 'INR'
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return formatter.format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 16px hsl(var(--theme-text) / 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'hsl(var(--theme-text))',
              margin: 0,
            }}
          >
            {opportunity.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'hsl(var(--theme-text) / 0.6)',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Company Info */}
          {opportunity.company && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Company
              </h3>
              <p style={{ fontSize: '1rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                {opportunity.company}
              </p>
            </div>
          )}

          {/* Lead Information */}
          {leadData && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Lead Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(leadData.firstName || leadData.lastName) && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Name:</strong> {[leadData.firstName, leadData.lastName].filter(Boolean).join(' ')}
                  </p>
                )}
                {leadData.email && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Email:</strong>{' '}
                    <a
                      href={`mailto:${leadData.email}`}
                      style={{ color: 'hsl(var(--theme-success-500))' }}
                    >
                      {leadData.email}
                    </a>
                  </p>
                )}
                {leadData.phone && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Phone:</strong>{' '}
                    <a
                      href={`tel:${leadData.phone}`}
                      style={{ color: 'hsl(var(--theme-success-500))' }}
                    >
                      {leadData.phone}
                    </a>
                  </p>
                )}
                {leadData.company && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Company:</strong> {leadData.company}
                  </p>
                )}
                {leadData.jobTitle && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Job Title:</strong> {leadData.jobTitle}
                  </p>
                )}
                {leadData.source && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Source:</strong> {leadData.source}
                  </p>
                )}
                {leadData.status && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Status:</strong> {leadData.status}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(opportunity.contactName || opportunity.contactEmail || opportunity.contactPhone) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Contact Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {opportunity.contactName && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Name:</strong> {opportunity.contactName}
                  </p>
                )}
                {opportunity.contactEmail && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Email:</strong>{' '}
                    <a
                      href={`mailto:${opportunity.contactEmail}`}
                      style={{ color: 'hsl(var(--theme-success-500))' }}
                    >
                      {opportunity.contactEmail}
                    </a>
                  </p>
                )}
                {opportunity.contactPhone && (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                    <strong>Phone:</strong>{' '}
                    <a
                      href={`tel:${opportunity.contactPhone}`}
                      style={{ color: 'hsl(var(--theme-success-500))' }}
                    >
                      {opportunity.contactPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Deal Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--theme-text) / 0.7)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Deal Information
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              {opportunity.value && (
                <div>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'hsl(var(--theme-text) / 0.6)',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    Value
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'hsl(var(--theme-text))',
                      margin: 0,
                    }}
                  >
                    {formatCurrency(opportunity.value, opportunity.currency)}
                  </p>
                </div>
              )}
              {opportunity.probability !== undefined && (
                <div>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'hsl(var(--theme-text) / 0.6)',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    Win Probability
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'hsl(var(--theme-text))',
                      margin: 0,
                    }}
                  >
                    {opportunity.probability}%
                  </p>
                </div>
              )}
              {opportunity.expectedCloseDate && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'hsl(var(--theme-text) / 0.6)',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    Expected Close Date
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      color: 'hsl(var(--theme-text))',
                      margin: 0,
                    }}
                  >
                    {formatDate(opportunity.expectedCloseDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned To */}
          {opportunity.assignedTo && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text) / 0.7)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Assigned To
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--theme-text))', margin: 0 }}>
                {opportunity.assignedTo.firstName && opportunity.assignedTo.lastName
                  ? `${opportunity.assignedTo.firstName} ${opportunity.assignedTo.lastName}`
                  : opportunity.assignedTo.email}
              </p>
            </div>
          )}

          {/* Stage Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--theme-text) / 0.7)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Current Stage
            </h3>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              disabled={isUpdating}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'hsl(var(--theme-elevation-0))',
                border: '1px solid hsl(var(--theme-border-color))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--theme-text))',
                fontSize: '0.875rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
              }}
            >
              {columns.map((column) => (
                <option key={column.stage.id} value={column.stage.id}>
                  {column.stage.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid hsl(var(--theme-border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onClose}
            disabled={isUpdating}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'hsl(var(--theme-elevation-1))',
              border: '1px solid hsl(var(--theme-border-color))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--theme-text))',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStageChange}
            disabled={isUpdating || selectedStageId === currentStageId}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor:
                selectedStageId === currentStageId
                  ? 'hsl(var(--theme-elevation-2))'
                  : 'hsl(var(--theme-success-500))',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: selectedStageId === currentStageId ? 'hsl(var(--theme-text) / 0.5)' : '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor:
                isUpdating || selectedStageId === currentStageId ? 'not-allowed' : 'pointer',
            }}
          >
            {isUpdating ? 'Updating...' : 'Update Stage'}
          </button>
        </div>
      </div>
    </div>
  )
}

