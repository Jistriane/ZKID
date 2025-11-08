# Packages Directory

This directory contains auto-generated contract client packages created by `stellar scaffold build --build-clients`.

## Generated Packages

After running `npm run build:clients`, you'll find:

- `verifier/` - Client for the Groth16 ZK Verifier contract
- `credential-registry/` - Client for the Credential Registry contract
- `compliance-oracle/` - Client for the Compliance Oracle contract

## Usage in Frontend

Import the generated clients in your frontend code:

```typescript
import * as VerifierContract from 'verifier';
import * as CredentialRegistryContract from 'credential-registry';
import * as ComplianceOracleContract from 'compliance-oracle';

// Use the contracts
const result = await VerifierContract.verifyProof({
  proof: zkProof,
  publicInputs: inputs
});
```

## Development Workflow

1. Modify contracts in `contracts/*/src/`
2. Run `npm run dev:contracts` to watch for changes
3. Clients are automatically rebuilt and available in frontend

## Note

These packages are generated and should not be manually edited.
They are gitignored and rebuilt on each deployment.
