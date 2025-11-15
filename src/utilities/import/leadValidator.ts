import type { Payload } from 'payload'

export interface LeadImportData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  source?: string
  status?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  tags?: string[]
  customFields?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates lead import data
 */
export async function validateLead(
  data: LeadImportData,
  payload: Payload,
  rowNumber?: number
): Promise<ValidationResult> {
  const errors: string[] = []
  const rowPrefix = rowNumber ? `Row ${rowNumber}: ` : ''

  // Required fields
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push(`${rowPrefix}First name is required`)
  }

  if (!data.lastName || data.lastName.trim() === '') {
    errors.push(`${rowPrefix}Last name is required`)
  }

  // Email validation (optional but must be valid if provided)
  if (data.email && data.email.trim()) {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const normalizedEmail = data.email.toLowerCase().trim()
    
    if (!emailRegex.test(normalizedEmail)) {
      errors.push(`${rowPrefix}Invalid email format: ${data.email}`)
    } else {
      // Check for duplicates
      const existingLead = await payload.find({
        collection: 'leads',
        where: {
          email: {
            equals: normalizedEmail,
          },
        },
        limit: 1,
      })

      if (existingLead.docs.length > 0) {
        errors.push(`${rowPrefix}Email already exists: ${normalizedEmail}`)
      }
    }
  }

  // Source validation
  if (data.source) {
    const validSources = [
      'website',
      'referral',
      'cold-call',
      'email-campaign',
      'social-media',
      'trade-show',
      'partner',
      'other',
    ]
    if (!validSources.includes(data.source.toLowerCase())) {
      errors.push(`${rowPrefix}Invalid source: ${data.source}`)
    }
  }

  // Status validation
  if (data.status) {
    const validStatuses = ['new', 'contacted', 'qualified', 'unqualified', 'converted']
    if (!validStatuses.includes(data.status.toLowerCase())) {
      errors.push(`${rowPrefix}Invalid status: ${data.status}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Normalizes lead data for import
 */
export function normalizeLeadData(data: LeadImportData): LeadImportData {
  return {
    ...data,
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    email: data.email?.toLowerCase().trim(),
    phone: data.phone?.trim(),
    company: data.company?.trim(),
    jobTitle: data.jobTitle?.trim(),
    source: data.source?.toLowerCase().trim(),
    status: data.status?.toLowerCase().trim() || 'new',
    street: data.street?.trim(),
    city: data.city?.trim(),
    state: data.state?.trim(),
    zip: data.zip?.trim(),
    country: data.country?.trim() || 'India',
  }
}

