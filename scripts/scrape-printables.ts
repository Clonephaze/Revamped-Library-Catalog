/**
 * scrape-printables.ts
 *
 * Queries the Printables internal GraphQL API to extract model data.
 * This is the same API their own website uses, so it works even though
 * regular HTTP scraping fails due to client-side rendering.
 *
 * Usage:
 *   npx tsx scripts/scrape-printables.ts <url>
 *
 * Example:
 *   npx tsx scripts/scrape-printables.ts https://www.printables.com/model/1247082-motor-fidget-print-in-place
 */

const GRAPHQL_ENDPOINT = 'https://api.printables.com/graphql/'

const QUERY = `
  query PrintProfile($id: ID!) {
    print(id: $id) {
      name
      summary
      printDuration
      slug
      user {
        publicUsername
      }
      images {
        filePath
      }
      tags {
        name
      }
    }
  }
`

function extractModelId(url: string): string | null {
  const match = url.match(/printables\.com\/model\/(\d+)/)
  return match ? match[1] : null
}

// printDuration is returned as a string in hours (e.g. "1.08" = 1.08 hours)
// Convert to minutes, rounding to nearest whole minute
function durationToMinutes(hours: string | null | undefined): number | string {
  if (!hours) return ''
  const h = parseFloat(hours)
  if (isNaN(h)) return ''
  return Math.round(h * 60)
}

async function fetchModel(modelId: string) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Mimic a browser request to avoid bot rejection
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Origin': 'https://www.printables.com',
      'Referer': 'https://www.printables.com/',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { id: modelId },
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const json = await response.json() as any

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`)
  }

  return json.data?.print
}

async function main() {
  const url = process.argv[2]

  if (!url) {
    console.error('Usage: npx tsx scripts/scrape-printables.ts <printables-url>')
    process.exit(1)
  }

  const modelId = extractModelId(url)
  if (!modelId) {
    console.error('Could not extract model ID from URL. Expected format: https://www.printables.com/model/<id>-...')
    process.exit(1)
  }

  console.log(`Fetching model ID: ${modelId}...\n`)

  const model = await fetchModel(modelId)

  if (!model) {
    console.error('No model data returned. The model may be private or the ID is wrong.')
    process.exit(1)
  }

  // First image in the array is the main/hero image
  const pictureUrl = model.images?.[0]?.filePath
    ? `https://media.printables.com/${model.images[0].filePath}`
    : ''

  const tags: string = (model.tags ?? []).map((t: any) => t.name).join(', ')

  const result = {
    Name:                 model.name ?? '',
    Description:          model.summary ?? '',
    'Print Time Minutes': durationToMinutes(model.printDuration),
    Author:               model.user?.publicUsername ?? '',
    Source:               `https://www.printables.com/model/${modelId}-${model.slug}`,
    'Picture URL':        pictureUrl,
    'Optional Tags':      tags,
  }

  console.log('=== Scraped Data ===')
  for (const [key, value] of Object.entries(result)) {
    console.log(`${key.padEnd(22)}: ${value}`)
  }

  console.log('\n=== TSV row (paste into spreadsheet) ===')
  console.log(Object.values(result).join('\t'))
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
