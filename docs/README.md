# ZKID Stellar Documentation Index

Welcome to the ZKID Stellar project. This directory aggregates the core knowledge required to understand, build, deploy, extend, and audit the system.

## Overview
ZKID Stellar is a zero-knowledge identity & compliance platform built on Stellar Soroban. It enables attribute verification (age, income thresholds, residency) using Groth16 proofs generated client-side, issued as revocable / expirable soulbound credentials, with an explainable compliance oracle and AI assistant (ElizaOS) fully local.

## Document Map

| Area | File | Purpose |
|------|------|---------|
| Improvements | CONTRACTS_IMPROVEMENTS.md | Changelog & rationale for smart contract refactors |
| AI Assistant | ELIZA_SETUP.md | ElizaOS setup & integration guide |
| Status | ../PROJECT_STATUS.md | Global project milestone & progress summary |
| (Planned) Architecture | ARCHITECTURE.md | System architecture (to create) |
| (Planned) Quickstart | QUICKSTART.md | End‑to‑end first run (to create) |
| (Planned) Deploy | DEPLOY_SOROBAN.md | Soroban deploy & environment (to create) |
| (Planned) Build | BUILD.md | Build flows & scripts (to create) |
| (Planned) API Examples | API_EXAMPLES.md | SDK usage / sample calls (to create) |
| (Planned) Frontend | FRONTEND_STRUCTURE.md | UI layer & state architecture (to create) |
| (Planned) Roadmap | ROADMAP.md | Strategic evolution (to create) |
| (Planned) Requirements | REQUIREMENTS.md | Functional / non‑functional specs (to create) |

> NOTE: Some planned documents are not yet authored in the repository. The table marks them. You can request me to generate any missing file now.

## Smart Contracts
- Verifier: Stores verification key & validates Groth16 proofs (BN254) with hash commitments.
- Credential Registry: Issues soulbound credentials with revocation + expiry logic.
- Compliance Oracle: Tracks sanctions state + attaches explanation metadata (hash + optional URI).

Errors use `#[contracterror]` enums; events currently use tuple publishing (legacy API) due to SDK version constraints (see CONTRACTS_IMPROVEMENTS.md).

## Circuits
Located under `circuits/` with artifacts (wasm, zkey, verification key) produced via `scripts/compile-circuits.sh`. Additional circuits can follow the same folder pattern.

## SDK
A TypeScript SDK (`sdk/zkid-sdk/`) providing:
- Proof generation helpers (wrapping snarkjs)
- Contract client abstractions
- Error mapping once TypeScript enums are added

## Frontend
React + Vite application in `frontend/zkid-app/` integrating:
- Proof generation & submission
- Credential issuance & validation flows
- Sanctions / compliance lookups
- AI assistant widget for compliance explanations

## AI Assistant (ElizaOS)
Runs locally (Bun + Ollama) and exposed to the frontend via a lightweight service. Fully private inference with local models.

## Build & Tooling
Use the Makefile for consistent flows (`make install`, `make build`, `make test`, `make app-dev`). Circuits and contracts have dedicated scripts.

## Security Principles
- Client-side proof generation (no raw PII leaves device)
- Minimal on-chain data (hashes / commitments only)
- Revocable & expirable credentials
- Transparent & auditable compliance metadata

## Next Steps (Recommended)
1. Generate missing English docs (Architecture, Quickstart, Deploy, Build, API Examples, Frontend Structure, Roadmap, Requirements).
2. Add contract integration tests & cross-contract test scenarios.
3. Regenerate TypeScript bindings & enrich SDK error typings.
4. Introduce event migration when upgrading Soroban SDK to a version supporting `#[contractevent]` without current serialization issues.

## Contributing
Follow standard GitHub flow (fork → branch → PR). See root `CONTRIBUTING.md` (Portuguese currently) — can be translated on request.

## License
MIT. See `../LICENSE`.

---
Need any of the missing documents created now? Just ask and I can scaffold them immediately.
