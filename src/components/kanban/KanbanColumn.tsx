import React from 'react'
import { KanbanCard } from './KanbanCard'
import type { KanbanColumn as KanbanColumnType, KanbanOpportunity } from '../../endpoints/opportunities/kanban'

interface KanbanColumnProps {
  column: KanbanColumnType
  onCardClick?: (opportunity: KanbanOpportunity) => void
  apiUrl?: string
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onCardClick,
  apiUrl = '/api',
}) => {
  const formatCurrency = (value: number, currency?: string) => {
    const currencyCode = currency || 'INR'
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    
    return formatter.format(value)
  }

  const stageColor = column.stage.color || '#6b7280'

  return (
    <div
      className="kanban-column"
      style={{
        borderLeftColor: stageColor,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
      }}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-header-row">
          <h3 className="kanban-column-title">
            {stageColor && (
              <span
                className="kanban-column-title-indicator"
                style={{ backgroundColor: stageColor }}
              />
            )}
            {column.stage.name}
          </h3>
          <span className="kanban-column-count">
            {column.count}
          </span>
        </div>
        {column.totalValue > 0 && (
          <div className="kanban-column-value">
            {formatCurrency(column.totalValue)}
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="kanban-column-content">
        {column.opportunities.map((opportunity) => (
          <KanbanCard
            key={opportunity.id}
            opportunity={opportunity}
            onClick={onCardClick}
            apiUrl={apiUrl}
          />
        ))}
        {column.opportunities.length === 0 && (
          <div className="kanban-empty-state">
            No opportunities
          </div>
        )}
      </div>
    </div>
  )
}

