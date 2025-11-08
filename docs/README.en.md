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

- Verifier: `CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC
- Credential Registry: `CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5
- Compliance Oracle: `CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM

Notes:
- Compliance Oracle admin is set to the deployer address.
- Prefer building contracts with Stellar CLI (wasm32v1-none) for deploys.

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
VERIFIER_ID=CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC
CREDENTIAL_REGISTRY_ID=CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5
COMPLIANCE_ORACLE_ID=CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM
```

## Integrity & Verification
- Pin circuit versions; track checksums (wasm, zkey, vk JSON).  
- Publish contract WASM sizes and commit hashes.  
- Consider Subresource Integrity (SRI) for circuit assets in production.

## Troubleshooting
| Issue | Cause | Fix |
|------|------|-----|
| Invalid proof | VK mismatch | Re-export VK and set in Verifier. |
| Deploy fails | Unfunded account | Use testnet friendbot. |
| CLI arg parse | Wrong encoding | Use SDK or base64/xdr helpers. |

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
| Target | Description |
|--------|-------------|
| `make install` | Install all dependencies (root + SDK + frontend) |
| `make build` | Build SDK and Soroban contracts (release) |
| `make test` | Run SDK and contract tests |
| `make circuits-build` | Compile Circom circuits (artifact regeneration) |
| `make app-dev` | Start frontend dev server |
| `make deploy-testnet` | Run deployment script (testnet) |
| `make clean` | Remove build artifacts |

## Contract Error Codes
| Contract | Error Enum | Examples |
|----------|------------|----------|
| Verifier | `VerifierError` | `VkNotSet`, `EmptyProof`, `EmptyInputs`, `InvalidProofSize` |
| Credential Registry | `CredentialError` | `NotFound`, `AlreadyRevoked`, `Expired`, `Unauthorized` |
| Compliance Oracle | `ComplianceError` | `AdminNotSet`, `Unauthorized`, `AdminAlreadySet` |

All fallible functions return `Result<_, ErrorEnum>` and avoid `panic!`.

## WASM Artifact Sizes (Approx)
| Contract | Size |
|----------|------|
| verifier.wasm | ~6.4 KB |
| credential_registry.wasm | ~13 KB |
| compliance_oracle.wasm | ~6.9 KB |

Release profile uses `opt-level="z"`, LTO, and symbol stripping.
