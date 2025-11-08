export type ProofArtifacts = {
  proof: unknown;
  publicSignals: unknown;
};

export type AgeProofInput = {
  circuit: 'age_verification';
  privateInputs: { birthdate: string };
  publicInputs: { minAge: number; currentDate: string };
};

import { fullProve, hashCanonical } from './zk/groth16'

export async function generateProof(_input: AgeProofInput): Promise<ProofArtifacts> {
  // Mapear birthdate/currentDate->birthYear/currentYear para input do circuito
  const wasm = '/circuits/artifacts/age_verification/age_verification.wasm'
  const zkey = '/circuits/artifacts/age_verification/age_verification.zkey'
  const birthYear = Number(_input.privateInputs.birthdate.slice(0,4))
  const currentYear = Number(_input.publicInputs.currentDate.slice(0,4))
  const minAge = _input.publicInputs.minAge
  const input = { birthYear, currentYear, minAge }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    // Fallback para mock durante desenvolvimento sem artefatos
    return { proof: { mock: true }, publicSignals: { mock: true } }
  }
}

// Income Threshold
export type IncomeProofInput = {
  circuit: 'income_threshold';
  privateInputs: { income: number };
  publicInputs: { minIncome: number };
};

export async function generateIncomeProof(_input: IncomeProofInput): Promise<ProofArtifacts> {
  const wasm = '/circuits/artifacts/income_threshold/income_threshold.wasm'
  const zkey = '/circuits/artifacts/income_threshold/income_threshold.zkey'
  const income = Math.floor(Number(_input.privateInputs.income))
  const threshold = Math.floor(Number(_input.publicInputs.minIncome))
  const input = { income, threshold }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    // Fallback para mock durante desenvolvimento sem artefatos
    return { proof: { mock: true }, publicSignals: { ok: income >= threshold, threshold } }
  }
}

// Country Verification
export type CountryProofInput = {
  circuit: 'country_verification';
  privateInputs: { countryCode: number };
  publicInputs: { targetCode: number };
};

export async function generateCountryProof(_input: CountryProofInput): Promise<ProofArtifacts> {
  const wasm = '/circuits/artifacts/country_verification/country_verification.wasm'
  const zkey = '/circuits/artifacts/country_verification/country_verification.zkey'
  const countryCode = Math.floor(Number(_input.privateInputs.countryCode))
  const targetCode = Math.floor(Number(_input.publicInputs.targetCode))
  const input = { countryCode, targetCode }
  try {
    const { proof, publicSignals } = await fullProve({ wasmPath: wasm, zkeyPath: zkey, input })
    return { proof, publicSignals }
  } catch (e) {
    // Fallback mock: equality check
    return { proof: { mock: true }, publicSignals: { is_target: countryCode === targetCode } }
  }
}

export type VerifyAndIssueRequest = {
  proof: unknown;
  publicSignals: unknown;
  userPasskey: string; // placeholder para id da credencial passkey
};

export async function verifyAndIssue(_req: VerifyAndIssueRequest): Promise<{ id: string }> {
  const config = getConfig()
  // 1) verificar proof
  const ok = await import('./client/soroban').then(m => m.verifyIdentityProof(config, { proof: _req.proof, publicSignals: _req.publicSignals }))
  if (!ok) throw new Error('Proof inválida')
  // 2) emitir credencial
  const proofHash = hashProof({ proof: _req.proof, publicSignals: _req.publicSignals })
  const id = await import('./client/soroban').then(m => m.issueCredential(config, { ownerPasskey: _req.userPasskey, proofHash, ttlSeconds: 60*60*24*365 }))
  return { id }
}

// Configuração do SDK
export type ZkidConfig = {
  network: 'testnet' | 'public';
  rpcUrl: string;
  verifierId: string;
  registryId: string;
  complianceId: string;
};

let cfg: ZkidConfig | null = null;

export function setConfig(c: ZkidConfig) { cfg = c }
export function getConfig(): ZkidConfig {
  if (!cfg) throw new Error('SDK não configurado. Chame setConfig() primeiro.');
  return cfg;
}

export function hashProof(_art: ProofArtifacts): string {
  try {
    return hashCanonical(_art)
  } catch {
    return 'mock-proof-hash'
  }
}
