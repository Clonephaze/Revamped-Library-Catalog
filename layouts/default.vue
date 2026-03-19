<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="container">
        <NuxtLink to="/" class="header-brand">
          <span aria-hidden="true">🖨️</span>
          <span>Library 3D Prints</span>
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
  background-color: #f3f2ef;
  border-top: 1px solid var(--color-border);
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
