import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Grande chunk principal (~6.4MB). Vamos fazer code splitting manual para
// separar dependências pesadas: stellar-sdk, snarkjs, zkid-sdk, react vendor.

function manualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (id.includes('@stellar/stellar-sdk')) return 'stellar'
    if (id.includes('snarkjs')) return 'zk'
    if (id.includes('react')) return 'vendor'
  }
  if (id.includes('sdk/zkid-sdk')) return 'zkid-sdk'
  return undefined
}

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
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
