/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK: string
  readonly VITE_SOROBAN_RPC: string
  readonly VITE_HORIZON: string
  readonly VITE_VERIFIER_CONTRACT_ID: string
  readonly VITE_REGISTRY_CONTRACT_ID: string
  readonly VITE_COMPLIANCE_CONTRACT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
