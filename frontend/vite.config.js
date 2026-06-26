import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    proxy: {
      '/api':   { target: 'http://localhost:5001', changeOrigin: true },
      '/auth':  { target: 'http://localhost:5001', changeOrigin: true },
      '/health':{ target: 'http://localhost:5001', changeOrigin: true },
    }
  }
})
