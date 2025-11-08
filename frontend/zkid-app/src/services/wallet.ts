// Integration with Stellar Wallet SDK and native Passkeys
// Reference: https://stellar.org/developers/docs/building-apps/wallet-integration
// Use dynamic import for '@stellar/stellar-sdk' to reduce initial bundle size

export type WalletConnection = {
  publicKey: string
  signTransaction: (tx: string) => Promise<string>
}

type Freighter = {
  getPublicKey(): Promise<string>
  signTransaction(xdr: string, opts: { network: string; networkPassphrase: string }): Promise<string>
}

type StellarNetworks = { TESTNET: string }
type StellarKeypair = { publicKey(): string; secret(): string }
interface StellarKeypairCtor { random(): StellarKeypair; fromSecret(secret: string): StellarKeypair }
interface StellarTx { sign(kp: StellarKeypair): void; toXDR(): string }
interface StellarTransactionBuilderCtor { fromXDR(xdr: string, network: string): StellarTx }
interface StellarSDK { Networks: StellarNetworks; Keypair: StellarKeypairCtor; TransactionBuilder: StellarTransactionBuilderCtor }

async function getSDK(): Promise<StellarSDK> {
  const mod: unknown = await import('@stellar/stellar-sdk')
  const defaultExport = (mod as { default?: unknown }).default
  const resolved: unknown = defaultExport ?? mod
  return resolved as StellarSDK
}

// Integration with Stellar Wallet SDK (WalletConnect, Freighter, etc.)
export async function connectWallet(): Promise<WalletConnection> {
  // Check if Freighter extension is installed
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : { }
  if (w.freighter) {
    try {
      const freighter = w.freighter as Freighter
      const pubKey = await freighter.getPublicKey()
      
      return {
        publicKey: pubKey,
        signTransaction: async (txXdr: string) => {
          const SDK = await getSDK()
          const signedXdr = await freighter.signTransaction(txXdr, {
            network: 'TESTNET',
            networkPassphrase: SDK.Networks.TESTNET
          })
          return signedXdr
        }
      }
    } catch (e) {
      console.warn('[wallet] Freighter connection failed:', e)
    }
  }
  
  // Fallback: use locally stored Passkey (development)
  let pubKey: string | null = localStorage.getItem('stellar-passkey-pubkey')
  
  if (!pubKey) {
    // Create new passkey (production: use WebAuthn)
    const SDK = await getSDK()
    const keypair = SDK.Keypair.random()
    const newPubKey = keypair.publicKey()
    pubKey = newPubKey
    localStorage.setItem('stellar-passkey-pubkey', newPubKey)
    // Note: secret stays in browser (simulating TEE/Secure Enclave)
    localStorage.setItem('stellar-passkey-secret', keypair.secret())
  }
  
  // Ensure pubKey is not null
  const finalPubKey: string = pubKey ?? (await getSDK()).Keypair.random().publicKey()
  
  return {
    publicKey: finalPubKey,
    signTransaction: async (txXdr: string) => {
      // Passkey simulation: use stored secret
      const secret = localStorage.getItem('stellar-passkey-secret')
      if (!secret) throw new Error('Passkey not found')
      
      const SDK = await getSDK()
      const keypair = SDK.Keypair.fromSecret(secret)
      const tx = SDK.TransactionBuilder.fromXDR(txXdr, SDK.Networks.TESTNET)
      tx.sign(keypair)
      return tx.toXDR()
    }
  }
}

// Helper para obter função de assinatura do wallet atual
export async function getWalletSigner(): Promise<(xdr: string) => Promise<string>> {
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : {}
  if (w.freighter?.signTransaction) {
    const SDK = await getSDK()
    return async (xdr: string) => w.freighter!.signTransaction(xdr, { network: 'TESTNET', networkPassphrase: SDK.Networks.TESTNET })
  }
  // Fallback: usar passkey local
  return async (txXdr: string) => {
    const secret = localStorage.getItem('stellar-passkey-secret')
    if (!secret) throw new Error('Passkey not found')
    const SDK = await getSDK()
    const keypair = SDK.Keypair.fromSecret(secret)
    const tx = SDK.TransactionBuilder.fromXDR(txXdr, SDK.Networks.TESTNET)
    tx.sign(keypair)
    return tx.toXDR()
  }
}

export async function disconnectWallet(): Promise<void> {
  // Clear local dev-only passkey data
  localStorage.removeItem('stellar-passkey-pubkey')
  localStorage.removeItem('stellar-passkey-secret')
}

// Check if a wallet is connected
export function isWalletConnected(): boolean {
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : { }
  if (w.freighter) {
    return true
  }
  return !!localStorage.getItem('stellar-passkey-pubkey')
}

// Get connected wallet publicKey (dev-only fallback)
export function getConnectedPublicKey(): string | null {
  return localStorage.getItem('stellar-passkey-pubkey')
}

