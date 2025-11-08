/**
 * ZKID Contract Usage Examples
 * 
 * Demonstrates how to use the auto-generated TypeScript clients for ZKID Soroban contracts.
 */

import { 
  VerifierClient, 
  CredentialRegistryClient, 
  ComplianceOracleClient,
  ZKID_CONTRACTS 
} from '../src/client/contracts';
import { Networks, Keypair } from '@stellar/stellar-sdk';

// Configuration
const config = ZKID_CONTRACTS.testnet;

// Example 1: Initialize contract clients
const verifier = new VerifierClient({
  contractId: config.verifier,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: config.rpcUrl,
});

const credentialRegistry = new CredentialRegistryClient({
  contractId: config.credentialRegistry,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: config.rpcUrl,
});

const complianceOracle = new ComplianceOracleClient({
  contractId: config.complianceOracle,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: config.rpcUrl,
});

// Example 2: Read-only operations (no signature required)
async function checkVersion() {
  console.log('Checking verifier contract version...');
  
  const tx = await verifier.version();
  const result = await tx.signAndSend();
  
  console.log('Version:', result);
  return result;
}

// Example 3: Check if a credential is valid
async function checkCredentialValidity(credentialId: Buffer) {
  console.log('Checking credential validity...');
  
  const tx = await credentialRegistry.is_valid({
    credential_id: credentialId,
  });
  
  const result = await tx.signAndSend();
  console.log('Is valid:', result);
  return result;
}

// Example 4: Issue a new credential (requires signing)
async function issueNewCredential(
  signerKeypair: Keypair,
  ownerPublicKey: string,
  proofHash: Buffer,
  ttlSeconds: number
) {
  console.log('Issuing new credential...');
  
  const tx = await credentialRegistry.issue_credential({
    owner: ownerPublicKey,
    proof_hash: proofHash,
    ttl_seconds: ttlSeconds,
  });
  
  // Sign and submit the transaction
  const result = await tx.signAndSend({
    signTransaction: async (xdr: string) => {
      const { Transaction } = await import('@stellar/stellar-sdk');
      const transaction = new Transaction(xdr, Networks.TESTNET);
      transaction.sign(signerKeypair);
      return {
        signedTxXdr: transaction.toXDR(),
        signerAddress: signerKeypair.publicKey(),
      };
    },
  });
  
  console.log('Credential issued:', result);
  return result;
}

// Example 5: Verify an identity proof
async function verifyIdentityProof(
  proof: Buffer,  // Serialized Groth16Proof
  publicInputs: Buffer  // Serialized public inputs
) {
  console.log('Verifying identity proof...');
  
  const tx = await verifier.verify_identity_proof({
    proof,
    public_inputs: publicInputs,
  });
  
  const result = await tx.signAndSend();
  console.log('Proof valid:', result);
  return result;
}

// Example 6: Check sanctions list
async function checkSanctions(proofHash: Buffer) {
  console.log('Checking sanctions list...');
  
  const tx = await complianceOracle.check_sanctions_list({
    proof_hash: proofHash,
  });
  
  const result = await tx.signAndSend();
  console.log('Sanctions check passed:', result);
  return result;
}

// Example 7: Get compliance admin
async function getComplianceAdmin() {
  console.log('Getting compliance admin...');
  
  const tx = await complianceOracle.get_admin();
  const result = await tx.signAndSend();
  
  console.log('Admin:', result);
  return result;
}

// Example 8: Simulate a transaction before sending
async function simulateBeforeSend() {
  console.log('Simulating transaction...');
  
  const tx = await verifier.version();
  
  // Simulate first to estimate costs
  const simulation = await tx.simulate();
  console.log('Simulation result:', simulation);
  
  // If simulation is successful, send
  if (simulation) {
    const result = await tx.signAndSend();
    console.log('Transaction sent:', result);
  }
}

// Export all examples
export {
  checkVersion,
  checkCredentialValidity,
  issueNewCredential,
  verifyIdentityProof,
  checkSanctions,
  getComplianceAdmin,
  simulateBeforeSend,
};
