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

const route = useRoute()
const id = route.params.id as string

const { data: model, status, error } = await useFetch<CatalogItem>(`/api/model/${id}`)

useHead(() => ({
  title: model.value ? `${model.value.name} — Northeast Branch Library` : '3D Print Model',
}))

const showForm = ref(false)
</script>

<template>
  <div class="container">
    <!-- Back link -->
    <NuxtLink to="/" class="btn btn--secondary" style="margin-bottom: 1.5rem; display: inline-flex;">
      ← Back to Catalog
    </NuxtLink>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="page-loading" aria-label="Loading model">
      <div class="spinner spinner--dark" />
    </div>

    <!-- Error / not found -->
    <div v-else-if="error || !model" class="alert alert--error" role="alert">
      This model could not be found.
      <NuxtLink to="/" style="margin-left: 0.5rem; font-weight: 600;">Return to catalog</NuxtLink>
    </div>

    <!-- Model detail -->
    <template v-else>
      <div class="model-detail">
        <!-- Image -->
        <div>
          <img
            v-if="model.imageUrl"
            :src="model.imageUrl"
            :alt="model.name"
            class="model-detail__image"
            referrerpolicy="no-referrer"
          />
          <div v-else class="model-detail__placeholder" aria-hidden="true">🖨️</div>
        </div>

        <!-- Info -->
        <div>
          <div style="margin-bottom: 0.5rem">
            <span class="badge badge--category">{{ model.category }}</span>
          </div>

          <h1 class="page-title" style="margin-bottom: 0.75rem">{{ model.name }}</h1>

          <p class="badge badge--time" style="display: inline-flex; margin-bottom: 1rem">
            ⏱ Est. print time: {{ model.printTimeMinutes }} min
          </p>

          <p v-if="model.description" style="margin-bottom: 1rem; line-height: 1.6; color: var(--color-text)">
            {{ model.description }}
          </p>

          <p v-if="model.author" style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--color-text-muted)">
            Designed by <strong>{{ model.author }}</strong>
          </p>

          <p v-if="model.sourceUrl" style="margin-bottom: 1.5rem">
            <a :href="model.sourceUrl" target="_blank" rel="noopener noreferrer" style="font-size: 0.9rem;">
              View original model ↗
            </a>
          </p>

          <!-- Print CTA -->
          <button
            v-if="!showForm"
            class="btn btn--primary btn--lg btn--full"
            type="button"
            @click="showForm = true"
          >
            🖨️ &nbsp;Print This
          </button>
        </div>
      </div>

      <!-- Print request form (revealed after tapping "Print This") -->
      <div v-if="showForm" class="card" style="margin-top: 2rem; padding: 1.5rem">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem">
          <h2 style="font-size: 1.2rem; font-weight: 700">Request a Print</h2>
          <button
            type="button"
            class="btn btn--secondary"
            style="padding: 0.4rem 0.9rem; font-size: 0.875rem"
            aria-label="Cancel print request form"
            @click="showForm = false"
          >
            Cancel
          </button>
        </div>

        <PrintForm
          :model-id="model.modelId"
          :model-name="model.name"
        />
      </div>
    </template>
  </div>
</template>
