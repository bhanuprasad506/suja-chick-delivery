import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Suja Chick Delivery',
        short_name: 'SujaChickDelivery',
        description: 'Suja Chick Delivery Management App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:4000\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/deliveries': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/orders': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/customers': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/debug': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/export': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
    },
  },
});
