import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * This is used by shadcn/ui components and custom components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

