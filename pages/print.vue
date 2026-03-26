<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'Print Catalog' })

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

// ─── Cover ───────────────────────────────────────────────────
const libraryName      = ref('Community Library')
const coverMessage     = ref("See a model you like? Visit the library's digital catalog to submit a print request — staff will print it and notify you when it's ready for pickup.")
const coverColor       = ref('#375C2D')
const accentColor      = ref('#a3e635')
const coverTitle       = ref('3-D\nPrinting Catalogue')
const coverPhotoUrl    = ref('/backgroundPrint.jpg')
const coverIcon1Url    = ref('/printer.png')
const coverIcon2Url    = ref('/rulerAndSquare.png')
const showWave         = ref(true)
const photoTintColor   = ref('#001a2c')
const photoTintOpacity = ref(0)

// ─── Layout options ───────────────────────────────────────────
const cardsPerPage      = ref(6)
const pageSize          = ref<'letter'|'a4'>('letter')
const showCover         = ref(true)
const showColorsPage    = ref(true)
const showCardImages    = ref(true)
const showPageNumbers   = ref(false)
const showLibraryHeader = ref(false)

// ─── Panel ───────────────────────────────────────────────────
const panelOpen = ref(true)
onMounted(() => { if (window.innerWidth < 640) panelOpen.value = false })

// ─── Color theme presets ─────────────────────────────────────
const colorThemes = [
    { name: 'Forest',   cover: '#375C2D', accent: '#a3e635' },
    { name: 'Ocean',    cover: '#0a3d5c', accent: '#38bdf8' },
    { name: 'Crimson',  cover: '#7f1d1d', accent: '#fca5a5' },
    { name: 'Gold',     cover: '#78350f', accent: '#fcd34d' },
    { name: 'Midnight', cover: '#1e1b4b', accent: '#a78bfa' },
    { name: 'Sage',     cover: '#2d4a3e', accent: '#6ee7b7' },
]
function applyTheme(t: typeof colorThemes[0]) {
    coverColor.value  = t.cover
    accentColor.value = t.accent
}

// ─── Title HTML (inlines accent color on lines 2+) ───────────
const coverTitleHtml = computed(() =>
    coverTitle.value.split('\n')
        .map((line, i) => `<span${i > 0 ? ` style="color:${accentColor.value}"` : ''}>${line}</span>`)
        .join('<br />')
)

// ─── Page dimensions ─────────────────────────────────────────
const pageW = computed(() => pageSize.value === 'a4' ? '8.27in' : '8.5in')
const pageH = computed(() => pageSize.value === 'a4' ? '11.69in' : '11in')
const pageStyle = computed(() => ({ width: pageW.value, minHeight: pageH.value }))

function handleFile(target: Ref<string>, e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
        if (target.value) URL.revokeObjectURL(target.value)
        target.value = URL.createObjectURL(file)
    }
}
function onCoverPhoto(e: Event) { handleFile(coverPhotoUrl, e) }
function onIcon1(e: Event) { handleFile(coverIcon1Url, e) }
function onIcon2(e: Event) { handleFile(coverIcon2Url, e) }
function setCardsPerPage(n: number) { cardsPerPage.value = n }
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

// Flatten into pages with page numbers
const pages = computed(() => {
    const result: { category: string; showHeading: boolean; items: CatalogItem[]; pageNum: number }[] = []
    let n = showCover.value ? 2 : 1
    for (const group of grouped.value) {
        splitIntoChunks(group.items, cardsPerPage.value).forEach((chunk, i) => {
            result.push({ category: group.category, showHeading: i === 0, items: chunk, pageNum: n++ })
        })
    }
    return result
})

const totalPages = computed(() => {
    let n = pages.value.length
    if (showCover.value) n++
    if (showColorsPage.value && filaments.value?.length) n++
    return n
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
    // Inject dynamic @page size so Letter/A4 is respected
    let el = document.getElementById('pr-page-size') as HTMLStyleElement | null
    if (!el) {
        el = document.createElement('style')
        el.id = 'pr-page-size'
        document.head.appendChild(el)
    }
    el.textContent = `@page { size: ${pageSize.value === 'a4' ? 'A4' : 'letter'}; margin: 0; }`
    window.print()
}
</script>

<template>
    <div class="pr">

        <!-- ── Toolbar ──────────────────────────────────────────── -->
        <div class="pr-bar no-print">
            <div class="pr-bar__start">
                <NuxtLink to="/" class="pr-bar__back">← Back</NuxtLink>
                <button class="pr-bar__toggle" @click="panelOpen = !panelOpen">
                    ⚙ {{ panelOpen ? 'Hide' : 'Settings' }}
                </button>
            </div>
            <span class="pr-bar__label">Print Preview</span>
            <button class="pr-bar__btn" @click="triggerPrint">🖨 Print Catalog</button>
        </div>

        <!-- ── Mobile backdrop ──────────────────────────────────── -->
        <div v-if="panelOpen" class="pr-backdrop no-print" aria-hidden="true" @click="panelOpen = false" />

        <!-- ── Content row ──────────────────────────────────────── -->
        <div class="pr-content">

            <!-- ── Settings panel ───────────────────────────────── -->
            <aside class="pr-panel no-print" :class="{ 'pr-panel--open': panelOpen }">

                <div class="pr-panel__header">
                    <span class="pr-panel__logo">🖨</span>
                    <div>
                        <p class="pr-panel__title">Print Settings</p>
                        <p class="pr-panel__sub">{{ catalog?.length ?? 0 }} models · {{ totalPages }} pages</p>
                    </div>
                    <button class="pr-panel__close" title="Close" @click="panelOpen = false">✕</button>
                </div>

                <!-- 📚 Library -->
                <div class="pr-panel__section">
                    <p class="pr-panel__section-label">📚 Library</p>
                    <label class="pr-panel__field">
                        <span>Library Name</span>
                        <input v-model="libraryName" class="pr-panel__input" placeholder="Community Library" />
                    </label>
                    <label class="pr-panel__field">
                        <span>Cover Message</span>
                        <textarea v-model="coverMessage" class="pr-panel__input pr-panel__textarea" rows="3" />
                    </label>
                </div>

                <!-- 🎨 Design -->
                <div class="pr-panel__section">
                    <p class="pr-panel__section-label">🎨 Design</p>
                    <div class="pr-panel__field">
                        <span>Quick Themes</span>
                        <div class="pr-panel__themes">
                            <button
                                v-for="theme in colorThemes" :key="theme.name"
                                class="pr-panel__theme-btn"
                                :title="theme.name"
                                :style="{ background: `linear-gradient(135deg, ${theme.cover} 55%, ${theme.accent} 55%)` }"
                                @click="applyTheme(theme)"
                            />
                        </div>
                    </div>
                    <label class="pr-panel__field">
                        <span>Cover Title <small>(one line per row)</small></span>
                        <textarea v-model="coverTitle" class="pr-panel__input pr-panel__textarea" rows="2" />
                    </label>
                    <div class="pr-panel__two-col">
                        <label class="pr-panel__field">
                            <span>Cover Colour</span>
                            <div class="pr-panel__color-row">
                                <input v-model="coverColor" type="color" class="pr-panel__color" />
                                <span class="pr-panel__color-hex">{{ coverColor }}</span>
                            </div>
                        </label>
                        <label class="pr-panel__field">
                            <span>Accent Colour</span>
                            <div class="pr-panel__color-row">
                                <input v-model="accentColor" type="color" class="pr-panel__color" />
                                <span class="pr-panel__color-hex">{{ accentColor }}</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 🖼 Images -->
                <div class="pr-panel__section">
                    <p class="pr-panel__section-label">🖼 Images</p>
                    <label class="pr-panel__field">
                        <span>Cover Photo</span>
                        <input type="file" accept="image/*" class="pr-panel__file" @change="onCoverPhoto" />
                    </label>
                    <label class="pr-panel__field">
                        <span>Icon 1 <small>(top-right)</small></span>
                        <input type="file" accept="image/*" class="pr-panel__file" @change="onIcon1" />
                    </label>
                    <label class="pr-panel__field">
                        <span>Icon 2 <small>(mid-left)</small></span>
                        <input type="file" accept="image/*" class="pr-panel__file" @change="onIcon2" />
                    </label>
                    <div class="pr-panel__field">
                        <span>Photo Tint <small>({{ photoTintOpacity }}%)</small></span>
                        <div class="pr-panel__tint-row">
                            <input v-model="photoTintColor" type="color" class="pr-panel__color pr-panel__color--sm" />
                            <input v-model.number="photoTintOpacity" type="range" min="0" max="80" step="5" class="pr-panel__range" />
                        </div>
                    </div>
                </div>

                <!-- 📄 Layout -->
                <div class="pr-panel__section">
                    <p class="pr-panel__section-label">📄 Layout</p>
                    <div class="pr-panel__field">
                        <span>Cards Per Page</span>
                        <div class="pr-panel__seg">
                            <button
                                v-for="n in [4, 6, 8]" :key="n"
                                class="pr-panel__seg-btn"
                                :class="{ active: cardsPerPage === n }"
                                @click="setCardsPerPage(n)"
                            >{{ n }}</button>
                        </div>
                    </div>
                    <div class="pr-panel__field">
                        <span>Page Size</span>
                        <div class="pr-panel__seg">
                            <button class="pr-panel__seg-btn" :class="{ active: pageSize === 'letter' }" @click="pageSize = 'letter'">Letter</button>
                            <button class="pr-panel__seg-btn" :class="{ active: pageSize === 'a4' }" @click="pageSize = 'a4'">A4</button>
                        </div>
                    </div>
                </div>

                <!-- 🔀 Sections -->
                <div class="pr-panel__section">
                    <p class="pr-panel__section-label">🔀 Sections</p>
                    <label class="pr-panel__toggle-row">
                        <span>Cover Page</span>
                        <span class="pr-panel__switch"><input v-model="showCover" type="checkbox" /><span /></span>
                    </label>
                    <label class="pr-panel__toggle-row">
                        <span>Colors Page</span>
                        <span class="pr-panel__switch"><input v-model="showColorsPage" type="checkbox" /><span /></span>
                    </label>
                    <label class="pr-panel__toggle-row">
                        <span>Card Images</span>
                        <span class="pr-panel__switch"><input v-model="showCardImages" type="checkbox" /><span /></span>
                    </label>
                    <label class="pr-panel__toggle-row">
                        <span>Wave Divider</span>
                        <span class="pr-panel__switch"><input v-model="showWave" type="checkbox" /><span /></span>
                    </label>
                    <label class="pr-panel__toggle-row">
                        <span>Page Numbers</span>
                        <span class="pr-panel__switch"><input v-model="showPageNumbers" type="checkbox" /><span /></span>
                    </label>
                    <label class="pr-panel__toggle-row">
                        <span>Library Header</span>
                        <span class="pr-panel__switch"><input v-model="showLibraryHeader" type="checkbox" /><span /></span>
                    </label>
                </div>

                <button class="pr-panel__print-btn" @click="triggerPrint">🖨&nbsp; Print Catalog</button>
            </aside>

            <!-- ── Pages scroll area ─────────────────────────────── -->
            <div class="pr-pages">

                <!-- Cover page -->
                <div v-if="showCover" class="pr-page pr-cover" :style="[pageStyle, { background: coverColor }]">
                    <div class="pr-cover__top">
                        <div class="pr-cover__org">
                            <span class="pr-cover__org-name">{{ libraryName }}</span>
                        </div>
                        <div v-if="coverIcon1Url" class="pr-cover__badge pr-cover__badge--tr">
                            <img :src="coverIcon1Url" alt="Icon" />
                        </div>
                    </div>
                    <div v-if="coverIcon2Url" class="pr-cover__badge pr-cover__badge--ml">
                        <img :src="coverIcon2Url" alt="Icon" />
                    </div>
                    <div class="pr-cover__photo-wrap">
                        <svg v-if="showWave" class="pr-cover__wave" :style="{ color: coverColor }" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M0,0 L0,40 Q250,100 500,40 Q750,-20 1000,40 L1000,0 Z" fill="currentColor" />
                        </svg>
                        <div v-if="coverPhotoUrl" class="pr-cover__photo">
                            <img :src="coverPhotoUrl" alt="Cover" />
                            <div v-if="photoTintOpacity > 0" class="pr-cover__tint" :style="{ background: photoTintColor, opacity: photoTintOpacity / 100 }" />
                        </div>
                        <div v-else class="pr-cover__photo pr-cover__photo--empty">
                            <span>Upload a cover photo above</span>
                        </div>
                        <div class="pr-cover__title-block">
                            <!-- eslint-disable-next-line vue/no-v-html -->
                            <div class="pr-cover__title" v-html="coverTitleHtml" />
                        </div>
                    </div>
                    <div class="pr-cover__footer">
                        <p class="pr-cover__stats">
                            {{ catalog?.length ?? 0 }} models &middot; {{ filaments?.length ?? 0 }} colors &middot; {{ printDate }}
                        </p>
                        <p v-if="coverMessage" class="pr-cover__msg">{{ coverMessage }}</p>
                    </div>
                </div>

                <!-- Catalog pages -->
                <div v-for="(page, pageIdx) in pages" :key="pageIdx" class="pr-page pr-catalog" :style="pageStyle">
                    <div v-if="showLibraryHeader" class="pr-page-header">
                        <span class="pr-page-header__name">{{ libraryName }}</span>
                        <span class="pr-page-header__label">3D Print Catalog</span>
                    </div>
                    <div v-if="page.showHeading" class="pr-cat-heading">
                        <h2 :style="{ color: accentColor, borderBottomColor: accentColor }">{{ page.category }}</h2>
                    </div>
                    <div class="pr-grid" :class="`pr-grid--${cardsPerPage}`">
                        <div v-for="item in page.items" :key="item.modelId" class="pr-card">
                            <div v-if="showCardImages" class="pr-card__img" :class="{ 'pr-card__img--empty': !item.imageUrl }">
                                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
                                <span v-else aria-hidden="true">🖨</span>
                            </div>
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
                    <div v-if="showPageNumbers || showLibraryHeader" class="pr-page-footer">
                        <span v-if="showLibraryHeader" class="pr-page-footer__name">{{ libraryName }}</span>
                        <span v-else />
                        <span v-if="showPageNumbers" class="pr-page-footer__num">{{ page.pageNum }} / {{ totalPages }}</span>
                    </div>
                </div>

                <!-- Colors page -->
                <div v-if="showColorsPage && filaments?.length" class="pr-page pr-colors" :style="pageStyle">
                    <h2 class="pr-colors__heading" :style="{ color: coverColor }">Available Filament Colors</h2>
                    <p class="pr-colors__sub">All models can be printed in any of the following colors, subject to availability.</p>
                    <div class="pr-colors__grid">
                        <div v-for="filament in filaments" :key="filament.color" class="pr-colors__row">
                            <span class="pr-colors__swatch" :style="{ background: filament.hex }" />
                            <span class="pr-colors__name">{{ filament.color }}</span>
                        </div>
                    </div>
                </div>

            </div><!-- end .pr-pages -->
        </div><!-- end .pr-content -->
    </div>
</template>

<style scoped>
/* ============================================================
   Root
   ============================================================ */
.pr {
    background: #d4d8d4;
    min-height: 100vh;
    padding-top: 56px;
    font-family: system-ui, -apple-system, sans-serif;
}

/* ============================================================
   Toolbar
   ============================================================ */
.pr-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    background: #093547;
    color: white;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.pr-bar__start {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.pr-bar__back {
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    font-size: 0.875rem;
}
.pr-bar__back:hover { color: white; }

.pr-bar__toggle {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 5px;
    color: rgba(255,255,255,0.8);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.28rem 0.65rem;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
}
.pr-bar__toggle:hover { background: rgba(255,255,255,0.18); }

.pr-bar__label {
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    opacity: 0.4;
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
    white-space: nowrap;
}
.pr-bar__btn:hover { background: #6b8c34; }

/* ============================================================
   Mobile backdrop
   ============================================================ */
.pr-backdrop {
    position: fixed;
    inset: 56px 0 0 0;
    background: rgba(0,0,0,0.45);
    z-index: 150;
}
@media (min-width: 1300px) {
    .pr-backdrop { display: none !important; }
}

/* ============================================================
   Content row + responsive panel
   ============================================================ */
.pr-content {
    display: flex;
    align-items: flex-start;
}

/* ≥1300px — sticky sidebar, toggleable */
@media (min-width: 1300px) {
    .pr-panel {
        width: 280px;
        position: sticky;
        top: 56px;
        height: calc(100vh - 56px);
        overflow-y: auto;
        border-right: 1px solid rgba(255,255,255,0.06);
        transition: width 0.25s ease, opacity 0.2s;
        flex-shrink: 0;
    }
    .pr-panel:not(.pr-panel--open) {
        width: 0;
        overflow: hidden;
        border-right: none;
        opacity: 0;
    }
    .pr-pages {
        flex: 1;
        min-width: 0;
        padding: 1rem 1.5rem 3rem;
        overflow-x: auto;
    }
}

/* 640–1299px — narrower collapsible inline sidebar */
@media (min-width: 640px) and (max-width: 1299px) {
    .pr-content { flex-direction: row; }
    .pr-panel {
        width: 240px;
        position: sticky;
        top: 56px;
        height: calc(100vh - 56px);
        overflow-y: auto;
        border-right: 1px solid rgba(255,255,255,0.06);
        transition: width 0.25s ease, opacity 0.2s;
        flex-shrink: 0;
    }
    .pr-panel:not(.pr-panel--open) {
        width: 0;
        overflow: hidden;
        border-right: none;
        opacity: 0;
    }
    .pr-pages {
        flex: 1;
        min-width: 0;
        padding: 0.75rem 1rem 3rem;
        overflow-x: auto;
    }
}

/* <640px — fixed overlay drawer from left */
@media (max-width: 639px) {
    .pr-content { flex-direction: column; }
    .pr-panel {
        position: fixed;
        top: 56px;
        left: 0;
        bottom: 0;
        width: 300px;
        max-width: 90vw;
        z-index: 160;
        overflow-y: auto;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        box-shadow: 4px 0 24px rgba(0,0,0,0.4);
    }
    .pr-panel--open { transform: translateX(0); }
    .pr-pages { width: 100%; padding: 0.5rem; overflow-x: auto; }
}

/* ============================================================
   Settings panel — base (shared across breakpoints)
   ============================================================ */
.pr-panel {
    background: #0f2430;
    color: #c8d8d0;
    display: flex;
    flex-direction: column;
}

.pr-panel__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.1rem 1rem 0.9rem;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: #0a1c28;
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;
}
.pr-panel__logo { font-size: 1.5rem; line-height: 1; }
.pr-panel__title { font-size: 0.9rem; font-weight: 700; color: white; line-height: 1.2; }
.pr-panel__sub { font-size: 0.67rem; color: rgba(255,255,255,0.35); margin-top: 1px; }
.pr-panel__close {
    margin-left: auto;
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    border-radius: 4px;
    line-height: 1;
    flex-shrink: 0;
}
.pr-panel__close:hover { color: white; background: rgba(255,255,255,0.1); }

.pr-panel__section {
    padding: 0.8rem 1rem 0.65rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}
.pr-panel__section-label {
    font-size: 0.63rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.28);
    margin-bottom: 0.05rem;
}

.pr-panel__field {
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
}
.pr-panel__field > span {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.03em;
}
.pr-panel__field small { font-weight: 400; opacity: 0.65; }

.pr-panel__two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.pr-panel__input {
    font-family: inherit;
    font-size: 0.8rem;
    padding: 0.32rem 0.5rem;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 5px;
    color: #e0ece6;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
}
.pr-panel__input:focus {
    border-color: #80a43f;
    background: rgba(255,255,255,0.1);
}
.pr-panel__textarea { resize: vertical; line-height: 1.4; }

.pr-panel__color-row { display: flex; align-items: center; gap: 0.4rem; }
.pr-panel__color {
    width: 34px;
    height: 34px;
    border: 2px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
    background: none;
}
.pr-panel__color--sm { width: 28px; height: 28px; }
.pr-panel__color-hex { font-size: 0.7rem; color: rgba(255,255,255,0.35); font-family: monospace; }

.pr-panel__file { font-size: 0.73rem; color: rgba(255,255,255,0.4); }
.pr-panel__file::file-selector-button {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 4px;
    color: #c8d8d0;
    font-size: 0.7rem;
    padding: 0.18rem 0.45rem;
    cursor: pointer;
    margin-right: 0.35rem;
    transition: background 0.15s;
}
.pr-panel__file::file-selector-button:hover { background: rgba(255,255,255,0.18); }

/* Color theme swatches */
.pr-panel__themes {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
.pr-panel__theme-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 2px solid rgba(255,255,255,0.15);
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
}
.pr-panel__theme-btn:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.5); }

/* Tint row */
.pr-panel__tint-row { display: flex; align-items: center; gap: 0.5rem; }
.pr-panel__range { flex: 1; accent-color: #80a43f; cursor: pointer; }

/* Segmented control (Cards per page / Page size) */
.pr-panel__seg {
    display: flex;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    overflow: hidden;
}
.pr-panel__seg-btn {
    flex: 1;
    background: transparent;
    border: none;
    border-right: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.45);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.3rem 0;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}
.pr-panel__seg-btn:last-child { border-right: none; }
.pr-panel__seg-btn:hover { background: rgba(255,255,255,0.08); color: white; }
.pr-panel__seg-btn.active { background: #80a43f; color: white; }

/* Section toggles */
.pr-panel__toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 0.08rem 0;
}
.pr-panel__toggle-row > span:first-child {
    font-size: 0.72rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
}

/* iOS-style switch */
.pr-panel__switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 18px;
    flex-shrink: 0;
}
.pr-panel__switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.pr-panel__switch > span {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.12);
    border-radius: 18px;
    transition: background 0.2s;
    cursor: pointer;
}
.pr-panel__switch > span::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    left: 2px;
    top: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
}
.pr-panel__switch input:checked + span { background: #80a43f; }
.pr-panel__switch input:checked + span::before { transform: translateX(16px); }

.pr-panel__print-btn {
    margin: 0.75rem 1rem 1rem;
    background: #80a43f;
    color: white;
    border: none;
    border-radius: 7px;
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s;
    width: calc(100% - 2rem);
    flex-shrink: 0;
}
.pr-panel__print-btn:hover { background: #6b8c34; }
/* ============================================================
   Pages area & page shell
   ============================================================ */
.pr-pages {
    flex: 1;
    padding: 0.5rem;
}

.pr-page {
    background: white;
    width: 8.5in;
    min-height: 11in;
    margin: 1rem auto;
    padding: 0.6in 0.65in 0.5in;
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    box-sizing: border-box;
    position: relative;
}

/* ============================================================
   Cover page — poster layout
   ============================================================ */
.pr-cover {
    display: flex;
    flex-direction: column;
    padding: 0 !important;
    overflow: hidden;
    position: relative;
}

/* Top band — library name + icon 1 */
.pr-cover__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.5in 0.55in 0;
}

.pr-cover__org {
    display: flex;
    flex-direction: column;
}

.pr-cover__org-name {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    line-height: 1.15;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    max-width: 18ch;
}

/* Circular icon badges */
.pr-cover__badge {
    width: 2in;
    height: 2in;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.15);
    border: 4px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
}

.pr-cover__badge img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.pr-cover__badge--tr {
    /* positioned in flex row (top-right) */
    position: absolute;
    top: 1in;
    right: 1in;
}

.pr-cover__badge--ml {
    position: absolute;
    top: 2.5in;
    left: 1in;
}
.pr-cover__badge--tr img {
    transform: scale(0.8);
}

/* Cover photo + title overlay */
.pr-cover__photo-wrap {
    margin-top: auto;
    position: relative;
    min-height: 5in;
}

.pr-cover__wave {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 0.6in;
    z-index: 2;
    display: block;
}

.pr-cover__photo {
    width: 100%;
    height: 5in;
    overflow: hidden;
    position: relative;
}

.pr-cover__tint {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.pr-cover__photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.pr-cover__photo--empty {
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.95rem;
    font-style: italic;
}

.pr-cover__title-block {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.2in 0.55in 0.45in;
}

.pr-cover__title {
    display: flex;
    flex-direction: column;
    gap: 0.05in;
}

/* All title lines share the same shadow/stroke */
.pr-cover__title :deep(span) {
    font-weight: 900;
    letter-spacing: -0.02em;
    -webkit-text-stroke: 1px rgba(0,0,0,0.4);
    text-shadow:
        -2px -2px 0 rgba(0,0,0,0.7),
         2px -2px 0 rgba(0,0,0,0.7),
        -2px  2px 0 rgba(0,0,0,0.7),
         2px  2px 0 rgba(0,0,0,0.7),
         0 3px 10px rgba(0,0,0,0.6);
}

/* First line — large white */
.pr-cover__title :deep(span:first-child) {
    font-size: 4rem;
    color: white;
    line-height: 0.95;
}

/* Subsequent lines — slightly smaller, accent colour (colour injected via inline style) */
.pr-cover__title :deep(span:not(:first-child)) {
    font-size: 2.5rem;
    line-height: 1.1;
}

/* Footer strip (stats + message inside cover bg) */
.pr-cover__footer {
    background: rgba(0, 0, 0, 0.25);
    padding: 0.2in 0.55in;
    text-align: center;
}

.pr-cover__stats {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 0.04em;
}

.pr-cover__msg {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
    margin-top: 0.1in;
    max-width: 6in;
    margin-left: auto;
    margin-right: auto;
}

/* ============================================================
   Catalog pages
   ============================================================ */
.pr-catalog {
    padding-top: 0.45in;
}

/* Optional library header band at top of each catalog page */
.pr-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.1in;
    margin-bottom: 0.15in;
    border-bottom: 1px solid #e0e6db;
}
.pr-page-header__name {
    font-size: 0.72rem;
    font-weight: 700;
    color: #093547;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.pr-page-header__label {
    font-size: 0.65rem;
    color: #9aa5a0;
}

/* Optional footer: library name left, page number right */
.pr-page-footer {
    position: absolute;
    bottom: 0.25in;
    left: 0.65in;
    right: 0.65in;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 0.5px solid #dde3d8;
    padding-top: 0.07in;
}
.pr-page-footer__name {
    font-size: 0.62rem;
    color: #b0b8b0;
    font-weight: 600;
    letter-spacing: 0.03em;
}
.pr-page-footer__num {
    font-size: 0.62rem;
    color: #b0b8b0;
    font-weight: 600;
    letter-spacing: 0.04em;
}

.pr-cat-heading h2 {
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #80a43f; /* fallback; colour overridden by :style binding */
    border-bottom: 2px solid #80a43f; /* ditto */
    padding-bottom: 0.2rem;
    margin-bottom: 0.2in;
}

.pr-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2in;
    align-content: start;
}

/* Grid density variants — all 2-column, image height varies */
.pr-grid--4 .pr-card__img { height: 2.5in; }
.pr-grid--6 .pr-card__img { height: 1.9in; }
.pr-grid--8 .pr-card__img { height: 1.3in; }

.pr-card {
    border: 1px solid #dde3d8;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.pr-card__img {
    height: 1.9in; /* default; overridden by density variant above */
    overflow: hidden;
    background: #f5f7f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pr-card__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.pr-card__img--empty {
    font-size: 2rem;
    color: #b0b8b0;
}

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

.pr-card__author {
    opacity: 0.8;
}

.pr-card__desc {
    font-size: 0.7rem;
    color: #444;
    line-height: 1.35;
    flex: 1;
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.pr-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 1px;
}

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

.pr-colors__sub {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.35in;
}

.pr-colors__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.15in 0.3in;
}

.pr-colors__row {
    display: flex;
    align-items: center;
    gap: 0.15in;
}

.pr-colors__swatch {
    width: 0.35in;
    height: 0.35in;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
}

.pr-colors__name {
    font-size: 0.85rem;
    color: #333;
}

/* ============================================================
   Print media
   ============================================================ */
@media print {
    @page {
        size: letter;
        margin: 0;
    }

    .pr {
        background: white !important;
        padding-top: 0;
    }

    .no-print {
        display: none !important;
    }

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
