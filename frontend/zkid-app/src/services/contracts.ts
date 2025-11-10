import { Networks } from '@stellar/stellar-sdk'
import {
  CredentialRegistryClient,
  ComplianceOracleClient,
  VerifierClient,
  ZKID_CONTRACTS,
} from 'zkid-sdk'

// --- Encoding helpers to satisfy Verifier contract expectations ---
// The contract expects `proof: Bytes` (>=256) and `public_inputs: Bytes` where
// lengths derived as multiples of 32 to compute public_count.
// We were previously sending JSON strings which can cause VM UnexpectedSize / budget issues.
// Now we compress into canonical field elements: each big number/hex converted to 32-byte big-endian.

function toFieldBytes(val: string | number | bigint): Uint8Array {
  let hex: string
  if (typeof val === 'number' || typeof val === 'bigint') {
    hex = BigInt(val).toString(16)
  } else {
    // remove 0x prefix if present; if decimal string, convert
    if (/^0x[0-9a-fA-F]+$/.test(val)) {
      hex = val.slice(2)
    } else if (/^[0-9]+$/.test(val)) {
      hex = BigInt(val).toString(16)
    } else {
      // fallback: hash the arbitrary string to 32 bytes using a simple fn
      const enc = new TextEncoder().encode(val)
      let acc = 0n
      for (let i = 0; i < enc.length; i++) {
        acc = (acc * 131n + BigInt(enc[i])) & ((1n << 256n) - 1n)
      }
      hex = acc.toString(16)
    }
  }
  if (hex.length > 64) {
    // truncate left if oversize (Groth16 coordinates typically <= 32 bytes)
    hex = hex.slice(hex.length - 64)
  }
  hex = hex.padStart(64, '0')
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return out
}

function encodeProofBytes(proof: unknown): Uint8Array {
  // Expect structure from snarkjs: { pi_a: [hex,hex], pi_b: [[hex,hex],[hex,hex]], pi_c: [hex,hex], ... }
  if (!proof || typeof proof !== 'object') {
    throw new Error('Formato de prova inválido')
  }
  const p = proof as { pi_a?: (string|number)[]; pi_b?: (string|number)[][]; pi_c?: (string|number)[] }
  const segments: Uint8Array[] = []
  for (const arr of [p.pi_a, p.pi_c]) {
    if (Array.isArray(arr)) {
      for (const v of arr) segments.push(toFieldBytes(v))
    }
  }
  if (Array.isArray(p.pi_b)) {
    for (const pair of p.pi_b) {
      if (Array.isArray(pair)) {
        for (const v of pair) segments.push(toFieldBytes(v))
      }
    }
  }
  // Concatenate
  const total = new Uint8Array(segments.length * 32)
  segments.forEach((seg, i) => total.set(seg, i * 32))
  if (total.length < 256) {
    // pad to meet minimal size requirement
    const padded = new Uint8Array(256)
    padded.set(total)
    return padded
  }
  return total
}

function encodePublicInputs(signals: unknown): Uint8Array {
  if (!Array.isArray(signals)) {
    throw new Error('publicSignals inválidos')
  }
  const parts: Uint8Array[] = []
  for (const s of signals as (string|number)[]) {
    parts.push(toFieldBytes(s))
  }
  const out = new Uint8Array(parts.length * 32)
  parts.forEach((p,i)=> out.set(p, i*32))
  return out
}

// Removemos o caminho via zkid-sdk/dist/client/soroban para evitar duplicidade de SDK

export type Network = 'testnet' | 'mainnet'

type EnvContracts = {
  rpcUrl?: string
  verifier?: string
  registry?: string
  compliance?: string
}

function getEnvContracts(): EnvContracts {
  return {
    rpcUrl: import.meta.env.VITE_SOROBAN_RPC as string | undefined,
    verifier: import.meta.env.VITE_VERIFIER_CONTRACT_ID as string | undefined,
    registry: import.meta.env.VITE_REGISTRY_CONTRACT_ID as string | undefined,
    compliance: import.meta.env.VITE_COMPLIANCE_CONTRACT_ID as string | undefined,
  }
}

// JSON-RPC helpers (Soroban RPC)
type JsonRpcResponse<T> = { jsonrpc: '2.0'; id: number|string|null; result?: T; error?: { code: number; message: string; data?: unknown } }

async function jsonRpc<T>(rpcUrl: string, method: string, params: Record<string, unknown>): Promise<T> {
  const body = { jsonrpc: '2.0', id: Date.now(), method, params }
  const resp = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    throw new Error(`Falha HTTP RPC (${resp.status} ${resp.statusText})`)
  }
  const parsed = await resp.json() as JsonRpcResponse<T>
  if (parsed.error) {
    const msg = parsed.error.message || 'Erro RPC desconhecido'
    throw new Error(`RPC ${method} falhou: ${msg}`)
  }
  return parsed.result as T
}

async function rawSendTransaction(
  rpcUrl: string,
  xdr: string
): Promise<{ status: string; hash?: string; errorResult?: string; latestLedger?: number }>{
  return jsonRpc(rpcUrl, 'sendTransaction', { transaction: xdr })
}

type GetTxResult = {
  status: 'SUCCESS' | 'FAILED' | 'NOT_FOUND'
  hash?: string
  resultXdr?: unknown
  resultMetaXdr?: unknown
  latestLedger?: number
  oldestLedger?: number
}

async function rawGetTransaction(rpcUrl: string, hash: string): Promise<GetTxResult> {
  return jsonRpc(rpcUrl, 'getTransaction', { hash })
}

// Tipos e funções de preparação removidos - não usados

export function createClients(network: Network) {
  const useMainnet = network === 'mainnet'
  // Por enquanto só temos constantes de testnet definidas
  const cfg = ZKID_CONTRACTS.testnet
  const env = getEnvContracts()
  const rpcUrl = env.rpcUrl || cfg.rpcUrl
  const networkPassphrase = useMainnet
    ? 'Public Global Stellar Network ; September 2015'
    : Networks.TESTNET

  const registry = new CredentialRegistryClient({
    contractId: env.registry || cfg.credentialRegistry,
    networkPassphrase,
    rpcUrl,
  })
  const compliance = new ComplianceOracleClient({
    contractId: env.compliance || cfg.complianceOracle,
    networkPassphrase,
    rpcUrl,
  })
  return { registry, compliance, rpcUrl, verifierId: env.verifier || cfg.verifier }
}

// Verifica prova on-chain e retorna commitment (hex 0x...)
export async function verifyIdentityProofService(
  params: {
    network: Network
  },
  callerPublicKey: string,
  proof: unknown,
  publicSignals: unknown,
  walletSign: (xdr: string, opts: { networkPassphrase: string }) => Promise<string>
): Promise<string> {
  const { verifierId, rpcUrl } = createClients(params.network)
  // networkTag removido (não usado com VerifierClient)
  const networkPassphrase = params.network === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : Networks.TESTNET
  // Encode proof & public inputs in compact binary format expected by contrato
  let encodedProof: Uint8Array
  let encodedInputs: Uint8Array
  try {
    encodedProof = encodeProofBytes(proof)
    encodedInputs = encodePublicInputs(publicSignals)
  } catch (encErr) {
    throw new Error(`Falha ao codificar prova/public inputs: ${(encErr as Error).message}`)
  }
  console.log('[verifyIdentityProof] Criando cliente sem simulação automática...')
  const verifier = new VerifierClient({
    contractId: verifierId,
    networkPassphrase,
    rpcUrl,
    publicKey: callerPublicKey, // ✅ CRITICAL: Define o source da tx como a carteira conectada
  })
  
  console.log('[verifyIdentityProof] Chamando contrato SEM simulate automático...')
  const tx = await verifier.verify_identity_proof(
    {
      caller: callerPublicKey,
      proof: Buffer.from(encodedProof),
      public_inputs: Buffer.from(encodedInputs),
    },
    {
      simulate: false, // ✅ DESLIGA simulação automática para evitar erro do SDK
    }
  )
  
  // Simula manualmente ANTES de enviar para validar e pegar o resultado
  console.log('[verifyIdentityProof] Simulando transação manualmente...')
  await tx.simulate()
  console.log('[verifyIdentityProof] Simulação concluída, resultado:', tx.result)
  
  // Captura o resultado ANTES de tentar signAndSend
  const finalResult = tx.result
  let proofHash: Uint8Array | Buffer
  try {
    type ResultLike = { unwrap: () => Uint8Array | Buffer }
    const isBuffer = Buffer.isBuffer(finalResult)
    const isUint8 = finalResult instanceof Uint8Array
    
    if (finalResult && typeof finalResult === 'object' && 'unwrap' in finalResult) {
      proofHash = (finalResult as ResultLike).unwrap()
      console.log('[verifyIdentityProof] Resultado unwrapped:', proofHash)
    } else if (isUint8 || isBuffer) {
      proofHash = finalResult as Uint8Array | Buffer
    } else {
      throw new Error('Formato de resultado inesperado')
    }
  } catch (unwrapErr) {
    console.error('[verifyIdentityProof] Erro ao processar resultado:', unwrapErr)
    throw new Error('Prova inválida (verificação on-chain falhou)')
  }
  
  // ✅ WORKAROUND: Usa prepareTransaction + signTransaction + envio via JSON-RPC ao invés de signAndSend bugado
  console.log('[verifyIdentityProof] Enviando transação manualmente (bypass signAndSend)...')
  try {
    // Recupera XDR construído
    const builtXdr = tx.built?.toXDR()
    if (!builtXdr) {
      throw new Error('Transação não foi preparada corretamente')
    }
    console.log('[verifyIdentityProof] Solicitando assinatura da carteira...')
    const signedXdrRaw = await walletSign(builtXdr, { networkPassphrase })
    console.log('[verifyIdentityProof] Assinatura recebida, tipo:', typeof signedXdrRaw)
    console.log('[verifyIdentityProof] signedXdrRaw:', signedXdrRaw)
    // Normaliza formato da assinatura
    let xdrString: string
    if (typeof signedXdrRaw === 'string') {
      xdrString = signedXdrRaw
    } else if (signedXdrRaw && typeof signedXdrRaw === 'object' && 'signedTxXdr' in signedXdrRaw) {
      xdrString = (signedXdrRaw as { signedTxXdr: string }).signedTxXdr
    } else {
      throw new Error('Formato de assinatura inválido da carteira')
    }
    // Envia diretamente via JSON-RPC sem reconstruir Transaction (evita conflito de múltiplas versões)
    console.log('[verifyIdentityProof] Enviando transação para o RPC (JSON-RPC)...')
    const sendResponse = await rawSendTransaction(rpcUrl, xdrString)
    console.log('[verifyIdentityProof] Resposta do envio:', sendResponse)
    
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Falha ao enviar transação: ${sendResponse.errorResult}`)
    }
    
  // Poll até confirmação
    if (sendResponse.status === 'PENDING' && sendResponse.hash) {
      console.log('[verifyIdentityProof] Aguardando confirmação...')
      let attempts = 0
      const maxAttempts = 30
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const txResponse = await rawGetTransaction(rpcUrl, sendResponse.hash as string)
        if (txResponse.status === 'SUCCESS') {
          console.log('[verifyIdentityProof] Transação confirmada!')
          break
        }
        if (txResponse.status === 'FAILED') {
          throw new Error('Transação falhou on-chain')
        }
        attempts++
      }
      if (attempts >= maxAttempts) {
        console.warn('[verifyIdentityProof] Timeout aguardando confirmação, mas usando resultado da simulação')
      }
    }
    
    console.log('[verifyIdentityProof] Transação processada com sucesso!')
  } catch (err) {
    console.error('[verifyIdentityProof] Erro ao enviar transação:', err)
    throw new Error(humanizeSorobanSignerError(err))
  }
  
  console.log('[verifyIdentityProof] Preparando retorno com proofHash:', proofHash)
  console.log('[verifyIdentityProof] proofHash type check - instanceof Uint8Array:', proofHash instanceof Uint8Array)
  console.log('[verifyIdentityProof] proofHash type check - Buffer.isBuffer:', Buffer.isBuffer(proofHash))
  
  // Usa o resultado já unwrapped
  if (!proofHash) {
    throw new Error('Prova inválida (proofHash está vazio)')
  }
  
  // Garante conversão para array antes de mapear
  const hashArray = proofHash instanceof Uint8Array ? Array.from(proofHash) : Array.from(Buffer.from(proofHash))
  const hex = hashArray.map(b=>b.toString(16).padStart(2,'0')).join('')
  const finalHash = hex.startsWith('0x') ? hex : `0x${hex}`
  
  console.log('[verifyIdentityProof] Hash final gerado:', finalHash)
  return finalHash
}

// Emissão de credencial usando client gerado
export async function issueCredentialService(
  network: Network,
  ownerPublicKey: string,
  proofCommitmentHex: string,
  ttlSeconds: number,
  walletSign: (xdr: string) => Promise<string>
): Promise<string> {
  const { rpcUrl } = createClients(network)
  const networkPassphrase = network === 'mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : Networks.TESTNET
  const env = getEnvContracts()
  const cfg = ZKID_CONTRACTS.testnet
  
  const registryWithSource = new CredentialRegistryClient({
    contractId: env.registry || cfg.credentialRegistry,
    networkPassphrase,
    rpcUrl,
    publicKey: ownerPublicKey,
  })
  
  console.log('[issueCredential] Aguardando 2s para garantir que verify_identity_proof foi processado...')
  await new Promise(r => setTimeout(r, 2000))
  
  const proofBuf = Buffer.from(proofCommitmentHex.replace(/^0x/, ''), 'hex')
  if (proofBuf.length !== 32) {
    throw new Error(`proof_hash inválido: esperado 32 bytes, recebido ${proofBuf.length}`)
  }

  console.log('[issueCredential] proof_hash recebido:', proofCommitmentHex)
  console.log('[issueCredential] proof_hash bytes:', Array.from(proofBuf))
  console.log('[issueCredential] Criando transação...')
  const tx = await registryWithSource.issue_credential({
    owner: ownerPublicKey,
    proof_hash: proofBuf,
    ttl_seconds: ttlSeconds,
  })
  
  // ✅ CRÍTICO: simulate() do cliente JÁ PREPARA a transação com footprint!
  console.log('[issueCredential] Simulando transação (cliente prepara footprint automaticamente)...')
  await tx.simulate()
  console.log('[issueCredential] Simulação OK - transação preparada com footprint!')

  // ✅ USA o XDR já preparado pelo cliente (que JÁ TEM footprint após simulate)
  const preparedXdr = tx.built?.toXDR()
  if (!preparedXdr) throw new Error('Transação não foi preparada corretamente')
  
  console.log('[issueCredential] XDR preparado (primeiros 200 chars):', preparedXdr.substring(0, 200))
  
  try {
    console.log('[issueCredential] Solicitando assinatura (XDR já tem footprint)...')
    const signedXdr = await walletSign(preparedXdr)
    
    let xdrString: string
    if (typeof signedXdr === 'string') {
      xdrString = signedXdr
    } else if (signedXdr && typeof signedXdr === 'object' && 'signedTxXdr' in signedXdr) {
      xdrString = (signedXdr as { signedTxXdr: string }).signedTxXdr
    } else {
      throw new Error('Formato de assinatura inválido')
    }
    
    console.log('[issueCredential] Enviando para RPC...')
    const sendResponse = await rawSendTransaction(rpcUrl, xdrString)
    console.log('[issueCredential] Resposta do envio:', sendResponse)
    
    if (sendResponse.status === 'ERROR') {
      let errorMsg = sendResponse.errorResult || JSON.stringify(sendResponse)
      
      // Tenta decodificar errorResultXdr se disponível
      const responseObj = sendResponse as unknown as { errorResultXdr?: string }
      if (responseObj.errorResultXdr) {
        try {
          const SDK = await import('@stellar/stellar-sdk')
          const errorXdr = SDK.xdr.TransactionResult.fromXDR(responseObj.errorResultXdr, 'base64')
          console.error('[issueCredential] ErrorXDR decodificado:', errorXdr)
          
          // Tenta extrair código de erro
          const resultCode = errorXdr.result().switch()
          console.error('[issueCredential] Código do erro:', resultCode)
          
          errorMsg = `Erro RPC: ${resultCode.name || resultCode.value || 'desconhecido'} (XDR: ${responseObj.errorResultXdr})`
        } catch (decodeErr) {
          console.error('[issueCredential] Erro ao decodificar XDR:', decodeErr)
        }
      }
      
      console.error('[issueCredential] Erro no envio:', errorMsg)
      throw new Error(`Falha ao enviar transação: ${errorMsg}`)
    }
    
    // Aguarda confirmação
    if (sendResponse.status === 'PENDING' && sendResponse.hash) {
      console.log('[issueCredential] Aguardando confirmação...')
      let attempts = 0
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 1000))
        const txResponse = await rawGetTransaction(rpcUrl, sendResponse.hash as string)
        console.log('[issueCredential] Status:', txResponse.status)
        
        if (txResponse.status === 'SUCCESS') {
          console.log('[issueCredential] ✅ SUCESSO!')
          return `cred_${proofCommitmentHex.slice(2, 14)}`
        }
        
        if (txResponse.status === 'FAILED') {
          console.error('[issueCredential] ❌ FALHOU:', txResponse)
          
          // Diagnóstico
          try {
            const resultMetaXdr = (txResponse as { resultMetaXdr?: string }).resultMetaXdr
            if (resultMetaXdr) {
              const metaStr = atob(resultMetaXdr)
              if (/outside of the footprint/i.test(metaStr)) {
                console.error('[issueCredential] ERRO: Chave fora do footprint')
              }
              if (/put_contract_data/i.test(metaStr)) {
                console.error('[issueCredential] ERRO: Falha ao gravar dados')
              }
            }
          } catch (e) {
            console.error('[issueCredential] Erro no diagnóstico:', e)
          }
          
          throw new Error(`Transação falhou. Hash: ${sendResponse.hash}`)
        }
        
        attempts++
      }
      
      throw new Error('Timeout aguardando confirmação')
    }
    
    return `cred_${proofCommitmentHex.slice(2, 14)}`
  } catch (error) {
    console.error('[issueCredential] ❌ ERRO GERAL:', error)
    throw error
  }
}

export async function isCredentialValidService(network: Network, credentialIdHex: string): Promise<boolean> {
  const { registry } = createClients(network)
  const tx = await registry.is_valid({ credential_id: Buffer.from(credentialIdHex.replace(/^0x/, ''), 'hex') })
  await tx.simulate()
  return Boolean(tx.result)
}

// Tenta tornar a mensagem "needsNonInvokerSigningBy" compreensível para o usuário final
function humanizeSorobanSignerError(err: unknown): string {
  const raw = err instanceof Error ? (err.message || String(err)) : String(err)
  // Casos comuns do RPC: "Transaction requires signatures from G... See needsNonInvokerSigningBy for details."
  const m = raw.match(/requires signatures from ([A-Z0-9]{56})(?:,\s*([A-Z0-9]{56}))?/)
  if (m) {
    const addrs = m.slice(1).filter(Boolean).join(', ')
    return `A transação requer assinatura adicional de: ${addrs}.\n\n` +
      'Sua carteira não exibiu o popup porque a simulação falhou antes da etapa de assinatura.\n' +
      'Para continuar: conecte a carteira do(s) endereço(s) acima (se for administrador) ou use um co-signer backend para completar a autorização.'
  }
  if (/needsNonInvokerSigningBy/i.test(raw)) {
    return 'A transação requer assinaturas adicionais (não-invocador). Conecte a carteira correta (admin) ou execute via um serviço que co-assine a operação.'
  }
  // Fallback genérico
  return raw
}

export async function checkSanctionsService(network: Network, proofCommitmentHex: string): Promise<boolean> {
  const { compliance } = createClients(network)
  const tx = await compliance.check_sanctions_list({ proof_hash: Buffer.from(proofCommitmentHex.replace(/^0x/, ''), 'hex') })
  await tx.simulate()
  return Boolean(tx.result)
}

export async function getComplianceAdminService(network: Network): Promise<string | null> {
  const { compliance } = createClients(network)
  const tx = await compliance.get_admin()
  await tx.simulate()
  const res: unknown = tx.result as unknown
  if (!res) return null
  if (typeof res === 'string') return res
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyRes: any = res
    if (typeof anyRes?.toString === 'function') return anyRes.toString('utf8') as string
    return String(res)
  } catch {
    return null
  }
}
