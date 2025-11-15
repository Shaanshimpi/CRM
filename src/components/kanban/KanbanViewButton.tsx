'use client'

import React, { useState } from 'react'
import { KanbanBoard } from './KanbanBoard'

/**
 * UI Field Component that provides a button to open Kanban view
 * This can be added to the Opportunities collection as a UI field
 */
export const KanbanViewButton: React.FC = () => {
  const [showKanban, setShowKanban] = useState(false)

  if (showKanban) {
    return (
      <div style={{ 
        height: 'calc(100vh - 200px)', 
        width: '100%',
        padding: '1rem',
        backgroundColor: '#f9fafb',
      }}>
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => setShowKanban(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Back to List View
          </button>
          <h2 className="text-lg font-semibold">Kanban View</h2>
        </div>
        <KanbanBoard apiUrl="/api" />
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Kanban View</h3>
          <p className="text-xs text-gray-600">
            Visualize opportunities in a Kanban board. Drag and drop cards between stages.
          </p>
        </div>
        <button
          onClick={() => setShowKanban(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
        >
          Open Kanban View
        </button>
      </div>
    </div>
  )
}

