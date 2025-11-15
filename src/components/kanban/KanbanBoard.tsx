'use client'

import React, { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanHeader } from './KanbanHeader'
import { OpportunityModal } from './OpportunityModal'
import { useKanbanData } from './hooks/useKanbanData'
import type { KanbanOpportunity } from '../../endpoints/opportunities/kanban'

interface KanbanBoardProps {
  apiUrl?: string
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ apiUrl = '/api' }) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState<KanbanOpportunity | null>(null)

  const { data, loading, error, refetch } = useKanbanData(selectedPipelineId, apiUrl)

  const handleCardClick = (opportunity: KanbanOpportunity) => {
    setSelectedOpportunity(opportunity)
  }

  const handleStageChange = async (opportunityId: string, newStageId: string) => {
    try {
      const url = `${apiUrl}/kanban/opportunities/stage`
      const requestBody = {
        opportunityId,
        stageId: newStageId,
      }
      
      console.log('[KanbanBoard] Updating stage:', { url, requestBody })
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[KanbanBoard] Response status:', response.status, response.statusText)

      if (!response.ok) {
        // Try to get error text first
        const errorText = await response.text().catch(() => '')
        console.error('[KanbanBoard] Error response text:', errorText)
        
        let errorData = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error('[KanbanBoard] Error response:', errorData)
        throw new Error(errorData.message || errorData.error || `Failed to update stage: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[KanbanBoard] Update successful:', result)

      // Refetch data to get updated state
      await refetch()
      console.log('[KanbanBoard] Data refetched')
    } catch (error) {
      console.error('[KanbanBoard] Failed to update opportunity stage:', error)
      throw error
    }
  }

  const handleCloseModal = () => {
    setSelectedOpportunity(null)
  }

  if (!selectedPipelineId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          apiUrl={apiUrl}
        />
        <div className="kanban-empty">
          <p>Please select a pipeline to view opportunities</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          apiUrl={apiUrl}
        />
        <div className="kanban-loading">
          <div className="kanban-spinner" />
          <p>Loading opportunities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          apiUrl={apiUrl}
        />
        <div className="kanban-error">
          <p>Error: {error}</p>
          <button
            onClick={() => refetch()}
            className="kanban-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          apiUrl={apiUrl}
        />
        <div className="kanban-empty">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  if (data.columns.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          apiUrl={apiUrl}
        />
        <div className="kanban-empty">
          <p>No stages found in this pipeline</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Create stages for this pipeline to see opportunities in Kanban view
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <KanbanHeader
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
        apiUrl={apiUrl}
      />
      
      <div className="kanban-board-container">
        <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
          {data.columns.map((column) => (
            <KanbanColumn
              key={column.stage.id}
              column={column}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* Opportunity Modal */}
      {selectedOpportunity && data && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          columns={data.columns}
          currentStageId={selectedOpportunity.stage.id}
          onClose={handleCloseModal}
          onStageChange={handleStageChange}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}

