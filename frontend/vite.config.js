import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // The entry chunk had grown past 500KB because React, the router and
        // Bootstrap all sat inside it, so every visitor re-downloaded the whole
        // thing whenever any application code changed. Splitting the parts that
        // almost never change into their own chunks keeps them cached across
        // deploys and brings each chunk under the warning threshold.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-router';
          if (/[\\/]node_modules[\\/](react-bootstrap|@restart|bootstrap)[\\/]/.test(id)) return 'vendor-bootstrap';
          if (/[\\/]node_modules[\\/](ogl|gsap|motion|framer-motion)[\\/]/.test(id)) return 'vendor-motion';
          return 'vendor';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
