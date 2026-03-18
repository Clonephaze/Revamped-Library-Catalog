<script setup lang="ts">
useHead({ title: '3D Print Catalog — Library' })

interface CatalogItem {
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTime: string
  colorOptions: string[]
}

const { data: catalog, status, error } = await useFetch<CatalogItem[]>('/api/catalog')
</script>

<template>
  <div class="container">
    <h1 class="page-title">3D Print Catalog</h1>
    <p class="page-subtitle">
      Browse our models and tap one to request a print. Staff will contact you when it's ready.
    </p>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="page-loading" aria-live="polite" aria-label="Loading catalog">
      <div class="spinner spinner--dark" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert--error" role="alert">
      Unable to load the catalog right now. Please try refreshing or ask a staff member for
      assistance.
    </div>

    <!-- Catalog grid -->
    <CatalogGrid v-else-if="catalog && catalog.length > 0" :items="catalog" />

    <!-- Empty catalog -->
    <div v-else class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">📭</span>
      <p class="empty-state__title">No models available right now</p>
      <p>Check back soon, or ask a staff member for more information.</p>
    </div>
  </div>
</template>
