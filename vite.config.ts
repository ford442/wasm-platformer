import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This alias tells Vite how to resolve the non-relative 'src/...' imports.
    // It mirrors the 'baseUrl' configuration in tsconfig.json.
    alias: {
      'src': path.resolve(__dirname, './src'),
    },
  },
})
