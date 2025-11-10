import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateProof } from 'zkid-sdk'
import { ensureCircuitArtifacts } from '../services/circuitsPreload'
import { issueCredentialService, verifyIdentityProofService } from '../services/contracts'
import { getWalletSigner } from '../services/wallet'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useWallet } from '../context/WalletContext'

export function AgeProofPage() {
  const navigate = useNavigate()
  const { isConnected, network, setNetwork, publicKey } = useWallet()
  const [birthdate, setBirthdate] = useState('')
  const [minAge, setMinAge] = useState('18')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [credentialId, setCredentialId] = useState('')

  async function handleGenerate() {
    setError('')
    setCredentialId('')
    
    if (!birthdate) {
      setError('Enter your date of birth')
      return
    }

    if (!isConnected) {
      setError('Connect a wallet first to issue the credential on-chain.')
      return
    }
    if (network !== 'testnet') {
      setError('Switch to Testnet to generate and issue the proof.')
      return
    }

    try {
      setLoading(true)
  setStatus('Gerando prova ZK (local)...')
      
      const currentDate = new Date().toISOString().slice(0, 10)
      // Preload/validar artefatos antes de gerar prova
      await ensureCircuitArtifacts('age_verification')
      const proofArtifacts = await generateProof({
        circuit: 'age_verification',
        privateInputs: { birthdate },
        publicInputs: { minAge: Number(minAge), currentDate, userPublicKey: publicKey! }
      })
      setStatus('Enviando prova para verificação on-chain (assinatura da carteira)...')
      const walletSign = await getWalletSigner()
  const proofHashHex = await verifyIdentityProofService({ network }, publicKey!, proofArtifacts.proof, proofArtifacts.publicSignals, walletSign)

      setStatus('Emitindo credencial on-chain...')
      const signedId = await issueCredentialService(
        network,
        publicKey!,
        proofHashHex,
        60 * 60 * 24 * 365,
        walletSign
      )

      setCredentialId(signedId)
      setStatus('✅ Credential issued successfully!')
      
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
  <h1 className="mb-2">🎂 Age Verification (Wallet-Signed)</h1>
        <p className="text-slate-300">
          Prove you are of legal age without revealing your exact date of birth.
        </p>
      </div>

      {network !== 'testnet' && (
        <div className="p-4 rounded-lg border border-amber-400/30 bg-amber-400/10">
          <div className="mb-2 text-amber-300">This flow runs on Testnet. Switch to Testnet to continue.</div>
          <Button onClick={() => setNetwork('testnet')}>Switch to Testnet</Button>
        </div>
      )}

      <Card>
        <CardContent>
          <div className="form-group">
            <label className="form-label">Date of Birth (private)</label>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              className="form-input"
              disabled={loading}
              aria-label="Date of Birth"
              placeholder="YYYY-MM-DD"
            />
            <span className="form-hint">ℹ️ Dados privados, apenas commitment (hash) vai on-chain</span>
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Age</label>
            <input
              type="number"
              value={minAge}
              onChange={e => setMinAge(e.target.value)}
              className="form-input"
              disabled={loading}
              aria-label="Minimum Age"
              placeholder="18"
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Generate Proof and Issue'}
          </Button>

          {status && (
            <div className={credentialId ? 'alert-success' : 'alert-info'}>
              {status}
            </div>
          )}

          {error && (
            <div className="alert-error">
              ❌ {error}
            </div>
          )}

          {credentialId && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg text-sm">
              <strong>Credential ID:</strong><br />
              <code className="break-all">{credentialId}</code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-start gap-2">
            <span className="text-2xl">🔒</span>
            <div>
              <strong className="text-white">Privacy guaranteed:</strong>
              <p className="text-sm text-slate-300 mt-1 mb-0">
                A prova ZK é gerada localmente e enviada on-chain com assinatura da sua carteira. Somente o fato de você ser maior de idade é verificado, sem revelar sua data de nascimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
