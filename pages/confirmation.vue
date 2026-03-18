<script setup lang="ts">
useHead({ title: 'Print Request Submitted — Library 3D Prints' })

const route = useRoute()

const queue = route.query.queue as string
const name = route.query.name as string
const model = route.query.model as string
const color = route.query.color as string

// Guard: if someone arrives here without a queue number, send them home.
if (!queue) {
  await navigateTo('/')
}
</script>

<template>
  <div class="container" style="max-width: 600px">
    <!-- Queue number hero -->
    <div class="queue-display" style="margin-bottom: 1.5rem" role="status" aria-live="polite">
      <p class="queue-display__label">Your Queue Number</p>
      <p class="queue-display__number">{{ queue }}</p>
      <p class="queue-display__hint">Write this down — you'll need it to check your status</p>
    </div>

    <!-- Success message -->
    <div class="alert alert--success" style="margin-bottom: 1.5rem" role="alert">
      ✅ Your request has been submitted! We'll contact you when it's ready for pickup.
    </div>

    <!-- Submitted details -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem">
      <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem">Request Summary</h2>
      <ul class="details-list">
        <li>
          <span class="dl-label">Name</span>
          <span class="dl-value">{{ name }}</span>
        </li>
        <li>
          <span class="dl-label">Model</span>
          <span class="dl-value">{{ model }}</span>
        </li>
        <li>
          <span class="dl-label">Color</span>
          <span class="dl-value">{{ color }}</span>
        </li>
        <li>
          <span class="dl-label">Status</span>
          <span class="badge badge--status-queued">Queued</span>
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="action-stack">
      <NuxtLink
        :to="{ path: '/status', query: { q: queue } }"
        class="btn btn--secondary btn--full"
      >
        Check Status Later
      </NuxtLink>
      <NuxtLink to="/" class="btn btn--primary btn--full">
        Back to Catalog
      </NuxtLink>
    </div>
  </div>
</template>
