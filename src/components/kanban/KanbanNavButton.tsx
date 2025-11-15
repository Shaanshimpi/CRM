'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

/**
 * Navigation button component to access Kanban view
 * Can be added to Opportunities collection list view
 */
export const KanbanNavButton: React.FC = () => {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/admin/collections/opportunities/kanban')}
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: 'hsl(var(--theme-elevation-1))',
        border: '1px solid hsl(var(--theme-border-color))',
        borderRadius: 'var(--radius)',
        color: 'hsl(var(--theme-text))',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: '0.5rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-2))'
        e.currentTarget.style.borderColor = 'hsl(var(--theme-text) / 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-1))'
        e.currentTarget.style.borderColor = 'hsl(var(--theme-border-color))'
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: '0.5rem' }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
      Kanban View
    </button>
  )
}

