import { getModelById } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || id.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Model ID is required.' })
  }

  try {
    const model = await getModelById(id.trim())

    if (!model) {
      throw createError({ statusCode: 404, statusMessage: 'Model not found.' })
    }

    return model
  } catch (error: unknown) {
    // Re-throw H3 errors (404, 400, …) as-is
    if (error instanceof Error && 'statusCode' in error) throw error

    console.error(`[GET /api/model/${id}]`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch model. Please try again.',
    })
  }
})
