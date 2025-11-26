'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { KanbanData } from '../../../endpoints/opportunities/kanban'

/**
 * Opportunities Kanban Dashboard Widget
 * Displays a summary of opportunities in the selected pipeline with quick access to Kanban view
 */
export const OpportunitiesKanbanWidget: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pipelines, setPipelines] = useState<Array<{ id: number | string; name: string }>>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null)

  // Fetch pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch('/api/pipelines?limit=100&where[isActive][equals]=true')
        if (!response.ok) throw new Error('Failed to fetch pipelines')
        const data = await response.json()
        
        const activePipelines = (data.docs || []).map((p: { id: number | string; name: string }) => ({
          id: p.id,
          name: p.name,
        }))
        setPipelines(activePipelines)
        
        // Auto-select first pipeline
        if (activePipelines.length > 0) {
          setSelectedPipelineId(String(activePipelines[0].id))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pipelines')
        setLoading(false)
      }
    }

    fetchPipelines()
  }, [])

  // Fetch kanban data when pipeline is selected
  useEffect(() => {
    if (!selectedPipelineId) {
      setKanbanData(null)
      setLoading(false)
      return
    }

    const fetchKanbanData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/kanban/opportunities?pipeline=${selectedPipelineId}`)
        if (!response.ok) throw new Error('Failed to fetch Kanban data')
        const data: KanbanData = await response.json()
        setKanbanData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load opportunities')
      } finally {
        setLoading(false)
      }
    }

    fetchKanbanData()
  }, [selectedPipelineId])

  // Calculate totals
  const totalOpportunities = kanbanData?.totalOpportunities || 0
  const totalValue = kanbanData?.totalValue || 0
  const columns = kanbanData?.columns || []
  const stageCounts = columns.map(col => ({
    stage: col.stage.name,
    count: col.opportunities.length,
    value: col.opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0),
  }))

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--theme-elevation-0))',
        border: '1px solid hsl(var(--theme-border-color))',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            color: 'hsl(var(--theme-text))',
          }}
        >
          Opportunities Pipeline
        </h2>
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
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
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
          Open Kanban View →
        </Link>
      </div>

      {/* Pipeline Selector */}
      {pipelines.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <select
            value={selectedPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid hsl(var(--theme-border-color))',
              borderRadius: 'var(--radius)',
              backgroundColor: 'hsl(var(--theme-elevation-0))',
              color: 'hsl(var(--theme-text))',
              fontSize: '0.875rem',
            }}
          >
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={String(pipeline.id)}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'hsl(var(--theme-text) / 0.6)',
          }}
        >
          Loading...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'hsl(var(--theme-error) / 0.1)',
            border: '1px solid hsl(var(--theme-error) / 0.3)',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--theme-error))',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && kanbanData && (
        <>
          {/* Summary Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Total Opportunities
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {totalOpportunities}
              </div>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Total Value
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(totalValue)}
              </div>
            </div>
          </div>

          {/* Stage Breakdown */}
          {stageCounts.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: 'hsl(var(--theme-text))',
                }}
              >
                Opportunities by Stage
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {stageCounts.map((stageInfo) => (
                  <div
                    key={stageInfo.stage}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'hsl(var(--theme-elevation-1))',
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--theme-border-color))',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'hsl(var(--theme-text))',
                        }}
                      >
                        {stageInfo.stage}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'hsl(var(--theme-text) / 0.6)',
                        }}
                      >
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                        }).format(stageInfo.value)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'hsl(var(--theme-text))',
                      }}
                    >
                      {stageInfo.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && !kanbanData && selectedPipelineId && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'hsl(var(--theme-text) / 0.6)',
          }}
        >
          No opportunities found in this pipeline
        </div>
      )}
    </div>
  )
}


