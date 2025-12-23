import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      filename: 'manifest.webmanifest',
      includeAssets: ["vite.svg", "robots.txt", "logo.jpeg"],
      workbox: {
        // Don't cache index.html - exclude it from precaching
        globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest,woff,woff2}'],
        // Exclude index.html from precaching - this ensures it's always fetched fresh
        navigateFallback: null,
        // Use network-first strategy for navigation requests (index.html)
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 0, // Don't cache HTML pages
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
        // Skip waiting and claim clients immediately on update
        skipWaiting: true,
        clientsClaim: true,
        // Clean up outdated caches
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "Gultraders",
        short_name: "Gultraders",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          {
            src: "maskable.png",
            sizes: "196x196",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "logo.jpeg",
            sizes: "192x192",
            type: "image/jpeg"
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    })

  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: true,
    sourcemap: false
  }
});
