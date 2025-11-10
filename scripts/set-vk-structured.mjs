#!/usr/bin/env node
// Define VK estruturada (VerificationKey) usando o client gerado do contrato Verifier.
// Uso:
//   export SOROBAN_SECRET=SA... 
//   node scripts/set-vk-structured.mjs --circuit age|country|income [--contract <ID>] [--rpc <URL>]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from '@stellar/stellar-sdk'
import rpcPkg from '@stellar/stellar-sdk/rpc'
import { Client as VerifierClient } from '../packages/verifier/dist/index.js'

const { Keypair, Networks, TransactionBuilder } = pkg
const { Server } = rpcPkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { circuit: 'age', contract: '', rpc: 'https://soroban-testnet.stellar.org' }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--circuit') out.circuit = args[++i]
    else if (a === '--contract') out.contract = args[++i]
    else if (a === '--rpc') out.rpc = args[++i]
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/set-vk-structured.mjs --circuit age|country|income [--contract <ID>] [--rpc <URL>]')
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
  return {
    alpha: [toFieldBuf(vk.vk_alpha_1[0]), toFieldBuf(vk.vk_alpha_1[1]), toFieldBuf(vk.vk_alpha_1[2] || '1')],
    beta: [
      [toFieldBuf(vk.vk_beta_2[0][0]), toFieldBuf(vk.vk_beta_2[0][1])],
      [toFieldBuf(vk.vk_beta_2[1][0]), toFieldBuf(vk.vk_beta_2[1][1])],
      [toFieldBuf(vk.vk_beta_2[2][0]), toFieldBuf(vk.vk_beta_2[2][1])]
    ],
    gamma: [
      [toFieldBuf(vk.vk_gamma_2[0][0]), toFieldBuf(vk.vk_gamma_2[0][1])],
      [toFieldBuf(vk.vk_gamma_2[1][0]), toFieldBuf(vk.vk_gamma_2[1][1])],
      [toFieldBuf(vk.vk_gamma_2[2][0]), toFieldBuf(vk.vk_gamma_2[2][1])]
    ],
    delta: [
      [toFieldBuf(vk.vk_delta_2[0][0]), toFieldBuf(vk.vk_delta_2[0][1])],
      [toFieldBuf(vk.vk_delta_2[1][0]), toFieldBuf(vk.vk_delta_2[1][1])],
      [toFieldBuf(vk.vk_delta_2[2][0]), toFieldBuf(vk.vk_delta_2[2][1])]
    ],
    ic: vk.IC.map(arr => [toFieldBuf(arr[0]), toFieldBuf(arr[1]), toFieldBuf(arr[2] || '1')])
  }
}

async function main() {
  const { circuit, contract, rpc } = parseArgs()
  const secret = process.env.SOROBAN_SECRET
  if (!secret) {
    console.error('[ERR] SOROBAN_SECRET não definido. Ex: export SOROBAN_SECRET=SA...')
    process.exit(1)
  }
  const signer = Keypair.fromSecret(secret)
  console.log('[Signer]', signer.publicKey())

  // Descobrir contrato se não passado
  let contractId = contract
  if (!contractId) {
    try {
      const last = JSON.parse(fs.readFileSync(path.join(ROOT, 'deploy/last_deploy.json'), 'utf8'))
      contractId = last.contracts.verifier.id
    } catch (_) {
      console.error('[ERR] Não foi possível obter contractId. Use --contract <ID>.')
      process.exit(1)
    }
  }

  const circuitPaths = {
    age: 'circuits/artifacts/age_verification/verification_key.json',
    country: 'circuits/artifacts/country_verification/verification_key.json',
    income: 'circuits/artifacts/income_threshold/verification_key.json'
  }
  const vkPath = path.join(ROOT, circuitPaths[circuit] || circuitPaths.age)
  if (!fs.existsSync(vkPath)) {
    console.error('[ERR] verification_key.json não encontrado em', vkPath)
    process.exit(1)
  }
  const vkJson = JSON.parse(fs.readFileSync(vkPath, 'utf8'))
  const vk = vkFromJson(vkJson)

  console.log('[VK] Circuit:', circuit)
  console.log('[VK] Contract:', contractId)
  console.log('[VK] RPC:', rpc)
  console.log('[VK] Points IC:', vk.ic.length)

  // Passar publicKey para evitar uso de FakeAccount (GAAAAAAAA...) na simulação
  const client = new VerifierClient({ contractId, networkPassphrase: Networks.TESTNET, rpcUrl: rpc, publicKey: signer.publicKey() })
  const assembled = await client.set_vk_structured({ vk })
    // Debug: inspecionar propriedades retornadas na simulação
    console.log('[DEBUG] assembled keys:', Object.keys(assembled))
    // Ver seq atual da conta e seq da tx construída
    try {
      const server = new Server(rpc)
      const acct = await server.getAccount(signer.publicKey())
      console.log('[DEBUG] account sequence:', acct.sequence)
    } catch (e) {
      console.log('[WARN] getAccount falhou (conta sem saldo/nao criada?):', e?.message || e)
    }
    // Assinar diretamente XDR simulado (não chamar prepareTransaction novamente para evitar txBadSeq)
    const result = await assembled.signAndSend({
      signTransaction: async (builtTxXdr) => {
        const tx = TransactionBuilder.fromXDR(builtTxXdr, Networks.TESTNET)
        console.log('[DEBUG] tx source:', tx.source)
        console.log('[DEBUG] tx seq:', tx.sequence)
        tx.sign(signer)
        return { signedTxXdr: tx.toXDR(), signerAddress: signer.publicKey() }
      }
    })
  console.log('[OK] set_vk_structured enviado:', typeof result === 'string' ? result : JSON.stringify(result))
}

main().catch(e => { console.error('[ERR] set-vk-structured:', e); process.exit(1) })
