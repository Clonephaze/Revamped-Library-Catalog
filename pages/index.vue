<script setup lang="ts">
useHead({
  title: '3D Print Catalog — Community Library',
  meta: [
    { name: 'description', content: 'Browse and request free 3D prints from the Community Library. Choose from dozens of models and submit a print request.' },
  ],
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

const { data: catalog, status, error } = useLazyFetch<CatalogItem[]>('/api/catalog')
</script>

<template>
  <div class="container">
    <h1 class="page-title">3D Print Catalog</h1>
    <p class="page-subtitle">
      Browse our models and tap one to request a print. You'll be contacted when it's ready.
    </p>

    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="catalog-grid" aria-live="polite" aria-label="Loading catalog">
      <div v-for="n in 8" :key="n" class="card skeleton-card">
        <div class="skeleton-card__image shimmer" />
        <div class="skeleton-card__body">
          <div class="shimmer" style="height: 1rem; width: 70%; border-radius: 4px" />
          <div class="shimmer" style="height: 0.75rem; width: 50%; border-radius: 4px" />
          <div class="shimmer" style="height: 1.5rem; width: 40%; border-radius: 100px" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert--error" role="alert">
      Unable to load the catalog right now. Please try refreshing the page.
    </div>

    <!-- Catalog grid -->
    <CatalogGrid v-else-if="catalog && catalog.length > 0" :items="catalog" />

    <!-- Empty catalog -->
    <div v-else class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">📭</span>
      <p class="empty-state__title">No models available right now</p>
      <p>Check back soon for new additions.</p>
    </div>
  </div>
</template>
