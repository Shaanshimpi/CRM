import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@payloadcms/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Match Payload's design system colors via CSS variables
        border: 'hsl(var(--theme-border-color))',
        background: 'hsl(var(--theme-bg))',
        foreground: 'hsl(var(--theme-text))',
        // Payload elevation colors
        elevation: {
          0: 'hsl(var(--theme-elevation-0))',
          1: 'hsl(var(--theme-elevation-1))',
          2: 'hsl(var(--theme-elevation-2))',
        },
        // Payload semantic colors
        success: 'hsl(var(--theme-success-500))',
        error: 'hsl(var(--theme-error-500))',
        warning: 'hsl(var(--theme-warning-500))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
  // Prevent Tailwind from resetting Payload's base styles
  corePlugins: {
    preflight: false, // Disable Tailwind's base reset to avoid conflicts with Payload
  },
}

export default config

