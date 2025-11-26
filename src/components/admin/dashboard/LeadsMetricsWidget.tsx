'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface LeadsStats {
  total: number
  new: number
  contacted: number
  qualified: number
  converted: number
  bySource: Array<{ source: string; count: number }>
}

/**
 * Leads Metrics Dashboard Widget
 * Displays key metrics about leads
 */
export const LeadsMetricsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LeadsStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all leads with status and source
        const response = await fetch('/api/leads?limit=1000&depth=0')
        if (!response.ok) throw new Error('Failed to fetch leads')
        const data = await response.json()
        const leads = data.docs || []

        // Calculate stats
        const total = leads.length
        const newCount = leads.filter((l: { status?: string }) => l.status === 'new').length
        const contactedCount = leads.filter((l: { status?: string }) => l.status === 'contacted').length
        const qualifiedCount = leads.filter((l: { status?: string }) => l.status === 'qualified').length
        const convertedCount = leads.filter((l: { status?: string }) => l.status === 'converted').length

        // Group by source
        const sourceMap = new Map<string, number>()
        leads.forEach((lead: { source?: string }) => {
          const source = lead.source || 'unknown'
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
        })
        const bySource = Array.from(sourceMap.entries())
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) // Top 5 sources

        setStats({
          total,
          new: newCount,
          contacted: contactedCount,
          qualified: qualifiedCount,
          converted: convertedCount,
          bySource,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
          Leads Overview
        </h2>
        <Link
          href="/admin/collections/leads"
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
          View All →
        </Link>
      </div>

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

      {!loading && !error && stats && (
        <>
          {/* Status Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Total
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {stats.total}
              </div>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                New
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {stats.new}
              </div>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Contacted
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {stats.contacted}
              </div>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Qualified
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {stats.qualified}
              </div>
            </div>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'hsl(var(--theme-elevation-1))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--theme-border-color))',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--theme-text) / 0.6)',
                  marginBottom: '0.25rem',
                }}
              >
                Converted
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'hsl(var(--theme-text))',
                }}
              >
                {stats.converted}
              </div>
            </div>
          </div>

          {/* Top Sources */}
          {stats.bySource.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: 'hsl(var(--theme-text))',
                }}
              >
                Top Lead Sources
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {stats.bySource.map((sourceInfo) => (
                  <div
                    key={sourceInfo.source}
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
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'hsl(var(--theme-text))',
                        textTransform: 'capitalize',
                      }}
                    >
                      {sourceInfo.source}
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'hsl(var(--theme-text))',
                      }}
                    >
                      {sourceInfo.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


