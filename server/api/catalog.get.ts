import { getCatalog } from '../utils/sheets'

export default defineEventHandler(async () => {
  try {
    const catalog = await getCatalog()
    return catalog
  } catch (error) {
    console.error('[GET /api/catalog]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch catalog. Please try again.',
    })
  }
})
