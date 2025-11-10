# ZKID Stellar Documentation

**Version:** 1.0.0 (Production Ready)  
**Last Updated:** November 10, 2025  
**Status:** ✅ Deployed on Testnet

## Overview

ZKID Stellar is a privacy-preserving identity and compliance system built on the Stellar blockchain. It leverages zero-knowledge proofs (ZKP) to enable users to verify attributes (such as age, country, or income) without revealing sensitive personal data. The system is modular, supporting multiple verification circuits and smart contracts for compliance, credential registry, and proof verification.

**Live Deployment:**
- **Frontend:** https://zkid-stellar.vercel.app
- **Network:** Stellar Testnet
- **Contracts:** 3 deployed and operational

## Features

- **Zero-Knowledge Proofs**: Circuits for age, country, and income verification using Circom + Groth16.
- **Smart Contracts**: Compliance Oracle, Credential Registry, and Verifier contracts written in Rust for Stellar Soroban.
- **Wallet Integration**: Native support for Freighter wallet + WebAuthn passkeys.
- **Frontend**: React + Vite web application with TypeScript for user interaction and proof generation.
- **SDK**: TypeScript SDK for integration with external apps.
- **Automation Scripts**: Shell scripts for circuit compilation, deployment, and testing.
- **AI Assistant**: ElizaOS bot for compliance explanations and user guidance.
- **Production Deployment**: Automated CI/CD via Vercel with testnet configuration.

## Architecture

### High-Level Components

1. **Circuits**: Circom-based ZKP circuits for attribute verification with wallet address binding.
2. **Smart Contracts**: Soroban contracts for compliance, credential management, and proof verification.
3. **Frontend**: React/Vite-based web app with Freighter wallet integration and passkey support.
4. **SDK**: TypeScript SDK for developers to integrate ZKID features.
5. **Automation**: Scripts for building, testing, and deploying circuits and contracts.
6. **AI Assistant**: ElizaOS bot for local compliance explanations (100% private).

**Deployed Contracts (Testnet):**
- **Verifier:** `CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F`
- **Credential Registry:** `CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4`
- **Compliance Oracle:** `CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC`

### Data Flow

1. User connects Freighter wallet to the frontend.
2. User submits attribute (e.g., age) in the frontend.
3. Frontend generates a ZKP using the relevant circuit (with wallet address binding).
4. Proof and public inputs are sent to the Verifier contract on Stellar.
5. Verifier contract validates the proof using BN254 pairing.
6. If valid, user can request credential issuance via Credential Registry.
7. Credential stored on-chain + locally (hybrid storage for instant UX).
8. Compliance checks query the Oracle for sanctions and explanations.
9. Result is returned to the frontend with real-time status updates.

**Storage Strategy:**
- **On-chain:** Credential metadata (ID, owner, dates, revocation status)
- **localStorage:** Full credential details for instant display
- **Verification:** Always validates on-chain status via `get_credential()`

### Directory Structure

- `circuits/`: Circom circuits and artifacts.
- `contracts/`: Soroban smart contracts (Rust).
- `frontend/zkid-app/`: Web application.
- `sdk/zkid-sdk/`: TypeScript SDK.
- `eliza_bot/`: Bot scripts and configuration.
- `infra/`: Docker and deployment scripts.
- `docs/`: Documentation and guides.
- `scripts/`: Shell scripts for automation.

## Roadmap

### ✅ v1.0.0 (COMPLETED - Nov 2025)

- ✅ Age, country, and income verification circuits with wallet binding
- ✅ Production Soroban contracts with typed events (`#[contractevent]`)
- ✅ Deterministic credential ID generation (proof_hash-based)
- ✅ Frontend with Freighter wallet + passkey support
- ✅ TypeScript SDK with full contract client generation
- ✅ Hybrid localStorage + on-chain credential tracking
- ✅ Production deployment on Vercel (https://zkid-stellar.vercel.app)
- ✅ ElizaOS AI assistant for compliance explanations
- ✅ Complete documentation and API examples
- ✅ Zero compilation warnings across all contracts
- ✅ Automated CI/CD pipeline

### v1.1.0 (Q1 2026)

- Multi-attribute composite proofs
- Advanced compliance logic with DAO governance
- Enhanced frontend UX with multi-wallet support
- Integration with external identity providers
- Mobile-responsive design improvements

### v2.0.0 (Q2-Q3 2026)

- Mainnet deployment with production contracts
- Cross-chain credential synchronization
- Decentralized setup (multi-party ceremony)
- Privacy-preserving selective revocation
- Community governance and contribution framework
- Support for additional blockchains (Ethereum, Polygon)

## Requirements

**Development:**
- Node.js 18+, npm
- Rust + cargo + Stellar Soroban CLI
- Circom 2.1.5+, snarkjs 0.7.x
- Git

**Production:**
- Freighter wallet browser extension
- Modern browser with WebAuthn support
- Network connection to Stellar Testnet

**Optional:**
- Docker (for local development)
- Bun runtime (for ElizaOS assistant)
- Ollama (for local AI models)

## API Examples

See `docs/API_EXAMPLES.md` for sample API calls and integration guides.

## Build & Deployment

**Quick Start:**
```bash
# One-command startup (frontend + AI assistant)
bash scripts/start-all.sh --with-bot --no-test

# Or step-by-step
make install
make build
make test
make app-dev
```

**Circuit Compilation:**
```bash
bash scripts/compile-circuits.sh
```

**Contract Deployment:**
```bash
stellar contract build --package verifier
stellar contract build --package credential_registry
stellar contract build --package compliance_oracle
bash scripts/auto-deploy.sh testnet
```

**Production Deployment:**
- Frontend: Vercel (auto-deploy on push to main)
- Contracts: Stellar Testnet via Soroban CLI
- See `docs/VERCEL_DEPLOYMENT.md` for deployment guide

## Production Metrics

**Performance:**
- Frontend build time: ~12s
- Proof generation: <2s client-side
- Contract WASM sizes: 6-13 KB (optimized)
- On-chain verification: <1s

**Reliability:**
- ✅ 100% credential issuance success rate (after deterministic ID fix)
- ✅ Zero contract panics (all errors via Result enums)
- ✅ Hybrid storage ensures instant UX + on-chain truth
- ✅ Automated deployments with zero downtime

**Security:**
- BN254 pairing for proof verification
- Soulbound credentials (non-transferable)
- Wallet address binding in all circuits
- Security headers on production frontend
- No PII stored on-chain

## Critical Insights

### Soroban Development Lessons

**🔴 Crypto Non-Determinism:**
- `env.crypto().sha256()` returns different values during simulation vs execution
- **Solution:** Use deterministic input data (like `proof_hash`) directly
- **Rule:** Never use `env.crypto()` for storage keys or IDs

**✅ Event System:**
- Successfully migrated to `#[contractevent]` for typed events
- Enables better indexing and off-chain monitoring

**📊 Storage Optimization:**
- Hybrid approach: localStorage (UX) + on-chain (truth)
- Eliminates dependency on RPC events API
- Provides instant display + guaranteed accuracy

## Contact & Community

- **GitHub:** [Jistriane/ZKID](https://github.com/Jistriane/ZKID)
- **Production:** https://zkid-stellar.vercel.app
- **Issues:** GitHub Issues for bug reports and feature requests
- **Documentation:** Complete guides in `docs/` folder

---

For detailed technical documentation:
- **Architecture:** `docs/ARCHITECTURE.md`
- **API Examples:** `docs/API_EXAMPLES.md`
- **Deployment:** `docs/VERCEL_DEPLOYMENT.md`
- **Build Guide:** `docs/BUILD.md`
- **Quickstart:** `docs/QUICKSTART.md`
