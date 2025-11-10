import { describe, it, expect, vi } from 'vitest'
import { generateProof, generateIncomeProof, generateCountryProof, hashProof, setConfig, getConfig } from '../src'

vi.mock('snarkjs', () => ({ groth16: { fullProve: vi.fn().mockResolvedValue({ proof: { p:1 }, publicSignals: { s:1 }}) }}))

describe('zkid-sdk', () => {
  it('hashProof returns a non-empty string', async () => {
    const h = hashProof({ proof: { a:1 }, publicSignals: { b:2 }})
    expect(typeof h).toBe('string')
    expect(h.length).toBeGreaterThan(0)
  })

  it('generateProof (age) produces artifacts with user binding', async () => {
    const res = await generateProof({
      circuit: 'age_verification',
      privateInputs: { birthdate: '1990-01-01' },
      publicInputs: { minAge: 18, currentDate: '2025-11-05', userPublicKey: 'GBZXN7PIRZGNMHGA...' }
    })
    expect(res).toHaveProperty('proof')
    expect(res).toHaveProperty('publicSignals')
  })

  it('generateIncomeProof returns proof artifacts', async () => {
    const res = await generateIncomeProof({
      circuit: 'income_threshold',
      privateInputs: { income: 50000 },
      publicInputs: { minIncome: 30000, userPublicKey: 'GBZXN7PIRZGNMHGA...' }
    })
    expect(res).toHaveProperty('proof')
    expect(res).toHaveProperty('publicSignals')
  })

  it('generateCountryProof returns proof artifacts (match)', async () => {
    const res = await generateCountryProof({
      circuit: 'country_verification',
      privateInputs: { countryCode: 76 },
      publicInputs: { targetCode: 76, userPublicKey: 'GBZXN7PIRZGNMHGA...' }
    })
    expect(res).toHaveProperty('proof')
    expect(res).toHaveProperty('publicSignals')
  })

  it('generateCountryProof non-match scenario', async () => {
    const res = await generateCountryProof({
      circuit: 'country_verification',
      privateInputs: { countryCode: 76 },
      publicInputs: { targetCode: 840, userPublicKey: 'GBZXN7PIRZGNMHGA...' }
    })
    expect(res).toHaveProperty('proof')
    expect(res).toHaveProperty('publicSignals')
  })

  it('setConfig and getConfig work', () => {
    setConfig({ network: 'testnet', rpcUrl: 'http://localhost:8000', verifierId: 'X', registryId: 'Y', complianceId: 'Z' })
    const cfg = getConfig()
    expect(cfg.network).toBe('testnet')
    expect(cfg.rpcUrl).toBe('http://localhost:8000')
  })

  it('hashProof handles various input shapes', () => {
    const h1 = hashProof({ proof: { a: 1 }, publicSignals: { b: 2 } })
    const h2 = hashProof({ proof: { c: 3 }, publicSignals: { d: 4 } })
    expect(h1).not.toBe(h2)
    expect(h1.length).toBeGreaterThan(0)
    expect(h2.length).toBeGreaterThan(0)
  })
})
