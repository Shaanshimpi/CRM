'use client'

import React from 'react'
import { OpportunitiesKanbanWidget } from './OpportunitiesKanbanWidget'
import { LeadsMetricsWidget } from './LeadsMetricsWidget'

/**
 * Main Dashboard Widgets Component
 * Aggregates all dashboard widgets for the admin panel
 * This component is injected into the admin dashboard via beforeDashboard hook
 */
export const DashboardWidgets: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        <OpportunitiesKanbanWidget />
        <LeadsMetricsWidget />
      </div>
    </div>
  )
}


