<script setup lang="ts">
const props = defineProps<{
  modelId: string
  modelName: string
  colorOptions: string[]
}>()

const name = ref('')
const contact = ref('')
const color = ref(props.colorOptions[0] ?? '')
const submitting = ref(false)
const errorMsg = ref<string | null>(null)

const router = useRouter()

async function submit() {
  errorMsg.value = null

  if (!name.value.trim()) {
    errorMsg.value = 'Please enter your name.'
    return
  }
  if (!contact.value.trim()) {
    errorMsg.value = 'Please enter your contact information.'
    return
  }
  if (!color.value) {
    errorMsg.value = 'Please select a filament color.'
    return
  }

  submitting.value = true

  try {
    const result = await $fetch<{
      queueNumber: string
      details: { name: string; modelName: string; color: string }
    }>('/api/submit-print', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        contact: contact.value.trim(),
        modelId: props.modelId,
        modelName: props.modelName,
        color: color.value,
      },
    })

    await router.push({
      path: '/confirmation',
      query: {
        queue: result.queueNumber,
        name: name.value.trim(),
        model: props.modelName,
        color: color.value,
      },
    })
  } catch (err: unknown) {
    const h3 = err as { data?: { statusMessage?: string } }
    errorMsg.value =
      h3?.data?.statusMessage ?? 'Something went wrong. Please try again or ask a staff member.'
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
        v-model="name"
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
    <div v-if="colorOptions.length > 0" class="form-group">
      <p class="form-label" id="color-group-label">
        Filament Color <span class="required" aria-hidden="true">*</span>
      </p>
      <div class="color-options" role="radiogroup" aria-labelledby="color-group-label">
        <template v-for="option in colorOptions" :key="option">
          <input
            :id="`pf-color-${option}`"
            v-model="color"
            type="radio"
            :value="option"
            class="color-radio"
            name="pf-color"
            :disabled="submitting"
          />
          <label :for="`pf-color-${option}`" class="color-radio-label">
            {{ option }}
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
