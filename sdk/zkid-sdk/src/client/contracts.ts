/**
 * ZKID Stellar Contract Clients
 * 
 * This module re-exports the auto-generated TypeScript clients for ZKID Soroban contracts.
 * 
 * Usage:
 * ```typescript
 * import { VerifierClient, CredentialRegistryClient, ComplianceOracleClient } from 'zkid-sdk/client/contracts';
 * import { Networks } from '@stellar/stellar-sdk';
 * 
 * // Initialize a client
 * const verifier = new VerifierClient({
 *   contractId: 'CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC',
 *   networkPassphrase: Networks.TESTNET,
 *   rpcUrl: 'https://soroban-testnet.stellar.org',
 * });
 * 
 * // Call a method
 * const versionTx = await verifier.version();
 * const result = await versionTx.signAndSend();
 * ```
 */

// Re-export generated contract clients
export { Client as VerifierClient } from 'verifier';
export { Client as CredentialRegistryClient } from 'credential_registry';
export { Client as ComplianceOracleClient } from 'compliance_oracle';

// Re-export types from generated contracts
export type { 
  Groth16Proof,
  VerificationKey,
} from 'verifier';

export type {
  Credential,
} from 'credential_registry';

// Network configuration constants (updated from latest deployment)
export const ZKID_CONTRACTS = {
  testnet: {
    verifier: 'CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F',
    credentialRegistry: 'CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4',
    complianceOracle: 'CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC',
    rpcUrl: 'https://soroban-testnet.stellar.org',
  },
} as const;

