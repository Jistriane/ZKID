// Avoid static import in browser to prevent ESM/CJS interop issues; use dynamic import inside functions
import { CredentialRegistryClient, ZKID_CONTRACTS } from 'zkid-sdk'
import { Networks } from '@stellar/stellar-sdk'

export interface Credential {
  id: string
  type: string
  issueDate: string
  expiryDate: string
  status: 'active' | 'pending' | 'revoked'
  proofHash?: string
  issuer?: string
}

// Local storage key for credentials
const CREDENTIALS_STORAGE_KEY = 'zkid_credentials'

// Helper to get contract ID from env or defaults
function getRegistryContractId(_network: 'testnet' | 'mainnet'): string {
  const envId = import.meta.env.VITE_REGISTRY_CONTRACT_ID as string | undefined
  if (envId) return envId
  return ZKID_CONTRACTS.testnet.credentialRegistry
}

// Store credential locally after issuance
export function storeCredentialLocally(
  publicKey: string,
  credentialId: string,
  proofHash: string,
  type: string = 'Age Verification',
  ttlSeconds: number = 365 * 24 * 60 * 60
): void {
  try {
    const storageKey = `${CREDENTIALS_STORAGE_KEY}_${publicKey}`
    const existing = localStorage.getItem(storageKey)
    const credentials: Array<{
      id: string
      proofHash: string
      type: string
      issueDate: string
      expiryDate: string
    }> = existing ? JSON.parse(existing) : []
    
    const issueDate = new Date()
    const expiryDate = new Date(issueDate.getTime() + ttlSeconds * 1000)
    
    // Avoid duplicates
    if (!credentials.some(c => c.proofHash === proofHash)) {
      credentials.push({
        id: credentialId,
        proofHash,
        type,
        issueDate: issueDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0]
      })
      
      localStorage.setItem(storageKey, JSON.stringify(credentials))
      console.log('[credentials] Stored credential locally:', credentialId)
    }
  } catch (error) {
    console.warn('[credentials] Failed to store credential locally:', error)
  }
}

// Fetch credentials from local storage + verify on-chain status
export async function fetchCredentials(
  publicKey: string,
  network: 'testnet' | 'mainnet'
): Promise<Credential[]> {
  try {
    console.log('[credentials] Fetching credentials for:', publicKey)
    
    // Get locally stored credentials
    const storageKey = `${CREDENTIALS_STORAGE_KEY}_${publicKey}`
    const localData = localStorage.getItem(storageKey)
    if (!localData) {
      console.log('[credentials] No local credentials found')
      return []
    }
    
    const localCredentials: Array<{
      id: string
      proofHash: string
      type: string
      issueDate: string
      expiryDate: string
    }> = JSON.parse(localData)
    
    if (localCredentials.length === 0) {
      console.log('[credentials] No credentials to verify')
      return []
    }
    
    console.log('[credentials] Found', localCredentials.length, 'local credentials, verifying on-chain...')
    
    // Get RPC URL and setup client
    const rpcUrl = network === 'testnet'
      ? 'https://soroban-testnet.stellar.org'
      : 'https://soroban-rpc.stellar.org'
    
    const networkPassphrase = network === 'mainnet'
      ? 'Public Global Stellar Network ; September 2015'
      : Networks.TESTNET
    
    const contractId = getRegistryContractId(network)
    const client = new CredentialRegistryClient({
      contractId,
      networkPassphrase,
      rpcUrl,
    })
    
    // Verify each credential on-chain
    const credentials: Credential[] = []
    
    for (const localCred of localCredentials) {
      try {
        // Convert proofHash to Buffer
        const credentialIdBuf = Buffer.from(localCred.proofHash.replace(/^0x/, ''), 'hex')
        
        // Fetch credential data from contract
        const tx = await client.get_credential({
          credential_id: credentialIdBuf
        })
        await tx.simulate()
        
        const credData = tx.result
        
        if (!credData) {
          console.warn('[credentials] Credential not found on-chain:', localCred.id)
          continue
        }
        
        // Determine status
        const isRevoked = credData.revoked || false
        const expiresAt = Number(credData.expires_at || 0)
        const now = Math.floor(Date.now() / 1000)
        const isExpired = expiresAt <= now
        
        let status: 'active' | 'pending' | 'revoked' = 'active'
        if (isRevoked) {
          status = 'revoked'
        } else if (isExpired) {
          status = 'revoked' // Treat expired as revoked for display
        }
        
        credentials.push({
          id: localCred.id,
          type: localCred.type,
          issueDate: localCred.issueDate,
          expiryDate: localCred.expiryDate,
          status,
          proofHash: localCred.proofHash,
          issuer: contractId
        })
        
        console.log('[credentials] Verified credential:', localCred.id, 'status:', status)
      } catch (credErr) {
        console.warn('[credentials] Failed to verify credential:', localCred.id, credErr)
        // Include credential with pending status if on-chain verification fails
        credentials.push({
          id: localCred.id,
          type: localCred.type,
          issueDate: localCred.issueDate,
          expiryDate: localCred.expiryDate,
          status: 'pending',
          proofHash: localCred.proofHash,
          issuer: contractId
        })
      }
    }
    
    console.log('[credentials] Returning', credentials.length, 'verified credentials')
    return credentials
  } catch (error) {
    console.error('[credentials] Failed to fetch credentials:', error)
    return []
  }
}

// Fetch verification count from recent transactions (real)
export async function fetchVerificationCount(
  publicKey: string,
  network: 'testnet' | 'mainnet'
): Promise<number> {
  try {
    const horizonUrl = network === 'testnet' 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'
    
    // Use REST directly to avoid SDK interop issues
    const url = `${horizonUrl}/accounts/${publicKey}/transactions?limit=200&order=desc`
    const res = await fetchWithTimeout(url, { timeoutMs: 8000 })
    if (!res.ok) throw new Error(`Horizon REST ${res.status}`)
    const data = await res.json()
    const records = (Array.isArray(data.records) ? data.records : []) as Array<{ memo?: string }>
    const verificationTxs = records.filter((tx) => {
      if (typeof tx.memo !== 'string') return false
      const memo = sanitizeMemo(tx.memo)
      return memo.includes('zkid_verify')
    })
    return verificationTxs.length
  } catch (error) {
    console.error('[credentials] Failed to fetch verification count:', error)
    return 0
  }
}

// Helper: fetch with timeout to avoid hanging UI
async function fetchWithTimeout(url: string, opts: { timeoutMs: number; init?: RequestInit }) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    return await fetch(url, { ...(opts.init || {}), signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

// Basic memo sanitization (strip non-printable and angle brackets)
function sanitizeMemo(memo: string): string {
  // Remove control characters and angle brackets without regex control ranges
  let out = ''
  for (let i = 0; i < memo.length; i++) {
    const ch = memo.charCodeAt(i)
    if (ch < 32) continue
    const c = memo[i]
    if (c === '<' || c === '>') continue
    out += c
  }
  return out
}
