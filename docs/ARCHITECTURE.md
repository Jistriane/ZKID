# ZKID Stellar Architecture

## 1. High-Level Overview

ZKID Stellar is a privacy-preserving identity & compliance platform on Stellar Soroban. Users prove attributes (e.g., age ≥ threshold) via zero-knowledge proofs (Groth16) generated locally, then optionally mint revocable, expirable soulbound credentials. A compliance oracle tracks sanctions and attaches explainable metadata. An AI assistant (ElizaOS) provides human-friendly explanations entirely locally.

## 2. Core Components

| Component           | Language       | Purpose                                                                     |
| ------------------- | -------------- | --------------------------------------------------------------------------- |
| Circuits (Circom)   | Circom         | Define constraints for attribute proofs (age, country, income).             |
| Proof Runtime       | snarkjs (JS)   | Client-side generation of Groth16 proofs & verification key management.     |
| Verifier Contract   | Rust (Soroban) | On-chain Groth16 verification using stored verification key and commitment. |
| Credential Registry | Rust (Soroban) | Issue, store (hash-based), revoke, and validate soulbound credentials.      |
| Compliance Oracle   | Rust (Soroban) | Admin-managed sanctions + explanation metadata (hash + optional URI).       |
| SDK                 | TypeScript     | Abstractions for proof generation, contract invocation, error handling.     |
| Frontend dApp       | React + Vite   | UI flows: Proof creation, credential issuance, compliance checks, passkeys. |
| AI Assistant        | ElizaOS + Bun  | Local conversational compliance/explanation interface.                      |

## 3. Data Flow

1. User enters minimal data locally (e.g., birth year).
2. Circom circuit compiled to wasm + zkey; snarkjs generates a Groth16 proof.
3. The proof and public inputs commitment are sent to the Verifier contract.
4. If valid, the user can request credential issuance (registry contract).
5. Credential stored as hashed identifiers + metadata (expiry, revoke flag).
6. Compliance checks query the Oracle (sanctions + explanation hash).
7. Frontend displays result and optionally fetches off-chain explanation (if URI known).
8. AI assistant augments user understanding (local model, no PII leakage).

## 4. Trust & Security Model

| Aspect               | Approach                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Proof correctness    | Relies on Groth16 soundness & correct circuit compilation.                               |
| Data privacy         | Only hash commitments & boolean flags stored on-chain.                                   |
| Credential integrity | Soulbound: owner address binding + revocation logic.                                     |
| Oracle authority     | Single admin address (upgradeable later to multisig / DAO).                              |
| Key management       | Verification key set once by trusted initializer (admin).                                |
| Replay protection    | Proof validity tied to deterministic commitment; no state mutation from verifying alone. |
| Frontend integrity   | User must trust served artifacts (recommend checksum & Subresource Integrity for wasm).  |

## 5. Storage Layout (Soroban)

| Contract            | Key Space                                             | Values                                                        |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Verifier            | Vk (instance)                                         | Verification key JSON compressed.                             |
| Credential Registry | `cred:<id>`                                           | Struct { owner, issued_at, expires_at, revoked, proof_hash }. |
| Compliance Oracle   | Admin (instance), `sanction:<hash>`, `explain:<hash>` | Booleans + explanation tuple { explanation_hash, uri? }.      |

## 6. Zero-Knowledge Pipeline

1. Circuit design (constraint logic).
2. Powers of Tau (ptau) trusted setup download.
3. Phase 2 zkey ceremony (optional contributions).
4. Export verification key (JSON).
5. Frontend loads wasm + zkey to generate proof.
6. Verifier contract stores verification key hash & uses precompiled pairing operations.
7. Public inputs hashed (SHA256) to reduce on-chain footprint.
8. Contract performs pairing check → returns success/failure.

## 7. Credential Lifecycle

| Stage    | Action                                                        |
| -------- | ------------------------------------------------------------- |
| Issue    | User proves attribute → Registry stores credential record.    |
| Validate | Frontend or another contract queries is_valid(credential_id). |
| Revoke   | Owner or authorized entity calls revoke (revoked = true).     |
| Expire   | Time-based check (expires_at < now) returns false validity.   |
| Audit    | Events emit (issue, revoke) for external indexing.            |

## 8. Compliance & Explanation Flow

1. Admin flags a hash as sanctioned (set_sanction_status).
2. Optional explanation added (set_explanation) with hash + URI pointing to off-chain doc.
3. Query `check_sanctions_list` returns boolean.
4. Query `get_explanation` returns explanation tuple (hash + URI optional).
5. Frontend may fetch content if URI provided; AI assistant summarizes locally.

## 9. Error Handling Strategy

Each contract defines a `#[contracterror]` enum. All mutating & query functions returning multi-step logic use `Result<_, ErrorEnum>` instead of panics. Frontend maps numeric codes to TypeScript enums (planned in SDK updates).

## 10. Events

Currently using legacy tuple-based `env.events().publish((symbol_short!("evt"), topic), data)` due to SDK version limitations. Migration path: upgrade Soroban SDK → adopt `#[contractevent]` for typed events.

## 11. Performance Considerations

- WASM sizes kept small (6–13 KB).
- Groth16 chosen for fast verification & small proof size.
- Off-chain proof generation avoids contract compute.
- Hash commitments reduce public input size.
- Release profile: size optimization (`opt-level="z"`, LTO, strip).

## 12. Extension Points

| Area                 | Potential Extension                                             |
| -------------------- | --------------------------------------------------------------- |
| Credentials          | Multi-attribute aggregation, selective disclosure proofs.       |
| Compliance Oracle    | DAO governance, timelocked changes, Merkle-based batch updates. |
| Proof Scheme         | Migration to Plonk/EVM-friendly schemes for cross-chain usage.  |
| Storage Optimization | Compression, batched credential issuance, layered indexing.     |
| Events               | Rich typed events for analytics & indexing.                     |

## 13. Threat Model (Summary)

| Threat                             | Mitigation                                                                |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Malicious circuit tampering        | Pin circuit hash & publish checksum; encourage reproducible builds.       |
| Unauthorized credential revocation | Owner auth check (`require_auth`).                                        |
| Oracle admin compromise            | Future multisig + on-chain governance.                                    |
| Frontend supply-chain attack       | Recommend checksum verification + offline bundle distribution.            |
| Proof replay in different context  | Public inputs hashed; context binding recommended (add domain separator). |

## 14. Future Architecture Evolutions

- Event system migration.
- Cross-chain credential synchronization (bridge contract + Merkle root anchoring).
- Decentralized setup (multi-party ceremony artifacts registry).
- Privacy-preserving selective revocation proofs.

## 15. Diagram (Textual)

```
[User Browser]
  |--(input minimal data)--> [Proof Generator (snarkjs)]
  |--(proof + hash)--> [Verifier Contract]
  |<--(valid flag)----|
  |--(issue request)--> [Credential Registry]
  |<--(credential id)--|
  |--(check sanctions)-> [Compliance Oracle]
  |<--(status+expl)----|
  |--(explanation ask)-> [Local AI Assistant]
```

## 16. Glossary

- Commitment: Hash of public inputs used in proof context.
- Soulbound: Non-transferable asset tied to an address.
- Revocation: Setting a credential to invalid state regardless of expiry.
- Explanation Hash: Hash of off-chain compliance narrative or legal document.

---

This document provides architectural grounding. Request more depth (e.g., sequence diagrams) if needed.
