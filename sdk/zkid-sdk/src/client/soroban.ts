import type { ZkidConfig } from '..'
import { Buffer } from 'buffer'
// Unificar instâncias do Stellar SDK entre frontend e SDK para evitar erro
// "TypeError: expected a 'Transaction', got: [object Object]" causado por duplicidade de módulos.
import * as StellarSdk from '@stellar/stellar-sdk'
import { Server, Api } from '@stellar/stellar-sdk/rpc'

export type VerifyRequest = {
  callerPublicKey: string
  proof: unknown
  publicSignals: unknown
}

export type IssueRequest = {
  ownerPublicKey: string // chave pública da conta Stellar que será o owner
  proofHash: string
  ttlSeconds: number
}

// Integração completa com Soroban RPC
// Chama o contrato Verifier.verify_identity_proof e retorna o commitment (hex) produzido on-chain
export async function verifyIdentityProof(cfg: ZkidConfig, req: VerifyRequest): Promise<string | null> {
  if (!cfg.verifierId) throw new Error('verifierId não configurado')
  try {
    const server = new Server(cfg.rpcUrl)
    const enc = new TextEncoder()
    const passphrase: string = cfg.network === 'public' ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
    const sourcePub = req.callerPublicKey
    if (!sourcePub) throw new Error('callerPublicKey ausente')
    const proofRaw = _zkid_toProofBytes(req.proof, enc)
    const inputsRaw = _zkid_encodeSignals(req.publicSignals, enc)
    const proofBytes = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(proofRaw))
    const publicBytes = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(inputsRaw))

    // Account source deve existir
    const sourceAccount = await server.getAccount(sourcePub)
    const contract = new StellarSdk.Contract(cfg.verifierId)
    const builtTx = new StellarSdk.TransactionBuilder(sourceAccount, { fee: StellarSdk.BASE_FEE, networkPassphrase: passphrase })
      .addOperation(contract.call('verify_identity_proof', new StellarSdk.Address(req.callerPublicKey).toScVal(), proofBytes, publicBytes))
      .setTimeout(180)
      .build()

    // Em ambientes bundlados pode haver múltiplas cópias do SDK; valida por shape
    type TxLike = { toXDR: () => string }
    const tx: StellarSdk.Transaction = ('toXDR' in builtTx)
      ? (builtTx as unknown as StellarSdk.Transaction)
      : (StellarSdk.TransactionBuilder.fromXDR((builtTx as unknown as TxLike).toXDR(), passphrase) as unknown as StellarSdk.Transaction)

    if (!cfg.signTransaction) throw new Error('signTransaction não configurado (carteira não conectada)')
    const prepared = await server.prepareTransaction(tx)
    const signedXdr = await cfg.signTransaction(prepared.toXDR(), { networkPassphrase: passphrase })
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, passphrase)
    const sent = await server.sendTransaction(signedTx)
    if (sent.status === 'ERROR') return null

    // Poll até obter SUCCESS
    let txResult = await server.getTransaction(sent.hash)
    while (txResult.status === Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise(r => setTimeout(r, 1000))
      txResult = await server.getTransaction(sent.hash)
    }
    if (txResult.status !== Api.GetTransactionStatus.SUCCESS) return null

    // Extrair returnValue
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scValToNative: ((v: unknown) => unknown) | undefined = (StellarSdk as any).scValToNative
      const raw = (txResult as { returnValue?: unknown }).returnValue
      if (!raw) return null
      const native = scValToNative ? scValToNative(raw) : undefined
      if (native && (native instanceof Uint8Array || Buffer.isBuffer(native))) {
        return bytesToHex(native as Uint8Array)
      }
    } catch (extractErr) {
      console.debug('[soroban] verifyIdentityProof retorno não extraído:', extractErr)
    }
    return null
  } catch (e) {
    console.warn('[soroban] verifyIdentityProof error:', e)
    return null
  }
}

// Helpers movidos para o escopo de módulo para evitar alertas de lint de funções internas.
function _zkid_toProofBytes(val: unknown, enc: TextEncoder): Uint8Array {
  if (val instanceof Uint8Array) return val
  if (Buffer.isBuffer(val)) return new Uint8Array(val)
  if (val && typeof val === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = val
    if (p.pi_a && p.pi_b && p.pi_c) {
      const segs: Uint8Array[] = []
      const toField = (x: string | number | bigint): Uint8Array => {
        let hex: string
        if (typeof x === 'number' || typeof x === 'bigint') hex = BigInt(x).toString(16)
        else if (typeof x === 'string') {
          hex = x.startsWith('0x') ? x.slice(2) : (/^[0-9]+$/.test(x) ? BigInt(x).toString(16) : Buffer.from(enc.encode(x)).toString('hex'))
        } else hex = '0'
        if (hex.length > 64) hex = hex.slice(hex.length - 64)
        hex = hex.padStart(64, '0')
        const out = new Uint8Array(32)
        for (let i = 0; i < 32; i++) out[i] = parseInt(hex.substr(i*2,2),16)
        return out
      }
      for (const arr of [p.pi_a, p.pi_c]) if (Array.isArray(arr)) for (const v of arr) segs.push(toField(v))
      if (Array.isArray(p.pi_b)) for (const pair of p.pi_b) if (Array.isArray(pair)) for (const v of pair) segs.push(toField(v))
      const total = new Uint8Array(segs.length * 32)
      segs.forEach((s,i)=> total.set(s, i*32))
      if (total.length < 256) { // padding mínima
        const pad = new Uint8Array(256)
        pad.set(total)
        return pad
      }
      return total
    }
  }
  return enc.encode(JSON.stringify(val))
}

function _zkid_encodeSignals(sig: unknown, enc: TextEncoder): Uint8Array {
  if (sig instanceof Uint8Array) return sig
  if (Buffer.isBuffer(sig)) return new Uint8Array(sig)
  if (Array.isArray(sig)) {
    const parts: Uint8Array[] = []
    for (const s of sig as (string|number|bigint)[]) {
      let hex: string
      if (typeof s === 'number' || typeof s === 'bigint') hex = BigInt(s).toString(16)
      else if (typeof s === 'string') hex = s.startsWith('0x') ? s.slice(2) : (/^[0-9]+$/.test(s) ? BigInt(s).toString(16) : Buffer.from(enc.encode(s)).toString('hex'))
      else hex = '0'
      if (hex.length > 64) hex = hex.slice(hex.length - 64)
      hex = hex.padStart(64,'0')
      const b = new Uint8Array(32)
      for (let i=0;i<32;i++) b[i]=parseInt(hex.substr(i*2,2),16)
      parts.push(b)
    }
    const out = new Uint8Array(parts.length*32)
    parts.forEach((p,i)=> out.set(p,i*32))
    return out
  }
  return enc.encode(JSON.stringify(sig))
}

export async function issueCredential(cfg: ZkidConfig, req: IssueRequest): Promise<string> {
  if (!cfg.registryId) throw new Error('registryId não configurado')
  if (!cfg.signTransaction) throw new Error('signTransaction não configurado (carteira não conectada)')
  
  try {
    const [StellarSdk, rpc] = await Promise.all([
      import('@stellar/stellar-sdk'),
      import('@stellar/stellar-sdk/rpc')
    ])
    const server = new (rpc as typeof import('@stellar/stellar-sdk/rpc')).Server(cfg.rpcUrl)
  const passphrase: string = cfg.network === 'public' ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
    
  // Construir parâmetros ScVal
  const ownerAddress = new StellarSdk.Address(req.ownerPublicKey)
  const proofHashBytes = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(hexToBytes(req.proofHash)))
    const ttlU32 = StellarSdk.xdr.ScVal.scvU32(req.ttlSeconds)
    
  // Buscar conta source = própria conta do usuário
  const sourceAccount = await server.getAccount(req.ownerPublicKey)
    
    // Construir transaction
    const contract = new StellarSdk.Contract(cfg.registryId)
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: passphrase
    })
      .addOperation(
        contract.call(
          'issue_credential',
          ownerAddress.toScVal(),
          proofHashBytes,
          ttlU32
        )
      )
      .setTimeout(180)
      .build()
    
    // Preparar transaction (obter footprint e auth)
    const prepared = await server.prepareTransaction(tx)

    // Assinatura com carteira conectada (obrigatória)
    const signedXdr = await cfg.signTransaction(prepared.toXDR(), { networkPassphrase: passphrase })
    // TransactionBuilder.fromXDR retorna Transaction | FeeBumpTransaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, passphrase)
    
    // Submeter transaction
    const sendResponse = await server.sendTransaction(signedTx)
    
  if (sendResponse.status === 'PENDING') {
      // Poll até transaction ser confirmada
      let getResponse = await server.getTransaction(sendResponse.hash)
      while (getResponse.status === (rpc as typeof import('@stellar/stellar-sdk/rpc')).Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        getResponse = await server.getTransaction(sendResponse.hash)
      }
      
      if (getResponse.status === (rpc as typeof import('@stellar/stellar-sdk/rpc')).Api.GetTransactionStatus.SUCCESS) {
        // Tentar extrair retorno; caso contrário, usa fallback sintético
        try {
          // retorno não tipado; manter como unknown
          const resultVal: unknown = (getResponse as { returnValue?: unknown }).returnValue
          if (resultVal) {
            // Preferir helper scValToNative quando disponível
            const scValToNative: ((v: unknown) => unknown) | undefined =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (StellarSdk as any).scValToNative ? (StellarSdk as { scValToNative?: (v: unknown) => unknown }).scValToNative : undefined
            const native = scValToNative ? scValToNative(resultVal) : undefined
            if (typeof native === 'string') {
              return native
            }
          }
        } catch (extractErr) {
          // Ignora falha ao extrair valor de retorno – usa fallback sintético
          if (process.env.NODE_ENV === 'development') {
            console.debug('[soroban] issueCredential return extraction error:', extractErr)
          }
        }
      }
    }
    
    throw new Error('Falha ao emitir credencial')
  } catch (e) {
    console.warn('[soroban] issueCredential error:', e)
    throw e
  }
}

// commitProof removido: o fluxo verifyIdentityProof já realiza a verificação e retorna o commitment


export type ExplanationRecord = { hashHex: string; uri?: string }

export async function setComplianceExplanation(cfg: ZkidConfig, params: { admin: string; proofHashHex: string; explanationHashHex: string; uri?: string }): Promise<boolean> {
  if (!cfg.complianceId) throw new Error('complianceId não configurado')
  try {
    const [StellarSdk, rpc] = await Promise.all([
      import('@stellar/stellar-sdk'),
      import('@stellar/stellar-sdk/rpc')
    ])
    const server = new (rpc as typeof import('@stellar/stellar-sdk/rpc')).Server(cfg.rpcUrl)
    const contract = new StellarSdk.Contract(cfg.complianceId)
  const passphrase: string = cfg.network === 'public' ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
    if (!cfg.signTransaction) throw new Error('signTransaction não configurado (carteira/admin não conectados)')

    const owner = new StellarSdk.Address(params.admin)
  const proofHash = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(hexToBytes(params.proofHashHex)))
  const expHash = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(hexToBytes(params.explanationHashHex)))
  const uriEncoded: Uint8Array | null = params.uri ? new TextEncoder().encode(params.uri) : null
  const uriBytes = uriEncoded ? StellarSdk.xdr.ScVal.scvBytes(Buffer.from(uriEncoded)) : StellarSdk.xdr.ScVal.scvVoid()

    const acc = await server.getAccount(params.admin)
    const tx = new StellarSdk.TransactionBuilder(acc, { fee: StellarSdk.BASE_FEE, networkPassphrase: passphrase })
      .addOperation(contract.call('set_explanation', owner.toScVal(), proofHash, expHash, uriBytes))
      .setTimeout(180)
      .build()

    const prepared = await server.prepareTransaction(tx)
    const signedXdr = await cfg.signTransaction(prepared.toXDR(), { networkPassphrase: passphrase })
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, passphrase)
    const sent = await server.sendTransaction(signedTx)
    return sent.status !== 'ERROR'
  } catch (e) {
    console.warn('[soroban] setComplianceExplanation error:', e)
    return false
  }
}

export async function getComplianceExplanation(cfg: ZkidConfig, proofHashHex: string): Promise<ExplanationRecord | null> {
  if (!cfg.complianceId) throw new Error('complianceId não configurado')
  try {
    const [StellarSdk, rpc] = await Promise.all([
      import('@stellar/stellar-sdk'),
      import('@stellar/stellar-sdk/rpc')
    ])
    const server = new (rpc as typeof import('@stellar/stellar-sdk/rpc')).Server(cfg.rpcUrl)
    const contract = new StellarSdk.Contract(cfg.complianceId)
  const passphrase: string = cfg.network === 'public' ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
    const sourcePub = cfg.simulationSource
    if (!sourcePub) throw new Error('simulationSource não configurado para simulação de consulta')

    const acc = await server.getAccount(sourcePub)
  const proofHash = StellarSdk.xdr.ScVal.scvBytes(Buffer.from(hexToBytes(proofHashHex)))
    const tx = new StellarSdk.TransactionBuilder(acc, { fee: StellarSdk.BASE_FEE, networkPassphrase: passphrase })
      .addOperation(contract.call('get_explanation', proofHash))
      .setTimeout(180)
      .build()
    const sim = await server.simulateTransaction(tx)
  // Checagem de sucesso da simulação (tipos v14)
  const rpcApi = (rpc as typeof import('@stellar/stellar-sdk/rpc')).Api
  const isSimSuccess = rpcApi?.isSimulationSuccess
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isSimSuccess && isSimSuccess(sim as any)) {
      const v: unknown = (sim as { result?: { retval?: unknown } }).result?.retval
      if (!v) return null
      const scValToNative: ((val: unknown) => unknown) | undefined =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (StellarSdk as any).scValToNative
      const native = scValToNative ? scValToNative(v) : null
      if (native && typeof native === 'object') {
        // Espera forma { hash: Uint8Array, uri: Uint8Array | null }
        const hash = (native as { hash?: Uint8Array }).hash as Uint8Array
        const uri = (native as { uri?: Uint8Array | null }).uri as Uint8Array | null
        return { hashHex: bytesToHex(hash), uri: uri ? new TextDecoder().decode(uri) : undefined }
      }
    }
    return null
  } catch (e) {
    console.warn('[soroban] getComplianceExplanation fallback:', e)
    return null
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Utils
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}
