import React from 'react'
import './styles.css'

export const metadata = {
  description: 'FireFist CRM Dashboard - Manage your leads, opportunities, and sales pipeline',
  title: 'FireFist CRM Dashboard',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
