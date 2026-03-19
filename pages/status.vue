<script setup lang="ts">
useHead({
  title: 'Print Queue — Northeast Branch Library',
  meta: [
    { name: 'description', content: 'Check the status of your 3D print request at the Northeast Branch Library. See which prints are waiting and which are ready for pickup.' },
  ],
})

interface PendingPrint {
  name: string
  label: string
  color: string
  status: string
}

const { data: queue, status, error, refresh } = useLazyFetch<PendingPrint[]>('/api/queue')
</script>

<template>
  <div class="container" style="max-width: 700px">
    <h1 class="page-title">Print Queue</h1>
    <p class="page-subtitle">
      See where your request is in the queue. Staff update this as prints are completed.
    </p>

    <!-- Refresh -->
    <button
      type="button"
      class="btn btn--secondary"
      style="margin-bottom: 1.5rem"
      :disabled="status === 'pending'"
      @click="refresh()"
    >
      {{ status === 'pending' ? 'Refreshing…' : '↻ Refresh' }}
    </button>

    <!-- Queue well -->
    <div class="queue-well">
      <!-- Loading skeleton -->
      <div v-if="status === 'pending' && !queue" class="queue-list" aria-live="polite" aria-label="Loading queue">
        <div v-for="n in 4" :key="n" class="card queue-item">
          <div class="queue-item__body">
            <div class="shimmer" style="height: 0.95rem; width: 6rem; border-radius: 4px" />
            <div class="shimmer" style="height: 0.85rem; width: 9rem; border-radius: 4px" />
            <div class="shimmer" style="height: 0.8rem; width: 4rem; border-radius: 4px" />
          </div>
          <div class="shimmer" style="height: 1.5rem; width: 5rem; border-radius: 100px" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert--error" role="alert">
        Unable to load the queue right now. Please try again or ask a staff member.
      </div>

      <!-- Queue list -->
      <div v-else-if="queue && queue.length > 0" class="queue-list" role="list">
        <div
          v-for="(entry, i) in queue"
          :key="i"
          class="card queue-item"
          :class="{ 'queue-item--ready': entry.status === 'Ready' }"
          role="listitem"
        >
          <div class="queue-item__body">
            <p class="queue-item__name">{{ entry.name }}</p>
            <p class="queue-item__model">{{ entry.label }}</p>
            <p class="queue-item__color">{{ entry.color }}</p>
          </div>
          <span
            class="badge"
            :class="entry.status === 'Ready' ? 'badge--status-done' : 'badge--status-queued'"
          >
            {{ entry.status === 'Ready' ? 'Ready for Pickup' : 'Waiting' }}
          </span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <span class="empty-state__icon" aria-hidden="true">🎉</span>
        <p class="empty-state__title">No pending prints</p>
        <p>All requests have been completed! Browse the catalog to submit a new one.</p>
      </div>
    </div>

    <!-- Nav -->
    <div style="margin-top: 2rem; text-align: center">
      <NuxtLink to="/" class="btn btn--primary">← Browse Catalog</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.queue-well {
  background: #e8ece4;
  border-radius: var(--radius-lg);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: var(--space-md);
  max-height: 60vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  gap: var(--space-md);
}

.queue-item--ready {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.queue-item__body {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs) var(--space-md);
  min-width: 0;
}

.queue-item__name {
  font-weight: 600;
  font-size: 0.95rem;
}

.queue-item__model {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.queue-item__color {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
