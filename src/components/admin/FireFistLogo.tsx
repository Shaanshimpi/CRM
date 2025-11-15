'use client'

import React from 'react'

export const FireFistLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 700,
        fontSize: '1.125rem',
        color: 'hsl(var(--theme-text))',
        textDecoration: 'none',
      }}
      className={className}
    >
      <span
        style={{
          fontSize: '1.5rem',
          lineHeight: 1,
        }}
      >
        🔥
      </span>
      <span>FireFist</span>
      <span
        style={{
          fontWeight: 500,
          opacity: 0.7,
          fontSize: '0.875rem',
        }}
      >
        CRM
      </span>
    </div>
  )
}

