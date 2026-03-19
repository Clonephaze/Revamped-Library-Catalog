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
}

export interface Filament {
  brand: string
  color: string
}

export interface QueueEntry {
  patron: string
  label: string
  color: string
  contact: string
  printed: boolean
  pickedUp: boolean
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
  }
}

/** queue tab: A=Patron B=Label C=Color D=Patron Contact E=Printed F=Picked up */
function rowToQueueEntry(row: string[]): QueueEntry {
  return {
    patron: row[0] ?? '',
    label: row[1] ?? '',
    color: row[2] ?? '',
    contact: row[3] ?? '',
    printed: (row[4] ?? '').toUpperCase() === 'TRUE',
    pickedUp: (row[5] ?? '').toUpperCase() === 'TRUE',
  }
}

/** filaments tab: A=Brand B=Color */
function rowToFilament(row: string[]): Filament {
  return {
    brand: row[0] ?? '',
    color: row[1] ?? '',
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/** Return all active models from the catalog sheet. */
export async function getCatalog(): Promise<CatalogItem[]> {
  const client = sheetsClient()
  const response = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: 'catalog!A2:G',
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

/** Return all available filament colors from the filaments sheet. */
export async function getFilaments(): Promise<Filament[]> {
  const client = sheetsClient()
  const response = await client.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: 'filaments!A2:B',
  })

  const rows = (response.data.values ?? []) as string[][]
  return rows.map(rowToFilament).filter((f) => f.color)
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/** Append a new print request row to the queue sheet. */
export async function submitPrint(data: PrintSubmission): Promise<void> {
  const client = sheetsClient()
  await client.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: 'queue!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          data.patron,
          data.label,
          data.color,
          data.contact,
          false, // Printed — unchecked
          false, // Picked up — unchecked
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
    .filter((entry) => !entry.pickedUp && entry.patron)
}
