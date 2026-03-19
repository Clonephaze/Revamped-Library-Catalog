import { getFilaments } from '../utils/sheets'

export default defineEventHandler(async () => {
  try {
    const filaments = await getFilaments()
    return filaments
  } catch (error) {
    console.error('[GET /api/filaments]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch filament colors. Please try again.',
    })
  }
})
