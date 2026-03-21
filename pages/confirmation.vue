<script setup lang="ts">
const config = useRuntimeConfig()

useHead({
  title: 'Print Request Submitted — Community Library',
  meta: [
    { name: 'description', content: 'Your 3D print request has been submitted. We\'ll contact you when it\'s ready for pickup at the Community Library.' },
  ],
})

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

    <!-- Demo note -->
    <div class="alert alert--info" style="margin-bottom: 1.5rem">
      <strong>This is a live demo.</strong> Your request was written to a real Google Sheet.
      Check the <NuxtLink to="/status">print queue</NuxtLink> to see it appear.
    </div>

    <!-- Actions -->
    <div class="action-stack">
      <NuxtLink to="/status" class="btn btn--secondary btn--full">
        View Print Queue
      </NuxtLink>
      <NuxtLink to="/" class="btn btn--primary btn--full">
        Back to Catalog
      </NuxtLink>
      <a
        v-if="config.public.sheetUrl"
        :href="config.public.sheetUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn--secondary btn--full"
      >
        📊 View the Google Sheet
      </a>
    </div>
  </div>
</template>
