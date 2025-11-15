'use client'

import React from 'react'
import { KanbanNavButton } from './KanbanNavButton'

/**
 * Header component for Opportunities list view
 * Displays title and Kanban View button
 */
export const OpportunitiesListHeader: React.FC = () => {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid hsl(var(--theme-border-color))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'hsl(var(--theme-elevation-0))',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'hsl(var(--theme-text))',
            margin: 0,
            marginBottom: '0.25rem',
          }}
        >
          Opportunities
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--theme-text) / 0.7)',
            margin: 0,
          }}
        >
          Manage and track sales opportunities through pipelines
        </p>
      </div>
      <KanbanNavButton />
    </div>
  )
}

