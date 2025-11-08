import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

type HealthData = {
  network: string
  latestLedger: number
  responseTime: number
  status: 'healthy' | 'slow' | 'error'
}

export function HealthPanel() {
  const { network } = useWallet()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      setLoading(true)
      const start = Date.now()
      try {
        const horizonUrl = network === 'testnet' 
          ? 'https://horizon-testnet.stellar.org'
          : 'https://horizon.stellar.org'
        
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        
        const res = await fetch(horizonUrl, { signal: controller.signal })
        clearTimeout(timeout)
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        
        const data = await res.json()
        const responseTime = Date.now() - start
        
        setHealth({
          network: network === 'testnet' ? 'Testnet' : 'Mainnet',
          latestLedger: data.core_latest_ledger || data.history_latest_ledger || 0,
          responseTime,
          status: responseTime < 1000 ? 'healthy' : 'slow'
        })
      } catch (e) {
        console.error('[HealthPanel] Failed to fetch Horizon health:', e)
        setHealth({
          network: network === 'testnet' ? 'Testnet' : 'Mainnet',
          latestLedger: 0,
          responseTime: 0,
          status: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
    
    checkHealth()
    // Refresh every 30s
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [network])

  if (loading) {
    return (
      <div style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8
      }}>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Checking network health...
        </div>
      </div>
    )
  }

  if (!health) return null

  const statusColor = health.status === 'healthy' 
    ? '#10b981' 
    : health.status === 'slow' 
    ? '#f59e0b' 
    : '#ef4444'

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${statusColor}40`,
      borderRadius: 8
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Network Health</h3>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 12px ${statusColor}`
        }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Network
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>
            {health.network}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Latest Ledger
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>
            {health.latestLedger > 0 ? health.latestLedger.toLocaleString() : 'N/A'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Response Time
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: statusColor }}>
            {health.responseTime > 0 ? `${health.responseTime}ms` : 'N/A'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Status
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: statusColor }}>
            {health.status === 'healthy' ? '✓ Healthy' : health.status === 'slow' ? '⚠ Slow' : '✗ Error'}
          </div>
        </div>
      </div>
    </div>
  )
}
