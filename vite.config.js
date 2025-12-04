import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // IMPORTANTE: Esto asegura que las rutas sean relativas para que funcione en file:// (Android)
  base: './', 
  build: {
    outDir: 'dist',
    // IMPORTANTE: Target bajo para máxima compatibilidad en Androids viejos/WebViews
    target: 'es2015', 
    minify: 'terser',
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pizza Brava POS',
        short_name: 'PizzaBrava',
        description: 'Sistema de Punto de Venta Pizza Brava',
        theme_color: '#ea580c',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
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
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Evitar problemas con dependencias de optimización
  optimizeDeps: {
    exclude: ['workbox-window'] 
  }
});