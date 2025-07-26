// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add the viteStaticCopy plugin
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/filament/filament-wasm.*',
          dest: '.'
        }
      ]
    })
  ],
  // Required to enable SharedArrayBuffer, which Filament uses.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
