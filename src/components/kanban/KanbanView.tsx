'use client'

import React from 'react'
import { KanbanBoard } from './KanbanBoard'

/**
 * Kanban View Component for Payload Admin
 * This component is used as a custom view in the Opportunities collection
 * Matches Payload's design system and styling
 * 
 * Note: Styles are imported in src/app/(payload)/layout.tsx
 */
export const KanbanView: React.FC = () => {
  return (
    <div className="kanban-view-container">
      <KanbanBoard apiUrl="/api" />
    </div>
  )
}

