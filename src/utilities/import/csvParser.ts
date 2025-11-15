import { parse } from 'csv-parse/sync'
import type { LeadImportData } from './leadValidator'

export interface CSVParseOptions {
  hasHeaders?: boolean
  columnMapping?: Record<string, string> // Maps CSV column names to lead fields
}

export interface ParsedCSVRow {
  data: LeadImportData
  rowNumber: number
}

/**
 * Maps common CSV column names to lead field names
 */
export const defaultColumnMapping: Record<string, string> = {
  'first name': 'firstName',
  'firstname': 'firstName',
  'fname': 'firstName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'lname': 'lastName',
  'email': 'email',
  'email address': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'company': 'company',
  'company name': 'company',
  'job title': 'jobTitle',
  'jobtitle': 'jobTitle',
  'title': 'jobTitle',
  'source': 'source',
  'lead source': 'source',
  'status': 'status',
  'street': 'street',
  'address': 'street',
  'city': 'city',
  'state': 'state',
  'zip': 'zip',
  'zip code': 'zip',
  'postal code': 'zip',
  'country': 'country',
  'tags': 'tags',
}

/**
 * Normalizes column names (lowercase, trim, remove spaces)
 */
export function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Maps CSV row to LeadImportData using column mapping
 */
function mapRowToLeadData(
  row: Record<string, string>,
  columnMapping: Record<string, string>
): LeadImportData {
  const leadData: LeadImportData = {}

  for (const [csvColumn, leadField] of Object.entries(columnMapping)) {
    const normalizedCsvColumn = normalizeColumnName(csvColumn)
    const rowKey = Object.keys(row).find(
      (key) => normalizeColumnName(key) === normalizedCsvColumn
    )

    if (rowKey && row[rowKey]) {
      const value = row[rowKey].trim()

      // Handle address fields
      if (leadField === 'street') {
        leadData.street = value
      } else if (leadField === 'city') {
        leadData.city = value
      } else if (leadField === 'state') {
        leadData.state = value
      } else if (leadField === 'zip') {
        leadData.zip = value
      } else if (leadField === 'country') {
        leadData.country = value
      } else if (leadField === 'tags') {
        // Split tags by comma or semicolon
        leadData.tags = value.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean)
      } else {
        // Direct mapping
        ;(leadData as any)[leadField] = value
      }
    }
  }

  return leadData
}

/**
 * Parses CSV file content into lead data
 */
export function parseCSV(
  csvContent: string | Buffer,
  options: CSVParseOptions = {}
): ParsedCSVRow[] {
  const { hasHeaders = true, columnMapping = defaultColumnMapping } = options

  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: hasHeaders,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle BOM for UTF-8 files
    })

    if (!hasHeaders && records.length > 0) {
      // Use first row as headers if hasHeaders is false
      const headers = records[0] as string[]
      const dataRows = records.slice(1) as string[][]

      return dataRows.map((row, index) => {
        const rowObj: Record<string, string> = {}
        headers.forEach((header, colIndex) => {
          rowObj[header] = row[colIndex] || ''
        })

        return {
          data: mapRowToLeadData(rowObj, columnMapping),
          rowNumber: index + 2, // +2 because row 1 is headers, and index is 0-based
        }
      })
    }

    // Map rows using column mapping
    return (records as Record<string, string>[]).map((row, index) => ({
      data: mapRowToLeadData(row, columnMapping),
      rowNumber: index + (hasHeaders ? 2 : 1), // +2 if headers (row 1 is header, row 2 is first data)
    }))
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

