import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa"; // <--- 1. IMPORTANTE
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: './',
  plugins: [
    react(),
    // 2. CONFIGURACIÓN PWA
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pizza Brava POS',
        short_name: 'PizzaBrava',
        description: 'Sistema de Punto de Venta Pizza Brava',
        theme_color: '#ea580c', // Naranja corporativo
        background_color: '#0f172a', // Fondo oscuro
        display: 'standalone', // Esto quita la barra del navegador
        orientation: 'landscape', // Sugiere horizontal para la tablet
        icons: [
          {
            src: 'pwa-192x192.png', // Asegúrate de tener estos iconos en /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Asegúrate de tener estos iconos en /public
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },

  
});