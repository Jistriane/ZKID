import { createContext, useContext, useState, useEffect, ReactNode } from 'react'


interface FreighterAPI {
  getPublicKey: () => Promise<string>
  signTransaction: (xdr: string, opts: { network: string; networkPassphrase: string }) => Promise<string>
}

interface AlbedoAPI {
  publicKey: (opts?: object) => Promise<{ pubkey: string } | { error: { message?: string } | string }>
  tx: (opts: { xdr: string; network: string }) => Promise<{ signed_envelope_xdr: string }>
}

declare global {
  interface Window {
    freighter?: FreighterAPI
    albedo?: AlbedoAPI
  }
}

interface WalletContextType {
  publicKey: string | null
  balance: string
  isConnected: boolean
  isLoading: boolean
  network: 'testnet' | 'mainnet'
  walletType: 'freighter' | 'albedo' | null
  connectFreighter: () => Promise<void>
  connectAlbedo: () => Promise<void>
  disconnect: () => void
  setNetwork: (network: 'testnet' | 'mainnet') => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [balance, setBalance] = useState('0')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')
  const [walletType, setWalletType] = useState<'freighter' | 'albedo' | null>(null)

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedPublicKey = localStorage.getItem('stellar-wallet-publickey')
    const savedNetwork = localStorage.getItem('stellar-wallet-network') as 'testnet' | 'mainnet'
    const savedWalletType = localStorage.getItem('stellar-wallet-type') as 'freighter' | 'albedo'
    
    if (savedPublicKey) {
      setPublicKey(savedPublicKey)
      setIsConnected(true)
      setWalletType(savedWalletType || null)
      if (savedNetwork) setNetwork(savedNetwork)
      fetchBalance(savedPublicKey, savedNetwork || 'testnet')
    }
  }, [])

  // Fetch account balance from Stellar network
  async function fetchBalance(pubKey: string, net: 'testnet' | 'mainnet') {
    try {
      console.log('[WalletContext] Fetching balance for:', pubKey, 'on', net)
      const horizonUrl = net === 'testnet' 
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
      
      console.log('[WalletContext] Loading Stellar SDK...')
      let gotBalance = false
      try {
        const mod = await import('@stellar/stellar-sdk')
        // Handle ESM/CJS interop: some bundlers expose SDK on default
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const StellarSDK: any = (mod as any).default ?? (mod as any)
        console.log('[WalletContext] SDK loaded, creating server...')
        // Support both SDK.Horizon.Server (common) and SDK.Server (fallback)
        const ServerCtor = (StellarSDK?.Horizon?.Server) || (StellarSDK?.Server)
        if (!ServerCtor) {
          throw new Error('Stellar SDK Server constructor not found (Horizon.Server/Server)')
        }
        const server = new ServerCtor(horizonUrl)
        console.log('[WalletContext] Loading account...')
        const account = await server.loadAccount(pubKey)
        console.log('[WalletContext] Account loaded, balances:', account.balances)
        
        // Get native XLM balance
        const xlmBalance = account.balances.find(
          (b: { asset_type: string; balance?: string }) => b.asset_type === 'native'
        )
        
        if (xlmBalance && 'balance' in xlmBalance) {
          console.log('[WalletContext] XLM balance found:', xlmBalance.balance)
          const formattedBalance = parseFloat(xlmBalance.balance).toFixed(2)
          console.log('[WalletContext] Setting balance to:', formattedBalance)
          setBalance(formattedBalance)
          gotBalance = true
        }
      } catch (sdkErr) {
        console.warn('[WalletContext] SDK failed, falling back to Horizon REST:', sdkErr)
      }

      // Fallback: direct REST call to Horizon
      if (!gotBalance) {
        console.log('[WalletContext] Fetching via REST fallback...')
        const res = await fetch(`${horizonUrl}/accounts/${pubKey}`)
        if (!res.ok) {
          throw new Error(`Horizon REST error: ${res.status} ${res.statusText}`)
        }
        const data: { balances: Array<{ asset_type: string; balance?: string }> } = await res.json()
        const xlm = data.balances.find(b => b.asset_type === 'native')
        if (xlm && xlm.balance) {
          const formattedBalance = parseFloat(xlm.balance).toFixed(2)
          console.log('[WalletContext] REST: XLM balance found:', formattedBalance)
          setBalance(formattedBalance)
        } else {
          console.log('[WalletContext] REST: No XLM balance found, setting to 0.00')
          setBalance('0.00')
        }
      }
    } catch (error) {
      console.error('[WalletContext] Failed to fetch balance:', error)
      // If account doesn't exist (not funded), set balance to 0
      console.log('[WalletContext] Error occurred, setting balance to 0.00')
      setBalance('0.00')
    }
  }

  // Connect using Freighter wallet extension
  async function connectFreighter() {
    setIsLoading(true)
    try {
      let pubKey: string | null = null
      
      try {
        // Try the official Freighter API
        const freighter = await import('@stellar/freighter-api')
        
        // ALWAYS call requestAccess first - it will prompt if needed or return immediately if already allowed
        if (typeof freighter.requestAccess === 'function') {
          console.log('[Freighter] Requesting access...')
          const result = await freighter.requestAccess()
          pubKey = typeof result === 'string' ? result : (result as { address: string }).address
          console.log('[Freighter] Got public key:', pubKey)
        } else if (typeof freighter.getAddress === 'function') {
          console.log('[Freighter] Fallback to getAddress...')
          const result = await freighter.getAddress()
          pubKey = typeof result === 'string' ? result : (result as { address: string }).address
          console.log('[Freighter] Got address:', pubKey)
        }
        
        // Fetch network details (non-blocking)
        if (typeof freighter.getNetworkDetails === 'function') {
          freighter.getNetworkDetails()
            .then((details: { network?: string; networkPassphrase?: string }) => {
              if (details?.networkPassphrase?.toLowerCase().includes('test')) {
                if (network !== 'testnet') updateNetwork('testnet')
              }
            })
            .catch(() => {})
        }
      } catch (apiErr) {
        console.error('[Freighter] API error:', apiErr)
        // Fallback to legacy window.freighter
        if (typeof window !== 'undefined' && window.freighter?.getPublicKey) {
          console.log('[Freighter] Trying legacy window.freighter...')
          pubKey = await window.freighter.getPublicKey()
        } else {
          throw apiErr
        }
      }
      
      if (!pubKey) {
        throw new Error('No public key received. Please approve the connection in your wallet.')
      }
      
      console.log('[Freighter] Connection successful! Public key:', pubKey)
      
      setPublicKey(pubKey)
      setIsConnected(true)
      setWalletType('freighter')
      
      localStorage.setItem('stellar-wallet-publickey', pubKey)
      localStorage.setItem('stellar-wallet-network', network)
      localStorage.setItem('stellar-wallet-type', 'freighter')
      
      console.log('[Freighter] Calling fetchBalance...')
      await fetchBalance(pubKey, network)
      console.log('[Freighter] fetchBalance completed')
      
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        // Don't show alert if user explicitly cancelled/rejected
        if (msg.includes('user') || msg.includes('reject') || msg.includes('cancel') || msg.includes('closed')) {
          console.log('[WalletContext] User cancelled Freighter connection')
        } else {
          alert('Freighter connection failed: ' + error.message + '\n\nTips:\n- Make sure you approved the connection popup\n- Ensure site access is allowed for this domain in the Freighter extension\n- Disable conflicting wallets temporarily (Rabet, xBull)\n- Reload the extension and this page')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Connect using Albedo wallet
  async function connectAlbedo() {
    setIsLoading(true)
    try {
      console.log('[Albedo] Starting connection...')
      
      // Check if Albedo is already available
      if (typeof window === 'undefined' || !window.albedo) {
        console.log('[Albedo] Not found, loading SDK...')
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@latest/lib/albedo.intent.js'
        script.async = true
        document.head.appendChild(script)
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log('[Albedo] SDK loaded successfully')
            resolve()
          }
          script.onerror = () => reject(new Error('Failed to load Albedo SDK'))
          setTimeout(() => reject(new Error('Albedo SDK load timeout')), 10000)
        })
        
        // Wait for window.albedo to be injected
        let attempts = 0
        while (attempts < 20 && !window.albedo) {
          await new Promise(resolve => setTimeout(resolve, 200))
          attempts++
        }
      }

      const albedo = window.albedo
      if (!albedo) {
        throw new Error('Albedo SDK not available after loading. Please reload the page and try again.')
      }
      
      console.log('[Albedo] Requesting public key...')
      const result = await albedo.publicKey({
        // Ensure correct network is used by Albedo intent
        network: network === 'testnet' ? 'testnet' : 'public'
      })
      console.log('[Albedo] Got result:', result)
      
      // Check for error response
      if ('error' in result) {
        const error = result.error
        const errorMsg = typeof error === 'string' ? error : (error.message || 'Unknown error')
        console.error('[Albedo] API returned error:', errorMsg)
        throw new Error(errorMsg)
      }
      
      if (!result.pubkey) {
        throw new Error('No public key from Albedo. Please approve the connection.')
      }
      
      console.log('[Albedo] Connection successful! Public key:', result.pubkey)
      
      setPublicKey(result.pubkey)
      setIsConnected(true)
      setWalletType('albedo')
      
      localStorage.setItem('stellar-wallet-publickey', result.pubkey)
      localStorage.setItem('stellar-wallet-network', network)
      localStorage.setItem('stellar-wallet-type', 'albedo')
      
      await fetchBalance(result.pubkey, network)
      
    } catch (error) {
      console.error('[Albedo] Connection error:', error)
      if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        
        // Specific message for "account not selected"
        if (msg.includes('account not selected')) {
          const go = confirm('❌ No account selected\n\nAlbedo is a web wallet. You need to create/select an account first.\n\nOpen Albedo in a new tab now to set it up?')
          if (go) {
            window.open('https://albedo.link', '_blank')
          }
          alert('After creating/selecting your account in Albedo, return here and click the Albedo button again to connect.')
        }
        // Don't show alert if user explicitly cancelled/rejected
        else if (msg.includes('user') || msg.includes('reject') || msg.includes('cancel') || msg.includes('closed')) {
          console.log('[Albedo] User cancelled connection')
        } else {
          alert('Albedo connection failed: ' + error.message + '\n\nTips:\n- Make sure you approved the popup\n- Allow popups from this site\n- Check console for errors (F12)\n- Try reloading the page')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Disconnect wallet
  function disconnect() {
    setPublicKey(null)
    setBalance('0')
    setIsConnected(false)
    setWalletType(null)
    
    localStorage.removeItem('stellar-wallet-publickey')
    localStorage.removeItem('stellar-wallet-network')
    localStorage.removeItem('stellar-wallet-type')
  }

  // Update network and refetch balance
  function updateNetwork(newNetwork: 'testnet' | 'mainnet') {
    setNetwork(newNetwork)
    localStorage.setItem('stellar-wallet-network', newNetwork)
    
    if (publicKey) {
      fetchBalance(publicKey, newNetwork)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        balance,
        isConnected,
        isLoading,
        network,
        walletType,
        connectFreighter,
        connectAlbedo,
        disconnect,
        setNetwork: updateNetwork
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
