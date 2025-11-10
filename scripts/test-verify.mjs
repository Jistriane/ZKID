// Simple CLI to call verify_identity_proof using SDK with a local signer
// Usage:
//   ZKID_TEST_SECRET=SA... node scripts/test-verify.mjs [age|income|country]
//   or provide ZKID_TEST_PUBLIC_KEY to only simulate (no signing) — will fail when sending

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk'
import { Server } from '@stellar/stellar-sdk/rpc'

// Prefer using built SDK build output to avoid TS compile in CLI context
import { setConfig } from '../sdk/zkid-sdk/dist/index.js'
import { verifyIdentityProof } from '../sdk/zkid-sdk/dist/client/soroban.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve proof artifacts dir based on selected circuit
const circuit = (process.argv[2] || 'age').toLowerCase()
const CIRCUIT_MAP = {
  age: 'age_verification',
  income: 'income_threshold',
  country: 'country_verification',
}
if (!CIRCUIT_MAP[circuit]) {
  console.error(`Circuito inválido: ${circuit}. Use: age | income | country`)
  process.exit(1)
}

// Env configuration
let TEST_SECRET = process.env.ZKID_TEST_SECRET || ''
let TEST_PUBLIC = process.env.ZKID_TEST_PUBLIC_KEY || (TEST_SECRET ? Keypair.fromSecret(TEST_SECRET).publicKey() : '')

// Auto-generate ephemeral key for testnet if none provided
if (!TEST_PUBLIC) {
  const kp = Keypair.random()
  TEST_SECRET = kp.secret()
  TEST_PUBLIC = kp.publicKey()
  console.log('[verify] Gerando chave efêmera para teste:', TEST_PUBLIC)
  console.log('[verify] SECRET (não persista em produção):', TEST_SECRET)
}

async function readJson(p) {
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw)
}

async function loadDeployInfo() {
  // Prefer deploy/last_deploy.json for contract IDs and network
  const deployPath = path.resolve(__dirname, '../deploy/last_deploy.json')
  try {
    const d = await readJson(deployPath)
    return {
      rpcUrl: d.rpcUrl || 'https://soroban-testnet.stellar.org',
      networkPassphrase: d.networkPassphrase || Networks.TESTNET,
      verifierId: d.contracts?.verifier?.id,
      registryId: d.contracts?.credential_registry?.id,
      complianceId: d.contracts?.compliance_oracle?.id,
    }
  } catch (e) {
    // Fallback to known testnet constants
    return {
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: Networks.TESTNET,
      verifierId: process.env.ZKID_VERIFIER_ID || '',
      registryId: process.env.ZKID_REGISTRY_ID || '',
      complianceId: process.env.ZKID_COMPLIANCE_ID || '',
    }
  }
}

async function main() {
  const deploy = await loadDeployInfo()
  if (!deploy.verifierId) {
    console.error('ID do contrato Verifier não encontrado. Configure deploy/last_deploy.json ou variáveis ZKID_VERIFIER_ID/...')
    process.exit(1)
  }

  // Configure SDK
  setConfig({
    network: 'testnet',
    rpcUrl: deploy.rpcUrl,
    verifierId: deploy.verifierId,
    registryId: deploy.registryId || 'C'.padEnd(56, 'X'),
    complianceId: deploy.complianceId || 'C'.padEnd(56, 'X'),
    simulationSource: TEST_PUBLIC,
    signTransaction: async (xdr, { networkPassphrase }) => {
      if (!TEST_SECRET) throw new Error('Sem ZKID_TEST_SECRET para assinar transação')
      const kp = Keypair.fromSecret(TEST_SECRET)
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase)
      tx.sign(kp)
      return tx.toXDR()
    },
  })

  // Load artifacts
  const artifactsDir = process.env.ZKID_PROOF_DIR
    || path.resolve(__dirname, `../circuits/artifacts/${CIRCUIT_MAP[circuit]}`)
  const proofPath = path.join(artifactsDir, 'proof_example.json')
  const pubPath = path.join(artifactsDir, 'public_signals_example.json')
  const [proof, publicSignals] = await Promise.all([
    readJson(proofPath),
    readJson(pubPath),
  ])

  // Quick sanity logs
  console.log('[verify] usando circuito:', CIRCUIT_MAP[circuit])
  console.log('[verify] conta (caller):', TEST_PUBLIC)
  console.log('[verify] contrato Verifier:', deploy.verifierId)

  // RPC readiness / ensure account exists (auto-fund via friendbot if testnet)
  const server = new Server(deploy.rpcUrl)
  try {
    await server.getAccount(TEST_PUBLIC)
  } catch (e) {
    if (deploy.networkPassphrase === Networks.TESTNET && TEST_SECRET) {
      console.log('[verify] Conta não encontrada. Tentando fundear via Friendbot...')
      try {
        const res = await fetch(`https://friendbot.stellar.org?addr=${TEST_PUBLIC}`)
        if (!res.ok) throw new Error(`Friendbot status ${res.status}`)
        await res.json()
        console.log('[verify] Friendbot sucesso. Recarregando conta.')
        await server.getAccount(TEST_PUBLIC)
      } catch (fbErr) {
        console.warn('[verify] Friendbot falhou:', fbErr)
        throw e
      }
    } else {
      console.warn('[verify] Conta não encontrada e sem secret para fundear.')
      throw e
    }
  }

  const commitment = await verifyIdentityProof(
    // @ts-expect-error using built artifacts config inline for simplicity
    { network: 'testnet', rpcUrl: deploy.rpcUrl, verifierId: deploy.verifierId, registryId: '', complianceId: '', simulationSource: TEST_PUBLIC, signTransaction: async (xdr, opts) => {
      if (!TEST_SECRET) throw new Error('Sem ZKID_TEST_SECRET')
      const kp = Keypair.fromSecret(TEST_SECRET)
      const tx = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase)
      tx.sign(kp)
      return tx.toXDR()
    } },
    { callerPublicKey: TEST_PUBLIC, proof, publicSignals }
  )

  if (!commitment) {
    console.error('[verify] Falha ou prova inválida (commitment nulo). Verifique logs do contrato e o formato de prova/inputs.')
    process.exit(2)
  }

  console.log('[verify] Commitment (hex):', commitment)
  console.log('\nPróximo passo opcional: emitir credencial no Registry com este commitment (hash).')
}

main().catch((e) => {
  console.error('[verify] erro inesperado:', e)
  process.exit(99)
})
