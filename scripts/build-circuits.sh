#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Building ZK circuits..."

CIRCUITS_DIR="circuits"
ART_DIR="circuits/artifacts"

# Check for circom
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Install from: https://docs.circom.io/getting-started/installation/"
    exit 1
fi

# Check for snarkjs
if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs not found. Install with: npm install -g snarkjs"
    exit 1
fi

# Create artifact directories
mkdir -p "$ART_DIR/age_verification"
mkdir -p "$ART_DIR/country_verification"
mkdir -p "$ART_DIR/income_threshold"

# Resolve Powers of Tau (ptau) file
# Preferir arquivo já presente na raiz do repositório, depois em circuits/ e por fim download
ROOT_PTAU="powersOfTau28_hez_final_12.ptau"
LOCAL_PTAU="$CIRCUITS_DIR/powersOfTau28_hez_final_12.ptau"
if [ -f "$ROOT_PTAU" ]; then
    PTAU_FILE="$ROOT_PTAU"
elif [ -f "$LOCAL_PTAU" ]; then
    PTAU_FILE="$LOCAL_PTAU"
else
    echo "📥 Baixando Powers of Tau (ptau file)..."
    mkdir -p "$CIRCUITS_DIR"
    curl -L -o "$LOCAL_PTAU" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau || true
    PTAU_FILE="$LOCAL_PTAU"
fi

# Se download inicial falhar (ex.: 243 bytes), tente mirror alternativo
if [ ! -s "$PTAU_FILE" ] || [ $(stat -c%s "$PTAU_FILE" 2>/dev/null || echo 0) -lt 1024 ]; then
    echo "⚠️  PTAU em '$PTAU_FILE' parece inválido. Tentando mirror alternativo..."
    curl -L -o "$LOCAL_PTAU" https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau || true
    PTAU_FILE="$LOCAL_PTAU"
fi

# Function to compile a circuit
compile_circuit() {
    local circuit_name=$1
    echo ""
    echo "⚡ Compiling $circuit_name..."
    
    # Compile circom to r1cs + wasm + sym
    circom "$CIRCUITS_DIR/${circuit_name}.circom" \
        --r1cs \
        --wasm \
        --sym \
        -l node_modules \
        -o "$ART_DIR/${circuit_name}"
    
    # Setup proving key
    echo "🔑 Setting up proving key for $circuit_name..."
    snarkjs groth16 setup \
        "$ART_DIR/${circuit_name}/${circuit_name}.r1cs" \
        "$PTAU_FILE" \
        "$ART_DIR/${circuit_name}/${circuit_name}_0000.zkey"
    
    # Contribute to phase 2 ceremony (1 contribution for demo)
    echo "🎲 Contributing to ceremony..."
    snarkjs zkey contribute \
        "$ART_DIR/${circuit_name}/${circuit_name}_0000.zkey" \
        "$ART_DIR/${circuit_name}/${circuit_name}.zkey" \
        --name="First contribution" \
        -v -e="random entropy"
    
    # Export verification key
    echo "📤 Exporting verification key..."
    snarkjs zkey export verificationkey \
        "$ART_DIR/${circuit_name}/${circuit_name}.zkey" \
        "$ART_DIR/${circuit_name}/verification_key.json"
    
    # Move wasm to correct location
    if [ -d "$ART_DIR/${circuit_name}/${circuit_name}_js" ]; then
        cp "$ART_DIR/${circuit_name}/${circuit_name}_js/${circuit_name}.wasm" \
           "$ART_DIR/${circuit_name}/${circuit_name}.wasm"
    fi
    
    echo "✅ $circuit_name compiled successfully!"
}

# Compile each circuit
compile_circuit "age_verification"
compile_circuit "income_threshold"
compile_circuit "country_verification"

# Copy artifacts to frontend public directory
echo ""
echo "📦 Copying artifacts to frontend..."
FRONTEND_CIRCUITS="frontend/zkid-app/public/circuits/artifacts"
mkdir -p "$FRONTEND_CIRCUITS"
cp -r "$ART_DIR"/* "$FRONTEND_CIRCUITS/"

echo ""
echo "✅ All circuits built successfully!"
echo "📂 Artifacts location:"
echo "   - Source: $ART_DIR"
echo "   - Frontend: $FRONTEND_CIRCUITS"
