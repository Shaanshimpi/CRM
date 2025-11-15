import React from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { KanbanView } from '@/components/kanban/KanbanView'
import { KanbanPageHeader } from './KanbanHeader'

/**
 * Kanban View Page for Opportunities
 * Accessible at /admin/collections/opportunities/kanban
 * Requires authentication - redirects to login if not signed in
 */
const KanbanPage = async () => {
  // Check authentication
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

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
      <KanbanPageHeader />
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <KanbanView />
      </div>
    </div>
  )
}

export default KanbanPage

