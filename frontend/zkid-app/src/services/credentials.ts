// Avoid static import in browser to prevent ESM/CJS interop issues; use dynamic import inside functions

export interface Credential {
  id: string
  type: string
  issueDate: string
  expiryDate: string
  status: 'active' | 'pending' | 'revoked'
  proofHash?: string
  issuer?: string
}

// Fetch credentials from Stellar blockchain
export async function fetchCredentials(
  publicKey: string,
  network: 'testnet' | 'mainnet'
): Promise<Credential[]> {
  try {
    const horizonUrl = network === 'testnet' 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'
    
    let account: { data_attr: Record<string, string> }
    try {
      const mod = await import('@stellar/stellar-sdk')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SDK: any = (mod as any).default ?? (mod as any)
      const ServerCtor = SDK?.Horizon?.Server || SDK?.Server
      if (!ServerCtor) throw new Error('No Server constructor')
      const server = new ServerCtor(horizonUrl)
      account = await server.loadAccount(publicKey)
    } catch (e) {
      // Fallback to REST with timeout
      const res = await fetchWithTimeout(`${horizonUrl}/accounts/${publicKey}`, { timeoutMs: 8000 })
      if (!res.ok) throw new Error(`Horizon REST ${res.status}`)
      account = await res.json()
    }
    
    // Parse credentials from account data entries
    const credentials: Credential[] = []
    
    // Check data entries for stored credentials
    // Format: zkid_cred_{type}_{timestamp}
    for (const [rawKey, value] of Object.entries(account.data_attr)) {
      if (rawKey.startsWith('zkid_cred_')) {
  // Sanitize key: allow alphanumerics, underscore, hyphen
  const key = rawKey.replace(/[^a-zA-Z0-9_-]/g, '')
        try {
          const decoded = Buffer.from(value, 'base64').toString('utf-8')
          const credData = JSON.parse(decoded)
          
          credentials.push({
            id: key,
            type: credData.type || 'Unknown',
            issueDate: credData.issueDate || new Date().toISOString().split('T')[0],
            expiryDate: credData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: credData.status || 'active',
            proofHash: credData.proofHash,
            issuer: credData.issuer
          })
        } catch (e) {
          console.warn('[credentials] Failed to parse credential:', key, e)
        }
      }
    }
    
    return credentials
  } catch (error) {
    console.error('[credentials] Failed to fetch credentials:', error)
    // If account doesn't exist, return empty array
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
