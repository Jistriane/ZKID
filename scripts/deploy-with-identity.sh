#!/usr/bin/env bash
# Deploy usando identidade do Stellar CLI
# Usage: ./scripts/deploy-with-identity.sh <network> <identity-name>
# Example: ./scripts/deploy-with-identity.sh testnet admin

set -e

NETWORK=${1:-testnet}
IDENTITY=${2:-admin}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🚀 ZKID Stellar Deploy (usando identidade)"
echo "Network: $NETWORK"
echo "Identity: $IDENTITY"
echo "Timestamp: $TIMESTAMP"
echo ""

# Verificar se a identidade existe
if ! stellar keys show "$IDENTITY" &>/dev/null; then
  echo "❌ Erro: Identidade '$IDENTITY' não encontrada"
  echo "Identidades disponíveis:"
  stellar keys ls
  exit 1
fi

PUBLIC_KEY=$(stellar keys address "$IDENTITY")
echo "📍 Deploying com: $PUBLIC_KEY"
echo ""

# Step 1: Build contracts
echo "📦 Step 1/5: Building contracts..."
stellar contract build --package verifier
stellar contract build --package compliance_oracle
stellar contract build --package credential_registry
echo "✅ Contracts built successfully"
echo ""

# Step 2: Deploy Verifier
echo "🔐 Step 2/5: Deploying Verifier..."
VERIFIER_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/verifier.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$VERIFIER_ID" ]; then
  echo "❌ Verifier deployment failed"
  exit 1
fi
echo "✅ Verifier deployed: $VERIFIER_ID"
echo ""

# Step 3: Deploy Compliance Oracle
echo "🛡️  Step 3/5: Deploying Compliance Oracle..."
COMPLIANCE_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/compliance_oracle.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$COMPLIANCE_ID" ]; then
  echo "❌ Compliance Oracle deployment failed"
  exit 1
fi
echo "✅ Compliance Oracle deployed: $COMPLIANCE_ID"
echo ""

# Step 4: Initialize Compliance Oracle
echo "🔧 Step 4/5: Initializing Compliance Oracle..."
INIT_TX=$(stellar contract invoke \
  --id "$COMPLIANCE_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- \
  init \
  --admin "$PUBLIC_KEY" 2>&1 | grep -oP '[a-f0-9]{64}' | tail -1)

if [ -z "$INIT_TX" ]; then
  echo "⚠️  Warning: Compliance Oracle initialization may have failed (or already initialized)"
else
  echo "✅ Compliance Oracle initialized: $INIT_TX"
fi
echo ""

# Step 5: Deploy Credential Registry
echo "📋 Step 5/5: Deploying Credential Registry..."
REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/credential_registry.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$REGISTRY_ID" ]; then
  echo "❌ Credential Registry deployment failed"
  exit 1
fi
echo "✅ Credential Registry deployed: $REGISTRY_ID"
echo ""

# Save deployment info
cat > deploy/last_deploy.json <<EOF
{
  "network": "$NETWORK",
  "rpcUrl": "https://soroban-$NETWORK.stellar.org",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "deployerPublicKey": "$PUBLIC_KEY",
  "contracts": {
    "verifier": {
      "id": "$VERIFIER_ID",
      "wasm": "target/wasm32v1-none/release/verifier.wasm"
    },
    "credential_registry": {
      "id": "$REGISTRY_ID",
      "wasm": "target/wasm32v1-none/release/credential_registry.wasm"
    },
    "compliance_oracle": {
      "id": "$COMPLIANCE_ID",
      "wasm": "target/wasm32v1-none/release/compliance_oracle.wasm",
      "init": {
        "admin": "$PUBLIC_KEY",
        "tx": "$INIT_TX"
      }
    }
  },
  "explorer": "https://stellar.expert/explorer/$NETWORK",
  "timestamp": "$TIMESTAMP"
}
EOF

echo "✅ Deployment info saved to deploy/last_deploy.json"
echo ""
echo "🎉 Deploy completed successfully!"
echo ""
echo "📊 Contract Summary:"
echo "  Verifier:           $VERIFIER_ID"
echo "  Credential Registry: $REGISTRY_ID"
echo "  Compliance Oracle:   $COMPLIANCE_ID"
echo ""
echo "🌐 View on Explorer:"
echo "  https://stellar.expert/explorer/$NETWORK/contract/$VERIFIER_ID"
echo ""
echo "📝 Next steps:"
echo "  1. Update SDK contract IDs: npm run build:clients"
echo "  2. Rebuild SDK: cd sdk/zkid-sdk && npm run build"
echo "  3. Test deployment: npm test"
