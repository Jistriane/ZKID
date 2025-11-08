# ZKID Stellar v0.1.0 - Testnet Deployment

Initial production-ready deployment of ZKID Stellar contracts to Soroban Testnet.

## 📦 Deployed Contracts

### Verifier Contract
- **ID**: `CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC`
- **Explorer**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC)
- **Purpose**: On-chain Groth16 proof verification (BN254 curve)
- **Functions**: `verify_identity_proof`, `set_verification_key`, `get_verification_key`, `version`

### Compliance Oracle Contract
- **ID**: `CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM`
- **Explorer**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM)
- **Purpose**: Sanctions list and compliance explanation storage
- **Admin**: `GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX`
- **Functions**: `init`, `check_sanctions_list`, `set_sanction_status`, `set_explanation`, `get_admin`, `version`

### Credential Registry Contract
- **ID**: `CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5`
- **Explorer**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5)
- **Purpose**: Issue and manage revocable, expirable soulbound credentials
- **Functions**: `issue_credential`, `is_valid`, `get_credential`, `revoke`, `version`

## 🛠️ Build Information

- **Rust toolchain**: stable
- **Soroban SDK**: 23.0.2
- **Build target**: `wasm32v1-none` (via Stellar CLI)
- **Optimization**: `opt-level = "z"`, LTO enabled, symbols stripped

## 📊 Contract Sizes

| Contract | WASM Size (approx) |
|----------|--------------------|
| `verifier.wasm` | ~6.4 KB |
| `compliance_oracle.wasm` | ~6.9 KB |
| `credential_registry.wasm` | ~13 KB |

## 🔐 Security Notes

- All contracts use explicit error enums (no panics).
- Compliance Oracle admin is set and cannot be changed (single init).
- Credentials are non-transferable (soulbound).
- Revocation and expiry are checked before validation.

## 🚀 Usage

### Environment Variables
```bash
export VERIFIER_ID=CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC
export COMPLIANCE_ORACLE_ID=CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM
export CREDENTIAL_REGISTRY_ID=CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5
```

### Query Contract Version
```bash
stellar contract invoke \
  --id $VERIFIER_ID \
  --source-account <your-key> \
  --network testnet \
  -- version
```

### Issue a Credential
```bash
stellar contract invoke \
  --id $CREDENTIAL_REGISTRY_ID \
  --source-account <owner-key> \
  --network testnet \
  -- issue_credential \
  --owner <OWNER_ADDRESS> \
  --proof_hash <PROOF_HASH_BYTES> \
  --ttl_seconds 2592000
```

## 📝 Release Notes

### Features
- ✅ Groth16 verification on-chain (placeholder implementation)
- ✅ Soulbound credentials with expiry and revocation
- ✅ Compliance oracle with admin-controlled sanctions list
- ✅ Explainable compliance (hash + optional URI)
- ✅ Event emission for credential issuance, revocation, admin init

### Known Limitations
- Verifier contract currently uses placeholder logic (full pairing TBD)
- Events use legacy `.publish()` API (migration to `#[contractevent]` planned)
- VK storage not yet optimized for large keys (chunking TBD)

### Improvements Since Last Version
- Migrated to `wasm32v1-none` target for proper Soroban compatibility
- Updated all READMEs with current deployment IDs
- Added `deploy/last_deploy.json` artifact tracking
- Improved error handling with explicit error enums

## 🔗 Links

- **GitHub Repository**: https://github.com/Jistriane/ZKID
- **Documentation**: See `docs/` folder
- **Testnet Faucet**: https://friendbot.stellar.org

## 📅 Deployment Details

- **Network**: Testnet (Soroban)
- **Date**: 2025-11-07
- **Deployer**: `GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX`
- **RPC**: https://soroban-testnet.stellar.org
- **Passphrase**: `Test SDF Network ; September 2015`

## ⚠️ Disclaimer

**Testnet deployment only.** These contracts are deployed to Stellar's testnet for development and demonstration purposes. Do not use with real assets or mainnet accounts.

---

For questions or issues, please open a GitHub issue or discussion.
