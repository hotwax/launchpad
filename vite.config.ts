/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {   // Only relative paths are allowed
        target: 'https://localhost:8443/',   // Your external server URL
        changeOrigin: true,                  // Changes the "Origin" header to match the target
        secure: false,                       // Set to false if you have SSL issues locally
      }
    }
  },
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@common': path.resolve(__dirname, '../../common')
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
