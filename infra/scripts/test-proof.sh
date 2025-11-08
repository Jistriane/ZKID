#!/usr/bin/env bash
set -euo pipefail

# Script para testar prova local de um circuito
# Uso: ./test-proof.sh age_verification

CIRCUIT=${1:-age_verification}
CIRCUITS_DIR="circuits"
ART_DIR="circuits/artifacts/$CIRCUIT"

if [ ! -f "$ART_DIR/${CIRCUIT}.wasm" ]; then
  echo "[erro] Artefatos não encontrados. Compile o circuito primeiro."
  exit 1
fi

INPUT_FILE="$CIRCUITS_DIR/example_${CIRCUIT//_verification/}_input.json"
if [ ! -f "$INPUT_FILE" ]; then
  echo "[aviso] Input example não encontrado: $INPUT_FILE. Usando input.json genérico."
  INPUT_FILE="input.json"
fi

echo "[info] Gerando prova para $CIRCUIT com input $INPUT_FILE..."
snarkjs groth16 fullprove "$INPUT_FILE" \
  "$ART_DIR/${CIRCUIT}_js/${CIRCUIT}.wasm" \
  "$ART_DIR/${CIRCUIT}.zkey" \
  proof.json public.json

echo "[info] Verificando prova localmente..."
snarkjs groth16 verify \
  "$ART_DIR/verification_key.json" \
  public.json proof.json

echo "[sucesso] Prova válida!"
