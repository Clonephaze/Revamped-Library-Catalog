<script setup lang="ts">
useHead({ title: 'Print Request Submitted — Library 3D Prints' })

const route = useRoute()

const name = route.query.name as string
const model = route.query.model as string
const color = route.query.color as string

// Guard: if someone arrives here directly, send them home.
if (!name && !model) {
  await navigateTo('/')
}
</script>

<template>
  <div class="container" style="max-width: 600px">
    <!-- Success hero -->
    <div class="queue-display" style="margin-bottom: 1.5rem" role="status" aria-live="polite">
      <p class="queue-display__number" style="font-size: clamp(2rem, 8vw, 3rem)">✅</p>
      <p class="queue-display__label" style="font-size: 1.1rem; opacity: 1; text-transform: none; letter-spacing: 0">
        You're all set!
      </p>
      <p class="queue-display__hint">We'll contact you when your print is ready for pickup.</p>
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
          <span class="badge badge--status-queued">Waiting</span>
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="action-stack">
      <NuxtLink to="/status" class="btn btn--secondary btn--full">
        View Print Queue
      </NuxtLink>
      <NuxtLink to="/" class="btn btn--primary btn--full">
        Back to Catalog
      </NuxtLink>
    </div>
  </div>
</template>
