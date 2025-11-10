# Changelog

All notable changes to the ZKID Stellar project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated all documentation with new contract IDs from latest deployment

## [0.2.0] - 2025-01-09

### Added

- Wallet address binding to ZK proofs via `addrHash` public input
- Modern event system using `#[contractevent]` macro across all contracts
- New deployment script `deploy-with-identity.sh` for Stellar CLI identities
- Event structs: `ProofVerified`, `VkSet`, `CredentialIssued`, `CredentialRevoked`, `AdminInitialized`, `SanctionStatusSet`, `ExplanationSet`
- CSS Modules for `IncomeProofPage` and `CountryProofPage` components
- Accessibility improvements (aria-labels, titles) across frontend
- Required `userPublicKey` parameter in all SDK proof generation functions

### Changed - Breaking Changes

- **BREAKING:** All circuits now require `addrHash` as public input
  - `age_verification.circom` - Updated circuit signature
  - `income_threshold.circom` - Updated circuit signature
  - `country_verification.circom` - Updated circuit signature
- **BREAKING:** SDK proof functions now require `userPublicKey` parameter
  - `generateProof()`
  - `generateIncomeProof()`
  - `generateCountryProof()`
- Migrated from deprecated `env.events().publish()` to `EventStruct{}.publish(&env)` pattern
- Frontend pages now pass wallet public key to proof generation functions
- All circuits recompiled with new artifacts (.wasm, .zkey, verification_key.json)

### Fixed

- Removed all Rust deprecation warnings (event system migration)
- Fixed accessibility errors (missing aria-labels and titles)
- Removed inline CSS warnings (migrated to CSS modules)
- Contract compilation warnings now zero across all three contracts

### Deployment

- **Testnet Deployment:** January 9, 2025
- **Deployer:** `GA3SMP7WZIP7G3RGLAXETC3GKK7LTKV7COLMQBOKGN7G5JQQ25GEEBYS` (identity: admin)
- **New Contract IDs:**
  - Verifier: `CA64XL6ZGUEDN73SN2TAWHY5XBTWPO43K2HJ6YWV5VPV5V5UZRD6VUC4`
  - Credential Registry: `CA44F2HEN2UTJ3XLWTJ4QCON4FXUQJU3L5BFSXRM6UBWOXJAZ7VBTHIO`
  - Compliance Oracle: `CDUTFVWQQWTD64HJVI3ZSVAOFSNVULQ2DDXCQRAG5FQGOOJUIZGCUX6G`

### Security

- Proofs now cryptographically bound to wallet addresses (prevents replay attacks across different users)
- Removed all mock data from proof generation pipeline
- Enhanced wallet integration with real signature verification

### Testing

- All 7 SDK tests passing
- Zero compilation warnings in Rust contracts
- Frontend build successful with CSS externalized

## [0.1.0] - 2024-12-XX

### Initial Release

- Initial project structure with monorepo setup
- Three Soroban smart contracts:
  - Verifier (Groth16 ZK proof verification)
  - Credential Registry (soulbound credentials)
  - Compliance Oracle (sanctions checking)
- Three Circom circuits:
  - Age verification
  - Income threshold
  - Country verification
- TypeScript SDK for proof generation and contract interaction
- React frontend with Vite
- ElizaOS AI assistant integration
- Freighter wallet support
- Comprehensive documentation (English and Portuguese)

### Previous Deployment

- **Old Contract IDs (deprecated):**
  - Verifier: `CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC`
  - Credential Registry: `CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5`
  - Compliance Oracle: `CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM`

---

## Migration Guide: 0.1.0 → 0.2.0

### For Developers

#### 1. Update Contract References

Replace old contract IDs with new ones in your code:

```typescript
// Old (0.1.0)
const VERIFIER_ID = 'CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC'

// New (0.2.0)
const VERIFIER_ID = 'CA64XL6ZGUEDN73SN2TAWHY5XBTWPO43K2HJ6YWV5VPV5V5UZRD6VUC4'
```

#### 2. Update Proof Generation Calls

Add `userPublicKey` parameter to all proof generation:

```typescript
// Old (0.1.0)
const proof = await generateProof(inputs, wasm, zkey)

// New (0.2.0)
const proof = await generateProof(inputs, wasm, zkey, userPublicKey)
```

#### 3. Recompile Circuits (if modified)

If you've customized circuits, regenerate artifacts:

```bash
bash scripts/compile-circuits.sh
```

#### 4. Rebuild SDK and Contract Packages

```bash
npm run build:contracts
npm run build:clients
cd sdk/zkid-sdk && npm run build
```

### For Frontend Integration

Update your wallet connection code to pass public key:

```typescript
// Old (0.1.0)
const result = await generateAgeProof({
  birthYear: 1990,
  currentYear: 2025,
  minAge: 18,
})

// New (0.2.0)
const walletPublicKey = await freighter.getPublicKey()
const result = await generateAgeProof({
  birthYear: 1990,
  currentYear: 2025,
  minAge: 18,
  userPublicKey: walletPublicKey,
})
```

### Breaking Changes Summary

1. **Circuit Public Inputs:** All circuits now include `addrHash` as a public input
2. **SDK Function Signatures:** `userPublicKey` is now required in proof generation
3. **Contract Addresses:** All three contracts have new deployment addresses
4. **Event System:** Contracts use new event structs (backward incompatible with old event listeners)

---

## Links

- [GitHub Repository](https://github.com/Jistriane/ZKID)
- [Stellar Expert - Verifier](https://stellar.expert/explorer/testnet/contract/CA64XL6ZGUEDN73SN2TAWHY5XBTWPO43K2HJ6YWV5VPV5V5UZRD6VUC4)
- [Stellar Expert - Registry](https://stellar.expert/explorer/testnet/contract/CA44F2HEN2UTJ3XLWTJ4QCON4FXUQJU3L5BFSXRM6UBWOXJAZ7VBTHIO)
- [Stellar Expert - Oracle](https://stellar.expert/explorer/testnet/contract/CDUTFVWQQWTD64HJVI3ZSVAOFSNVULQ2DDXCQRAG5FQGOOJUIZGCUX6G)
