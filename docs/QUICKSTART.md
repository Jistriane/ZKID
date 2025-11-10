# ZKID Stellar Quickstart

## Goal

Run the full stack locally: generate a zero-knowledge proof, verify it on-chain (local build), issue a credential, and query compliance.

## Prerequisites

- Node.js 18+
- Rust + Cargo
- `soroban-cli`
- Circom 2.1.5 + snarkjs 0.7.x (optional initial run uses prebuilt artifacts)
- Git

## 1. Clone

```bash
git clone <repo-url>
cd zkid-stellar
```

## 2. Install

```bash
make install
```

Installs root deps + SDK + frontend.

## 3. Build (SDK + Contracts)

```bash
make build
```

Generates TypeScript SDK build & Rust WASM contracts (release profile).

## 4. (Optional) Compile Circuits

If you want to regenerate artifacts:

```bash
make circuits-build
```

Otherwise use existing `circuits/artifacts/*`.

## 5. Run Tests

```bash
make test
```

Ensures contracts & SDK base tests pass.

## 6. Start Frontend

```bash
make app-dev
```

Open http://localhost:5173

## 7. Start AI Assistant (Optional)

```bash
npm run eliza:dev
```

Open http://localhost:3000

## 8. Deploy to Testnet (Outline)

(See `docs/DEPLOY_SOROBAN.md` for full steps.)

```bash
# Example placeholder commands
soroban config network add testnet --rpc-url <URL> --network-passphrase "Test SDF Network ; September 2015"
# Fund account, then deploy verifier
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/verifier.wasm --source <ACCOUNT>
```

Store the returned contract IDs in an `.env` file or config JSON.

## 9. Verify a Proof (Mock Flow)

From frontend: generate age proof → send to Verifier → receive success. (Real key must be set after deploy.)

## 10. Issue a Credential

Call Registry contract via SDK; store returned credential id (hash or deterministic key). Use `is_valid` to confirm.

## 11. Compliance Check

Query Oracle (sanction status) and get explanation hash (optional fetch from external URI).

## 12. Cleanup

```bash
cargo clean
rm -rf frontend/zkid-app/dist
```

## Troubleshooting

| Issue                 | Cause                  | Fix                                   |
| --------------------- | ---------------------- | ------------------------------------- |
| Missing circom binary | Not installed          | Re-run setup or manual install steps. |
| soroban deploy fails  | Unfunded account       | Use friendbot/testnet faucet.         |
| Proof invalid         | Wrong verification key | Re-export and reset key in Verifier.  |

## Next

- Read `docs/ARCHITECTURE.md` for deeper design.
- See `docs/API_EXAMPLES.md` to integrate via SDK.

---

Fast path complete. For production steps, follow deploy & security hardening guides.
