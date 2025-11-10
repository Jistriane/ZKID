<p align="center">
  <img src="frontend/zkid-app/public/brand/zkid-logo.png" alt="ZKID logo" width="220" />
</p>

# 🔐 ZKID Stellar — Full Documentation (English)

Zero‑Knowledge Identity and Compliance with Passkeys  
Stellar Soroban + Circom + React + ElizaOS

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

<p align="center">
  <img src="docs/assets/landing.png" alt="ZKID Stellar UI preview" width="1024" />
</p>

## Table of Contents

- What is ZKID Stellar
- Features
- Tech Stack
- Repository Structure
- Prerequisites
- Quickstart
- Detailed Guides
  - Build Circuits
  - Build & Test Contracts
  - Frontend
  - AI Assistant (ElizaOS)
- Deployment (Soroban)
- Configuration & Environment
- Integrity & Verification
- Troubleshooting
- Security & Privacy
- Roadmap
- Contributing & License
- Makefile Targets
- Contract Error Codes
- WASM Artifact Sizes

---

## What is ZKID Stellar

ZKID Stellar is a privacy‑first identity & compliance platform. Users generate Groth16 proofs locally to attest attributes (e.g., age ≥ threshold) without revealing raw data. On chain, a Verifier validates proofs; a Registry issues revocable & expirable soulbound credentials; a Compliance Oracle maintains sanctions and explanation metadata. An AI assistant (ElizaOS) provides explainable compliance locally.

## Features

- Client‑side ZK proof generation (snarkjs)
- On‑chain verification (Soroban, BN254 pairing)
- Passkeys (WebAuthn) support
- Soulbound credentials (non‑transferable) with expiry & revocation
- Compliance oracle with explanation hash + optional URI
- Local AI assistant (Bun + Ollama + ElizaOS)
- Small WASM contracts (≈ 6–13 KB)

## Tech Stack

- Circuits: Circom 2.x + snarkjs 0.7.x
- Contracts: Rust (Soroban)
- SDK: TypeScript
- Frontend: React + Vite
- AI: ElizaOS + Bun + local models (Ollama)

## Repository Structure

- `contracts/` — Verifier, Credential Registry, Compliance Oracle (Rust)
- `circuits/` — Circom sources and artifacts (wasm, zkey, vk)
- `sdk/zkid-sdk/` — TypeScript SDK
- `frontend/zkid-app/` — React dApp
- `eliza_bot/` — AI assistant
- `docs/` — Documentation (see docs/README.md)

## Prerequisites

- Node 18+, npm
- Rust + cargo + `soroban-cli`
- Circom 2.1.5+, snarkjs 0.7.x
- Git

## Quickstart

### One-Command Startup (Recommended)

Start the entire system (frontend + bot) with a single command:

```bash
bash scripts/start-all.sh --with-bot --no-test
```

This script will:

1. Install all dependencies (monorepo + SDK + frontend + bot)
2. Build Soroban contracts and SDK
3. Compile ZK circuits (or skip with `--skip-circuits`)
4. Start frontend dev server (http://localhost:5173)
5. Start Eliza bot (http://localhost:3000)

**Available flags:**

- `--with-bot` — Start Eliza bot alongside frontend
- `--no-test` — Skip test execution (faster startup)
- `--skip-circuits` — Don't recompile circuits (use existing artifacts)
- `--port <n>` — Custom frontend port (default: 5173)
- `--help` — Show all options

**Stop all services:**

```bash
# Use the PIDs shown in terminal output
kill <FRONTEND_PID> <BOT_PID>
# Or press Ctrl+C in the terminal running the script
```

### Manual Startup (Alternative)

Use the Makefile for step-by-step control:

```bash
make install
make build
make test
make app-dev
# optional
npm run eliza:dev
```

Open http://localhost:5173 for the dApp, http://localhost:3000 for ElizaOS.

## Detailed Guides

See `docs/` for complete guides. Highlights below.

## Current Testnet Deployment

**Last Deployment:** November 10, 2025  
**Deployer:** `GA3SMP7WZIP7G3RGLAXETC3GKK7LTKV7COLMQBOKGN7G5JQQ25GEEBYS` (identity: admin)

### Soroban Contracts

- **Verifier:** `CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F>
- **Credential Registry:** `CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4>
- **Compliance Oracle:** `CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC>

### Frontend (Vercel)

- **Production URL:** <https://zkid-stellar.vercel.app>
- **Vercel Dashboard:** <https://vercel.com/jistrianedroid-3423s-projects/zkid-stellar>
- **Status:** ● Ready (Production)
- **Framework:** Vite
- **Network:** Testnet (Stellar)

### Recent Updates (November 10, 2025)

- **CRITICAL FIX:** Deterministic credential ID generation in `issue_credential`
  - Root cause discovered: `env.crypto().sha256()` returns different values during simulation vs execution
  - Solution: Use `proof_hash` directly as credential ID (no hashing)
  - Result: 100% success rate on credential issuance, zero footprint errors
  - Technical detail: Storage keys now deterministic between simulate and execute phases
- **Dashboard Credential Tracking:** Implemented hybrid localStorage + on-chain verification system
  - Credentials stored locally after issuance (`storeCredentialLocally()`)
  - Dashboard fetches from localStorage and verifies status on-chain via `get_credential()`
  - Real-time status updates: active, revoked, or expired
  - No dependency on RPC events API (more reliable and performant)
- Regenerated SDK & TypeScript bindings with new contract IDs
- Improved simulation logging and invokeHostFunction error decoding
- Full re-deploy of verifier, registry and oracle contracts

Notes:

- Compliance Oracle admin is set to the deployer address.
- Prefer building contracts with Stellar CLI (wasm32v1-none) for deploys.
- Use `scripts/deploy-with-identity.sh` for deployment with Stellar CLI identities.

### Build Circuits

```bash
bash scripts/compile-circuits.sh
```

Manual (reference): compile → ptau → setup → contribute → export VK → copy wasm.  
Artifacts under `circuits/artifacts/<circuit>/`.

### Build & Test Contracts

Recommended build (Stellar CLI):

```bash
stellar contract build --package verifier
stellar contract build --package compliance_oracle
stellar contract build --package credential_registry
```

Tests:

```bash
cd contracts && cargo test
```

WASM output: `target/wasm32v1-none/release/*.wasm` (CLI) or `target/wasm32-unknown-unknown/release/*.wasm` (legacy)

### Frontend

```bash
cd frontend/zkid-app
npm run dev
```

### AI Assistant (ElizaOS)

```bash
npm run eliza:dev
```

Runs locally (Bun + Ollama models). Fully private.

## Deployment (Soroban)

Follow `docs/DEPLOY_SOROBAN.md` for network config, account funding, deploy, and initialization.  
Store contract IDs in a `.env`/config file for the SDK and frontend.

## Configuration & Environment

Common variables (testnet deployment):

```
SOROBAN_RPC=https://soroban-testnet.stellar.org:443
SOROBAN_NETWORK="Test SDF Network ; September 2015"
VERIFIER_ID=CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F
CREDENTIAL_REGISTRY_ID=CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4
COMPLIANCE_ORACLE_ID=CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC
```

## Integrity & Verification

- Pin circuit versions; track checksums (wasm, zkey, vk JSON).
- Publish contract WASM sizes and commit hashes.
- Consider Subresource Integrity (SRI) for circuit assets in production.

## Troubleshooting

| Issue                 | Cause                             | Fix                                                                    |
| --------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Invalid proof         | VK mismatch                       | Re-export VK and set in Verifier.                                      |
| Deploy fails          | Unfunded account                  | Use testnet friendbot.                                                 |
| CLI arg parse         | Wrong encoding                    | Use SDK or base64/xdr helpers.                                         |
| Frontend white screen | Module export error               | Check browser console; ensure matching `@stellar/stellar-sdk` versions |
| React Router warning  | Future flag not set               | Verify `future={{ v7_startTransition: true }}` in RouterProvider       |
| Bot interop warnings  | Star exports in contract packages | Non-blocking; can fix by using named exports                           |

## Security & Privacy

- No raw PII on chain or servers.
- Client‑side proofs; only commitments are on chain.
- Contracts use explicit error enums (no panics).
- Ownership checks for revocation.

## Roadmap

See `docs/ROADMAP.md` for phases, goals, and risks.  
Event system migration planned with future Soroban SDK.

## Contributing & License

Contributions welcome (open PRs).  
License: MIT.

---

## Makefile Targets

| Target                | Description                                      |
| --------------------- | ------------------------------------------------ |
| `make install`        | Install all dependencies (root + SDK + frontend) |
| `make build`          | Build SDK and Soroban contracts (release)        |
| `make test`           | Run SDK and contract tests                       |
| `make circuits-build` | Compile Circom circuits (artifact regeneration)  |
| `make app-dev`        | Start frontend dev server                        |
| `make deploy-testnet` | Run deployment script (testnet)                  |
| `make clean`          | Remove build artifacts                           |

## Contract Error Codes

| Contract            | Error Enum        | Examples                                                    |
| ------------------- | ----------------- | ----------------------------------------------------------- |
| Verifier            | `VerifierError`   | `VkNotSet`, `EmptyProof`, `EmptyInputs`, `InvalidProofSize` |
| Credential Registry | `CredentialError` | `NotFound`, `AlreadyRevoked`, `Expired`, `Unauthorized`     |
| Compliance Oracle   | `ComplianceError` | `AdminNotSet`, `Unauthorized`, `AdminAlreadySet`            |

All fallible functions return `Result<_, ErrorEnum>` and avoid `panic!`.

## WASM Artifact Sizes (Approx)

| Contract                 | Size    |
| ------------------------ | ------- |
| verifier.wasm            | ~6.4 KB |
| credential_registry.wasm | ~13 KB  |
| compliance_oracle.wasm   | ~6.9 KB |

Release profile uses `opt-level="z"`, LTO, and symbol stripping.

---

## Scaffold Stellar Integration

This repository is wired with a Scaffold-style setup to generate and consume typed TS clients for Soroban contracts.

- Central config: `stellar.toml` defines networks, build commands and deployed IDs.
- Clients: generated to `packages/<contract>` with a `Client` class exposing typed methods.
- SDK shim: `sdk/zkid-sdk/src/client/contracts.ts` re-exports clients as `VerifierClient`, `CredentialRegistryClient`, `ComplianceOracleClient`.
- Frontend: services wrap `signAndSend` with a wallet signer (Freighter or passkey fallback) and provide simple functions like `verifyIdentityProofService`.

Quick usage:

```ts
import { VerifierClient } from 'zkid-sdk/client/contracts'
import { Networks } from '@stellar/stellar-sdk'

const verifier = new VerifierClient({
  contractId: 'CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F',
  networkPassphrase: Networks.TESTNET,
  rpcUrl: 'https://soroban-testnet.stellar.org',
})

const version = await (await verifier.version()).simulate()

const signer = await getWalletSigner()
const tx = await verifier.verify_identity_proof(Buffer.from(proof), Buffer.from(inputs))
const res = await tx.signAndSend(signer)
```

Regenerate clients after contract changes:

```bash
make build
npm run build:clients
npm run build -w sdk/zkid-sdk
```
