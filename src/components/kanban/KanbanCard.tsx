import React, { useState, useRef, useEffect } from 'react'
import type { KanbanOpportunity } from '../../endpoints/opportunities/kanban'
import { KanbanCardTooltip } from './KanbanCardTooltip'

interface KanbanCardProps {
  opportunity: KanbanOpportunity
  onClick?: (opportunity: KanbanOpportunity) => void
  apiUrl?: string
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  opportunity,
  onClick,
  apiUrl = '/api',
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (assignedTo?: KanbanOpportunity['assignedTo']) => {
    if (!assignedTo) return '?'
    if (assignedTo.firstName && assignedTo.lastName) {
      return `${assignedTo.firstName[0]}${assignedTo.lastName[0]}`.toUpperCase()
    }
    return assignedTo.email[0].toUpperCase()
  }

  const getDisplayName = (assignedTo?: KanbanOpportunity['assignedTo']) => {
    if (!assignedTo) return 'Unassigned'
    if (assignedTo.firstName && assignedTo.lastName) {
      return `${assignedTo.firstName} ${assignedTo.lastName}`
    }
    return assignedTo.email
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(opportunity)
  }

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    
    tooltipTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const tooltipWidth = 500 // Max tooltip width
        const tooltipHeight = window.innerHeight * 0.8 // Max tooltip height
        const padding = 10

        let x = rect.right + padding
        let y = rect.top

        // Adjust if tooltip would go off right edge
        if (x + tooltipWidth > window.innerWidth - padding) {
          x = rect.left - tooltipWidth - padding
        }

        // Adjust if tooltip would go off bottom edge
        if (y + tooltipHeight > window.innerHeight - padding) {
          y = window.innerHeight - tooltipHeight - padding
        }

        // Adjust if tooltip would go off top edge
        if (y < padding) {
          y = padding
        }

        setTooltipPosition({ x, y })
        setShowTooltip(true)
      }
    }, 500) // Show tooltip after 500ms hover
  }

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setShowTooltip(false)
  }

  return (
    <>
      <div
        ref={cardRef}
        className="kanban-card"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      {/* Header */}
      <div className="kanban-card-header">
        <h3 className="kanban-card-title">
          {opportunity.name}
        </h3>
        {opportunity.assignedTo && (
          <div
            className="kanban-card-avatar"
            title={getDisplayName(opportunity.assignedTo)}
          >
            {getInitials(opportunity.assignedTo)}
          </div>
        )}
      </div>

      {/* Company */}
      {opportunity.company && (
        <div className="kanban-card-company">{opportunity.company}</div>
      )}

      {/* Contact Information */}
      {(opportunity.contactName || opportunity.contactPhone) && (
        <div className="kanban-card-contact">
          {opportunity.contactName && (
            <div className="kanban-card-contact-name">{opportunity.contactName}</div>
          )}
          {opportunity.contactPhone && (
            <div className="kanban-card-contact-phone">{opportunity.contactPhone}</div>
          )}
        </div>
      )}

      {/* Value and Probability */}
      {(opportunity.value || opportunity.probability !== undefined) && (
        <div className="kanban-card-footer">
          {opportunity.value && (
            <div className="kanban-card-value">
              {formatCurrency(opportunity.value, opportunity.currency)}
            </div>
          )}
          {opportunity.probability !== undefined && (
            <div className="kanban-card-probability">
              {opportunity.probability}%
            </div>
          )}
        </div>
      )}

      {/* Expected Close Date */}
      {opportunity.expectedCloseDate && (
        <div className="kanban-card-date">
          {formatDate(opportunity.expectedCloseDate)}
        </div>
      )}

      {/* Notes, Tasks, and Reminders */}
      {(opportunity.notes || opportunity.tasks || opportunity.reminders) && (
        <div className="kanban-card-metadata">
          {opportunity.notes && (
            <div className="kanban-card-meta-item" title={`${opportunity.notes.count} note${opportunity.notes.count !== 1 ? 's' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>{opportunity.notes.count}</span>
            </div>
          )}
          {opportunity.tasks && (
            <div className="kanban-card-meta-item" title={`${opportunity.tasks.count} task${opportunity.tasks.count !== 1 ? 's' : ''} (${opportunity.tasks.pendingCount || 0} pending)`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>
                {opportunity.tasks.pendingCount || 0}/{opportunity.tasks.count}
              </span>
            </div>
          )}
          {opportunity.reminders && (
            <div className="kanban-card-meta-item" title={`${opportunity.reminders.count} reminder${opportunity.reminders.count !== 1 ? 's' : ''} (${opportunity.reminders.pendingCount || 0} pending)`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>
                {opportunity.reminders.pendingCount || 0}/{opportunity.reminders.count}
              </span>
            </div>
          )}
        </div>
      )}
      </div>

      {showTooltip && (
        <KanbanCardTooltip
          opportunity={opportunity}
          position={tooltipPosition}
          apiUrl={apiUrl}
        />
      )}
    </>
  )
}
