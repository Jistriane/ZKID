import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateIncomeProof, verifyAndIssue } from 'zkid-sdk'
import { ensurePasskey } from '../services/passkeys'
import { useWallet } from '../context/WalletContext'

export function IncomeProofPage() {
  const navigate = useNavigate()
  const { isConnected, network, setNetwork } = useWallet()
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
      
      const proof = await generateIncomeProof({
        circuit: 'income_threshold',
        privateInputs: { income: Number(income) },
        publicInputs: { minIncome: Number(minIncome) }
      })

      setStatus('Verifying proof on-chain...')
      const passkey = await ensurePasskey()
      
      setStatus('Issuing credential...')
      const result = await verifyAndIssue({
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        userPasskey: passkey
      })

      setCredentialId(result.id)
      setStatus('✅ Credential issued successfully!')
      
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e: any) {
      setError(e?.message || String(e))
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>💰 Income Verification</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Prove that your income is above the required minimum without revealing the exact amount.
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
            Your Monthly Income (private)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="5000"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e8f0',
                borderRadius: 6,
                fontSize: '1rem'
              }}
              disabled={loading}
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e8f0',
                borderRadius: 6,
                fontSize: '1rem'
              }}
              disabled={loading}
            >
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <small style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            ℹ️ This data never leaves your device
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Minimum Required Income ({currency})
          </label>
          <input
            type="number"
            value={minIncome}
            onChange={e => setMinIncome(e.target.value)}
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
          />
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
        fontSize: '0.875rem',
        marginBottom: '1rem'
      }}>
        <strong>🔒 Privacy guaranteed:</strong> The ZK proof only proves that your
        income is above the minimum, without revealing the exact amount.
      </div>

      <div style={{
        background: 'rgba(59,130,246,0.12)',
        padding: '1rem',
        borderRadius: 6,
        fontSize: '0.875rem'
      }}>
        <strong>📊 Use cases:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
          <li>Loans and financing</li>
          <li>Property rental</li>
          <li>Premium bank account opening</li>
          <li>High limit credit cards</li>
        </ul>
      </div>
    </div>
  )
}
