# Requirements Specification

## 1. Functional Requirements

| ID    | Requirement                                                         | Priority |
| ----- | ------------------------------------------------------------------- | -------- |
| FR-1  | User can generate zero-knowledge age proof locally.                 | High     |
| FR-2  | System verifies proof on-chain via Verifier contract.               | High     |
| FR-3  | User can request credential issuance post-verification.             | High     |
| FR-4  | Credentials are non-transferable (soulbound).                       | High     |
| FR-5  | Credential can be revoked by owner.                                 | High     |
| FR-6  | Credential auto-invalidates after expiry timestamp.                 | High     |
| FR-7  | Compliance oracle returns sanction status by proof/credential hash. | High     |
| FR-8  | Admin can set/change sanction status.                               | High     |
| FR-9  | Admin can attach explanation hash + optional URI.                   | Medium   |
| FR-10 | System exposes explanation retrieval by hash.                       | Medium   |
| FR-11 | Frontend displays credential validity state.                        | High     |
| FR-12 | Frontend integrates passkeys for passwordless auth.                 | Medium   |
| FR-13 | SDK provides simplified proof + contract invocation APIs.           | High     |
| FR-14 | AI assistant answers compliance questions locally.                  | Medium   |
| FR-15 | All contract mutating functions perform auth checks.                | High     |
| FR-16 | Errors surfaced as structured enum types (not panics).              | High     |
| FR-17 | Proof generation does not leak raw inputs externally.               | High     |
| FR-18 | User can view sanction explanation metadata if exists.              | Medium   |
| FR-19 | Build artifacts reproducible (scripts).                             | Medium   |
| FR-20 | Documentation available in English.                                 | High     |

## 2. Non-Functional Requirements

| ID     | Requirement                | Target                                        |
| ------ | -------------------------- | --------------------------------------------- |
| NFR-1  | Proof generation latency   | < 2s (age circuit)                            |
| NFR-2  | Contract verification time | < 500ms RPC round-trip                        |
| NFR-3  | WASM size (per contract)   | < 15 KB release                               |
| NFR-4  | Availability               | 99% (testnet assumptions)                     |
| NFR-5  | Privacy                    | No PII stored on-chain or server              |
| NFR-6  | Security                   | No panics; explicit error handling            |
| NFR-7  | Maintainability            | Modular code & documented architecture        |
| NFR-8  | Extensibility              | New circuits pluggable without major refactor |
| NFR-9  | Internationalization       | Ready for multi-language expansion            |
| NFR-10 | Observability              | Event emission for issue/revoke actions       |

## 3. User Roles

| Role             | Capabilities                                           |
| ---------------- | ------------------------------------------------------ |
| End User         | Generate proofs, issue credentials, view status.       |
| Credential Owner | Revoke own credentials.                                |
| Compliance Admin | Set sanctions, attach explanations, initialize oracle. |
| Developer        | Extend circuits, update contracts, integrate SDK.      |
| Auditor          | Inspect on-chain events, verify code against spec.     |

## 4. Constraints

| Constraint                              | Impact                                        |
| --------------------------------------- | --------------------------------------------- |
| Soroban SDK version limitation (events) | Use legacy tuple events until upgrade.        |
| Groth16 trusted setup requirement       | Must trust ptau source; enable contributions. |
| Client compute limits                   | Proof generation must remain lightweight.     |
| Testnet reliability                     | Occasional RPC delays; implement retries.     |

## 5. Assumptions

- Users have access to modern browsers supporting WebAuthn.
- Circuits remain relatively small (no complex multi-attribute joins yet).
- Single admin model acceptable for initial compliance oracle phase.

## 6. Acceptance Criteria (Samples)

| Req   | Criteria                                                                                  |
| ----- | ----------------------------------------------------------------------------------------- |
| FR-2  | Given a valid proof & correct VK, contract returns success `Result<bool, _>` with `true`. |
| FR-5  | After revoke call by owner, `is_valid` returns false.                                     |
| FR-7  | Sanctioned hash returns `true` from `check_sanctions_list`.                               |
| FR-16 | No `panic!` occurrences discovered via code audit.                                        |
| NFR-3 | Contract WASM sizes measured under threshold (< 15 KB).                                   |

## 7. Risk Analysis (Selective)

| Risk                               | Severity | Mitigation                                          |
| ---------------------------------- | -------- | --------------------------------------------------- |
| Incorrect circuit                  | High     | Peer review & deterministic build scripts.          |
| VK not updated post-circuit change | Medium   | Add version check; disallow mismatched circuit IDs. |
| Admin key loss                     | High     | Plan multisig recovery in next phase.               |
| Proof misuse (context)             | Medium   | Domain separation (future update).                  |

## 8. Compliance & Legal Notes

- Provides explanatory metadata only; NOT legal advice.
- Hashes of explanations allow tamper-evident referencing.
- Future integration may include signed regulatory position statements.

## 9. Future Requirements (Planned)

| ID    | Proposed Requirement                       | Priority |
| ----- | ------------------------------------------ | -------- |
| FR-21 | Multi-attribute aggregated proof           | Medium   |
| FR-22 | Off-chain credential backup & restore flow | Medium   |
| FR-23 | DAO-governed compliance admin              | Long     |
| FR-24 | Selective disclosure of credential subset  | Long     |

## 10. Traceability (Example)

```
Circuit spec (age) -> Groth16 proof -> Verifier::verify_identity_proof -> Issue credential -> Registry storage -> Event emission -> Frontend validity badge
```

---

Living spec. Update as roadmap evolves.
