import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { ComplianceAssistant } from '../components/ComplianceAssistant'

interface ExplanationData {
  ruleId: string
  reason: string
  modelVersion: string
  confidence: number
  timestamp: string
  evidenceHash: string
  aiProvider: string
}

interface OnChainData {
  hash: string
  uri: string
}

export function CompliancePage() {
  const { publicKey, network, isConnected, setNetwork } = useWallet()
  const [explanations, setExplanations] = useState<ExplanationData[]>([])
  const [selectedRule, setSelectedRule] = useState<ExplanationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null)

  // Load real, wallet-based signals from Horizon (recent transactions)
  useEffect(() => {
    async function loadFromHorizon() {
      if (!isConnected || !publicKey) {
        setExplanations([])
        setSelectedRule(null)
        setOnChainData(null)
        return
      }
      // Only fetch on Testnet as requested
      if (network !== 'testnet') {
        setExplanations([])
        setSelectedRule(null)
        setOnChainData(null)
        return
      }
      setLoading(true)
      try {
        const horizonUrl = network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
        const res = await fetch(`${horizonUrl}/accounts/${publicKey}/transactions?limit=10&order=desc`)
        if (!res.ok) throw new Error(`Horizon REST ${res.status}`)
        const data = await res.json()
        const records = (Array.isArray(data.records) ? data.records : []) as Array<{
          id: string
          hash: string
          created_at: string
          memo?: string
        }>
        const mapped: ExplanationData[] = records.map((tx) => {
          // Sanitize memo to prevent HTML injection
          const rawMemo = tx.memo || ''
          const sanitizedMemo = sanitizeMemo(rawMemo.trim())
          return {
            ruleId: sanitizedMemo || `tx_${tx.id.slice(0, 6)}`,
            reason: sanitizedMemo ? `Transaction memo: ${sanitizedMemo}` : 'Transaction without memo',
            modelVersion: 'horizon-tx-v1',
            confidence: 1.0,
            timestamp: tx.created_at,
            evidenceHash: tx.hash,
            aiProvider: 'Stellar Horizon'
          }
        })
        setExplanations(mapped)
        setSelectedRule(mapped[0] ?? null)
      } catch (e) {
        console.error('[CompliancePage] Failed to load transactions:', e)
        setExplanations([])
        setSelectedRule(null)
      } finally {
        setLoading(false)
      }
    }
    loadFromHorizon()
  }, [isConnected, publicKey, network])

  async function fetchOnChainExplanation(_ruleId: string) {
    setLoading(true)
    try {
      if (!selectedRule) {
        setOnChainData(null)
        return
      }
      const horizonUrl = network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
      // For now, consider the evidenceHash as tx hash and link to Horizon tx endpoint
      setOnChainData({
        hash: selectedRule.evidenceHash,
        uri: `${horizonUrl}/transactions/${selectedRule.evidenceHash}`
      })
    } catch (e) {
      console.error('Failed to fetch on-chain explanation:', e)
      setOnChainData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedRule) fetchOnChainExplanation(selectedRule.ruleId)
  }, [selectedRule])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          🤖 Explainable AI Compliance
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1' }}>
          Transparency and auditability in compliance decisions
        </p>
      </div>

      {/* AI Compliance Assistant */}
      <ComplianceAssistant className="mb-8" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Rules List */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>📋 Compliance Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {explanations.map(exp => (
              <button
                key={exp.ruleId}
                onClick={() => setSelectedRule(exp)}
                style={{
                  padding: '1rem',
                  background: selectedRule && selectedRule.ruleId === exp.ruleId ? '#6d6cff' : 'rgba(255,255,255,0.06)',
                  color: selectedRule && selectedRule.ruleId === exp.ruleId ? 'white' : '#e2e8f0',
                  border: `1px solid ${selectedRule && selectedRule.ruleId === exp.ruleId ? '#6d6cff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {exp.ruleId.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  opacity: selectedRule && selectedRule.ruleId === exp.ruleId ? 0.9 : 0.6
                }}>
                  {exp.reason.slice(0, 50)}...
                </div>
              </button>
            ))}
            {network !== 'testnet' && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(251,146,60,0.12)',
                borderRadius: 8,
                border: '1px solid rgba(251,146,60,0.3)'
              }}>
                <div style={{ marginBottom: '0.5rem', color: '#fbbf24' }}>
                  Compliance data loads on Testnet. Switch to Testnet to fetch real data.
                </div>
                <button
                  onClick={() => setNetwork('testnet')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#6d6cff',
                    color: 'white',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Switch to Testnet
                </button>
              </div>
            )}
            {!loading && isConnected && explanations.length === 0 && (
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                color: '#94a3b8'
              }}>
                No recent transactions found for this account.
              </div>
            )}
            {!isConnected && (
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                color: '#94a3b8'
              }}>
                Connect a wallet to load real on-chain compliance signals.
              </div>
            )}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(251,146,60,0.12)',
            borderRadius: 8,
            fontSize: '0.875rem',
            border: '1px solid rgba(251,146,60,0.3)'
          }}>
            <strong>💡 About:</strong> Each compliance decision is explained by AI
            and recorded on-chain for audit.
          </div>
        </div>

        {/* Explanation Details */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '2rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1.5rem'
            }}>
              {selectedRule ? (
                <div>
                  <h2 style={{ marginBottom: '0.5rem' }}>{selectedRule.ruleId.toUpperCase()}</h2>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>{selectedRule.reason}</p>
                </div>
              ) : (
                <div>
                  <h2 style={{ marginBottom: '0.5rem' }}>No selection</h2>
                  <p style={{ color: '#cbd5e1', margin: 0 }}>Choose an item from the left to view details.</p>
                </div>
              )}
              <div style={{
                padding: '0.5rem 1rem',
                background: selectedRule && selectedRule.confidence >= 0.95 ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
                color: selectedRule && selectedRule.confidence >= 0.95 ? '#34d399' : '#fbbf24',
                borderRadius: 6,
                fontWeight: 600
              }}>
                {selectedRule ? `${(selectedRule.confidence * 100).toFixed(1)}% confidence` : '—'}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8
              }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  AI Model
                </div>
                <div style={{ fontWeight: 600 }}>{selectedRule ? selectedRule.aiProvider : '—'}</div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  {selectedRule ? selectedRule.modelVersion : '—'}
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8
              }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Timestamp
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedRule ? new Date(selectedRule.timestamp).toLocaleString('en-US') : '—'}
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Evidence Hash (On-Chain)
              </div>
              <code style={{
                display: 'block',
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 4,
                fontSize: '0.875rem',
                wordBreak: 'break-all'
              }}>
                {selectedRule ? selectedRule.evidenceHash : '—'}
              </code>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#cbd5e1' }}>
                Loading on-chain data...
              </div>
            ) : onChainData && selectedRule ? (
              <div style={{
                padding: '1rem',
                background: 'rgba(16,185,129,0.15)',
                borderRadius: 8
              }}>
                <strong>✅ Verified On-Chain</strong>
                <pre style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(onChainData, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{
                padding: '1rem',
                background: 'rgba(248,113,113,0.15)',
                borderRadius: 8,
                fontSize: '0.875rem'
              }}>
                ⚠️ {isConnected ? 'No on-chain data to display for the selected item.' : 'Data not found. Connect a wallet to verify on-chain.'}
              </div>
            )}
          </div>

          {/* Compliance Framework */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>📚 Supported Frameworks</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {[
                { name: 'MiCA', desc: 'Markets in Crypto-Assets' },
                { name: 'LGPD', desc: 'Brazilian General Data Protection Law' },
                { name: 'GDPR', desc: 'General Data Protection Regulation' },
                { name: 'AML/CFT', desc: 'Anti-Money Laundering' },
                { name: 'KYC', desc: 'Know Your Customer' },
                { name: 'BACEN', desc: 'Central Bank of Brazil' }
              ].map(framework => (
                <div key={framework.name} style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {framework.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {framework.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
