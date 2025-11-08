import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Configurações para permitir extensões de navegador
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    cors: true,
  },
  optimizeDeps: {
    exclude: ['@stellar/stellar-sdk'], // Evitar problemas com SDK do Stellar
  },
})
