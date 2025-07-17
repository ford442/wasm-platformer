import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This alias tells Vite how to resolve the non-relative 'src/...' imports.
    // We are making the alias more specific to target the exact file that is failing.
    alias: {
      'src/wasm/game.js': path.resolve(__dirname, 'src/wasm/game.js'),
    },
  },
})
