<script setup lang="ts">
const config = useRuntimeConfig()
const open = ref(false)

function close() {
  open.value = false
}
</script>

<template>
  <!-- Floating trigger -->
  <button
    class="about-fab"
    aria-label="About this project"
    @click="open = true"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  </button>

  <!-- Backdrop + Modal -->
  <Teleport to="body">
    <Transition name="about-modal">
      <div v-if="open" class="about-backdrop" @click.self="close">
        <div class="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
          <button class="about-modal__close" aria-label="Close" @click="close">✕</button>
          <h2 id="about-title" class="about-modal__heading">About This Project</h2>

          <div class="about-modal__sections">
            <section>
              <h3>🔄 How It Works</h3>
              <p>
                A patron picks a 3D model and filament color, then submits a print request.
                The request is added to a Google Sheet queue. Staff prints the item and
                updates the status. The patron is notified when it's ready for pickup.
              </p>
            </section>

            <section>
              <h3>📊 Google Sheets Backend</h3>
              <p>
                This app uses a Google Sheet as its entire database. The model catalog,
                print queue, and filament colors are all stored in separate tabs of a
                single spreadsheet — read and written in real time via the Google Sheets API.
              </p>
            </section>

            <section>
              <h3>⚙️ Tech Stack</h3>
              <ul>
                <li><strong>Nuxt 3</strong> — full-stack Vue framework</li>
                <li><strong>Vue 3</strong> + <strong>TypeScript</strong></li>
                <li><strong>Google Sheets API</strong> — live data layer</li>
                <li><strong>Nitro</strong> — server routes &amp; API</li>
                <li><strong>Vercel</strong> — deployment &amp; hosting</li>
              </ul>
            </section>
          </div>

          <div class="about-modal__actions">
            <a
              v-if="config.public.sheetUrl"
              :href="config.public.sheetUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn--primary"
            >
              📊 View the Google Sheet
            </a>
            <a
              href="https://github.com/Clonephaze"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn--secondary"
            >
              🔗 View Source on GitHub
            </a>
            <a
              href="https://www.clonecore.net"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn--secondary"
            >
              🌐 My Portfolio
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Floating action button */
.about-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(9, 53, 71, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.about-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(9, 53, 71, 0.4);
}

/* Backdrop */
.about-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Modal */
.about-modal {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 2rem;
}

.about-modal__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--color-text-muted);
  box-shadow: var(--shadow-sm);
  transition: background 0.15s;
}

.about-modal__close:hover {
  background: var(--color-bg);
}

.about-modal__heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.25rem;
}

/* Sections */
.about-modal__sections {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.about-modal__sections h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
  color: var(--color-text);
}

.about-modal__sections p,
.about-modal__sections li {
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.about-modal__sections ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.about-modal__sections li::before {
  content: '→ ';
  color: var(--color-accent);
  font-weight: 600;
}

/* Actions */
.about-modal__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Transition */
.about-modal-enter-active,
.about-modal-leave-active {
  transition: opacity 0.2s ease;
}

.about-modal-enter-active .about-modal,
.about-modal-leave-active .about-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.about-modal-enter-from,
.about-modal-leave-to {
  opacity: 0;
}

.about-modal-enter-from .about-modal {
  transform: translateY(12px) scale(0.97);
}

.about-modal-leave-to .about-modal {
  transform: translateY(8px) scale(0.98);
}
</style>
