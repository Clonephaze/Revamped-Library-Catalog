<script setup lang="ts">
interface Filament {
  color: string
  hex: string
}

const props = defineProps<{
  modelId: string
  modelName: string
}>()

const { data: filaments, status: filamentStatus } = useLazyFetch<Filament[]>('/api/filaments')

const patronName = ref('')
const contact = ref('')
const color = ref('')
const submitting = ref(false)
const errorMsg = ref<string | null>(null)

const router = useRouter()

// Pre-select the first color once filaments load
watch(filaments, (list) => {
  if (!color.value && list && list.length > 0) {
    color.value = list[0].color
  }
}, { immediate: true })

async function submit() {
  errorMsg.value = null

  if (!patronName.value.trim()) {
    errorMsg.value = 'Please enter your name.'
    return
  }
  if (!contact.value.trim()) {
    errorMsg.value = 'Please enter your contact information.'
    return
  }

  const cleaned = contact.value.trim()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)
  const phoneOk = /[\d]{7,}/.test(cleaned.replace(/[\s\-().+]/g, ''))
  if (!emailOk && !phoneOk) {
    errorMsg.value = 'Please enter a valid email address or phone number.'
    return
  }
  if (!color.value) {
    errorMsg.value = 'Please select a filament color.'
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/submit-print', {
      method: 'POST',
      body: {
        patron: patronName.value.trim(),
        contact: contact.value.trim(),
        label: props.modelName,
        color: color.value,
      },
    })

    await router.push({
      path: '/confirmation',
      query: {
        name: patronName.value.trim(),
        model: props.modelName,
        color: color.value,
      },
    })
  } catch (err: unknown) {
    const h3 = err as { data?: { statusMessage?: string } }
    errorMsg.value =
      h3?.data?.statusMessage ?? 'Something went wrong. Please try again later.'
    submitting.value = false
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <!-- Name -->
    <div class="form-group">
      <label class="form-label" for="pf-name">
        Your Name <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        id="pf-name"
        v-model="patronName"
        type="text"
        class="form-input"
        placeholder="Jane Smith"
        autocomplete="name"
        required
        :disabled="submitting"
      />
    </div>

    <!-- Contact -->
    <div class="form-group">
      <label class="form-label" for="pf-contact">
        Email or Phone <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        id="pf-contact"
        v-model="contact"
        type="text"
        class="form-input"
        placeholder="jane@example.com or 555-0123"
        autocomplete="email"
        required
        :disabled="submitting"
      />
      <p class="form-help">We'll contact you when your print is ready for pickup.</p>
    </div>

    <!-- Color selection -->
    <div class="form-group">
      <p class="form-label" id="color-group-label">
        Filament Color <span class="required" aria-hidden="true">*</span>
      </p>

      <!-- Loading skeleton -->
      <div v-if="filamentStatus === 'pending'" class="color-options-skeleton" aria-label="Loading colors">
        <span v-for="n in 25" :key="n" class="color-pill-skeleton" />
      </div>

      <!-- Loaded -->
      <div v-else-if="filaments && filaments.length > 0" class="color-options" role="radiogroup" aria-labelledby="color-group-label">
        <template v-for="f in filaments" :key="f.color">
          <input
            :id="`pf-color-${f.color}`"
            v-model="color"
            type="radio"
            :value="f.color"
            class="color-radio"
            name="pf-color"
            :disabled="submitting"
          />
          <label :for="`pf-color-${f.color}`" class="color-radio-label">
            <span
              v-if="f.hex"
              class="color-swatch"
              :style="{ backgroundColor: f.hex }"
              aria-hidden="true"
            />
            {{ f.color }}
          </label>
        </template>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMsg" class="alert alert--error" role="alert">
      {{ errorMsg }}
    </div>

    <!-- Submit -->
    <button
      type="submit"
      class="btn btn--primary btn--full btn--lg"
      :disabled="submitting"
      :aria-busy="submitting"
    >
      <span v-if="submitting" class="spinner" aria-hidden="true" />
      {{ submitting ? 'Submitting…' : 'Submit Print Request' }}
    </button>
  </form>
</template>

<style scoped>
.form {
  gap: 0.75rem;
}
</style>
