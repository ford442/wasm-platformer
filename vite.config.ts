import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This plugin handles importing .wasm files and their JS glue code.
    wasm(),
    // This plugin is required by the wasm plugin to work correctly.
    topLevelAwait()
  ],
})
