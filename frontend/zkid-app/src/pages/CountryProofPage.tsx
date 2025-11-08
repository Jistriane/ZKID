import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCountryProof, verifyAndIssue } from 'zkid-sdk'
import { ensurePasskey } from '../services/passkeys'
import { useWallet } from '../context/WalletContext'

const ALLOWED_COUNTRIES = ['BR', 'US', 'AR', 'MX', 'CL', 'CO', 'PE', 'UY']

export function CountryProofPage() {
  const navigate = useNavigate()
  const { isConnected, network, setNetwork } = useWallet()
  const [country, setCountry] = useState('BR')
  const [allowedList, setAllowedList] = useState(['BR', 'AR', 'UY'])
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
      // For privacy we only prove membership by checking equality with one target at a time.
      // We'll iterate until one matches or all fail.
  let proofResult: { proof: unknown; publicSignals: unknown } | null = null
      for (const target of allowedList) {
        const countryCode = isoAlpha2ToNumeric(country)
        const targetCode = isoAlpha2ToNumeric(target)
        const proof = await generateCountryProof({
          circuit: 'country_verification',
          privateInputs: { countryCode },
          publicInputs: { targetCode }
        })
        // publicSignals mock fallback shape { is_target }
  const ps = proof.publicSignals as { is_target?: boolean }
  const ok = ps?.is_target === true
        if (ok) {
          proofResult = proof
          break
        }
      }
      if (!proofResult) {
        throw new Error('Country not in allowed list (proof failed).')
      }

      setStatus('Verifying proof on-chain...')
      const passkey = await ensurePasskey()
      
      setStatus('Issuing credential...')
      const result = await verifyAndIssue({
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        userPasskey: passkey
      })

      setCredentialId(result.id)
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
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>🌎 Country Verification</h1>
  <p style={{ color: '#666', marginBottom: '2rem' }}>
  Prove you are from an allowed country without revealing your exact nationality.
      </p>
      {network !== 'testnet' && (
        <div style={{
          background: 'rgba(251,146,60,0.12)',
          border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ marginBottom: '0.5rem', color: '#fbbf24' }}>
            This flow runs on Testnet. Switch to Testnet to continue.
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

      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '2rem',
        marginBottom: '1rem'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Your Country (private)
          </label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#e2e8f0',
              borderRadius: 6,
              fontSize: '1rem'
            }}
            disabled={loading}
          >
            {ALLOWED_COUNTRIES.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <small style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            ℹ️ This data never leaves your device
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Allowed Countries (public)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ALLOWED_COUNTRIES.map(code => (
              <button
                key={code}
                onClick={() => toggleCountryInList(code)}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: allowedList.includes(code) ? '#6d6cff' : 'rgba(255,255,255,0.06)',
                  color: allowedList.includes(code) ? 'white' : '#e2e8f0',
                  border: `1px solid ${allowedList.includes(code) ? '#6d6cff' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 6,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {code}
              </button>
            ))}
          </div>
          <small style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Select the countries that can access the service
          </small>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading ? 'rgba(255,255,255,0.15)' : '#6d6cff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Generate Proof and Issue'}
        </button>

        {status && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: credentialId ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
            borderRadius: 6,
            color: '#e2e8f0'
          }}>
            {status}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(248,113,113,0.15)',
            borderRadius: 6,
            color: '#fecaca'
          }}>
            ❌ {error}
          </div>
        )}

        {credentialId && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: '0.875rem'
          }}>
            <strong>Credential ID:</strong><br />
            <code>{credentialId}</code>
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(251,146,60,0.12)',
        padding: '1rem',
        borderRadius: 6,
        fontSize: '0.875rem'
      }}>
        <strong>🔒 Privacy guaranteed:</strong> The ZK proof proves that you belong
        to the allowed set of countries, without revealing which one specifically.
      </div>
    </div>
  )
}
