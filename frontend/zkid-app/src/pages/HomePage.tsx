import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { useWallet } from '../context/WalletContext'
import { useEffect, useState } from 'react'

export function HomePage() {
  const { isConnected, publicKey, network, setNetwork } = useWallet()
  const [txCount, setTxCount] = useState<number | null>(null)
  const [recentHash, setRecentHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadSignals() {
      if (!isConnected || !publicKey || network !== 'testnet') {
        setTxCount(null)
        setRecentHash(null)
        return
      }
      setLoading(true)
      try {
        const horizon = 'https://horizon-testnet.stellar.org'
        const res = await fetch(`${horizon}/accounts/${publicKey}/transactions?limit=1&order=desc`)
        if (res.ok) {
          const data = await res.json()
          const records = Array.isArray(data.records) ? data.records : []
          setTxCount(data.records?.length ?? 0)
          if (records[0]) setRecentHash(records[0].hash)
        }
      } catch (e) {
        console.warn('[HomePage] loadSignals failed', e)
      } finally {
        setLoading(false)
      }
    }
    loadSignals()
  }, [isConnected, publicKey, network])
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">
          <span className="bg-[linear-gradient(120deg,#fff,rgba(255,255,255,0.6))] bg-clip-text text-transparent">
            Zero‑Knowledge Identity
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-300">
          Privacy by design. On‑chain verification in seconds with Soroban and ZK Proofs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/proofs/age"><Button size="lg">Prove Age</Button></Link>
          <Link to="/dashboard"><Button variant="secondary" size="lg">View Dashboard</Button></Link>
        </div>
        {network !== 'testnet' && isConnected && (
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-200 text-sm">
            <span>Switch to Testnet to show live wallet signals.</span>
            <Button size="sm" onClick={() => setNetwork('testnet')}>Switch</Button>
          </div>
        )}
        {network === 'testnet' && isConnected && (
          <div className="mt-4 text-sm text-slate-300">
            {loading && <span>Loading wallet signals...</span>}
            {!loading && recentHash && (
              <span>Latest tx: {recentHash.slice(0,12)}... • Total fetched: {txCount}</span>
            )}
            {!loading && !recentHash && <span>No transactions found yet for this wallet.</span>}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <FeatureCard icon="🔒" title="Privacy‑First" description="ZK Proofs on client. Your data never leaves your device." />
        <FeatureCard icon="⚡" title="Soroban" description="Fast and economical on‑chain verification with smart contracts." />
        <FeatureCard icon="🌎" title="LATAM Ready" description="Remittances, international Pix, microcredit and Gov.br." />
        <FeatureCard icon="🧠" title="Compliance AI" description="Auditable explanations for regulators (MiCA, LGPD)." />
      </section>

      {/* How it works */}
      <section>
        <Card>
          <CardContent>
            <h3 className="mb-3">How It Works</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>Connect your Stellar wallet (Freighter or local Passkey)</li>
              <li>Choose the proof type (age, country, income)</li>
              <li>Generate the ZK proof in your browser (private data)</li>
              <li>Verify on‑chain via Soroban and issue the credential</li>
              <li>Use your credential in compatible services</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="mb-1 text-white/90">{title}</h3>
        <p className="text-sm text-slate-300 m-0">{description}</p>
      </CardContent>
    </Card>
  )
}
