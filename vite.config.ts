/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'oms-api': path.resolve(__dirname, '../../packages/oms-api/src'),
      'dxp-components': path.resolve(__dirname, '../../packages/dxp-components/src')
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
