'use client'

import React from 'react'

/**
 * FireFist CRM Icon component for Payload admin panel
 * Used in mobile view, favicon replacement, etc.
 */
const FireFistIcon: React.FC<Record<string, any>> = (props: any) => {
  const { className } = props || {}
  return (
    <div
      data-firefist-icon="true"
      className={`firefist-icon ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontSize: '1.75rem',
        lineHeight: 1,
        filter: 'drop-shadow(0 0 3px rgba(255, 69, 0, 0.4))',
      }}
    >
      <span
        role="img"
        aria-label="FireFist"
        style={{
          display: 'inline-block',
          transform: 'translateY(1px)',
        }}
      >
        🔥
      </span>
    </div>
  )
}

export default FireFistIcon
export { FireFistIcon }
