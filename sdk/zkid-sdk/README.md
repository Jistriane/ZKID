# ZKID SDK

TypeScript SDK for interacting with ZKID Soroban smart contracts on Stellar.

## Features

✅ **Auto-generated Contract Clients** - Type-safe TypeScript clients for all ZKID contracts  
✅ **Zero-Knowledge Proof Generation** - Create and verify ZK proofs for identity claims  
✅ **Credential Management** - Issue and validate on-chain credentials  
✅ **Compliance Integration** - Built-in sanctions checking and compliance oracle

## Installation

```bash
npm install zkid-sdk
# or
yarn add zkid-sdk
```

## Quick Start

### 1. Initialize Contract Clients

```typescript
import { 
  VerifierClient, 
  CredentialRegistryClient,
  ZKID_CONTRACTS 
} from 'zkid-sdk/client/contracts';
import { Networks } from '@stellar/stellar-sdk';

// Connect to testnet
const verifier = new VerifierClient({
  contractId: ZKID_CONTRACTS.testnet.verifier,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: ZKID_CONTRACTS.testnet.rpcUrl,
});

const credentialRegistry = new CredentialRegistryClient({
  contractId: ZKID_CONTRACTS.testnet.credentialRegistry,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: ZKID_CONTRACTS.testnet.rpcUrl,
});
```

### 2. Read Contract State

```typescript
// Check contract version
const versionTx = await verifier.version();
const version = await versionTx.signAndSend();
console.log('Contract version:', version);

// Check if a credential is valid
const isValidTx = await credentialRegistry.is_valid({
  credential_id: Buffer.from('credential-id-here'),
});
const isValid = await isValidTx.signAndSend();
console.log('Credential valid:', isValid);
```

### 3. Write to Contract (requires signing)

```typescript
import { Keypair } from '@stellar/stellar-sdk';

// Issue a new credential
const signerKeypair = Keypair.fromSecret('SXXX...');

const tx = await credentialRegistry.issue_credential({
  owner: 'GXXX...',
  proof_hash: Buffer.from('proof-hash'),
  ttl_seconds: 3600,
});

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
```

## Contract Clients

### VerifierClient

Verifies zero-knowledge proofs for identity claims.

**Methods:**
- `version()` - Get contract version
- `verify_identity_proof({ proof, public_inputs })` - Verify a ZK proof
- `initialize({ vk })` - Initialize verification key (admin only)

### CredentialRegistryClient

Manages on-chain credentials with expiration.

**Methods:**
- `version()` - Get contract version
- `issue_credential({ owner, proof_hash, ttl_seconds })` - Issue a new credential
- `is_valid({ credential_id })` - Check if credential is valid
- `revoke_credential({ credential_id })` - Revoke a credential (issuer only)

### ComplianceOracleClient

Provides compliance and sanctions checking.

**Methods:**
- `version()` - Get contract version
- `check_sanctions_list({ proof_hash })` - Check if entity is sanctioned
- `add_to_sanctions({ entity_id })` - Add entity to sanctions list (admin only)
- `get_admin()` - Get current admin address

## Advanced Usage

### Simulate Before Sending

```typescript
const tx = await verifier.version();

// Simulate to estimate costs
const simulation = await tx.simulate();
console.log('Estimated cost:', simulation);

// Then send if simulation succeeds
if (simulation) {
  const result = await tx.signAndSend();
}
```

### Error Handling

```typescript
try {
  const tx = await credentialRegistry.issue_credential({
    owner: 'GXXX...',
    proof_hash: Buffer.from('...'),
    ttl_seconds: 3600,
  });
  
  const result = await tx.signAndSend();
  console.log('Success:', result);
} catch (error) {
  console.error('Transaction failed:', error);
}
```

### Custom RPC Configuration

```typescript
import { VerifierClient } from 'zkid-sdk/client/contracts';

const verifier = new VerifierClient({
  contractId: 'CXXX...',
  networkPassphrase: 'Your Network Passphrase',
  rpcUrl: 'https://your-soroban-rpc.com',
  // Optional: custom timeout, retry logic, etc.
});
```

## Examples

Complete usage examples are available in the [`examples/`](./examples) directory:

- `contract-usage.ts` - Comprehensive contract interaction examples
- `zk-proof-generation.ts` - Zero-knowledge proof creation and verification

## Development

### Build from Source

```bash
# Install dependencies
npm install

# Build SDK
npm run build

# Run tests
npm test
```

### Generate Contract Clients

To regenerate TypeScript clients from updated contracts:

```bash
# From project root
npm run build:clients
```

## Contract Addresses

### Testnet

- **Verifier**: `CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC`
- **Credential Registry**: `CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5`
- **Compliance Oracle**: `CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM`

View on Stellar Explorer:
- [Verifier](https://stellar.expert/explorer/testnet/contract/CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC)
- [Credential Registry](https://stellar.expert/explorer/testnet/contract/CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5)
- [Compliance Oracle](https://stellar.expert/explorer/testnet/contract/CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM)

## Resources

- [ZKID Documentation](../../docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Documentation](https://soroban.stellar.org/docs)

## License

MIT License - see [LICENSE](../../LICENSE) for details
