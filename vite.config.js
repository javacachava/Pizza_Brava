import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- ESTO EVITA EL CRASH EN ANDROID (Rutas relativas)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
})