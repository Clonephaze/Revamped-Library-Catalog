<script setup lang="ts">
useHead({ title: 'Check Print Status — Library 3D Prints' })

interface QueueEntry {
  id: string
  timestamp: string
  queueNumber: string
  name: string
  contact: string
  modelId: string
  modelName: string
  color: string
  status: string
  notes: string
}

const route = useRoute()

// Pre-fill if ?q=XXXX is supplied (e.g. from the confirmation page link)
const queueInput = ref((route.query.q as string) ?? '')
const result = ref<QueueEntry | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Auto-lookup when arriving from confirmation page with a queue number pre-filled
onMounted(async () => {
  if (queueInput.value.trim()) {
    await lookup()
  }
})

async function lookup() {
  const q = queueInput.value.trim()
  if (!q) {
    errorMsg.value = 'Please enter your queue number.'
    return
  }

  loading.value = true
  errorMsg.value = null
  result.value = null

  try {
    result.value = await $fetch<QueueEntry>(`/api/status/${encodeURIComponent(q)}`)
  } catch (err: unknown) {
    const h3 = err as { statusCode?: number; data?: { statusMessage?: string } }

    if (h3?.statusCode === 404) {
      errorMsg.value = `Queue number "${q}" was not found. Please check and try again.`
    } else {
      errorMsg.value = h3?.data?.statusMessage ?? 'Unable to look up status. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    Queued: 'badge--status-queued',
    Printing: 'badge--status-printing',
    Done: 'badge--status-done',
    Failed: 'badge--status-failed',
  }
  return map[s] ?? 'badge--status-queued'
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="container" style="max-width: 600px">
    <h1 class="page-title">Check Print Status</h1>
    <p class="page-subtitle">Enter the queue number from your confirmation to see the current status.</p>

    <!-- Lookup form -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem">
      <form class="form" @submit.prevent="lookup">
        <div class="form-group">
          <label class="form-label" for="queue-input">Queue Number</label>
          <input
            id="queue-input"
            v-model="queueInput"
            type="text"
            class="form-input"
            placeholder="e.g. 0042"
            inputmode="numeric"
            autocomplete="off"
            maxlength="6"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn btn--primary btn--full" :disabled="loading" :aria-busy="loading">
          <span v-if="loading" class="spinner" aria-hidden="true" />
          {{ loading ? 'Checking…' : 'Check Status' }}
        </button>
      </form>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="alert alert--error" role="alert" style="margin-bottom: 1rem">
      {{ errorMsg }}
    </div>

    <!-- Result -->
    <div v-if="result" class="status-result" aria-live="polite">
      <div class="status-result__header">
        <div>
          <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.2rem">
            Queue #{{ result.queueNumber }}
          </p>
          <p style="font-weight: 700; font-size: 1.1rem">{{ result.modelName }}</p>
        </div>
        <span class="badge" :class="statusClass(result.status)" style="font-size: 0.875rem; padding: 0.4rem 1rem">
          {{ result.status }}
        </span>
      </div>

      <div class="status-result__body">
        <ul class="details-list">
          <li>
            <span class="dl-label">Color</span>
            <span class="dl-value">{{ result.color }}</span>
          </li>
          <li>
            <span class="dl-label">Submitted</span>
            <span class="dl-value">{{ formatDate(result.timestamp) }}</span>
          </li>
          <li v-if="result.notes">
            <span class="dl-label">Notes</span>
            <span class="dl-value">{{ result.notes }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Nav -->
    <div style="margin-top: 2rem; text-align: center">
      <NuxtLink to="/" class="btn btn--secondary">← Back to Catalog</NuxtLink>
    </div>
  </div>
</template>
