import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { catalogStartupGuard } from './scripts/catalog-startup-guard'

export default defineConfig({
  plugins: [
    catalogStartupGuard(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{css,html,ico,js,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Emot-ID',
        short_name: 'Emot-ID',
        description: 'Explore emotions through words, body sensations, and affect mapping.',
        id: '/emotid/',
        theme_color: '#f7f7f3',
        background_color: '#f7f7f3',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['lifestyle', 'utilities'],
        scope: '/emotid/',
        start_url: '/emotid/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  base: '/emotid/',
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          return undefined
        },
      },
    },
  },
})
