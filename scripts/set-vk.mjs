#!/usr/bin/env node
// Set Verification Key (VK) on Verifier contract from a verification_key.json
// Usage:
//   SOROBAN_SECRET=S... node scripts/set-vk.mjs --circuit age|country|income [--contract <ID>] [--rpc <URL>] [--passphrase <STR>]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Buffer } from 'buffer'
import stellarPkg from '@stellar/stellar-sdk'
const { Keypair, Networks, TransactionBuilder, Contract, xdr } = stellarPkg
// RPC Server está em submódulo rpc
import rpcPkg from '@stellar/stellar-sdk/rpc'
const { Server } = rpcPkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { circuit: 'age', contract: '', rpc: '', passphrase: '', vkPath: '' }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--circuit') out.circuit = args[++i]
    else if (a === '--contract') out.contract = args[++i]
    else if (a === '--rpc') out.rpc = args[++i]
    else if (a === '--passphrase') out.passphrase = args[++i]
    else if (a === '--vk') out.vkPath = args[++i]
    else if (a === '--help' || a === '-h') {
      console.log('Usage: SOROBAN_SECRET=S... node scripts/set-vk.mjs --circuit age|country|income [--contract <ID>] [--rpc <URL>] [--passphrase <STR>] [--vk <path>]')
      process.exit(0)
    }
  }
  return out
}

function toFieldBuf(x) {
  let hex
  if (typeof x === 'number' || typeof x === 'bigint') hex = BigInt(x).toString(16)
  else if (typeof x === 'string') hex = x.startsWith('0x') ? x.slice(2) : (/^[0-9]+$/.test(x) ? BigInt(x).toString(16) : Buffer.from(x, 'utf8').toString('hex'))
  else hex = '0'
  if (hex.length > 64) hex = hex.slice(hex.length - 64)
  hex = hex.padStart(64, '0')
  return Buffer.from(hex, 'hex')
}

function vkFromJson(vk) {
  // Map snarkjs verification_key.json to contract VerificationKey type
  const alpha = [toFieldBuf(vk.vk_alpha_1[0]), toFieldBuf(vk.vk_alpha_1[1]), toFieldBuf(vk.vk_alpha_1[2] || '1')]
  const beta = [
    [toFieldBuf(vk.vk_beta_2[0][0]), toFieldBuf(vk.vk_beta_2[0][1])],
    [toFieldBuf(vk.vk_beta_2[1][0]), toFieldBuf(vk.vk_beta_2[1][1])],
    [toFieldBuf(vk.vk_beta_2[2][0]), toFieldBuf(vk.vk_beta_2[2][1])]
  ]
  const gamma = [
    [toFieldBuf(vk.vk_gamma_2[0][0]), toFieldBuf(vk.vk_gamma_2[0][1])],
    [toFieldBuf(vk.vk_gamma_2[1][0]), toFieldBuf(vk.vk_gamma_2[1][1])],
    [toFieldBuf(vk.vk_gamma_2[2][0]), toFieldBuf(vk.vk_gamma_2[2][1])]
  ]
  const delta = [
    [toFieldBuf(vk.vk_delta_2[0][0]), toFieldBuf(vk.vk_delta_2[0][1])],
    [toFieldBuf(vk.vk_delta_2[1][0]), toFieldBuf(vk.vk_delta_2[1][1])],
    [toFieldBuf(vk.vk_delta_2[2][0]), toFieldBuf(vk.vk_delta_2[2][1])]
  ]
  const ic = vk.IC.map(arr => [toFieldBuf(arr[0]), toFieldBuf(arr[1]), toFieldBuf(arr[2] || '1')])
  return { alpha, beta, gamma, delta, ic }
}

async function main() {
  const { circuit, contract: contractArg, rpc, passphrase, vkPath } = parseArgs()
  const secret = process.env.SOROBAN_SECRET
  if (!secret) {
    console.error('[ERR] SOROBAN_SECRET não definido. Ex: export SOROBAN_SECRET=S...')
    process.exit(1)
  }
  const keypair = Keypair.fromSecret(secret)
  console.log('[Signer]', keypair.publicKey())

  // Resolve verification_key.json path
  const map = {
    age: path.join(PROJECT_ROOT, 'circuits/artifacts/age_verification/verification_key.json'),
    country: path.join(PROJECT_ROOT, 'circuits/artifacts/country_verification/verification_key.json'),
    income: path.join(PROJECT_ROOT, 'circuits/artifacts/income_threshold/verification_key.json')
  }
  const vkFile = vkPath || map[circuit] || map.age
  if (!fs.existsSync(vkFile)) {
    console.error('[ERR] verification_key.json não encontrado em', vkFile)
    process.exit(1)
  }
  const vkJson = JSON.parse(fs.readFileSync(vkFile, 'utf8'))
  const vk = vkFromJson(vkJson)

  // Infer contract/rpc/passphrase
  let contractId = contractArg
  if (!contractId) {
    try {
      const last = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'deploy/last_deploy.json'), 'utf8'))
      contractId = last.contracts.verifier.id
    } catch (_) {
      contractId = contractId || ''
    }
  }
  const rpcUrl = rpc || 'https://soroban-testnet.stellar.org'
  const networkPassphrase = passphrase || Networks.TESTNET

  console.log('[VK] Circuit:', circuit)
  console.log('[VK] Contract:', contractId)
  console.log('[VK] RPC:', rpcUrl)

  // Construir manualmente ScVals
  const toScValBuf = (b) => xdr.ScVal.scvBytes(b)
  const scAlpha = xdr.ScVal.scvVec(vk.alpha.map(toScValBuf))
  const scBeta = xdr.ScVal.scvVec(vk.beta.map(pair => xdr.ScVal.scvVec(pair.map(toScValBuf))))
  const scGamma = xdr.ScVal.scvVec(vk.gamma.map(pair => xdr.ScVal.scvVec(pair.map(toScValBuf))))
  const scDelta = xdr.ScVal.scvVec(vk.delta.map(pair => xdr.ScVal.scvVec(pair.map(toScValBuf))))
  const scIc = xdr.ScVal.scvVec(vk.ic.map(arr => xdr.ScVal.scvVec(arr.map(toScValBuf))))
  // Formato simplificado: map { alpha:Vec<Bytes>, beta:Vec<Vec<Bytes>>, ... }
  const scVk = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('alpha'), value: scAlpha }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('beta'), value: scBeta }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('gamma'), value: scGamma }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('delta'), value: scDelta }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol('ic'), value: scIc })
  ])

  const server = new Server(rpcUrl)
  const sourceAccount = await server.getAccount(keypair.publicKey())
  const fee = '1000'
  const contractClient = new Contract(contractId)
  const tx = new TransactionBuilder(sourceAccount, { fee, networkPassphrase })
    .addOperation(contractClient.call('set_verification_key', scVk))
    .setTimeout(180)
    .build()
  tx.sign(keypair)
  const prepared = await server.prepareTransaction(tx)
  prepared.sign(keypair) // may re-sign after prepare
  const sendResp = await server.sendTransaction(prepared)
  console.log('[TX] sent status:', sendResp.status)
  if (sendResp.status !== 'PENDING' && sendResp.status !== 'SUCCESS') {
    console.error('[ERR] Falha ao enviar transação:', sendResp)
    process.exit(1)
  }
  // Poll for completion
  let hash = sendResp.hash
  const timeoutAt = Date.now() + 60_000
  while (Date.now() < timeoutAt) {
    const res = await server.getTransaction(hash)
    if (res.status === 'SUCCESS') {
      console.log('[OK] VK definida com sucesso. Hash:', hash)
      process.exit(0)
    }
    if (res.status === 'FAILED') {
      console.error('[ERR] Transação falhou:', res)
      process.exit(1)
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  console.warn('[WARN] Timeout aguardando confirmação. Verifique no explorer com o hash acima.')
}

main().catch((e) => {
  console.error('[ERR] set-vk:', e)
  process.exit(1)
})
