// circuitsPreload.ts
// Helper para garantir que artefatos wasm/zkey de cada circuito estejam acessíveis antes da geração da prova.
// Falha cedo em modo estrito (quando allowMockFallback === false).

const CIRCUIT_BASE = '/circuits/artifacts'

type CircuitName = 'age_verification' | 'income_threshold' | 'country_verification'

interface ArtifactCheckResult {
  wasmOk: boolean
  zkeyOk: boolean
  errors: string[]
}

async function head(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function checkArtifacts(circuit: CircuitName): Promise<ArtifactCheckResult> {
  const wasmUrl = `${CIRCUIT_BASE}/${circuit}/${circuit}.wasm`
  const zkeyUrl = `${CIRCUIT_BASE}/${circuit}/${circuit}.zkey`
  const [wasmOk, zkeyOk] = await Promise.all([head(wasmUrl), head(zkeyUrl)])
  const errors: string[] = []
  if (!wasmOk) errors.push(`WASM não acessível: ${wasmUrl}`)
  if (!zkeyOk) errors.push(`ZKey não acessível: ${zkeyUrl}`)
  return { wasmOk, zkeyOk, errors }
}

export async function ensureCircuitArtifacts(circuit: CircuitName): Promise<void> {
  const result = await checkArtifacts(circuit)
  if (!result.wasmOk || !result.zkeyOk) {
    throw new Error(`Artefatos ausentes para ${circuit}:\n${result.errors.join('\n')}`)
  }
}

export async function preloadAllCircuits(): Promise<{ [K in CircuitName]: ArtifactCheckResult }> {
  const circuits: CircuitName[] = ['age_verification', 'income_threshold', 'country_verification']
  const entries = await Promise.all(circuits.map(async c => [c, await checkArtifacts(c)] as const))
  return Object.fromEntries(entries) as { [K in CircuitName]: ArtifactCheckResult }
}

