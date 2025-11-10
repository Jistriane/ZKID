import { useState, useEffect } from 'react'
import { CredentialCard } from '../components/CredentialCard'
import { HealthPanel } from '../components/HealthPanel'
import { ComplianceAssistant } from '../components/ComplianceAssistant'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { fetchCredentials, fetchVerificationCount, Credential } from '../services/credentials'
import { revokeCredentialService } from '../services/contracts'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export function DashboardPage() {
  const { publicKey, isConnected, network } = useWallet()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [verificationCount, setVerificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState<Credential | null>(null)
  const [revoking, setRevoking] = useState<Record<string, boolean>>({})

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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {credentials.map(cred => (
                <CredentialCard
                  key={cred.id}
                  {...cred}
                  onView={() => setSelected(cred)}
                  isRevoking={!!revoking[cred.id]}
                  onRevoke={async () => {
                    if (!publicKey) return
                    if (!cred.proofHash) {
                      console.warn('[Dashboard] Credencial sem proofHash, não é possível revogar')
                      return
                    }
                    if (!window.confirm('Revogar esta credencial? Esta ação não pode ser desfeita.')) {
                      return
                    }
                    try {
                      setRevoking(prev => ({ ...prev, [cred.id]: true }))
                      const walletSign = async (xdr: string) => {
                        type Freighter = { signTransaction?: (xdr: string, opts: { network: string }) => Promise<string | { signedTxXdr: string }> }
                        const freighter: Freighter | undefined = (window as unknown as { freighter?: Freighter }).freighter
                        if (!freighter?.signTransaction) throw new Error('Carteira não disponível')
                        const networkLabel = network === 'mainnet' ? 'PUBLIC' : 'TESTNET'
                        const res = await freighter.signTransaction(xdr, { network: networkLabel })
                        return typeof res === 'string' ? res : res?.signedTxXdr
                      }
                      await revokeCredentialService(network, publicKey, cred.proofHash, walletSign)
                      const updated = await fetchCredentials(publicKey, network)
                      setCredentials(updated)
                    } catch (err) {
                      console.error('[Dashboard] Falha ao revogar credencial:', err)
                      alert('Não foi possível revogar a credencial. Verifique sua carteira e tente novamente.')
                    } finally {
                      setRevoking(prev => ({ ...prev, [cred.id]: false }))
                    }
                  }}
                />
              ))}
            </div>

            {selected && (
              <Card className="mt-6">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="m-0 mb-2">Credential Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Type</div>
                          <div className="font-semibold">{selected.type}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Status</div>
                          <div className="font-semibold capitalize">{selected.status}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">ID</div>
                          <div className="font-mono break-all">{selected.id}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Proof Hash</div>
                          <div className="font-mono break-all">{selected.proofHash || '—'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Issued on</div>
                          <div className="font-semibold">{selected.issueDate}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Expires on</div>
                          <div className="font-semibold">{selected.expiryDate}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-slate-400">Issuer (Contract)</div>
                          <div className="font-mono break-all">{selected.issuer || '—'}</div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
