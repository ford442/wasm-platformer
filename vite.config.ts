import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // This alias tells Vite how to resolve the '/game.js' import during the build.
    // It mirrors the 'paths' configuration in tsconfig.json.
    alias: {
      '/game.js': path.resolve(__dirname, './public/game.js'),
    },
  },
})
