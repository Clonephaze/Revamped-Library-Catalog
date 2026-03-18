<script setup lang="ts">
defineProps<{
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTime: string
}>()
</script>

<template>
  <NuxtLink :to="`/model/${modelId}`" class="card card--hover model-card" :aria-label="`View ${name}`">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="name"
      class="model-card__image"
      loading="lazy"
    />
    <div v-else class="model-card__placeholder" aria-hidden="true">🖨️</div>

    <div class="model-card__body">
      <p class="model-card__name">{{ name }}</p>
      <div class="model-card__meta">
        <span class="badge badge--category">{{ category }}</span>
        <span class="badge badge--time">⏱ {{ printTime }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
