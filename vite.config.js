import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    assetsInlineLimit: 0,  // Phaser's audio/asset loaders break if small files get inlined
    chunkSizeWarningLimit: 2000,
  },
})
