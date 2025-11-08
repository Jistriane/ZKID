import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

const USE_CASES = [
  {
    id: 'remessas',
    title: '💸 International Remittances',
    description: '70% reduction in transfer costs between Brazil and LATAM countries',
    icon: '💸',
    benefits: [
      'Identity verification without intermediaries',
      'Automatic BACEN compliance',
      'Settlement in 2-3 seconds via Stellar',
      'Costs < $0.50 per transaction'
    ],
    metrics: {
      'Average Time': '2.3s',
      'Average Cost': '$0.35',
      'Volume Processed': '$1.2M',
      'Success Rate': '99.8%'
    }
  },
  {
    id: 'pix',
    title: '🇧🇷 PIX Integration',
    description: 'Decentralized KYC for instant PIX account opening',
    icon: '🇧🇷',
    benefits: [
      'Onboarding in < 5 minutes',
      'CPF proof without sharing number',
      'Native LGPD compliance',
      'Gov.br integration via ZK'
    ],
    metrics: {
      'Onboarding Time': '4.2min',
      'Accounts Opened': '15,432',
      'Automatic Approval': '94%',
      'Cost per KYC': '$0.80'
    }
  },
  {
    id: 'microcredito',
    title: '🏦 Microcredit',
    description: 'Income verification for P2P loans without intermediaries',
    icon: '🏦',
    benefits: [
      'Income proof without exposing payslip',
      'Credit score preserving privacy',
      'Instant settlement via Stellar',
      'Access for banked and unbanked'
    ],
    metrics: {
      'Loans Issued': '2,341',
      'Total Volume': 'R$ 3.8M',
      'Default Rate': '2.1%',
      'Approval Time': '8min'
    }
  },
  {
    id: 'govbr',
    title: '🏛️ Gov.br Digital',
  description: 'Verifiable government credentials on-chain',
    icon: '🏛️',
    benefits: [
      'Proof of residence without physical documents',
      'Verifiable voter registration',
      'Educational certificates on-chain',
      'Interoperability between government agencies'
    ],
    metrics: {
      'Credentials Issued': '8,723',
      'Integrated Agencies': '12',
      'Verifications/day': '1,450',
      'Paper Savings': '89%'
    }
  }
]

export function LatamPage() {
  const [selectedCase, setSelectedCase] = useState(USE_CASES[0])
  const { isConnected, network, publicKey, setNetwork } = useWallet()
  const [recentTxs, setRecentTxs] = useState<Array<{ hash: string; memo?: string; created_at: string }>>([])
  const [loading, setLoading] = useState(false)

  // Load real account signals (recent transactions) only when connected on Testnet
  useEffect(() => {
    async function load() {
      if (!isConnected || !publicKey || network !== 'testnet') {
        setRecentTxs([])
        return
      }
      setLoading(true)
      try {
        const horizon = 'https://horizon-testnet.stellar.org'
        const res = await fetch(`${horizon}/accounts/${publicKey}/transactions?limit=5&order=desc`)
        if (res.ok) {
          const data = await res.json()
            const records = (Array.isArray(data.records) ? data.records : []) as Array<{ hash: string; memo?: string; created_at: string }>
            setRecentTxs(records.map((r) => ({ hash: r.hash, memo: r.memo, created_at: r.created_at })))
        }
      } catch (e) {
        console.warn('[LatamPage] Failed to load txs', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isConnected, publicKey, network])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          🌎 ZKID in Latin America
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1' }}>
          Real use cases transforming digital identity in the region
        </p>
      </div>

      {/* Use Case Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {USE_CASES.map(useCase => (
          <button
            key={useCase.id}
            onClick={() => setSelectedCase(useCase)}
            style={{
              padding: '1.5rem',
              background: selectedCase.id === useCase.id ? '#6d6cff' : 'rgba(255,255,255,0.06)',
              color: selectedCase.id === useCase.id ? 'white' : '#e2e8f0',
              border: `2px solid ${selectedCase.id === useCase.id ? '#6d6cff' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{useCase.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {useCase.title.replace(/^[^ ]+ /, '')}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Use Case Details */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{selectedCase.icon}</div>
        <h2 style={{ marginBottom: '0.5rem' }}>{selectedCase.title}</h2>
        <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem' }}>
          {selectedCase.description}
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>✨ Benefits</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedCase.benefits.map((benefit, i) => (
              <li key={i} style={{
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                marginBottom: '0.5rem',
                borderRadius: 6,
                borderLeft: '3px solid #6d6cff'
              }}>
                ✓ {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem' }}>📊 Live Signals (Testnet)</h3>
          {network !== 'testnet' && (
            <div style={{
              padding: '1rem',
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid rgba(251,146,60,0.3)',
              borderRadius: 8,
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem', color: '#fbbf24' }}>
                Switch to Testnet and connect a wallet to view recent transaction signals.
              </div>
              <button
                onClick={() => setNetwork('testnet')}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#6d6cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >Switch to Testnet</button>
            </div>
          )}
          {network === 'testnet' && !isConnected && (
            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              marginBottom: '1rem',
              color: '#94a3b8'
            }}>
              Connect a wallet to load recent on-chain signals.
            </div>
          )}
          {network === 'testnet' && isConnected && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {loading && (
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>Loading...</div>
              )}
              {!loading && recentTxs.length === 0 && (
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  color: '#94a3b8'
                }}>No transactions found.</div>
              )}
              {recentTxs.map(tx => {
                const sanitized = sanitizeMemo(tx.memo || '')
                return (
                  <div key={tx.hash} style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      {new Date(tx.created_at).toLocaleString('en-US')}
                    </div>
                    <div style={{ fontSize: '0.875rem', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                      {tx.hash.slice(0, 12)}...{tx.hash.slice(-6)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6d6cff' }}>
                      {sanitized ? `Memo: ${sanitized}` : 'No memo'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Integration Guide */}
      <div style={{
        marginTop: '2rem',
        background: 'rgba(251,146,60,0.12)',
        padding: '2rem',
        borderRadius: 8,
        border: '1px solid rgba(251,146,60,0.3)'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>🚀 How to Integrate</h3>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            Connect your Stellar wallet (Freighter or Albedo)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Generate the necessary ZK proofs for the use case
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Integrate via ZKID SDK (npm install zkid-sdk)
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Configure the Compliance Oracle for your jurisdiction
          </li>
        </ol>
      </div>

      {/* Resources */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8
        }}>
          <h4 style={{ marginBottom: '0.5rem' }}>📖 Documentation</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Complete integration and API guide
          </p>
          <a href="/docs" style={{ color: '#6d6cff', fontWeight: 600 }}>
            View documentation →
          </a>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8
        }}>
          <h4 style={{ marginBottom: '0.5rem' }}>💻 Example Code</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Reference implementations on GitHub
          </p>
          <a
            href="https://github.com/your-repo/zkid-latam-examples"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6d6cff', fontWeight: 600 }}
          >
            View examples →
          </a>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8
        }}>
          <h4 style={{ marginBottom: '0.5rem' }}>🤝 Support</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Talk to our developer team
          </p>
          <a href="mailto:dev@zkid.lat" style={{ color: '#6d6cff', fontWeight: 600 }}>
            Contact us →
          </a>
        </div>
      </div>
    </div>
  )
}

// Helper: sanitize memo to prevent HTML injection
function sanitizeMemo(memo: string): string {
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
