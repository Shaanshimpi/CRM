'use client'

import React, { useState, useEffect } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanHeader, type Pipeline } from './KanbanHeader'
import { OpportunityModal } from './OpportunityModal'
import { StageManagementModal } from './StageManagementModal'
import { NewOpportunityModal } from './NewOpportunityModal'
import { useKanbanData } from './hooks/useKanbanData'
import type { KanbanOpportunity } from '../../endpoints/opportunities/kanban'

interface KanbanBoardProps {
  apiUrl?: string
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ apiUrl = '/api' }) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  
  // Helper to normalize pipeline ID to string
  const setPipelineId = (id: string | number | null) => {
    if (id === null) {
      setSelectedPipelineId(null)
    } else {
      setSelectedPipelineId(String(id))
    }
  }
  const [selectedOpportunity, setSelectedOpportunity] = useState<KanbanOpportunity | null>(null)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [showStageManagement, setShowStageManagement] = useState(false)
  const [showNewOpportunity, setShowNewOpportunity] = useState(false)
  const [owners, setOwners] = useState<
    Array<{
      id: string
      email: string
      firstName?: string
      lastName?: string
    }>
  >([])
  const [ownersLoading, setOwnersLoading] = useState(false)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [pipelinesLoading, setPipelinesLoading] = useState(false)
  const { data, loading, error, refetch } = useKanbanData(selectedPipelineId, apiUrl, selectedOwnerId)

  // Verify that loaded data matches selected pipeline
  useEffect(() => {
    if (data && selectedPipelineId) {
      const dataPipelineId = String(data.pipeline.id)
      const selectedPipelineIdStr = String(selectedPipelineId)
      
      if (dataPipelineId !== selectedPipelineIdStr) {
        console.error('[KanbanBoard] Pipeline mismatch detected!', {
          selectedPipelineId: selectedPipelineIdStr,
          dataPipelineId,
          dataPipelineName: data.pipeline.name,
          selectedPipelineName: pipelines.find(p => String(p.id) === selectedPipelineIdStr)?.name,
        })
        // Auto-correct: refetch with the correct pipeline
        // This can happen if the pipeline was changed while data was loading
        refetch()
      } else {
        console.log('[KanbanBoard] Pipeline verified:', {
          pipelineId: dataPipelineId,
          pipelineName: data.pipeline.name,
          selectedPipelineName: pipelines.find(p => String(p.id) === selectedPipelineIdStr)?.name,
          match: true,
        })
      }
    }
  }, [data, selectedPipelineId, pipelines, refetch])

  useEffect(() => {
    const fetchOwners = async () => {
      setOwnersLoading(true)
      try {
        const response = await fetch(`${apiUrl}/users?limit=200&depth=0`)
        if (response.ok) {
          const result = await response.json()
          setOwners(result.docs || [])
        }
      } catch (err) {
        console.error('[KanbanBoard] Failed to fetch owners', err)
      } finally {
        setOwnersLoading(false)
      }
    }

    void fetchOwners()
  }, [apiUrl])

  useEffect(() => {
    const fetchPipelines = async () => {
      setPipelinesLoading(true)
      try {
        const response = await fetch(`${apiUrl}/pipelines?where[isActive][equals]=true&limit=100`)
        if (response.ok) {
          const result = await response.json()
          const docs: Pipeline[] = (result.docs || []).map((p: { id: string | number; name: string; isActive: boolean }) => ({
            ...p,
            id: String(p.id), // Normalize all IDs to strings
          }))
          setPipelines(docs)
          
          // Auto-select first pipeline if none selected
          if (!selectedPipelineId && docs.length > 0) {
            setPipelineId(docs[0].id)
          }
          
          // Verify selected pipeline still exists, if not reset to first
          if (selectedPipelineId && docs.length > 0) {
            const selectedExists = docs.some(p => p.id === selectedPipelineId)
            if (!selectedExists) {
              console.warn('[KanbanBoard] Selected pipeline no longer exists, switching to first available')
              setPipelineId(docs[0].id)
            }
          }
        }
      } catch (err) {
        console.error('[KanbanBoard] Failed to fetch pipelines', err)
      } finally {
        setPipelinesLoading(false)
      }
    }

    void fetchPipelines()
  }, [apiUrl, selectedPipelineId])

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
        
        let errorData: { message?: string; error?: string } = {}
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

  const handleStagesUpdated = () => {
    refetch()
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the opportunity being dragged
    if (data) {
      for (const column of data.columns) {
        const opportunity = column.opportunities.find(opp => String(opp.id) === String(active.id))
        if (opportunity) {
          setDraggedOpportunity(opportunity)
          break
        }
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('[KanbanBoard] Drag end:', { activeId: active.id, overId: over?.id, hasData: !!data })
    
    setActiveId(null)
    setDraggedOpportunity(null)

    if (!over || !data) {
      console.log('[KanbanBoard] Drag end cancelled:', { over: over?.id, hasData: !!data })
      return
    }

    const opportunityId = String(active.id)
    const newStageId = String(over.id)

    console.log('[KanbanBoard] Processing drag end:', { opportunityId, newStageId })

    // Find the current opportunity to check if stage actually changed
    let currentStageId: string | null = null
    for (const column of data.columns) {
      const opportunity = column.opportunities.find(opp => String(opp.id) === opportunityId)
      if (opportunity) {
        currentStageId = String(opportunity.stage.id)
        console.log('[KanbanBoard] Found opportunity:', { opportunityId, currentStageId, newStageId })
        break
      }
    }

    // Only update if stage actually changed
    if (currentStageId && currentStageId !== newStageId) {
      console.log('[KanbanBoard] Stage changed, updating:', { opportunityId, from: currentStageId, to: newStageId })
      try {
        await handleStageChange(opportunityId, newStageId)
        console.log('[KanbanBoard] Stage update successful')
      } catch (error) {
        console.error('[KanbanBoard] Drag and drop failed:', error)
        // Optionally show error message to user
      }
    } else {
      console.log('[KanbanBoard] Stage unchanged or opportunity not found:', { currentStageId, newStageId, opportunityId })
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDraggedOpportunity(null)
  }

  if (!selectedPipelineId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <KanbanHeader
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          selectedOwnerId={selectedOwnerId}
          onOwnerChange={setSelectedOwnerId}
          owners={owners}
          ownersLoading={ownersLoading}
          pipelines={pipelines}
          pipelinesLoading={pipelinesLoading}
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
          selectedOwnerId={selectedOwnerId}
          onOwnerChange={setSelectedOwnerId}
          owners={owners}
          ownersLoading={ownersLoading}
          pipelines={pipelines}
          pipelinesLoading={pipelinesLoading}
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
          selectedOwnerId={selectedOwnerId}
          onOwnerChange={setSelectedOwnerId}
          owners={owners}
          ownersLoading={ownersLoading}
          pipelines={pipelines}
          pipelinesLoading={pipelinesLoading}
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
          selectedOwnerId={selectedOwnerId}
          onOwnerChange={setSelectedOwnerId}
          owners={owners}
          ownersLoading={ownersLoading}
          pipelines={pipelines}
          pipelinesLoading={pipelinesLoading}
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
          selectedOwnerId={selectedOwnerId}
          onOwnerChange={setSelectedOwnerId}
          owners={owners}
          ownersLoading={ownersLoading}
          pipelines={pipelines}
          pipelinesLoading={pipelinesLoading}
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
        onPipelineChange={(pipelineId) => {
          // Normalize pipeline ID to string
          const normalizedId = String(pipelineId)
          console.log('[KanbanBoard] Pipeline change requested:', {
            original: pipelineId,
            normalized: normalizedId,
            availablePipelines: pipelines.map(p => ({ id: String(p.id), name: p.name })),
          })
          setPipelineId(normalizedId)
        }}
        selectedOwnerId={selectedOwnerId}
        onOwnerChange={setSelectedOwnerId}
        owners={owners}
        ownersLoading={ownersLoading}
        pipelines={pipelines}
        pipelinesLoading={pipelinesLoading}
        onStagesManage={() => setShowStageManagement(true)}
        onPipelineCreated={() => {
          // After pipeline is created, re-fetch list
          ;(async () => {
            try {
              const response = await fetch(`${apiUrl}/pipelines?where[isActive][equals]=true&limit=100`)
              if (response.ok) {
                const result = await response.json()
                const docs: Pipeline[] = (result.docs || []).map((p: { id: string | number; name: string; isActive: boolean }) => ({
                  ...p,
                  id: String(p.id), // Normalize all IDs to strings
                }))
                setPipelines(docs)
              }
            } catch (err) {
              console.error('[KanbanBoard] Failed to refresh pipelines', err)
            }
          })()
        }}
        onNewOpportunity={() => setShowNewOpportunity(true)}
        apiUrl={apiUrl}
      />
      
      <div className="kanban-board-container">
        <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
          {data.columns.map((column) => (
            <KanbanColumn
              key={column.stage.id}
              column={column}
              onCardClick={handleCardClick}
              apiUrl={apiUrl}
            />
          ))}
        </div>
      </div>

      {/* Opportunity Modal - View/Edit */}
      {selectedOpportunity && data && !showNewOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          columns={data.columns}
          currentStageId={selectedOpportunity.stage.id}
          pipelineId={selectedPipelineId}
          onClose={handleCloseModal}
          onStageChange={handleStageChange}
          onSave={() => {
            refetch()
            handleCloseModal()
          }}
          apiUrl={apiUrl}
        />
      )}

      {/* Opportunity Modal - Create New */}
      {showNewOpportunity && data && selectedPipelineId && (
        <NewOpportunityModal
          isOpen={showNewOpportunity}
          onClose={() => setShowNewOpportunity(false)}
          pipelineId={selectedPipelineId}
          owners={owners}
          pipelines={pipelines}
          apiUrl={apiUrl}
          onCreated={() => {
            refetch()
            setShowNewOpportunity(false)
          }}
          onPipelineChange={(pipeline) => {
            setPipelineId(pipeline)
          }}
        />
      )}

      {/* Stage Management Modal */}
      {showStageManagement && selectedPipelineId && (
        <StageManagementModal
          isOpen={showStageManagement}
          onClose={() => setShowStageManagement(false)}
          pipelineId={selectedPipelineId}
          onStagesUpdated={handleStagesUpdated}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}

