# Circuit Artifacts Build Guide

This directory contains ZK circuit artifacts for ZKID proofs. The circuits are written in Circom and compiled to WebAssembly + zkey files for use in the browser.

## Prerequisites

To build circuit artifacts, you need:

### 1. Install Circom

```bash
# Ubuntu/Debian
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

Or download pre-built binaries from: https://docs.circom.io/getting-started/installation/

### 2. Install snarkjs

```bash
npm install -g snarkjs
```

## Building Circuits

Once prerequisites are installed:

```bash
# From project root
bash scripts/build-circuits.sh
```

This will:

1. Download Powers of Tau file (~50MB) if needed
2. Compile each circuit (age_verification, income_threshold, country_verification)
3. Generate proving/verification keys
4. Copy artifacts to `frontend/zkid-app/public/circuits/artifacts/`

## Circuit Specifications

### age_verification.circom

- **Inputs**: birthYear (private), currentYear (public), minAge (public)
- **Output**: 1 if age >= minAge, 0 otherwise
- **Size**: ~32-bit arithmetic

### income_threshold.circom

- **Inputs**: income (private), threshold (public)
- **Output**: 1 if income >= threshold
- **Uses**: circomlib GreaterEqThan(32)

### country_verification.circom

- **Inputs**: countryCode (private), targetCode (public)
- **Output**: 1 if codes match
- **Uses**: circomlib IsEqual()

## Development Without Artifacts

The SDK includes mock proof generation for development. If artifacts are not present at runtime, the SDK will:

- Return mock proof objects
- Log warnings to console
- Allow UI/flow testing without real ZK proofs

Production deployments should include real artifacts.

## Troubleshooting

**Missing circomlib:**

```bash
npm install -g circomlib
```

**PowersOfTau download fails:**
Download manually from https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

**Out of memory during compilation:**
Use a smaller ptau file (e.g., `powersOfTau28_hez_final_10.ptau`) or increase Node.js memory:

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

## Artifact Structure

After building, artifacts are organized as:

```
circuits/artifacts/
├── age_verification/
│   ├── age_verification.wasm
│   ├── age_verification.zkey
│   ├── verification_key.json
│   └── age_verification.r1cs
├── income_threshold/
│   └── ... (same structure)
└── country_verification/
    └── ... (same structure)
```

Frontend loads `.wasm` and `.zkey` files from `public/circuits/artifacts/` at runtime.
