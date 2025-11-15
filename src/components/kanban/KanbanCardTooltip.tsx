import React, { useState, useEffect } from 'react'
import type { KanbanOpportunity } from '../../endpoints/opportunities/kanban'

interface FullOpportunity {
  id: string
  name: string
  value?: number
  currency?: string
  probability?: number
  expectedCloseDate?: string
  actualCloseDate?: string
  company?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  assignedTo?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  notes?: Array<{
    id: string
    content: string
    isPrivate?: boolean
    createdAt?: string
    createdBy?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }>
  tasks?: Array<{
    id: string
    title: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string
    assignedTo?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }>
  reminders?: Array<{
    id: string
    title: string
    description?: string
    reminderDate?: string
    status?: string
    type?: string
  }>
}

interface KanbanCardTooltipProps {
  opportunity: KanbanOpportunity
  position: { x: number; y: number }
  apiUrl?: string
}

export const KanbanCardTooltip: React.FC<KanbanCardTooltipProps> = ({
  opportunity,
  position,
  apiUrl = '/api',
}) => {
  const [fullOpportunity, setFullOpportunity] = useState<FullOpportunity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFullDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiUrl}/opportunities/${opportunity.id}?depth=2`)
        if (response.ok) {
          const data = await response.json()
          setFullOpportunity(data)
        } else {
          setError('Failed to load details')
        }
      } catch (_err) {
        setError('Failed to load details')
      } finally {
        setLoading(false)
      }
    }

    fetchFullDetails()
  }, [opportunity.id, apiUrl])

  const formatCurrency = (value?: number, currency?: string) => {
    if (!value) return ''
    const currencyCode = currency || 'INR'
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return formatter.format(value)
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDisplayName = (user?: { email: string; firstName?: string; lastName?: string }) => {
    if (!user) return 'Unassigned'
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.email
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'hsl(var(--theme-success-500))'
      case 'pending':
      case 'inProgress':
        return 'hsl(var(--theme-warning-500))'
      case 'cancelled':
      case 'dismissed':
        return 'hsl(var(--theme-text) / 0.4)'
      case 'sent':
        return 'hsl(var(--theme-success-500))'
      default:
        return 'hsl(var(--theme-text) / 0.6)'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'hsl(var(--theme-error-500))'
      case 'high':
        return 'hsl(var(--theme-warning-500))'
      case 'medium':
        return 'hsl(var(--theme-success-500))'
      case 'low':
        return 'hsl(var(--theme-text) / 0.5)'
      default:
        return 'hsl(var(--theme-text) / 0.6)'
    }
  }

  return (
    <div
      className="kanban-card-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      <div className="kanban-card-tooltip-content">
        {loading && (
          <div className="kanban-card-tooltip-loading">
            <div className="kanban-spinner" style={{ width: '16px', height: '16px' }} />
            <span>Loading details...</span>
          </div>
        )}

        {error && (
          <div className="kanban-card-tooltip-error">
            {error}
          </div>
        )}

        {fullOpportunity && !loading && (
          <>
            {/* Header */}
            <div className="kanban-card-tooltip-header">
              <h4 className="kanban-card-tooltip-title">{fullOpportunity.name}</h4>
              {fullOpportunity.assignedTo && (
                <div className="kanban-card-tooltip-assigned">
                  Assigned to: {getDisplayName(fullOpportunity.assignedTo)}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="kanban-card-tooltip-section">
              <div className="kanban-card-tooltip-details">
                {fullOpportunity.company && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Company:</strong> {fullOpportunity.company}
                  </div>
                )}
                {(fullOpportunity.contactName || fullOpportunity.contactEmail || fullOpportunity.contactPhone) && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Contact:</strong>
                    {fullOpportunity.contactName && <span> {fullOpportunity.contactName}</span>}
                    {fullOpportunity.contactEmail && <span> ({fullOpportunity.contactEmail})</span>}
                    {fullOpportunity.contactPhone && <span> - {fullOpportunity.contactPhone}</span>}
                  </div>
                )}
                {fullOpportunity.value && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Value:</strong> {formatCurrency(fullOpportunity.value, fullOpportunity.currency)}
                  </div>
                )}
                {fullOpportunity.probability !== undefined && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Probability:</strong> {fullOpportunity.probability}%
                  </div>
                )}
                {fullOpportunity.expectedCloseDate && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Expected Close:</strong> {formatDate(fullOpportunity.expectedCloseDate)}
                  </div>
                )}
                {fullOpportunity.actualCloseDate && (
                  <div className="kanban-card-tooltip-detail-item">
                    <strong>Actual Close:</strong> {formatDate(fullOpportunity.actualCloseDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Tasks Section */}
            {fullOpportunity.tasks && fullOpportunity.tasks.length > 0 && (
              <div className="kanban-card-tooltip-section">
                <div className="kanban-card-tooltip-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Tasks ({fullOpportunity.tasks.length})
                </div>
                <div className="kanban-card-tooltip-list">
                  {fullOpportunity.tasks.map((task) => (
                    <div key={task.id} className="kanban-card-tooltip-list-item">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(task.status),
                            marginTop: '0.375rem',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{task.title}</strong>
                            {task.priority && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  backgroundColor: getPriorityColor(task.priority) + '20',
                                  color: getPriorityColor(task.priority),
                                }}
                              >
                                {task.priority}
                              </span>
                            )}
                            {task.status && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: getStatusColor(task.status),
                                }}
                              >
                                {task.status}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.6)', marginTop: '0.25rem' }}>
                              {task.description}
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.5)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {task.dueDate && (
                              <span>Due: {formatDate(task.dueDate)}</span>
                            )}
                            {task.assignedTo && (
                              <span>Assigned: {getDisplayName(task.assignedTo)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders Section */}
            {fullOpportunity.reminders && fullOpportunity.reminders.length > 0 && (
              <div className="kanban-card-tooltip-section">
                <div className="kanban-card-tooltip-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Reminders ({fullOpportunity.reminders.length})
                </div>
                <div className="kanban-card-tooltip-list">
                  {fullOpportunity.reminders.map((reminder) => (
                    <div key={reminder.id} className="kanban-card-tooltip-list-item">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(reminder.status),
                            marginTop: '0.375rem',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{reminder.title}</strong>
                            {reminder.status && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: getStatusColor(reminder.status),
                                }}
                              >
                                {reminder.status}
                              </span>
                            )}
                            {reminder.type && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'hsl(var(--theme-text) / 0.6)',
                                }}
                              >
                                ({reminder.type})
                              </span>
                            )}
                          </div>
                          {reminder.description && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.6)', marginTop: '0.25rem' }}>
                              {reminder.description}
                            </div>
                          )}
                          {reminder.reminderDate && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.5)', marginTop: '0.25rem' }}>
                              Date: {formatDateTime(reminder.reminderDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {fullOpportunity.notes && fullOpportunity.notes.length > 0 && (
              <div className="kanban-card-tooltip-section">
                <div className="kanban-card-tooltip-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Notes ({fullOpportunity.notes.length})
                </div>
                <div className="kanban-card-tooltip-list">
                  {fullOpportunity.notes.map((note) => (
                    <div key={note.id} className="kanban-card-tooltip-list-item">
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {note.content}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--theme-text) / 0.5)', marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                          {note.createdAt && <span>{formatDateTime(note.createdAt)}</span>}
                          {note.createdBy && <span>by {getDisplayName(note.createdBy)}</span>}
                          {note.isPrivate && <span style={{ color: 'hsl(var(--theme-warning-500))' }}>Private</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

