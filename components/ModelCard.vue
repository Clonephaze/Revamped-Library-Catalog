<script setup lang="ts">
defineProps<{
  modelId: string
  name: string
  category: string
  imageUrl: string
  printTimeMinutes: number
  author: string
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
      <span class="model-card__time">{{ printTimeMinutes }} min</span>
    </div>

    <div class="model-card__body">
      <p class="model-card__name">{{ name }}</p>
      <div class="model-card__meta">
        <span class="badge badge--category">{{ category }}</span>
      </div>
      <p v-if="author" class="model-card__author">by {{ author }}</p>
    </div>
  </button>
</template>

<style scoped>
.model-card__image-wrap {
  position: relative;
}

.model-card__time {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(9, 53, 71, 0.85);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  line-height: 1;
}

.model-card__author {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>
