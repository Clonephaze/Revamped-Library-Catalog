import { getPendingPrints } from '../utils/sheets'

export default defineEventHandler(async () => {
  try {
    const entries = await getPendingPrints()

    // Privacy: expose only first name + last initial, model, color, and status.
    return entries.map((entry) => {
      const parts = entry.patron.trim().split(/\s+/)
      const displayName =
        parts.length > 1
          ? `${parts[0]} ${parts[parts.length - 1][0]}.`
          : parts[0] ?? ''

      return {
        name: displayName,
        label: entry.label,
        color: entry.color,
        status: entry.status,
      }
    })
  } catch (error) {
    console.error('[GET /api/queue]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch queue. Please try again.',
    })
  }
})
