<script setup lang="ts">
interface CatalogItem {
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTimeMinutes: number
  author: string
}

const props = defineProps<{
  items: CatalogItem[]
}>()

const selectedCategory = ref('All')

const categories = computed(() => {
  const cats = new Set(props.items.map((i) => i.category).filter(Boolean))
  return ['All', ...Array.from(cats).sort()]
})

const filteredItems = computed(() =>
  props.items.filter((i) => {
    if (selectedCategory.value !== 'All' && i.category !== selectedCategory.value) return false
    return true
  }),
)
</script>

<template>
  <div>
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

    <!-- Grid -->
    <div v-if="filteredItems.length > 0" class="catalog-grid">
      <ModelCard
        v-for="item in filteredItems"
        :key="item.modelId"
        v-bind="item"
      />
    </div>

    <div v-else class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">🔍</span>
      <p class="empty-state__title">No models in this category</p>
      <p>Try selecting a different category above.</p>
    </div>
  </div>
</template>
