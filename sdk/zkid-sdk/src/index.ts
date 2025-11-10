export type ProofArtifacts = {
  proof: unknown;
  publicSignals: unknown;
};

export type AgeProofInput = {
  circuit: 'age_verification';
  privateInputs: { birthdate: string };
  publicInputs: { minAge: number; currentDate: string; userPublicKey: string };
};

// Explicit .js extensions for Node ESM resolution after TS build
import { fullProve, hashCanonical } from './zk/groth16.js'
import { verifyIdentityProof } from './client/soroban.js'

export async function generateProof(_input: AgeProofInput): Promise<ProofArtifacts> {
  // Mapear birthdate/currentDate->birthYear/currentYear para input do circuito
  const wasm = '/circuits/artifacts/age_verification/age_verification.wasm'
  const zkey = '/circuits/artifacts/age_verification/age_verification.zkey'
  const birthYear = Number(_input.privateInputs.birthdate.slice(0,4))
  const currentYear = Number(_input.publicInputs.currentDate.slice(0,4))
  const minAge = _input.publicInputs.minAge
  if (!_input.publicInputs.userPublicKey) throw new Error('userPublicKey obrigatório para bind da prova')
  const addrHash = hashAddressField(_input.publicInputs.userPublicKey)
  const input = { birthYear, currentYear, minAge, addrHash }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    throw new Error(`[generateProof] Falha ao gerar prova: ${(e as Error)?.message ?? e}`)
  }
}

// Income Threshold
export type IncomeProofInput = {
  circuit: 'income_threshold';
  privateInputs: { income: number };
  publicInputs: { minIncome: number; userPublicKey: string };
};

export async function generateIncomeProof(_input: IncomeProofInput): Promise<ProofArtifacts> {
  const wasm = '/circuits/artifacts/income_threshold/income_threshold.wasm'
  const zkey = '/circuits/artifacts/income_threshold/income_threshold.zkey'
  const income = Math.floor(Number(_input.privateInputs.income))
  const threshold = Math.floor(Number(_input.publicInputs.minIncome))
  if (!_input.publicInputs.userPublicKey) throw new Error('userPublicKey obrigatório para bind da prova')
  const addrHash = hashAddressField(_input.publicInputs.userPublicKey)
  const input = { income, threshold, addrHash }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    throw new Error(`[generateIncomeProof] Falha ao gerar prova: ${(e as Error)?.message ?? e}`)
  }
}

// Country Verification
export type CountryProofInput = {
  circuit: 'country_verification';
  privateInputs: { countryCode: number };
  publicInputs: { targetCode: number; userPublicKey: string };
};

export async function generateCountryProof(_input: CountryProofInput): Promise<ProofArtifacts> {
  const wasm = '/circuits/artifacts/country_verification/country_verification.wasm'
  const zkey = '/circuits/artifacts/country_verification/country_verification.zkey'
  const countryCode = Math.floor(Number(_input.privateInputs.countryCode))
  const targetCode = Math.floor(Number(_input.publicInputs.targetCode))
  if (!_input.publicInputs.userPublicKey) throw new Error('userPublicKey obrigatório para bind da prova')
  const addrHash = hashAddressField(_input.publicInputs.userPublicKey)
  const input = { countryCode, targetCode, addrHash }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    throw new Error(`[generateCountryProof] Falha ao gerar prova: ${(e as Error)?.message ?? e}`)
  }
}

export type VerifyAndIssueRequest = {
  proof: unknown;
  publicSignals: unknown;
  userPasskey: string; // placeholder para id da credencial passkey (off-chain link)
  userPublicKey: string; // Stellar account address que deve autorizar issue_credential
};

export async function verifyAndIssue(_req: VerifyAndIssueRequest): Promise<{ id: string }> {
  const config = getConfig()
  // Verificar prova on-chain (assinatura da carteira obrigatória) -> retorna commitment
  const commitmentHex = await verifyIdentityProof(config, { callerPublicKey: _req.userPublicKey, proof: _req.proof, publicSignals: _req.publicSignals })
  if (!commitmentHex) throw new Error('Proof inválida no Verifier')

  // 3) emitir credencial (assinatura obrigatória pelo owner)
  const proofHash = commitmentHex
  const id = await import('./client/soroban.js').then(m => m.issueCredential(config, { ownerPublicKey: _req.userPublicKey, proofHash, ttlSeconds: 60*60*24*365 }))
  return { id }
}

// Configuração do SDK
export type ZkidConfig = {
  network: 'testnet' | 'public';
  rpcUrl: string;
  verifierId: string;
  registryId: string;
  complianceId: string;
  // Função opcional para assinar transações (ex: Freighter / Albedo). Recebe XDR não assinado e deve retornar XDR assinado.
  signTransaction?: (xdr: string, opts: { networkPassphrase: string }) => Promise<string>;
  // Conta pública para ser usada como source em simulações de transações (ex.: a própria carteira conectada)
  simulationSource?: string;
};

let cfg: ZkidConfig | null = null;

export function setConfig(c: ZkidConfig) { cfg = c }
export function getConfig(): ZkidConfig {
  if (!cfg) throw new Error('SDK não configurado. Chame setConfig() primeiro.');
  return cfg;
}

function safeGetConfig(): ZkidConfig { return getConfig() }

export function hashProof(_art: ProofArtifacts): string {
  try {
    return hashCanonical(_art)
  } catch {
    throw new Error('[hashProof] Falha ao computar hash da prova')
  }
}

// Helper: gera prova e registra commitment com a carteira conectada
export async function generateAndCommit(
  input: AgeProofInput | IncomeProofInput | CountryProofInput,
  callerPublicKey: string
): Promise<ProofArtifacts> {
  const cfg = safeGetConfig()
  const proof = input.circuit === 'age_verification'
    ? await generateProof(input as AgeProofInput)
    : input.circuit === 'income_threshold'
      ? await generateIncomeProof(input as IncomeProofInput)
      : await generateCountryProof(input as CountryProofInput)

  // Realiza verificação/commit on-chain
  const commitmentHex = await verifyIdentityProof(cfg, { callerPublicKey, proof: proof.proof, publicSignals: proof.publicSignals })
  if (!commitmentHex) throw new Error('Falha ao verificar/commitar prova com a carteira')
  return proof
}

// Re-export contract clients for convenience
export * from './client/contracts.js';

// Conversão determinística de endereço público em number (field element) simples.
function hashAddressField(address: string): bigint {
  // Implementação simplificada: soma ponderada dos char codes -> hex -> BigInt truncado.
  // Em produção, substituir por SHA-256 adequada e truncagem para o prime do curve.
  let acc = 0n
  for (let i = 0; i < address.length; i++) {
    acc = (acc * 131n + BigInt(address.charCodeAt(i))) & ((1n << 250n) - 1n)
  }
  return acc
}
