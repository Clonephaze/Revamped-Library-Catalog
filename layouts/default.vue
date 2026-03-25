<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="container">
        <NuxtLink to="/" class="header-brand">
          <svg class="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1v8.8a4 4 0 0 1-.7 2.3L14.5 20a1 1 0 0 1-.8.5h-3.4a1 1 0 0 1-.8-.5l-3.3-4.4a4 4 0 0 1-.7-2.3V4.5a1 1 0 0 1 1-1z"/><path d="M6.5 8.5h11"/><circle cx="9" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r=".5" fill="currentColor" stroke="none"/></svg>
          <span>Community Library</span>
        </NuxtLink>
        <nav class="header-nav" aria-label="Site navigation">
          <NuxtLink to="/">Catalog</NuxtLink>
          <NuxtLink to="/status">Queue</NuxtLink>
          <NuxtLink to="/print" class="header-nav__print">🖨 Print</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <AboutModal />

    <footer class="app-footer">
      <div class="container">
        <p class="footer-credit">A demo project by Jack</p>
        <div class="footer-links">
          <a href="https://www.clonecore.net" target="_blank" rel="noopener noreferrer">Portfolio</a>
          <span class="footer-sep" aria-hidden="true">&middot;</span>
          <a href="https://github.com/Clonephaze" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span class="footer-sep" aria-hidden="true">&middot;</span>
          <span>Built with Nuxt 3 &amp; Google Sheets</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.header-logo {
  height: 2rem;
  width: 2rem;
  color: white;
  flex-shrink: 0;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  padding: 2rem 0;
}

.app-footer {
  background: linear-gradient(135deg, var(--brand-forest) 0%, var(--color-primary-light) 100%);
  border-top: 3px solid var(--color-accent);
  padding: 1.25rem 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
}

.footer-credit {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.3rem;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-links a:hover {
  color: white;
  text-decoration: underline;
}

.footer-sep {
  opacity: 0.4;
}
</style>
