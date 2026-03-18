import { createPrintRequest } from '../utils/sheets'

// Maximum field lengths to prevent oversized payloads
const LIMITS = {
  name: 100,
  contact: 200,
  modelId: 50,
  modelName: 200,
  color: 50,
} as const

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // ---- Validate presence ----
  const { name, contact, modelId, modelName, color } = body ?? {}

  const missing = (['name', 'contact', 'modelId', 'modelName', 'color'] as const).filter(
    (field) => !body?.[field]?.toString().trim(),
  )

  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}.`,
    })
  }

  // ---- Sanitize (trim + enforce max length) ----
  const sanitized = {
    name: String(name).trim().slice(0, LIMITS.name),
    contact: String(contact).trim().slice(0, LIMITS.contact),
    modelId: String(modelId).trim().slice(0, LIMITS.modelId),
    modelName: String(modelName).trim().slice(0, LIMITS.modelName),
    color: String(color).trim().slice(0, LIMITS.color),
  }

  try {
    const queueNumber = await createPrintRequest(sanitized)

    return {
      success: true,
      queueNumber,
      submittedAt: new Date().toISOString(),
      details: {
        name: sanitized.name,
        modelName: sanitized.modelName,
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
