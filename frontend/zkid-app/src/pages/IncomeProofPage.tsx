import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateIncomeProof } from 'zkid-sdk'
import { ensureCircuitArtifacts } from '../services/circuitsPreload'
import { issueCredentialService, verifyIdentityProofService } from '../services/contracts'
import { getWalletSigner } from '../services/wallet'
import { useWallet } from '../context/WalletContext'
import styles from './IncomeProofPage.module.css'

export function IncomeProofPage() {
  const navigate = useNavigate()
  const { isConnected, network, setNetwork, publicKey } = useWallet()
  const [income, setIncome] = useState('')
  const [minIncome, setMinIncome] = useState('3000')
  const [currency, setCurrency] = useState('BRL')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [credentialId, setCredentialId] = useState('')

  async function handleGenerate() {
    setError('')
    setCredentialId('')
    
    if (!income || Number(income) <= 0) {
      setError('Enter your income')
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
  setStatus('Generating zero-knowledge income threshold proof...')
      
      await ensureCircuitArtifacts('income_threshold')
      const proof = await generateIncomeProof({
        circuit: 'income_threshold',
        privateInputs: { income: Number(income) },
        publicInputs: { minIncome: Number(minIncome), userPublicKey: publicKey! }
      })

      setStatus('Enviando prova para verificação on-chain (assinatura da carteira)...')
      const walletSign = await getWalletSigner()
  const proofHashHex = await verifyIdentityProofService({ network }, publicKey!, proof.proof, proof.publicSignals, walletSign)
      
      setStatus('Emitindo credencial...')
  const id = await issueCredentialService(network, publicKey!, proofHashHex, 60*60*24*365, walletSign)
      setCredentialId(id)
      setStatus('✅ Credential issued successfully!')
      
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>💰 Income Verification</h1>
      <p className={styles.subtitle}>
        Prove that your income is above the required minimum without revealing the exact amount.
      </p>
      {network !== 'testnet' && (
        <div className={styles.warningBox}>
          <div className={styles.warningTitle}>
            This flow runs on Testnet. Switch to Testnet to continue.
          </div>
          <button
            onClick={() => setNetwork('testnet')}
            className={styles.connectButton}
          >
            Switch to Testnet
          </button>
        </div>
      )}

      <div className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Your Monthly Income (private)
          </label>
          <div className={styles.inputGroup}>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="5000"
              className={styles.input}
              disabled={loading}
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className={styles.select}
              disabled={loading}
              aria-label="Currency selection"
              title="Select currency"
            >
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <small className={styles.hint}>
            ℹ️ This data never leaves your device
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Minimum Required Income ({currency})
          </label>
          <input
            type="number"
            value={minIncome}
            onChange={e => setMinIncome(e.target.value)}
            className={styles.input}
            disabled={loading}
            aria-label="Minimum required income"
            title="Enter minimum required income"
            placeholder="Enter minimum income"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Processing...' : 'Generate Proof and Issue'}
        </button>

        {status && (
          <div className={credentialId ? styles.statusBoxSuccess : styles.statusBoxInfo}>
            {status}
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {credentialId && (
          <div className={styles.credentialBox}>
            <strong>Credential ID:</strong><br />
            <code>{credentialId}</code>
          </div>
        )}
      </div>

      <div className={styles.warningInfoBox}>
        <strong>🔒 Privacy guaranteed:</strong> The ZK proof only proves that your
        income is above the minimum, without revealing the exact amount.
      </div>

      <div className={styles.infoBox}>
        <strong>📊 Use cases:</strong>
        <ul className={styles.list}>
          <li>Loans and financing</li>
          <li>Property rental</li>
          <li>Premium bank account opening</li>
          <li>High limit credit cards</li>
        </ul>
      </div>
    </div>
  )
}
