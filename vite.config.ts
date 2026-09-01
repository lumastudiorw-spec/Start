import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Guardian — Personal Safety',
        short_name: 'Guardian',
        description:
          'A privacy-first personal safety app: no trackers, no ad SDKs, no server. Everything stays on your device except the alert you choose to send.',
        theme_color: '#b3121c',
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
            name: 'Send SOS',
            short_name: 'SOS',
            url: '/?tab=sos',
            description: 'Jump straight to the SOS trigger',
          },
        ],
      },
      workbox: {
        // App shell only — never cache anything containing contacts/location.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
