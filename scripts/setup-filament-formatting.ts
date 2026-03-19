/**
 * setup-filament-formatting.ts
 *
 * One-time script that adds conditional formatting rules to the "filaments"
 * sheet so that when staff types a color name (e.g. "Red"), the cell
 * background automatically turns that color.
 *
 * The website reads cell background colors to show color swatches, so this
 * keeps everything automatic — no manual cell coloring needed.
 *
 * Usage:
 *   npx tsx scripts/setup-filament-formatting.ts
 *
 * Requires .env with:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_KEY
 *   GOOGLE_SPREADSHEET_ID
 */

import 'dotenv/config'
import { google } from 'googleapis'

// ---------------------------------------------------------------------------
// Color rules: name → { r, g, b } in 0-1 range for Sheets API
// ---------------------------------------------------------------------------

const COLOR_RULES: { text: string; bg: { red: number; green: number; blue: number }; fg?: { red: number; green: number; blue: number } }[] = [
  { text: 'Red',       bg: { red: 0.90, green: 0.22, blue: 0.21 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Blue',      bg: { red: 0.19, green: 0.51, blue: 0.81 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Green',     bg: { red: 0.22, green: 0.63, blue: 0.41 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Yellow',    bg: { red: 0.98, green: 0.92, blue: 0.30 } },
  { text: 'Orange',    bg: { red: 0.93, green: 0.46, blue: 0.13 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Purple',    bg: { red: 0.50, green: 0.35, blue: 0.84 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Pink',      bg: { red: 0.93, green: 0.39, blue: 0.65 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Black',     bg: { red: 0.10, green: 0.10, blue: 0.10 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'White',     bg: { red: 0.97, green: 0.97, blue: 0.97 } },
  { text: 'Gray',      bg: { red: 0.62, green: 0.68, blue: 0.75 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Grey',      bg: { red: 0.62, green: 0.68, blue: 0.75 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Gold',      bg: { red: 0.84, green: 0.62, blue: 0.18 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Silver',    bg: { red: 0.80, green: 0.84, blue: 0.88 } },
  { text: 'Brown',     bg: { red: 0.55, green: 0.27, blue: 0.07 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Teal',      bg: { red: 0.19, green: 0.59, blue: 0.58 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Navy',      bg: { red: 0.16, green: 0.26, blue: 0.40 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Cyan',      bg: { red: 0.00, green: 0.71, blue: 0.85 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Magenta',   bg: { red: 0.84, green: 0.25, blue: 0.55 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Lime',      bg: { red: 0.52, green: 0.80, blue: 0.09 } },
  { text: 'Beige',     bg: { red: 0.96, green: 0.94, blue: 0.88 } },
  { text: 'Coral',     bg: { red: 1.00, green: 0.50, blue: 0.31 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Turquoise', bg: { red: 0.25, green: 0.88, blue: 0.82 } },
  { text: 'Maroon',    bg: { red: 0.50, green: 0.00, blue: 0.00 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Olive',     bg: { red: 0.42, green: 0.56, blue: 0.14 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Salmon',    bg: { red: 0.98, green: 0.50, blue: 0.45 } },
  { text: 'Ivory',     bg: { red: 1.00, green: 1.00, blue: 0.94 } },
  { text: 'Lavender',  bg: { red: 0.71, green: 0.63, blue: 0.87 } },
  { text: 'Mint',      bg: { red: 0.60, green: 0.92, blue: 0.70 } },
  { text: 'Peach',     bg: { red: 1.00, green: 0.80, blue: 0.64 } },
  { text: 'Charcoal',  bg: { red: 0.27, green: 0.27, blue: 0.27 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Brass',     bg: { red: 0.72, green: 0.58, blue: 0.20 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Copper',    bg: { red: 0.72, green: 0.45, blue: 0.20 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Pale Blue', bg: { red: 0.68, green: 0.85, blue: 0.95 } },
  { text: 'Titanium',  bg: { red: 0.53, green: 0.55, blue: 0.57 }, fg: { red: 1, green: 1, blue: 1 } },
  { text: 'Transparent', bg: { red: 0.90, green: 0.95, blue: 1.00 } },
  { text: 'White Silk', bg: { red: 0.95, green: 0.93, blue: 0.90 } },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!email || !key || !spreadsheetId) {
    console.error('Missing env vars. Need GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SPREADSHEET_ID')
    process.exit(1)
  }

  const auth = new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  const sheets = google.sheets({ version: 'v4', auth })

  // Find the sheetId for the "filaments" tab
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' })
  const filamentSheet = meta.data.sheets?.find(
    (s) => s.properties?.title?.toLowerCase() === 'filaments',
  )

  if (!filamentSheet?.properties?.sheetId && filamentSheet?.properties?.sheetId !== 0) {
    console.error('Could not find a sheet tab named "filaments". Available tabs:')
    meta.data.sheets?.forEach((s) => console.error(`  - ${s.properties?.title}`))
    process.exit(1)
  }

  const sheetId = filamentSheet.properties.sheetId!

  // Build conditional formatting requests — one rule per color
  // Each rule: "if cell TEXT_EQ <color name>, set background"
  // Applied to column A, rows 2-1000
  const requests = COLOR_RULES.map((rule, index) => ({
    addConditionalFormatRule: {
      rule: {
        ranges: [{ sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 1 }],
        booleanRule: {
          condition: {
            type: 'TEXT_EQ' as const,
            values: [{ userEnteredValue: rule.text }],
          },
          format: {
            backgroundColor: rule.bg,
            ...(rule.fg ? { textFormat: { foregroundColor: rule.fg } } : {}),
          },
        },
      },
      index,
    },
  }))

  // Clear any existing conditional format rules on the sheet first
  const existing = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.conditionalFormats',
    ranges: ['filaments'],
  })

  const existingRules = existing.data.sheets?.[0]?.conditionalFormats ?? []
  const deleteRequests = existingRules.map((_, i) => ({
    deleteConditionalFormatRule: { sheetId, index: 0 }, // always delete index 0 as they shift
  }))

  // Apply: first delete old rules, then add new ones
  const allRequests = [...deleteRequests, ...requests]

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: allRequests },
  })

  console.log(`✅ Applied ${COLOR_RULES.length} conditional formatting rules to the "filaments" sheet.`)
  console.log('')
  console.log('Colors configured:')
  COLOR_RULES.forEach((r) => console.log(`  • ${r.text}`))
  console.log('')
  console.log('Staff just types a color name in column A and the cell auto-colors.')
  console.log('The website will pick up the background color for swatches automatically.')
}

main().catch((err) => {
  console.error('Failed:', err.message ?? err)
  process.exit(1)
})
