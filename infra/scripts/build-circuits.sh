#!/usr/bin/env bash
set -euo pipefail

# Placeholder: ajustar paths conforme instalação local de circom/snarkjs
CIRCUITS_DIR="circuits"
ART_DIR="circuits/artifacts"

mkdir -p "$ART_DIR/age_verification" "$ART_DIR/country_verification" "$ART_DIR/income_threshold"

echo "[info] Compile age_verification (ajuste comandos conforme seu ambiente)"
echo "circom $CIRCUITS_DIR/age_verification.circom --r1cs --wasm --sym -o $ART_DIR/age_verification"
echo "snarkjs groth16 setup $ART_DIR/age_verification/age_verification.r1cs <ptau> $ART_DIR/age_verification/age_verification.zkey"
echo "snarkjs zkey export verificationkey $ART_DIR/age_verification/age_verification.zkey $ART_DIR/age_verification/verification_key.json"

echo "[info] Repita para country_verification e income_threshold"
