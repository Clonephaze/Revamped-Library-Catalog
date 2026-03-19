/**
 * seed-catalog.ts
 *
 * One-time script that reads the existing "3D Printing Catalogue" folder
 * structure and outputs a TSV (tab-separated values) file that can be
 * pasted directly into the Google Sheets `catalog` tab.
 *
 * Usage:
 *   npx tsx scripts/seed-catalog.ts
 *
 * Output:
 *   scripts/catalog-seed.tsv   — open in a text editor, Select All, paste
 *                                  into the catalog sheet starting at A1.
 *
 * The script extracts:
 *   - ModelID   (slugified model folder name)
 *   - Name      (model folder name, cleaned up)
 *   - Category  (parent folder letter prefix → human label)
 *   - PrintTime (tier folder: Long / Medium / Short)
 *   - Description, ImageURL, Author, SourceURL are left blank — staff fills these in.
 *   - Active    (TRUE)
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const CATALOGUE_DIR = join(__dirname, '..', '3D Printing Catalogue')

const CATEGORY_MAP: Record<string, string> = {
  'A': 'Toys & Gadgets',
  'B': 'Educational & STEM',
  'C': 'Home & Office',
  'D': 'Miscellaneous',
}

const PRINT_TIERS = ['Long Prints', 'Medium Prints', 'Short Prints']

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')       // strip leading number + dot
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric → dash
    .replace(/^-+|-+$/g, '')        // trim leading/trailing dashes
}

function cleanName(folderName: string): string {
  return folderName.replace(/^\d+\.\s*/, '').trim()
}

function tierToLabel(tier: string): string {
  if (tier.startsWith('Long')) return 'Long'
  if (tier.startsWith('Medium')) return 'Medium'
  if (tier.startsWith('Short')) return 'Short'
  return ''
}

interface CatalogRow {
  category: string
  name: string
  description: string
  printTimeMinutes: string
  author: string
  source: string
  pictureUrl: string
}

const rows: CatalogRow[] = []

// Walk each category folder (A. Toys & Gadgets, B. Educational & STEM, etc.)
for (const catFolder of readdirSync(CATALOGUE_DIR).sort()) {
  const catPath = join(CATALOGUE_DIR, catFolder)
  if (!statSync(catPath).isDirectory()) continue

  // Determine category from the leading letter
  const letter = catFolder.charAt(0).toUpperCase()
  const category = CATEGORY_MAP[letter]
  if (!category) continue

  // Check if this category has tier subfolders (Long/Medium/Short) or direct model folders
  const children = readdirSync(catPath).sort()
  const hasTiers = children.some((c) =>
    PRINT_TIERS.some((t) => c.includes(t.split(' ')[0])),
  )

  if (hasTiers) {
    for (const tierFolder of children) {
      const tierPath = join(catPath, tierFolder)
      if (!statSync(tierPath).isDirectory()) continue

      const printTime = tierToLabel(tierFolder)

      for (const modelFolder of readdirSync(tierPath).sort()) {
        const modelPath = join(tierPath, modelFolder)
        if (!statSync(modelPath).isDirectory()) continue

        rows.push({
          category,
          name: cleanName(modelFolder),
          description: '',
          printTimeMinutes: '',
          author: '',
          source: '',
          pictureUrl: '',
        })
      }
    }
  } else {
    // Direct model folders under category (e.g. D. Miscellaneous)
    for (const modelFolder of children) {
      const modelPath = join(catPath, modelFolder)
      if (!statSync(modelPath).isDirectory()) continue

      rows.push({
        category,
        name: cleanName(modelFolder),
        description: '',
        printTimeMinutes: '',
        author: '',
        source: '',
        pictureUrl: '',
      })
    }
  }
}

// Build TSV output
const header = ['Category', 'Name', 'Description', 'Print Time Minutes', 'Author', 'Source', 'Picture URL']
const lines = [
  header.join('\t'),
  ...rows.map((r) =>
    [r.category, r.name, r.description, r.printTimeMinutes, r.author, r.source, r.pictureUrl].join('\t'),
  ),
]

const outPath = join(__dirname, 'catalog-seed.tsv')
writeFileSync(outPath, lines.join('\n'), 'utf-8')

console.log(`✅ Generated ${rows.length} catalog entries → ${outPath}`)
console.log('\nNext steps:')
console.log('  1. Open catalog-seed.tsv in a text editor')
console.log('  2. Select All → Copy')
console.log('  3. Go to your Google Sheet → catalog tab → cell A1 → Paste')
console.log('  4. Fill in ImageURL + SourceURL + Author for each model')
