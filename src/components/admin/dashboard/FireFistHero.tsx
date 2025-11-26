'use client'

import React from 'react'
import Link from 'next/link'

/**
 * FireFist CRM hero banner displayed above dashboard widgets.
 * Highlights brand identity and provides a quick entry point to Kanban.
 */
export const FireFistHero: React.FC = () => {
  return (
    <section
      style={{
        width: '100%',
        margin: '0 auto 1.5rem',
        padding: '2.5rem',
        borderRadius: 'calc(var(--radius) * 1.5)',
        background: 'linear-gradient(135deg, #ff7a18 0%, #af002d 100%)',
        color: '#fff',
        boxShadow: '0 25px 45px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '800px',
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.35em',
            fontSize: '1.25rem',
            fontWeight: 700,
            opacity: 0.95,
          }}
        >
          FireFist CRM
        </span>
        <h1
          style={{
            fontSize: '3.5rem',
            lineHeight: 1.1,
            margin: 0,
            fontWeight: 700,
          }}
        >
          Ignite every pipeline with clarity, focus, and speed.
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            maxWidth: '560px',
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
          }}
        >
          Track deals, uncover bottlenecks, and rally the team from one
          command center. The Kanban view keeps every opportunity moving.
        </p>
        <div>
          <Link
            href="/admin/collections/opportunities/kanban"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            padding: '1.1rem 2.85rem',
            fontSize: '1.1rem',
              fontWeight: 600,
              color: '#1b1b1f',
              backgroundColor: '#fff',
              borderRadius: '999px',
              textDecoration: 'none',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            Launch Kanban Control →
          </Link>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-60px',
          top: '-60px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(0px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '40px',
          bottom: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '45%',
          background: 'rgba(0,0,0,0.15)',
          filter: 'blur(0px)',
        }}
      />
    </section>
  )
}


