// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#093547' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  // Runtime config — server-side keys are NOT exposed to the client.
  // Map to env vars:
  //   GOOGLE_SERVICE_ACCOUNT_EMAIL
  //   GOOGLE_SERVICE_ACCOUNT_KEY
  //   GOOGLE_SPREADSHEET_ID
  runtimeConfig: {
    googleServiceAccountEmail: '',
    googleServiceAccountKey: '',
    googleSpreadsheetId: '',
    public: {
      sheetUrl: '',
    },
  },

  // No hardcoded Nitro preset — Vercel auto-detects Nuxt and sets it at deploy
  // time. Locally this defaults to 'node-server', which works with nuxt preview.

  compatibilityDate: '2024-04-03',
})
