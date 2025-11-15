import type { PayloadRequest } from 'payload'
import type { Endpoint } from 'payload'
import { parseCSV } from '../../utilities/import/csvParser'
import { parseExcel } from '../../utilities/import/excelParser'
import { validateLead, normalizeLeadData, type LeadImportData } from '../../utilities/import/leadValidator'

export interface ImportResult {
  success: boolean
  total: number
  created: number
  updated: number
  errors: number
  errorDetails: Array<{
    rowNumber: number
    email?: string
    errors: string[]
  }>
  message: string
}

/**
 * CSV Import Endpoint
 */
export const csvImportEndpoint: Endpoint = {
  path: '/leads/import/csv',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get file from form data
      if (!req.formData) {
        return Response.json({ error: 'FormData not supported' }, { status: 400 })
      }
      const formData = await req.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 })
      }

      // Check file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        return Response.json({ error: 'Invalid file type. Expected CSV.' }, { status: 400 })
      }

      // Read file content
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const csvContent = fileBuffer.toString('utf-8')

      // Parse CSV
      const parsedRows = parseCSV(csvContent, {
        hasHeaders: true,
      })

      // Process in batches
      const batchSize = 100
      const result: ImportResult = {
        success: true,
        total: parsedRows.length,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [],
        message: '',
      }

      for (let i = 0; i < parsedRows.length; i += batchSize) {
        const batch = parsedRows.slice(i, i + batchSize)

        for (const { data, rowNumber } of batch) {
          // Normalize data
          const normalizedData = normalizeLeadData(data)

          // Validate
          const validation = await validateLead(normalizedData, payload, rowNumber)

          if (!validation.isValid) {
            result.errors++
            result.errorDetails.push({
              rowNumber,
              email: normalizedData.email,
              errors: validation.errors,
            })
            continue
          }

          // Create lead
          try {
            // Build lead document
            const leadDoc: Record<string, unknown> = {
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName,
              email: normalizedData.email,
              phone: normalizedData.phone,
              company: normalizedData.company,
              jobTitle: normalizedData.jobTitle,
              source: normalizedData.source || 'other',
              status: normalizedData.status || 'new',
            }

            // Add address if provided
            if (
              normalizedData.street ||
              normalizedData.city ||
              normalizedData.state ||
              normalizedData.zip ||
              normalizedData.country
            ) {
              leadDoc.address = {
                street: normalizedData.street,
                city: normalizedData.city,
                state: normalizedData.state,
                zip: normalizedData.zip,
                country: normalizedData.country || 'India',
              }
            }

            // Add tags if provided
            if (normalizedData.tags && normalizedData.tags.length > 0) {
              leadDoc.tags = normalizedData.tags
            }

            // Add custom fields if provided
            if (normalizedData.customFields) {
              leadDoc.customFields = normalizedData.customFields
            }

            await payload.create({
              collection: 'leads',
              data: leadDoc as any,
              req,
            })

            result.created++
          } catch (error) {
            result.errors++
            result.errorDetails.push({
              rowNumber,
              email: normalizedData.email,
              errors: [
                error instanceof Error ? error.message : 'Failed to create lead',
              ],
            })
          }
        }
      }

      result.success = result.errors === 0
      result.message = `Imported ${result.created} leads. ${result.errors} errors.`

      return Response.json(result)
    } catch (error) {
      return Response.json(
        {
          error: 'Import failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
}

/**
 * Excel Import Endpoint
 */
export const excelImportEndpoint: Endpoint = {
  path: '/leads/import/excel',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get file from form data
      if (!req.formData) {
        return Response.json({ error: 'FormData not supported' }, { status: 400 })
      }
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const sheetName = formData.get('sheetName') as string | null

      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 })
      }

      // Check file type
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        return Response.json({ error: 'Invalid file type. Expected Excel (.xlsx or .xls).' }, { status: 400 })
      }

      // Read file content
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      // Parse Excel
      const parsedRows = parseExcel(fileBuffer, {
        sheetName: sheetName || undefined,
      })

      // Process (same as CSV)
      const batchSize = 100
      const result: ImportResult = {
        success: true,
        total: parsedRows.length,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [],
        message: '',
      }

      for (let i = 0; i < parsedRows.length; i += batchSize) {
        const batch = parsedRows.slice(i, i + batchSize)

        for (const { data, rowNumber } of batch) {
          const normalizedData = normalizeLeadData(data)
          const validation = await validateLead(normalizedData, payload, rowNumber)

          if (!validation.isValid) {
            result.errors++
            result.errorDetails.push({
              rowNumber,
              email: normalizedData.email,
              errors: validation.errors,
            })
            continue
          }

          try {
            const leadDoc: any = {
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName,
              email: normalizedData.email,
              phone: normalizedData.phone,
              company: normalizedData.company,
              jobTitle: normalizedData.jobTitle,
              source: normalizedData.source || 'other',
              status: normalizedData.status || 'new',
            }

            if (
              normalizedData.street ||
              normalizedData.city ||
              normalizedData.state ||
              normalizedData.zip ||
              normalizedData.country
            ) {
              leadDoc.address = {
                street: normalizedData.street,
                city: normalizedData.city,
                state: normalizedData.state,
                zip: normalizedData.zip,
                country: normalizedData.country || 'India',
              }
            }

            if (normalizedData.tags && normalizedData.tags.length > 0) {
              leadDoc.tags = normalizedData.tags
            }

            if (normalizedData.customFields) {
              leadDoc.customFields = normalizedData.customFields
            }

            await payload.create({
              collection: 'leads',
              data: leadDoc as any,
              req,
            })

            result.created++
          } catch (error) {
            result.errors++
            result.errorDetails.push({
              rowNumber,
              email: normalizedData.email,
              errors: [
                error instanceof Error ? error.message : 'Failed to create lead',
              ],
            })
          }
        }
      }

      result.success = result.errors === 0
      result.message = `Imported ${result.created} leads. ${result.errors} errors.`

      return Response.json(result)
    } catch (error) {
      return Response.json(
        {
          error: 'Import failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
}

/**
 * API Import Endpoint (JSON)
 */
export const apiImportEndpoint: Endpoint = {
  path: '/leads/import/api',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      if (!req.json) {
        return Response.json({ error: 'JSON parsing not supported' }, { status: 400 })
      }
      const body = await req.json()
      const leadsData: LeadImportData[] = Array.isArray(body) ? body : [body]

      const result: ImportResult = {
        success: true,
        total: leadsData.length,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [],
        message: '',
      }

      const createdIds: string[] = []

      for (let i = 0; i < leadsData.length; i++) {
        const data = leadsData[i]
        const normalizedData = normalizeLeadData(data)
        const validation = await validateLead(normalizedData, payload, i + 1)

        if (!validation.isValid) {
          result.errors++
          result.errorDetails.push({
            rowNumber: i + 1,
            email: normalizedData.email,
            errors: validation.errors,
          })
          continue
        }

        try {
          const leadDoc: any = {
            firstName: normalizedData.firstName,
            lastName: normalizedData.lastName,
            email: normalizedData.email,
            phone: normalizedData.phone,
            company: normalizedData.company,
            jobTitle: normalizedData.jobTitle,
            source: normalizedData.source || 'other',
            status: normalizedData.status || 'new',
          }

          if (
            normalizedData.street ||
            normalizedData.city ||
            normalizedData.state ||
            normalizedData.zip ||
            normalizedData.country
          ) {
            leadDoc.address = {
              street: normalizedData.street,
              city: normalizedData.city,
              state: normalizedData.state,
              zip: normalizedData.zip,
              country: normalizedData.country || 'USA',
            }
          }

          if (normalizedData.tags && normalizedData.tags.length > 0) {
            leadDoc.tags = normalizedData.tags
          }

          if (normalizedData.customFields) {
            leadDoc.customFields = normalizedData.customFields
          }

          const created = await payload.create({
            collection: 'leads',
            data: leadDoc,
            req,
          })

          result.created++
          createdIds.push(created.id.toString())
        } catch (error) {
          result.errors++
          result.errorDetails.push({
            rowNumber: i + 1,
            email: normalizedData.email,
            errors: [
              error instanceof Error ? error.message : 'Failed to create lead',
            ],
          })
        }
      }

      result.success = result.errors === 0
      result.message = `Imported ${result.created} leads. ${result.errors} errors.`

      return Response.json({
        ...result,
        createdIds,
      })
    } catch (error) {
      return Response.json(
        {
          error: 'Import failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
}

