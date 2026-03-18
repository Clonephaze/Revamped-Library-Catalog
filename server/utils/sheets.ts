/**
 * Google Sheets utility — all direct Sheets API calls are isolated here.
 *
 * Required environment variables (set in .env or Vercel project settings):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_KEY   — full PEM string, \n as literal backslash-n
 *   GOOGLE_SPREADSHEET_ID
 *
 * Sheet layout:
 *   Catalog    — row 1 is header, data starts at A2
 *   PrintQueue — row 1 is header, data starts at A2
 */

import { google } from 'googleapis'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogItem {
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTime: string
  colorOptions: string[]
  active: boolean
}

export interface PrintRequest {
  name: string
  contact: string
  modelId: string
  modelName: string
  color: string
}

export interface QueueEntry {
  id: string
  timestamp: string
  queueNumber: string
  name: string
  contact: string
  modelId: string
  modelName: string
  color: string
  status: string
  notes: string
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID
  if (!id) throw new Error('Missing env: GOOGLE_SPREADSHEET_ID')
  return id
}

function createAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  // Env vars store \n as a literal two-character sequence; convert to real newlines.
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

function sheets() {
  return google.sheets({ version: 'v4', auth: createAuth() })
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToCatalogItem(row: string[]): CatalogItem {
  return {
    modelId: row[0] ?? '',
    name: row[1] ?? '',
    category: row[2] ?? '',
    imageUrl: row[3] ?? '',
    printTime: row[4] ?? '',
    colorOptions: (row[5] ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    active: (row[6] ?? '').toLowerCase() === 'true',
  }
}

function rowToQueueEntry(row: string[]): QueueEntry {
  return {
    id: row[0] ?? '',
    timestamp: row[1] ?? '',
    queueNumber: row[2] ?? '',
    name: row[3] ?? '',
    contact: row[4] ?? '',
    modelId: row[5] ?? '',
    modelName: row[6] ?? '',
    color: row[7] ?? '',
    status: row[8] ?? '',
    notes: row[9] ?? '',
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return all active models from the Catalog sheet. */
export async function getCatalog(): Promise<CatalogItem[]> {
  const client = sheets()
  const response = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: 'Catalog!A2:G',
  })

  const rows = (response.data.values ?? []) as string[][]
  return rows.map(rowToCatalogItem).filter((item) => item.active)
}

/** Return a single model by its ModelID, or null if not found. */
export async function getModelById(id: string): Promise<CatalogItem | null> {
  const catalog = await getCatalog()
  return catalog.find((item) => item.modelId === id) ?? null
}

/**
 * Append a new print request row to PrintQueue and return the queue number.
 *
 * Queue numbers are padded 4-digit integers (e.g. "0042").
 * We read the current max and increment — acceptable for a low-concurrency
 * library environment. Each row also gets a unique timestamp-based ID so
 * the sheet stays consistent even in the unlikely event of a collision.
 */
export async function createPrintRequest(data: PrintRequest): Promise<string> {
  const client = sheets()
  const spreadsheetId = getSpreadsheetId()

  // Read existing queue numbers to find the current maximum.
  const queueResponse = await client.spreadsheets.values.get({
    spreadsheetId,
    range: 'PrintQueue!C2:C',
  })

  const existingRows = (queueResponse.data.values ?? []) as string[][]
  const numbers = existingRows
    .map((r) => parseInt(r[0] ?? '0', 10))
    .filter((n) => !isNaN(n))

  const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  const queueNumber = String(nextNumber).padStart(4, '0')

  const id = `PQ-${Date.now()}`
  const timestamp = new Date().toISOString()

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: 'PrintQueue!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          id,
          timestamp,
          queueNumber,
          data.name,
          data.contact,
          data.modelId,
          data.modelName,
          data.color,
          'Queued',
          '', // Notes — empty on creation
        ],
      ],
    },
  })

  return queueNumber
}

/** Look up a print request by queue number. Returns null if not found. */
export async function getStatus(queueNumber: string): Promise<QueueEntry | null> {
  const client = sheets()
  const response = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: 'PrintQueue!A2:J',
  })

  const rows = (response.data.values ?? []) as string[][]
  const row = rows.find((r) => r[2] === queueNumber)
  return row ? rowToQueueEntry(row) : null
}
