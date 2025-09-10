import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      filename: 'manifest.webmanifest',
      includeAssets: ["vite.svg", "robots.txt", "logo.jpg"],
      manifest: {
        name: "Gul Autos",
        short_name: "Gul Autos",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#FED700", // Updated to match your theme
        icons: [
          {
            src: "maskable.png",
            sizes: "196x196",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "logo.jpg",
            sizes: "192x192",
            type: "image/jpeg"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['lucide-react', 'framer-motion'],
          router: ['react-router-dom'],
          utils: ['axios', 'sonner']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable sourcemaps in production for better performance
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@reduxjs/toolkit', 
      'react-redux',
      'react-router-dom',
      'lucide-react',
      'axios',
      'sonner'
    ]
  },
  // Enable gzip compression
  server: {
    compress: true
  }
});
