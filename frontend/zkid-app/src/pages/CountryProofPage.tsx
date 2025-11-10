import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCountryProof } from 'zkid-sdk'
import { ensureCircuitArtifacts } from '../services/circuitsPreload'
import { issueCredentialService, verifyIdentityProofService } from '../services/contracts'
import { getWalletSigner } from '../services/wallet'
import { useWallet } from '../context/WalletContext'
import styles from './CountryProofPage.module.css'

const ALLOWED_COUNTRIES = ['BR', 'US', 'AR', 'MX', 'CL', 'CO', 'PE', 'UY']

export function CountryProofPage() {
  const navigate = useNavigate()
  const { isConnected, network, setNetwork, publicKey } = useWallet()
  const [country, setCountry] = useState('BR')
  const [allowedList, setAllowedList] = useState<string[]>([...ALLOWED_COUNTRIES])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [credentialId, setCredentialId] = useState('')

  async function handleGenerate() {
    setError('')
    setCredentialId('')

    if (!country) {
      setError('Select your country')
      return
    }

    if (allowedList.length === 0) {
      setError('Select at least one allowed country')
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
      setStatus('Generating country equality zero-knowledge proof...')
      
      // Validar artefatos uma vez antes do loop
      await ensureCircuitArtifacts('country_verification')
      
      // For privacy we only prove membership by checking equality with one target at a time.
      // We'll iterate until one matches or all fail.
      let proofResult: { proof: unknown; publicSignals: unknown } | null = null
      for (const target of allowedList) {
        const countryCode = isoAlpha2ToNumeric(country)
        const targetCode = isoAlpha2ToNumeric(target)
        
        const proof = await generateCountryProof({
          circuit: 'country_verification',
          privateInputs: { countryCode },
          publicInputs: { targetCode, userPublicKey: publicKey! }
        })
        
        // publicSignals é array: [is_target] onde is_target = 1 se match, 0 caso contrário
  const publicSignals = proof.publicSignals as (number | string)[]
  const first = Array.isArray(publicSignals) ? publicSignals[0] : undefined
  const numeric = typeof first === 'string' ? parseInt(first, 10) : typeof first === 'number' ? first : 0
  const ok = numeric === 1
        
        if (ok) {
          proofResult = proof
          break
        }
      }
      if (!proofResult) {
        throw new Error('Country not in allowed list (proof failed).')
      }

      setStatus('Enviando prova para verificação on-chain (assinatura da carteira)...')
      const walletSign = await getWalletSigner()
  const proofHashHex = await verifyIdentityProofService({ network }, publicKey!, proofResult.proof, proofResult.publicSignals, walletSign)
      
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

  function toggleCountryInList(code: string) {
    if (allowedList.includes(code)) {
      setAllowedList(allowedList.filter(c => c !== code))
    } else {
      setAllowedList([...allowedList, code])
    }
  }

  function isoAlpha2ToNumeric(alpha2: string): number {
    // Minimal mapping (real ISO-3166-1 numeric codes). Extend as needed.
    const map: Record<string, number> = {
      BR: 76,
      US: 840,
      AR: 32,
      MX: 484,
      CL: 152,
      CO: 170,
      PE: 604,
      UY: 858
    }
    return map[alpha2] ?? 0
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🌎 Country Verification</h1>
      <p className={styles.subtitle}>
        Prove you are from an allowed country without revealing your exact nationality.
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
            Your Country (private)
          </label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className={styles.select}
            disabled={loading}
            aria-label="Your country selection"
            title="Select your country"
          >
            {ALLOWED_COUNTRIES.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <small className={styles.hint}>
            ℹ️ This data never leaves your device
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Allowed Countries (public)
          </label>
          <div className={styles.countryButtonsContainer}>
            {ALLOWED_COUNTRIES.map(code => (
              <button
                key={code}
                onClick={() => toggleCountryInList(code)}
                disabled={loading}
                className={`${styles.countryButton} ${allowedList.includes(code) ? styles.countryButtonSelected : ''}`}
              >
                {code}
              </button>
            ))}
          </div>
          <small className={styles.hint}>
            Select the countries that can access the service
          </small>
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
        <strong>🔒 Privacy guaranteed:</strong> The ZK proof proves that you belong
        to the allowed set of countries, without revealing which one specifically.
      </div>
    </div>
  )
}
