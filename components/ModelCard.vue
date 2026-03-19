<script setup lang="ts">
defineProps<{
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTimeMinutes: number
  author: string
  tags: string[]
}>()

defineEmits<{
  select: [modelId: string]
}>()
</script>

<template>
  <button
    type="button"
    class="card card--hover model-card"
    :aria-label="`View ${name}`"
    @click="$emit('select', modelId)"
  >
    <div class="model-card__image-wrap">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="model-card__image"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <div v-else class="model-card__placeholder" aria-hidden="true">🖨️</div>
    </div>

    <div class="model-card__body">
      <p class="model-card__name">{{ name }}</p>
      <p class="model-card__time">Est. Print Time: {{ printTimeMinutes }} min</p>
      <div class="model-card__meta">
        <span class="badge badge--category">{{ category }}</span>
        <span v-for="tag in tags" :key="tag" class="badge badge--tag" :class="`badge--tag-${tag.toLowerCase().replace(/\s+/g, '-')}`">{{ tag }}</span>
      </div>
      <p v-if="author" class="model-card__author">by {{ author }}</p>
    </div>
  </button>
</template>

<style scoped>
.model-card__image-wrap {
  position: relative;
}

.model-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-card__time {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  backdrop-filter: blur(4px);
  line-height: 1;
}

.model-card__author {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>
