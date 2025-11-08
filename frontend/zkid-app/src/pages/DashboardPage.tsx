import { useState, useEffect } from 'react'
import { CredentialCard } from '../components/CredentialCard'
import { HealthPanel } from '../components/HealthPanel'
import { ComplianceAssistant } from '../components/ComplianceAssistant'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { fetchCredentials, fetchVerificationCount, Credential } from '../services/credentials'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export function DashboardPage() {
  const { publicKey, isConnected, network } = useWallet()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [verificationCount, setVerificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch credentials when wallet is connected
  useEffect(() => {
    async function loadCredentials() {
      if (!publicKey || !isConnected) {
        setCredentials([])
        setVerificationCount(0)
        return
      }

      setIsLoading(true)
      try {
        const [creds, count] = await Promise.all([
          fetchCredentials(publicKey, network),
          fetchVerificationCount(publicKey, network)
        ])
        setCredentials(creds)
        setVerificationCount(count)
      } catch (error) {
        console.error('[DashboardPage] Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCredentials()
  }, [publicKey, isConnected, network])

  const stats = [
    { label: 'Active Credentials', value: credentials.filter(c => c.status === 'active').length, color: 'text-emerald-400' },
    { label: 'Total Issued', value: credentials.length, color: 'text-primary' },
    { label: 'Verifications', value: verificationCount, color: 'text-amber-400' },
    { label: 'Revoked', value: credentials.filter(c => c.status === 'revoked').length, color: 'text-red-400' }
  ]

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl animate-pulse">⏳</div>
        <div className="text-xl text-slate-300">Loading your credentials from blockchain...</div>
      </div>
    )
  }

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <div className="text-center py-12 space-y-4 max-w-lg mx-auto">
        <div className="text-6xl mb-4">👛</div>
        <h2 className="mb-2">Connect Your Wallet</h2>
        <p className="text-slate-300">
          To view your credentials and manage your zero-knowledge proofs, please connect your Stellar wallet.
        </p>
        <Link to="/settings">
          <Button size="lg">Go to Settings</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="m-0">Dashboard</h1>
        <Link to="/proofs">
          <Button size="lg">+ New Proof</Button>
        </Link>
      </div>

      <div className="stats-grid">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent>
              <div className={`stat-value ${stat.color}`}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <HealthPanel />

      <ComplianceAssistant className="mb-8" />

      <div>
        <h2 className="mb-4">My Credentials</h2>
        
        {credentials.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-lg mb-4">No credentials yet</p>
                <Link to="/proofs">
                  <Button>Create First Proof</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {credentials.map(cred => (
              <CredentialCard key={cred.id} {...cred} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
