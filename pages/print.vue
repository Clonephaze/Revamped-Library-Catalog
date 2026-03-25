<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Print Catalog — Community Library',
})

interface CatalogItem {
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTimeMinutes: number
  description: string
  author: string
  sourceUrl: string
  tags: string[]
}

interface Filament {
  color: string
  hex: string
}

const [{ data: catalog }, { data: filaments }] = await Promise.all([
  useFetch<CatalogItem[]>('/api/catalog'),
  useFetch<Filament[]>('/api/filaments'),
])

const libraryName = ref('Community Library')
const coverMessage = ref(
  'See a model you like? Visit the library\'s digital catalog to submit a print request — staff will print it and notify you when it\'s ready for pickup.',
)

const printDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
})

// Group catalog by category, sort categories and items within each
const grouped = computed(() => {
  if (!catalog.value) return []
  const map = new Map<string, CatalogItem[]>()
  for (const item of catalog.value) {
    const cat = item.category || 'Uncategorized'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
})

// Flatten into pages: each page = { category, items (up to 6) }
// First chunk of a category includes the heading
const pages = computed(() => {
  const result: { category: string; showHeading: boolean; items: CatalogItem[] }[] = []
  for (const group of grouped.value) {
    const chunks = splitIntoChunks(group.items, 6)
    chunks.forEach((chunk, i) => {
      result.push({ category: group.category, showHeading: i === 0, items: chunk })
    })
  }
  return result
})

function splitIntoChunks<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function formatTime(minutes: number): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function triggerPrint() {
  window.print()
}
</script>

<template>
  <div class="pr">
    <!-- Screen toolbar (hidden when printing) -->
    <div class="pr-bar no-print">
      <div class="pr-bar__inner">
        <NuxtLink to="/" class="pr-bar__back">← Back to Catalog</NuxtLink>
        <span class="pr-bar__label">Print Preview</span>
        <button class="pr-bar__btn" @click="triggerPrint">🖨 Print Catalog</button>
      </div>
    </div>

    <!-- Editable fields (screen only) -->
    <div class="pr-fields no-print">
      <label>
        <span>Library Name</span>
        <input v-model="libraryName" class="pr-fields__input" />
      </label>
      <label>
        <span>Cover Message</span>
        <textarea v-model="coverMessage" class="pr-fields__textarea" rows="3" />
      </label>
    </div>

    <!-- COVER PAGE -->
    <div class="pr-page pr-cover">
      <div class="pr-cover__body">
        <div class="pr-cover__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v8.8a4 4 0 0 1-.7 2.3L14.5 20a1 1 0 0 1-.8.5h-3.4a1 1 0 0 1-.8-.5l-3.3-4.4a4 4 0 0 1-.7-2.3V4.5a1 1 0 0 1 1-1z"/><path d="M6.5 8.5h11"/><circle cx="9" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r=".5" fill="currentColor" stroke="none"/></svg>
        </div>
        <h1 class="pr-cover__title">3D Print Catalog</h1>
        <p class="pr-cover__org">{{ libraryName }}</p>
        <div class="pr-cover__divider" />
        <p class="pr-cover__stat">{{ catalog?.length ?? 0 }} models available</p>
        <p class="pr-cover__stat">{{ filaments?.length ?? 0 }} filament colors</p>
        <p class="pr-cover__date">Printed {{ printDate }}</p>
      </div>
      <p class="pr-cover__msg">{{ coverMessage }}</p>
    </div>

    <!-- CATALOG PAGES -->
    <div v-for="(page, pageIdx) in pages" :key="pageIdx" class="pr-page pr-catalog">
      <div v-if="page.showHeading" class="pr-cat-heading">
        <h2>{{ page.category }}</h2>
      </div>
      <div class="pr-grid" :class="{ 'pr-grid--with-heading': page.showHeading }">
        <div v-for="item in page.items" :key="item.modelId" class="pr-card">
          <div v-if="item.imageUrl" class="pr-card__img">
            <img :src="item.imageUrl" :alt="item.name" />
          </div>
          <div v-else class="pr-card__img pr-card__img--empty" aria-hidden="true">🖨</div>
          <div class="pr-card__body">
            <h3 class="pr-card__name">{{ item.name }}</h3>
            <p class="pr-card__meta">
              <span>⏱ {{ formatTime(item.printTimeMinutes) }}</span>
              <span v-if="item.author" class="pr-card__author">by {{ item.author }}</span>
            </p>
            <p class="pr-card__desc">{{ item.description }}</p>
            <div v-if="item.tags?.length" class="pr-card__tags">
              <span v-for="tag in item.tags" :key="tag" class="pr-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FILAMENT COLORS PAGE -->
    <div v-if="filaments?.length" class="pr-page pr-colors">
      <h2 class="pr-colors__heading">Available Filament Colors</h2>
      <p class="pr-colors__sub">All models can be printed in any of the following colors, subject to availability.</p>
      <div class="pr-colors__grid">
        <div v-for="filament in filaments" :key="filament.color" class="pr-colors__row">
          <span class="pr-colors__swatch" :style="{ background: filament.hex }" />
          <span class="pr-colors__name">{{ filament.color }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   Screen layout
   ============================================================ */
.pr {
  background: #e8e8e8;
  min-height: 100vh;
  padding-top: 56px;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Toolbar */
.pr-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #093547;
  color: white;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.pr-bar__inner {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pr-bar__back {
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  font-size: 0.875rem;
}
.pr-bar__back:hover { color: white; }
.pr-bar__label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.5;
}
.pr-bar__btn {
  background: #80a43f;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.pr-bar__btn:hover { background: #6b8c34; }

/* Editable fields */
.pr-fields {
  max-width: 8.5in;
  margin: 1rem auto 0;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.pr-fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pr-fields__input,
.pr-fields__textarea {
  font-family: inherit;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #333;
}
.pr-fields__textarea {
  resize: vertical;
}

/* Page shell */
.pr-page {
  background: white;
  width: 8.5in;
  min-height: 11in;
  margin: 1rem auto;
  padding: 0.6in 0.65in 0.5in;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  box-sizing: border-box;
}

/* ============================================================
   Cover page
   ============================================================ */
.pr-cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.pr-cover__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.pr-cover__icon svg { width: 4.5rem; height: 4.5rem; color: #093547; }
.pr-cover__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #093547;
  margin-top: 0.75rem;
  line-height: 1.1;
}
.pr-cover__org {
  font-size: 1.2rem;
  font-weight: 600;
  color: #80a43f;
}
.pr-cover__divider {
  width: 3rem;
  height: 3px;
  background: #80a43f;
  border-radius: 2px;
  margin: 0.75rem 0;
}
.pr-cover__stat { font-size: 1rem; color: #4a5568; line-height: 1.7; }
.pr-cover__date { font-size: 0.85rem; color: #9aa5a8; margin-top: 0.4rem; }
.pr-cover__msg {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  max-width: 5in;
  text-align: center;
}

/* ============================================================
   Catalog pages
   ============================================================ */
.pr-catalog {
  padding-top: 0.45in;
}

.pr-cat-heading h2 {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #80a43f;
  border-bottom: 2px solid #80a43f;
  padding-bottom: 0.2rem;
  margin-bottom: 0.2in;
}

.pr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, auto);
  gap: 0.2in;
  align-content: start;
}
.pr-grid--with-heading {
  /* no extra sizing needed */
}

.pr-card {
  border: 3px solid #dde3d8;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.pr-card__img {
  height: 1.9in;
  overflow: hidden;
  background: #f5f7f3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pr-card__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pr-card__img--empty { font-size: 2rem; color: #b0b8b0; }

.pr-card__body {
  padding: 0.12in 0.12in 0.1in;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pr-card__name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #093547;
  line-height: 1.2;
}
.pr-card__meta {
  font-size: 0.68rem;
  color: #728070;
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.pr-card__author { opacity: 0.8; }
.pr-card__desc {
  font-size: 0.7rem;
  color: #444;
  line-height: 1.35;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pr-card__tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 1px; }
.pr-tag {
  background: #eef3e6;
  color: #4a6830;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 100px;
  border: 1px solid #c4d8a0;
}

/* ============================================================
   Colors page
   ============================================================ */
.pr-colors__heading {
  font-size: 1.4rem;
  font-weight: 700;
  color: #093547;
  margin-bottom: 0.2rem;
}
.pr-colors__sub { font-size: 0.85rem; color: #666; margin-bottom: 0.35in; }
.pr-colors__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.15in 0.3in;
}
.pr-colors__row { display: flex; align-items: center; gap: 0.15in; }
.pr-colors__swatch {
  width: 0.35in;
  height: 0.35in;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.pr-colors__name { font-size: 0.85rem; color: #333; }

/* ============================================================
   Print media
   ============================================================ */
@media print {
  @page { size: letter; margin: 0; }

  .pr {
    background: white !important;
    padding-top: 0;
  }

  .no-print { display: none !important; }

  .pr-page {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0.6in 0.65in 0.5in;
    box-shadow: none;
    page-break-after: always;
    break-after: always;
  }



  .pr-colors {
    page-break-before: always;
    break-before: always;
  }
}
</style>
