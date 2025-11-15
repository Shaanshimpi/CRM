import * as XLSX from 'xlsx'
import type { LeadImportData } from './leadValidator'
import { defaultColumnMapping, type ParsedCSVRow, normalizeColumnName } from './csvParser'

/**
 * Parses Excel file (.xlsx or .xls) into lead data
 */
export function parseExcel(
  fileBuffer: Buffer,
  options: { sheetName?: string; columnMapping?: Record<string, string> } = {}
): ParsedCSVRow[] {
  const { sheetName, columnMapping = defaultColumnMapping } = options

  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    // Get sheet
    const sheet = sheetName
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      throw new Error(`Sheet "${sheetName || workbook.SheetNames[0]}" not found`)
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      defval: '', // Default value for empty cells
      raw: false, // Convert dates and numbers to strings
    })

    // Map rows using column mapping (same as CSV)
    return (jsonData as Record<string, string>[]).map((row, index) => {
      // Convert all values to strings and trim
      const processedRow: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        processedRow[key] = String(value || '').trim()
      }

      return {
        data: mapRowToLeadData(processedRow, columnMapping),
        rowNumber: index + 2, // +2 because row 1 is headers
      }
    })
  } catch (error) {
    throw new Error(
      `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Maps Excel row to LeadImportData using column mapping
 */
function mapRowToLeadData(
  row: Record<string, string>,
  columnMapping: Record<string, string>
): LeadImportData {
  const leadData: LeadImportData = {}

  for (const [excelColumn, leadField] of Object.entries(columnMapping)) {
    const normalizedExcelColumn = normalizeColumnName(excelColumn)
    const rowKey = Object.keys(row).find(
      (key) => normalizeColumnName(key) === normalizedExcelColumn
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
 * Gets sheet names from Excel file
 */
export function getExcelSheetNames(fileBuffer: Buffer): string[] {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    return workbook.SheetNames
  } catch (error) {
    throw new Error(
      `Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

