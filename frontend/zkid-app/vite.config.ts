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
  resolve: {
    // ✅ CRÍTICO: Força Vite a usar uma ÚNICA instância do Stellar SDK
    // Resolve o problema "expected a 'Transaction', got: [object Object]"
    dedupe: ['@stellar/stellar-sdk'],
    alias: {
      '@stellar/stellar-sdk': '@stellar/stellar-sdk',
    },
  },
  optimizeDeps: {
    include: [
      '@stellar/stellar-sdk',
      '@stellar/stellar-sdk/contract',
      '@stellar/stellar-sdk/rpc',
      'buffer'
    ],
    // Force bundling para garantir instância única
    force: true,
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
