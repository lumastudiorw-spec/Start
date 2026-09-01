import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) instead of an auto-generated one,
      // so it can register a Background Sync handler that flushes queued
      // alerts once connectivity returns — even if the app isn't open.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Eyes on Me — Personal Safety',
        short_name: 'Eyes on Me',
        description:
          'A privacy-first personal safety app. Someone is watching over you: one tap sends your location to trusted contacts, and keeps trying until it gets through.',
        theme_color: '#e2242f',
        background_color: '#0f0f10',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Eyes on Me',
            short_name: 'Alert',
            url: '/?tab=alert',
            description: 'Jump straight to the alert trigger',
          },
        ],
      },
      injectManifest: {
        // App shell only — never cache anything containing contacts/location.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
