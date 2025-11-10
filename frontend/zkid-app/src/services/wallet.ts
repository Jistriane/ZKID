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
  // Exige extensão de carteira: remover totalmente fallback de passkey.
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : { }
  if (!w.freighter) {
    throw new Error('Freighter wallet não detectada. Instale a extensão para continuar.')
  }
  const freighter = w.freighter as Freighter
  const pubKey = await freighter.getPublicKey()
  return {
    publicKey: pubKey,
    signTransaction: async (txXdr: string) => {
      const SDK = await getSDK()
      return freighter.signTransaction(txXdr, { network: 'TESTNET', networkPassphrase: SDK.Networks.TESTNET })
    }
  }
}

// Helper para obter função de assinatura do wallet atual
export async function getWalletSigner(): Promise<(xdr: string) => Promise<string>> {
  // 1) Tente usar a API oficial do Freighter (recomendada)
  try {
    // import dinâmico evita pesar o bundle inicial
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freighter: any = await import('@stellar/freighter-api')
    if (freighter && typeof freighter.signTransaction === 'function') {
      const SDK = await getSDK()
      // Detecta rede persistida pelo app (WalletContext grava em localStorage)
      const stored = (typeof window !== 'undefined') ? window.localStorage.getItem('stellar-wallet-network') : null
      const useTestnet = !stored || stored.toLowerCase() === 'testnet'
      const networkPassphrase = useTestnet ? SDK.Networks.TESTNET : 'Public Global Stellar Network ; September 2015'
      return async (xdr: string) => freighter.signTransaction(xdr, { network: useTestnet ? 'TESTNET' : 'PUBLIC', networkPassphrase })
    }
  } catch (_) {
    // segue para fallback
  }

  // 2) Fallback para window.freighter (modo legado)
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : {}
  if (w.freighter?.signTransaction) {
    const SDK = await getSDK()
    return async (xdr: string) => w.freighter!.signTransaction(xdr, { network: 'TESTNET', networkPassphrase: SDK.Networks.TESTNET })
  }
  throw new Error('Nenhuma carteira conectada. Conecte via Freighter e tente novamente.')
}

export async function disconnectWallet(): Promise<void> { /* Sem estado secreto para limpar agora */ }

// Check if a wallet is connected
export function isWalletConnected(): boolean {
  const w = typeof window !== 'undefined' ? (window as unknown as { freighter?: Freighter }) : { }
  // Considera tanto a injeção do objeto quanto uma sessão gravada pelo WalletContext
  const hasWindowAPI = !!w.freighter
  const hasSession = (typeof window !== 'undefined') && !!window.localStorage.getItem('stellar-wallet-publickey')
  return hasWindowAPI || hasSession
}

// Get connected wallet publicKey (dev-only fallback)
export function getConnectedPublicKey(): string | null {
  // Freighter expõe método getPublicKey via window somente com chamada; aqui retornamos null e exigimos chamada explícita.
  return null
}

