/**
 * Google Sheets utility — all direct Sheets API calls are isolated here.
 *
 * Required environment variables (set in .env or Vercel project settings):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_KEY   — full PEM string, \n as literal backslash-n
 *   GOOGLE_SPREADSHEET_ID
 *
 * Sheet tabs (single spreadsheet):
 *   catalog   — model catalog managed by staff
 *   queue     — print request queue (Sheet1)
 *   filaments — available filament colors (Sheet2)
 */

import { google } from 'googleapis'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogItem {
  modelId: string
  name: string
  category: string
  printTimeMinutes: number
  description: string
  imageUrl: string
  author: string
  sourceUrl: string
  tags: string[]
}

export interface Filament {
  color: string
  hexes: string[]  // 1–4 swatch colors read from cell backgrounds
}

export interface QueueEntry {
  patron: string
  label: string
  color: string
  contact: string
  status: string
}

export interface PrintSubmission {
  patron: string
  label: string
  color: string
  contact: string
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID
  if (!id) throw new Error('Missing env: GOOGLE_SPREADSHEET_ID')
  return id
}

/** Validate that a string looks like a Google Sheets ID (alphanumeric, dash, underscore, 20-60 chars). */
function assertValidSheetId(id: string): void {
  if (!/^[a-zA-Z0-9_-]{20,60}$/.test(id)) {
    throw new Error('Invalid spreadsheet ID format')
  }
}

function createAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n')

  if (!email || !key) {
    throw new Error(
      'Missing env: GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY',
    )
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function sheetsClient() {
  return google.sheets({ version: 'v4', auth: createAuth() })
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** catalog tab: A=Category B=Name C=Description D=Print Time Minutes E=Author F=Source G=Picture URL */
function rowToCatalogItem(row: string[]): CatalogItem {
  const name = row[1] ?? ''
  return {
    modelId: slugify(name),
    name,
    category: row[0] ?? '',
    description: row[2] ?? '',
    printTimeMinutes: parseInt(row[3] ?? '0', 10) || 0,
    author: row[4] ?? '',
    sourceUrl: row[5] ?? '',
    imageUrl: row[6] ?? '',
    tags: (row[7] ?? '').split(',').map(t => t.trim()).filter(Boolean),
  }
}

/** queue tab: A=Patron B=Label C=Color D=Patron Contact E=Status F=Request Date */
function rowToQueueEntry(row: string[]): QueueEntry {
  return {
    patron: row[0] ?? '',
    label: row[1] ?? '',
    color: row[2] ?? '',
    contact: row[3] ?? '',
    status: row[4] ?? 'Waiting',
  }
}

/** filaments tab: A=Name  B=Color1  C=Color2  D=Color3  E=Color4 (B–E backgrounds hold swatches) */
function rowToFilament(row: string[]): Filament {
  return {
    color: row[0] ?? '',
    hexes: [],
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** Return all active models from the catalog sheet. Pass `sheetId` to read from a branch sheet instead of the default. */
export async function getCatalog(sheetId?: string): Promise<CatalogItem[]> {
  const spreadsheetId = sheetId ?? getSpreadsheetId()
  const client = sheetsClient()
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: 'catalog!A2:H',
  })

  const rows = (response.data.values ?? []) as string[][]
  return rows.map(rowToCatalogItem).filter((item) => item.name)
}

/** Return a single model by its ModelID, or null if not found / inactive. */
export async function getModelById(id: string): Promise<CatalogItem | null> {
  const catalog = await getCatalog()
  return catalog.find((item) => item.modelId === id) ?? null
}

// ---------------------------------------------------------------------------
// Filaments
// ---------------------------------------------------------------------------

/** Fallback hex values for common filament color names. */
const COLOR_NAME_HEX: Record<string, string> = {
  red: '#e53e3e',
  blue: '#3182ce',
  green: '#38a169',
  yellow: '#ecc94b',
  orange: '#dd6b20',
  purple: '#805ad5',
  pink: '#ed64a6',
  black: '#1a1a1a',
  white: '#f7f7f7',
  gray: '#a0aec0',
  grey: '#a0aec0',
  gold: '#d69e2e',
  silver: '#cbd5e0',
  brown: '#8b4513',
  teal: '#319795',
  navy: '#2a4365',
  cyan: '#00b5d8',
  magenta: '#d53f8c',
  lime: '#84cc16',
  beige: '#f5f0e1',
  coral: '#ff7f50',
  turquoise: '#40e0d0',
  maroon: '#800000',
  olive: '#6b8e23',
  salmon: '#fa8072',
  ivory: '#fffff0',
  brass: '#b8942f',
  copper: '#b87333',
  'pale blue': '#add9f2',
  titanium: '#888c91',
  transparent: '#e5f2ff',
  'white silk': '#f2ede6',
}

/** Try to match a color name to a known hex value (case-insensitive, partial match). */
function guessHex(name: string): string {
  const lower = name.toLowerCase().trim()
  if (COLOR_NAME_HEX[lower]) return COLOR_NAME_HEX[lower]
  // partial match: e.g. "Light Blue" contains "blue"
  for (const [key, hex] of Object.entries(COLOR_NAME_HEX)) {
    if (lower.includes(key)) return hex
  }
  return ''
}

/** Return all available filament colors, reading name from column A and up to 4 swatch hex values from cell backgrounds in columns B–E. Pass `sheetId` to read from a branch sheet instead of the default. */
export async function getFilaments(sheetId?: string): Promise<Filament[]> {
  const client = sheetsClient()
  const spreadsheetId = sheetId ?? getSpreadsheetId()

  // Read values AND cell background colors for columns A–E
  const response = await client.spreadsheets.get({
    spreadsheetId,
    ranges: ['filaments!A2:E'],
    fields: 'sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)',
  })

  const rowData = response.data.sheets?.[0]?.data?.[0]?.rowData ?? []

  function bgToHex(bg: { red?: number | null; green?: number | null; blue?: number | null } | null | undefined): string | null {
    if (!bg) return null
    const r = Math.round((bg.red   ?? 0) * 255)
    const g = Math.round((bg.green ?? 0) * 255)
    const b = Math.round((bg.blue  ?? 0) * 255)
    // Skip white / near-white (default sheet background)
    if (r >= 245 && g >= 245 && b >= 245) return null
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return rowData
    .map((row) => {
      const cells = row.values ?? []
      const colorName = cells[0]?.formattedValue ?? ''
      if (!colorName) return null

      // Columns B–E (indices 1–4) hold the color swatches
      const hexes = cells
        .slice(1, 5)
        .map((cell) => bgToHex(cell?.effectiveFormat?.backgroundColor))
        .filter((h): h is string => h !== null)

      // Fallback: if no cell backgrounds found, try guessing from the name
      if (!hexes.length) {
        const guessed = guessHex(colorName)
        if (guessed) hexes.push(guessed)
      }

      return { color: colorName, hexes }
    })
    .filter((f): f is Filament => f !== null)
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/**
 * Insert a new print request at the TOP of the queue (row 2, just below headers).
 * Uses insertDimension + update so the newest request is always first.
 * Writes "Waiting" for the Status dropdown
 * and the current date in the Request Date column (F).
 */
export async function submitPrint(data: PrintSubmission): Promise<void> {
  const client = sheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const now = new Date()
  const requestDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: 'queue!A2:F2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        [
          data.patron,
          data.label,
          data.color,
          data.contact,
          'Waiting',
          requestDate,
        ],
      ],
    },
  })
}

/** Return all queue entries that have NOT been picked up yet. */
export async function getPendingPrints(): Promise<QueueEntry[]> {
  const client = sheetsClient()
  const response = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: 'queue!A2:F',
  })

  const rows = (response.data.values ?? []) as string[][]
  return rows
    .map(rowToQueueEntry)
    .filter((entry) => entry.patron && entry.status !== 'Picked Up')
}
