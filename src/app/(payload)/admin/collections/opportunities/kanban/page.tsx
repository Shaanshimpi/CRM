'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KanbanView } from '@/components/kanban/KanbanView'

/**
 * Kanban View Page for Opportunities
 * Accessible at /admin/collections/opportunities/kanban
 */
const KanbanPage = () => {
  const router = useRouter()

  return (
    <div
      style={{
        height: 'calc(100vh - var(--nav-height, 64px))',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'hsl(var(--theme-elevation-0))',
      }}
    >
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid hsl(var(--theme-border-color))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'hsl(var(--theme-elevation-0))',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button
            onClick={() => router.push('/admin/collections/opportunities')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'hsl(var(--theme-elevation-1))',
              border: '1px solid hsl(var(--theme-border-color))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--theme-text))',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-2))'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-1))'
            }}
          >
            ← Back to List
          </button>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'hsl(var(--theme-text))',
              margin: 0,
            }}
          >
            Opportunities - Kanban View
          </h1>
        </div>
        <Link
          href="/admin/collections/opportunities/kanban"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            backgroundColor: 'hsl(var(--theme-elevation-1))',
            border: '1px solid hsl(var(--theme-border-color))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--theme-text))',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-2))'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--theme-elevation-1))'
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
        </Link>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <KanbanView />
      </div>
    </div>
  )
}

export default KanbanPage

