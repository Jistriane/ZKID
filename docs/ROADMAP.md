# ZKID Stellar Roadmap

## Vision

Provide a globally interoperable, privacy-preserving identity and compliance layer leveraging zero-knowledge and explainable AI, starting on Stellar and expanding cross-chain.

## Phase 1 – Foundation (Completed / Current)

| Item                                        | Status |
| ------------------------------------------- | ------ |
| Groth16 age proof circuit                   | ✅     |
| Verifier contract                           | ✅     |
| Credential registry (revocation + expiry)   | ✅     |
| Compliance oracle (sanctions + explanation) | ✅     |
| Local AI assistant (ElizaOS)                | ✅     |
| Basic frontend flows                        | ✅     |
| Documentation baseline                      | ✅     |

## Phase 2 – Robustness

| Item                                        | Target     |
| ------------------------------------------- | ---------- |
| Additional circuits (income, residency)     | Short-term |
| Full test suites (Registry + Oracle)        | Short-term |
| Contract bindings generation (TS)           | Short-term |
| Event system migration (`#[contractevent]`) | Medium     |
| Typed error mapping in SDK                  | Short-term |
| Proof caching & reuse                       | Medium     |

## Phase 3 – Integration & UX

| Item                                      | Target |
| ----------------------------------------- | ------ |
| Multi-wallet support (Freighter + others) | Medium |
| Passkey + wallet linking abstraction      | Medium |
| i18n (EN/PT/ES)                           | Medium |
| Rich credential dashboard (filters, tags) | Medium |
| On-chain analytics (indexer integration)  | Medium |

## Phase 4 – Governance & Scale

| Item                                        | Target |
| ------------------------------------------- | ------ |
| Multisig / DAO for compliance oracle admin  | Long   |
| Batch credential issuance                   | Long   |
| Circuit update strategy (versioning)        | Long   |
| Decentralized verification key distribution | Long   |
| Pluggable proof systems (Plonk, Halo2)      | Long   |

## Phase 5 – Cross-Chain / Interop

| Item                                               | Target |
| -------------------------------------------------- | ------ |
| Ethereum rollup bridge (credential hash anchoring) | Long   |
| Cross-chain proof verification adapters            | Long   |
| Universal DID integration (DID:PKH, DID:Web)       | Long   |
| Selective disclosure aggregated proofs             | Long   |

## Non-Functional Goals

| Goal            | Description                                             |
| --------------- | ------------------------------------------------------- |
| Performance     | Proof generation < 2s on mid-tier device (age circuit). |
| WASM Size       | Keep contract WASM < 15 KB.                             |
| Privacy         | No raw user attributes persisted on-chain.              |
| Security        | Zero panics; all error paths explicit.                  |
| Maintainability | Modular circuits & upgrade-friendly contracts.          |

## Risks & Mitigations

| Risk                            | Mitigation                                    |
| ------------------------------- | --------------------------------------------- |
| SDK drift vs contracts          | Automated binding generation.                 |
| Event API deprecation lingering | Schedule upgrade & regression tests.          |
| Oracle admin compromise         | Future multisig + hardware wallet policy.     |
| Circuit vulnerability           | Formal review + reproducible build checksums. |

## Metrics (Future Tracking)

| Metric                      | Target                  |
| --------------------------- | ----------------------- |
| Proof success rate          | > 99% valid submissions |
| Credential issuance latency | < 5s end-to-end testnet |
| Revocation propagation      | < 1 block               |
| AI response time            | < 1.5s first token      |

## Upgrade Strategy

1. Introduce version fields in credential data.
2. Maintain backward-compatible verification key storage.
3. Migrate events after Soroban SDK upgrade (shadow deployment first).
4. Cross-chain adapters as separated micro-contracts (bridge pattern).

## Long-Term Vision Extensions

- Compliance knowledge graph (hash-linked).
- Zero-knowledge selective revocation proofs.
- Privacy-preserving credential aggregation sets.
- Meta-credential layering (e.g., “Financially Eligible” derived from multiple inputs).

---

Living document; update as milestones are reached.
