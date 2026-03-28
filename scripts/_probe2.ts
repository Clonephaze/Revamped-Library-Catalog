const fetch = globalThis.fetch
const H = { 'Content-Type': 'application/json', 'Origin': 'https://www.printables.com', 'Referer': 'https://www.printables.com/' }

async function probe() {
  // Find correct image sub-fields
  for (const f of ['filePath', 'filePath __typename', 'filePath type', 'filePath dominant']) {
    const r = await fetch('https://api.printables.com/graphql/', {
      method: 'POST', headers: H,
      body: JSON.stringify({ query: `query { print(id: "1247082") { images { ${f} } } }` })
    })
    const j = await r.json() as any
    const ok = !j.errors
    console.log(`${ok ? 'OK ' : 'ERR'} images { ${f} }` + (ok ? '' : ' => ' + j.errors[0].message))
    if (ok) console.log('   ', JSON.stringify(j.data?.print?.images?.slice(0, 2)))
  }

  // Full data dump with known-good fields
  console.log('\n--- Full data dump ---')
  const r2 = await fetch('https://api.printables.com/graphql/', {
    method: 'POST', headers: H,
    body: JSON.stringify({ query: `query {
      print(id: "1247082") {
        name
        description
        summary
        printDuration
        slug
        user { publicUsername }
        images { filePath }
        tags { name }
      }
    }` })
  })
  const j2 = await r2.json() as any
  if (j2.errors) console.log('Errors:', JSON.stringify(j2.errors))
  else console.log(JSON.stringify(j2.data.print, null, 2))
}

probe().catch(e => console.error(e.message))
