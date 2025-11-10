# Build & Tooling Guide

## 1. Overview

Describes how to build all artifacts: circuits, contracts, SDK, frontend. Provides optimization notes and CI suggestions.

## 2. Layers

| Layer        | Toolchain        | Output                            |
| ------------ | ---------------- | --------------------------------- |
| Circuits     | Circom + snarkjs | wasm, zkey, verification key JSON |
| Contracts    | Rust + Cargo     | optimized WASM (Soroban)          |
| SDK          | TypeScript + tsc | dist/ library bundle              |
| Frontend     | Vite + React     | dev server / production build     |
| AI Assistant | Bun + ElizaOS    | local service runtime             |

## 3. Makefile Targets

| Target                | Action                                         |
| --------------------- | ---------------------------------------------- |
| `make install`        | Install all JS/NPM deps (root, SDK, frontend). |
| `make build`          | Build SDK + contracts.                         |
| `make test`           | Run SDK + contract tests.                      |
| `make app-dev`        | Start frontend dev server.                     |
| `make circuits-build` | Compile circuits via script.                   |
| `make deploy-testnet` | Run deployment script (placeholder).           |
| `make clean`          | Remove build artifacts.                        |

## 4. Contracts Build

Optimization flags found in `Cargo.toml` release profile:

- `opt-level = "z"` → size optimization
- `lto = true` → link-time optimization
- `strip = true` → remove symbols

Build:

```bash
cargo build --release --target wasm32-unknown-unknown
```

Output: `target/wasm32-unknown-unknown/release/*.wasm`

## 5. Circuits Build

Script: `scripts/compile-circuits.sh` (wraps circom + snarkjs).
Artifacts placed under `circuits/artifacts/<name>/`.

Manual flow (reference): compile → powers of tau download → setup → contribute → export VK → copy wasm.

## 6. SDK Build

```bash
cd sdk/zkid-sdk
npm run build
```

Generates TypeScript declarations + JS output (check `dist/`). Planned addition: contract bindings generation via `soroban-cli`.

## 7. Frontend Build

Dev:

```bash
npm run dev
```

Production:

```bash
npm run build
```

Outputs to `frontend/zkid-app/dist/`.

## 8. AI Assistant Build

```bash
cd eliza_bot
bun install
bun run dev
```

Uses local models via Ollama.

## 9. Caching Strategies (CI)

| Layer              | Cache Key Suggestions              |
| ------------------ | ---------------------------------- |
| Node modules       | OS + lockfile hash                 |
| Cargo registry     | Rust version + Cargo.lock hash     |
| Circuits artifacts | Circuit source hash + ptau version |
| Wasm outputs       | Rust + contract source hash        |

## 10. CI Pipeline Outline

1. Checkout & restore caches.
2. Install toolchains (Rust, Node, Circom optional).
3. `make build`
4. `make test`
5. Security checks (lint, formatting, wasm size gate).
6. Artifact upload (wasm, zkey, VK).
7. (Optional) Deploy on tagged release.

## 11. Common Issues

| Issue              | Cause                        | Fix                                 |
| ------------------ | ---------------------------- | ----------------------------------- |
| Large WASM size    | Missing release profile      | Ensure `--release` + size opts.     |
| Circuit mismatch   | Outdated zkey                | Re-run setup & export VK.           |
| Type errors in SDK | Out-of-sync contract changes | Regenerate bindings & update types. |

## 12. Future Build Enhancements

- Automated contract bindings generation.
- Deterministic reproducible builds with hashed outputs.
- Multi-target cross-chain build scripts.
- Wasm size regression checks.

---

End of build guide.
