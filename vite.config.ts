import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANTE: si el nombre de tu repo en GitHub es distinto de "ripo-web",
  // cambiá esta línea a base: "/NOMBRE-DE-TU-REPO/".
  base: '/rippo-web/',
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})

