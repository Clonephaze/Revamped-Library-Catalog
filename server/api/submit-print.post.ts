import { submitPrint } from '../utils/sheets'

const LIMITS = {
  patron: 100,
  contact: 200,
  label: 200,
  color: 50,
} as const

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { patron, label, color, contact } = body ?? {}

  const missing = (['patron', 'label', 'color', 'contact'] as const).filter(
    (field) => !body?.[field]?.toString().trim(),
  )

  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}.`,
    })
  }

  const sanitized = {
    patron: String(patron).trim().slice(0, LIMITS.patron),
    label: String(label).trim().slice(0, LIMITS.label),
    color: String(color).trim().slice(0, LIMITS.color),
    contact: String(contact).trim().slice(0, LIMITS.contact),
  }

  try {
    await submitPrint(sanitized)

    return {
      success: true,
      details: {
        patron: sanitized.patron,
        label: sanitized.label,
        color: sanitized.color,
      },
    }
  } catch (error) {
    console.error('[POST /api/submit-print]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit print request. Please try again.',
    })
  }
})
