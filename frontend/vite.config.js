import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mui/icons-material': path.resolve(__dirname, 'src/shims/mui-icons'),
    },
  },
  server: {
    port: 3000,
    host: true
  }
})
