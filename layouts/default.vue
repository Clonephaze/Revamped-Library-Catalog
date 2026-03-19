<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="container">
        <NuxtLink to="/" class="header-brand">
          <img src="/KernCountyLogo.svg" alt="Kern County Library" class="header-logo" />
          <span>Northeast Branch Library</span>
        </NuxtLink>
        <nav class="header-nav" aria-label="Site navigation">
          <NuxtLink to="/">Catalog</NuxtLink>
          <NuxtLink to="/status">Queue</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <footer class="app-footer">
      <div class="container">
        <p>Questions? Ask a staff member at the service desk.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.header-logo {
  height: 4rem;
  width: auto;
  filter: brightness(0) invert(1);
  margin-left: -8rem;
  margin-right: 1.5rem;
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
  background-color: var(--brand-navy);
  border-top: 3px solid var(--color-accent);
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}
</style>
