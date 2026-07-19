import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // Production: https://novablockchain.it.com/
  base: process.env.VITE_BASE || '/',

  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  preview: {
    port: 4174,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
