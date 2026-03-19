<script setup lang="ts">
interface CatalogItem {
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTimeMinutes: number
  description: string
  author: string
  sourceUrl: string
}

const props = defineProps<{
  items: CatalogItem[]
}>()

const selectedCategory = ref('All')
const selectedItem = ref<CatalogItem | null>(null)

type SortOption = 'category' | 'name' | 'time-asc' | 'time-desc'
const sortBy = ref<SortOption>('category')

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'name', label: 'Name' },
  { value: 'time-asc', label: 'Time ↑' },
  { value: 'time-desc', label: 'Time ↓' },
]

const categories = computed(() => {
  const cats = new Set(props.items.map((i) => i.category).filter(Boolean))
  return ['All', ...Array.from(cats).sort()]
})

const filteredItems = computed(() => {
  let items = props.items.filter((i) => {
    if (selectedCategory.value !== 'All' && i.category !== selectedCategory.value) return false
    return true
  })

  items = [...items].sort((a, b) => {
    switch (sortBy.value) {
      case 'category':
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'time-asc':
        return a.printTimeMinutes - b.printTimeMinutes
      case 'time-desc':
        return b.printTimeMinutes - a.printTimeMinutes
      default:
        return 0
    }
  })

  return items
})
function openModel(modelId: string) {
  const item = props.items.find((i) => i.modelId === modelId)
  if (item) selectedItem.value = item
}
</script>

<template>
  <div>
    <!-- Toolbar: filters + sort -->
    <div class="catalog-toolbar">
      <!-- Category filter pills -->
      <div v-if="categories.length > 2" class="catalog-filters" role="group" aria-label="Filter by category">
        <button
          v-for="cat in categories"
          :key="cat"
          class="filter-btn"
          :class="{ active: selectedCategory === cat }"
          :aria-pressed="selectedCategory === cat"
          type="button"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Sort dropdown -->
      <div class="catalog-sort">
        <label for="sort-select" class="catalog-sort__label">Sort by</label>
        <select id="sort-select" v-model="sortBy" class="form-select catalog-sort__select">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="filteredItems.length > 0" class="catalog-grid">
      <ModelCard
        v-for="item in filteredItems"
        :key="item.modelId"
        v-bind="item"
        @select="openModel"
      />
    </div>

    <div v-else class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">🔍</span>
      <p class="empty-state__title">No models in this category</p>
      <p>Try selecting a different category above.</p>
    </div>

    <!-- Modal -->
    <ModelModal
      v-if="selectedItem"
      :model="selectedItem"
      @close="selectedItem = null"
    />
  </div>
</template>
