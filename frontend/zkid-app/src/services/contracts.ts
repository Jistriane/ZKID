import { Networks } from '@stellar/stellar-sdk'
import { 
  VerifierClient,
  CredentialRegistryClient,
  ComplianceOracleClient,
  ZKID_CONTRACTS,
} from 'zkid-sdk'
import { getConnectedPublicKey } from './wallet'

type Network = 'testnet' | 'mainnet'

function getEnvContracts() {
  const rpcUrl = import.meta.env.VITE_SOROBAN_RPC as string | undefined
  const verifier = import.meta.env.VITE_VERIFIER_CONTRACT_ID as string | undefined
  const registry = import.meta.env.VITE_REGISTRY_CONTRACT_ID as string | undefined
  const compliance = import.meta.env.VITE_COMPLIANCE_CONTRACT_ID as string | undefined
  return { rpcUrl, verifier, registry, compliance }
}

export function createClients(network: Network) {
  const useMainnet = network === 'mainnet'
  const cfg = ZKID_CONTRACTS.testnet // default to testnet constants
  const env = getEnvContracts()
  const rpcUrl = env.rpcUrl || cfg.rpcUrl
  const networkPassphrase = useMainnet ? 'Public Global Stellar Network ; September 2015' : Networks.TESTNET

  const verifier = new VerifierClient({
    contractId: env.verifier || cfg.verifier,
    networkPassphrase,
    rpcUrl,
  })
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
  return { verifier, registry, compliance }
}

// Helpers
function toBuffer(obj: unknown): Buffer {
  if (obj instanceof Uint8Array) return Buffer.from(obj)
  if (typeof obj === 'string') return Buffer.from(obj)
  return Buffer.from(JSON.stringify(obj))
}

export async function verifyIdentityProofService(network: Network, proof: unknown, publicSignals: unknown): Promise<boolean> {
  const { verifier } = createClients(network)
  const tx = await verifier.verify_identity_proof({
    proof: toBuffer(proof),
    public_inputs: toBuffer(publicSignals),
  })
  await tx.simulate()
  return Boolean(tx.result)
}

export async function issueCredentialService(
  network: Network,
  ownerPublicKey: string,
  proofHashHex: string,
  ttlSeconds: number,
  walletSign: (xdr: string) => Promise<string>
): Promise<string> {
  const { registry } = createClients(network)
  const tx = await registry.issue_credential({
    owner: ownerPublicKey,
    proof_hash: Buffer.from(proofHashHex.replace(/^0x/, ''), 'hex'),
    ttl_seconds: ttlSeconds,
  })
  const signerAddress = getConnectedPublicKey() || ownerPublicKey
  const sent = await tx.signAndSend({
    signTransaction: async (xdr: string) => {
      const signedTxXdr = await walletSign(xdr)
      return { signedTxXdr, signerAddress }
    },
  })
  // As the return type depends on contract, try to coerce to string or synthesize
  if (typeof sent === 'string') return sent
  // Fallback: derive id from proof hash prefix
  return `cred_${proofHashHex.slice(2, 14)}`
}

export async function isCredentialValidService(network: Network, credentialIdHex: string): Promise<boolean> {
  const { registry } = createClients(network)
  const tx = await registry.is_valid({ credential_id: Buffer.from(credentialIdHex.replace(/^0x/, ''), 'hex') })
  await tx.simulate()
  return Boolean(tx.result)
}

export async function checkSanctionsService(network: Network, proofHashHex: string): Promise<boolean> {
  const { compliance } = createClients(network)
  const tx = await compliance.check_sanctions_list({ proof_hash: Buffer.from(proofHashHex.replace(/^0x/, ''), 'hex') })
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
  // try to coerce buffer-like
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyRes: any = res
    if (typeof anyRes?.toString === 'function') {
      return anyRes.toString('utf8') as string
    }
    return String(res)
  } catch {
    return null
  }
}
