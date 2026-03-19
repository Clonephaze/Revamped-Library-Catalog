<script setup lang="ts">
useHead({ title: 'Print Queue — Northeast Branch Library' })

interface PendingPrint {
  name: string
  label: string
  color: string
  printed: boolean
}

const { data: queue, status, error, refresh } = await useFetch<PendingPrint[]>('/api/queue')
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

    <!-- Loading -->
    <div v-if="status === 'pending' && !queue" class="page-loading" aria-label="Loading queue">
      <div class="spinner spinner--dark" />
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
        :class="{ 'queue-item--ready': entry.printed }"
        role="listitem"
      >
        <div class="queue-item__body">
          <p class="queue-item__name">{{ entry.name }}</p>
          <p class="queue-item__model">{{ entry.label }}</p>
          <p class="queue-item__color">{{ entry.color }}</p>
        </div>
        <span
          class="badge"
          :class="entry.printed ? 'badge--status-done' : 'badge--status-queued'"
        >
          {{ entry.printed ? 'Ready for Pickup' : 'Waiting' }}
        </span>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <span class="empty-state__icon" aria-hidden="true">🎉</span>
      <p class="empty-state__title">No pending prints</p>
      <p>All requests have been completed! Browse the catalog to submit a new one.</p>
    </div>

    <!-- Nav -->
    <div style="margin-top: 2rem; text-align: center">
      <NuxtLink to="/" class="btn btn--primary">← Browse Catalog</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
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
