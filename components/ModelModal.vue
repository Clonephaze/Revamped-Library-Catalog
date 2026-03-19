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
  model: CatalogItem
}>()

const emit = defineEmits<{
  close: []
}>()

function onBackdrop(e: MouseEvent) {
  if ((e.target as Element)?.classList.contains('modal-backdrop')) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="onBackdrop" role="dialog" aria-modal="true" :aria-label="model.name">
      <div class="modal-panel">
        <!-- Close button -->
        <button
          type="button"
          class="modal-close"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>

        <!-- Scrollable content -->
        <div class="modal-content">
          <div class="modal-detail">
            <!-- Image -->
            <div class="modal-image-wrap">
              <img
                v-if="model.imageUrl"
                :src="model.imageUrl"
                :alt="model.name"
                class="modal-image"
                referrerpolicy="no-referrer"
              />
              <div v-else class="modal-image modal-image--placeholder" aria-hidden="true">🖨️</div>
            </div>

            <!-- Info -->
            <div class="modal-info">
              <span class="badge badge--category">{{ model.category }}</span>

              <h2 class="modal-title">{{ model.name }}</h2>

              <p class="modal-time">
                ⏱ Est. print time: <strong>{{ model.printTimeMinutes }} min</strong>
              </p>

              <p v-if="model.description" class="modal-desc">
                {{ model.description }}
              </p>

              <p v-if="model.author" class="modal-author">
                Designed by <strong>{{ model.author }}</strong>
              </p>

              <p v-if="model.sourceUrl" class="modal-source">
                <a :href="model.sourceUrl" target="_blank" rel="noopener noreferrer">
                  View original model ↗
                </a>
              </p>
            </div>
          </div>

          <!-- Print request form (always visible) -->
          <div class="modal-form-section">
            <h3 class="modal-form-heading">Request a Print</h3>

            <PrintForm
              :model-id="model.modelId"
              :model-name="model.name"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(9, 53, 71, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-panel {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 40px rgba(9, 53, 71, 0.25);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.modal-close:hover {
  background: #f0f0f0;
}

.modal-content {
  overflow-y: auto;
  padding: 2.75rem 1.5rem 1.25rem;
}

.modal-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 600px) {
  .modal-detail {
    grid-template-columns: 260px 1fr;
    gap: 1.25rem;
  }
}

.modal-image-wrap {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.modal-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
  background-color: #eef2ea;
}

.modal-image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: linear-gradient(135deg, #eef2ea 0%, #dce5d4 100%);
}

.modal-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0;
}

.modal-time {
  font-size: 0.9rem;
  color: var(--brand-navy);
}

.modal-desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text);
}

.modal-author {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.modal-source {
  font-size: 0.875rem;
}

.modal-source a {
  color: var(--color-accent);
}

.modal-form-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.modal-form-heading {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}
</style>
