'use client'

import React from 'react'

const FireFistLogo: React.FC<Record<string, any>> = (props: any) => {
  const { className } = props || {}
  return (
    <div
      data-firefist-logo="true"
      className={`firefist-logo ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        fontWeight: 700,
        fontSize: '1.125rem',
        color: 'hsl(var(--theme-text))',
        textDecoration: 'none',
        letterSpacing: '-0.01em',
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          fontSize: '1.75rem',
          lineHeight: 1,
          filter: 'drop-shadow(0 0 2px rgba(255, 69, 0, 0.3))',
          display: 'inline-block',
          transform: 'translateY(2px)',
        }}
        role="img"
        aria-label="Fire"
      >
        🔥
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          FireFist
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            opacity: 0.65,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          CRM
        </span>
      </div>
    </div>
  )
}

export default FireFistLogo
export { FireFistLogo }
