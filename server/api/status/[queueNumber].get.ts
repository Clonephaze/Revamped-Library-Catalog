import { getStatus } from '../../utils/sheets'

// Queue numbers are zero-padded integers, 1–6 digits.
const QUEUE_NUMBER_RE = /^\d{1,6}$/

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'queueNumber')

  if (!raw || !QUEUE_NUMBER_RE.test(raw)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid queue number. Must be 1–6 digits.',
    })
  }

  // Normalise to the 4-digit padded format used when writing rows.
  const queueNumber = raw.padStart(4, '0')

  try {
    const entry = await getStatus(queueNumber)

    if (!entry) {
      throw createError({
        statusCode: 404,
        statusMessage: `Queue number "${raw}" was not found.`,
      })
    }

    return entry
  } catch (error: unknown) {
    if (error instanceof Error && 'statusCode' in error) throw error

    console.error(`[GET /api/status/${raw}]`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve status. Please try again.',
    })
  }
})
