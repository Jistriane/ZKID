# Soroban Deployment Guide

## 1. Overview
Deploying ZKID Stellar contracts (Verifier, Credential Registry, Compliance Oracle) to Stellar Soroban testnet or future mainnet.

## 2. Requirements
- `soroban-cli` installed
- Funded Stellar account (testnet: friendbot)
- Rust build toolchain
- Built WASM artifacts (`cargo build --release --target wasm32-unknown-unknown`)

## 3. Install soroban-cli
```bash
cargo install --locked soroban-cli
soroban --version
```

## 4. Configure Network (Testnet)
```bash
soroban config network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

## 5. Generate / Use Account
```bash
soroban config identity generate dev-user
soroban config identity address dev-user
```
Fund via friendbot (testnet only):
```
https://friendbot.stellar.org/?addr=<ADDRESS>
```

## 6. Build Contracts
```bash
cargo build --release --target wasm32-unknown-unknown
ls target/wasm32-unknown-unknown/release/*.wasm
```

## 7. Deploy Contracts
Example deploying Verifier:
```bash
VERIFIER_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/verifier.wasm \
  --source dev-user \
  --network testnet)

echo "Verifier Contract ID: $VERIFIER_ID"
```
Repeat for `credential_registry.wasm` and `compliance_oracle.wasm`.

## 8. Initialize Contracts
If any contract requires initialization (e.g., set admin):
```bash
soroban contract invoke \
  --id $COMPLIANCE_ID \
  --source dev-user \
  --network testnet \
  --fn init \
  --arg $(soroban config identity address dev-user)
```

## 9. Set Verification Key
Upload verification key JSON off-chain (e.g., IPFS / server) and store hash or compressed representation.
```bash
soroban contract invoke \
  --id $VERIFIER_ID \
  --source dev-user \
  --network testnet \
  --fn set_verification_key \
  --arg <serialized_vk>
```
(If size constraints apply, consider chunking or storing only a hash and keep full key off-chain.)

## 10. Verify a Proof (Example)
```bash
soroban contract invoke \
  --id $VERIFIER_ID \
  --source dev-user \
  --network testnet \
  --fn verify_identity_proof \
  --arg <proof_vec_val> \
  --arg <public_inputs_vec_val>
```
The CLI argument format may require base64 or xdr encodings for complex types; use SDK for convenience.

## 11. Issue Credential
```bash
soroban contract invoke \
  --id $CRED_ID \
  --source <USER_ADDR> \
  --network testnet \
  --fn issue_credential \
  --arg <owner_address> \
  --arg <proof_hash_bytes> \
  --arg <ttl_seconds>
```

## 12. Revoke Credential
```bash
soroban contract invoke \
  --id $CRED_ID \
  --source <OWNER_ADDR> \
  --network testnet \
  --fn revoke \
  --arg <owner_address> \
  --arg <credential_id_bytes>
```

## 13. Sanctions & Explanations
```bash
# Set sanction status
soroban contract invoke \
  --id $COMPLIANCE_ID \
  --source dev-user \
  --network testnet \
  --fn set_sanction_status \
  --arg <caller_address> \
  --arg <proof_hash_bytes> \
  --arg <is_sanctioned_bool>

# Attach explanation
soroban contract invoke \
  --id $COMPLIANCE_ID \
  --source dev-user \
  --network testnet \
  --fn set_explanation \
  --arg <caller_address> \
  --arg <proof_hash_bytes> \
  --arg <explanation_hash_bytes> \
  --arg <uri_string>
```

## 14. Query Functions
Use `--fn <function>` without mutation arguments:
```bash
soroban contract invoke --id $COMPLIANCE_ID --fn check_sanctions_list --arg <proof_hash_bytes>
```

## 15. Environment Variables
Maintain a `.env` or `config/contracts.json` storing contract IDs:
```json
{
  "verifier": "$VERIFIER_ID",
  "credentialRegistry": "$CRED_ID",
  "complianceOracle": "$COMPLIANCE_ID"
}
```

## 16. Upgrades
- New version: deploy new wasm.
- Migration: copy state if layout changed (design upgrade function or snapshot/export). 
- Credential compatibility: ensure same hashing algorithm & structure.

## 17. Troubleshooting
| Issue | Cause | Resolution |
|-------|-------|-----------|
| Out of funds | Insufficient testnet XLM | Re-run friendbot funding. |
| Invoke arg parsing fails | Incorrect encoding | Use SDK helper or serialize explicitly. |
| Verification fails | Mismatched VK | Re-set verification key; confirm circuit version. |
| Admin errors | init not called | Invoke `init` before admin operations. |

## 18. Security Notes
- Protect admin key (compliance oracle). 
- Consider multisig for production. 
- Version pin circuits & verification key hash. 

---
End of deploy guide. For automation, integrate these steps in CI.
