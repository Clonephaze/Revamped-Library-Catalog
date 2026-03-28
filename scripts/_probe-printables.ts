const fetch = globalThis.fetch

async function probe() {
  // Step 1: Try basic fields
  const tests = [
    'query { print(id: "1247082") { name description } }',
    'query { print(id: "1247082") { name summary } }',
    'query { print(id: "1247082") { name printDuration } }',
    'query { print(id: "1247082") { name estimatedPrintTime } }',
    'query { print(id: "1247082") { name user { publicUsername } } }',
    'query { print(id: "1247082") { name images { filePath imageType } } }',
    'query { print(id: "1247082") { name tags { name } } }',
    'query { print(id: "1247082") { name slug } }',
  ]

  for (const q of tests) {
    const r = await fetch('https://api.printables.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://www.printables.com', 'Referer': 'https://www.printables.com/' },
      body: JSON.stringify({ query: q }),
    })
    const json = await r.json() as any
    const ok = !json.errors
    console.log(`${ok ? 'OK ' : 'ERR'} | ${q.replace('query { print(id: "1247082") ', '')}${ok ? '' : ' => ' + json.errors?.[0]?.message}`)
  }

  // Step 2: Try a bigger dump of all likely fields at once
  const bigQuery = `query {
    print(id: "1247082") {
      name
      description
      summary
      printDuration
      estimatedPrintTime
      url
      slug
      user { publicUsername handle }
      images { filePath imageType }
      tags { name }
    }
  }`
  console.log('\n--- Full query attempt ---')
  const r2 = await fetch('https://api.printables.com/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://www.printables.com', 'Referer': 'https://www.printables.com/' },
    body: JSON.stringify({ query: bigQuery }),
  })
  const j2 = await r2.json() as any
  if (j2.errors) console.log('Errors:', JSON.stringify(j2.errors))
  else console.log('Data:', JSON.stringify(j2.data, null, 2))
}

probe().catch(e => console.error(e.message))
