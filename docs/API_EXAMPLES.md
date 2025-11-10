# SDK API Examples

Examples showing how to consume the ZKID Stellar SDK (TypeScript) and interact with contracts.

## 1. Setup

```ts
import { VerifierClient, CredentialRegistryClient, ComplianceOracleClient } from 'zkid-sdk'
import { SorobanRpc } from '@stellar/soroban-client' // Placeholder

const rpcUrl = process.env.SOROBAN_RPC!
const networkPassphrase = process.env.SOROBAN_NETWORK!

const verifier = new VerifierClient({
  contractId: process.env.VERIFIER_ID!,
  rpcUrl,
  networkPassphrase,
})

const registry = new CredentialRegistryClient({
  contractId: process.env.CREDENTIAL_REGISTRY_ID!,
  rpcUrl,
  networkPassphrase,
})

const compliance = new ComplianceOracleClient({
  contractId: process.env.COMPLIANCE_ORACLE_ID!,
  rpcUrl,
  networkPassphrase,
})
```

## 2. Generate Proof (Age ≥ 18)

```ts
import { generateAgeProof } from 'zkid-sdk/proofs'

const age = 22
const threshold = 18
const proofArtifactsPath = '/circuits/artifacts/age_verification' // wasm + zkey + vk json

const { proof, publicSignals } = await generateAgeProof({
  age,
  threshold,
  artifactsDir: proofArtifactsPath,
})
```

## 3. Verify Proof On-Chain

```ts
const result = await verifier.verifyIdentityProof({ proof, publicSignals })
if (result.isOk()) {
  console.log('Proof valid', result.value)
} else {
  console.error('Verification failed', result.error)
}
```

## 4. Issue Credential

```ts
const ownerAddress = 'GABC...' // Stellar address
const proofHash = verifier.hashSignals(publicSignals) // helper to produce hash
const ttlSeconds = 60 * 60 * 24 * 365 // 1 year

const issue = await registry.issueCredential({
  owner: ownerAddress,
  proofHash,
  ttlSeconds,
})
console.log('Credential issued', issue.credentialId)
```

## 5. Check Validity

```ts
const valid = await registry.isValid({ credentialId: issue.credentialId })
console.log('Is credential valid?', valid)
```

## 6. Revoke Credential

```ts
const revokeResult = await registry.revoke({
  caller: ownerAddress,
  credentialId: issue.credentialId,
})
if (revokeResult.isOk()) console.log('Revoked')
else console.error('Revoke error', revokeResult.error)
```

## 7. Sanctions Check

```ts
const sanctioned = await compliance.checkSanctionsList({ proofHash })
if (sanctioned) console.warn('Address/Proof is sanctioned')
```

## 8. Add Sanction (Admin)

```ts
const adminAddr = ownerAddress // if owner = admin
await compliance.setSanctionStatus({
  caller: adminAddr,
  proofHash,
  isSanctioned: true,
})
```

## 9. Attach Explanation (Admin)

```ts
await compliance.setExplanation({
  caller: adminAddr,
  proofHash,
  explanationHash: 'sha256:...',
  uri: 'ipfs://bafy...', // optional external doc
})
```

## 10. Retrieve Explanation

```ts
const explanation = await compliance.getExplanation({ proofHash })
if (explanation) {
  console.log('Explanation hash', explanation.hash)
  if (explanation.uri) console.log('URI', explanation.uri)
}
```

## 11. Error Handling Pattern

```ts
const res = await verifier.verifyIdentityProof({ proof, publicSignals })
if (!res.isOk()) {
  switch (res.error) {
    case 'VkNotSet':
      // prompt admin to set verification key
      break
    case 'EmptyProof':
      // show UI validation warning
      break
    default:
      console.error('Unhandled error', res.error)
  }
}
```

## 12. Batch Proof Verifications (Client-Side)

```ts
const proofs = [
  /* multiple user inputs */
]
const results = await Promise.all(proofs.map((p) => verifier.verifyIdentityProof(p)))
```

## 13. Security Considerations

- Always verify `verification_key.json` integrity (checksum).
- Validate proof structure before invoking contract (avoid malformed calls).
- Do not expose raw witness inputs to logs.

## 14. Future Enhancements

- Automatic binding generation from WASM/IDL.
- Strong typed error enums in TS (numeric mapping).
- Retry & backoff wrapper for RPC transient errors.

---

End of examples. Extend with multi-attribute composite proofs as circuits evolve.
