import { getCatalog } from '../utils/sheets'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawSheetId = query.sheetId as string | undefined

  // Validate the optional branch sheet ID before passing it to the sheets utility
  if (rawSheetId !== undefined && !/^[a-zA-Z0-9_-]{20,60}$/.test(rawSheetId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sheetId parameter' })
  }

  try {
    const catalog = await getCatalog(rawSheetId)
    return catalog
  } catch (error) {
    console.error('[GET /api/catalog]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch catalog. Please try again.',
    })
  }
})
