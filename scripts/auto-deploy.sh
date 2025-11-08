#!/usr/bin/env bash
# Auto-deploy script for ZKID Stellar contracts
# Usage: ./scripts/auto-deploy.sh <network> <secret-key>
# Example: ./scripts/auto-deploy.sh testnet SCVOS4PVP...

set -e

NETWORK=${1:-testnet}
SECRET_KEY=${2:-}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ -z "$SECRET_KEY" ]; then
  echo "❌ Error: SECRET_KEY is required"
  echo "Usage: $0 <network> <secret-key>"
  exit 1
fi

echo "🚀 ZKID Stellar Auto-Deploy"
echo "Network: $NETWORK"
echo "Timestamp: $TIMESTAMP"
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
  --source-account "$SECRET_KEY" \
  --network "$NETWORK" \
  --alias verifier 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

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
  --source-account "$SECRET_KEY" \
  --network "$NETWORK" \
  --alias compliance_oracle 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$COMPLIANCE_ID" ]; then
  echo "❌ Compliance Oracle deployment failed"
  exit 1
fi
echo "✅ Compliance Oracle deployed: $COMPLIANCE_ID"
echo ""

# Step 4: Initialize Compliance Oracle
echo "⚙️  Step 4/5: Initializing Compliance Oracle..."
PUBLIC_KEY=$(stellar keys address --secret-key "$SECRET_KEY" 2>/dev/null || stellar keys show "$SECRET_KEY" 2>/dev/null || echo "")
if [ -z "$PUBLIC_KEY" ]; then
  echo "⚠️  Warning: Could not derive public key from secret. Skipping init."
else
  INIT_TX=$(stellar contract invoke \
    --id "$COMPLIANCE_ID" \
    --source-account "$SECRET_KEY" \
    --network "$NETWORK" \
    -- init --admin "$PUBLIC_KEY" 2>&1 | grep -oP '[a-f0-9]{64}' | head -1 || echo "")
  
  if [ -n "$INIT_TX" ]; then
    echo "✅ Compliance Oracle initialized (tx: ${INIT_TX:0:12}...)"
  else
    echo "⚠️  Init may have failed or admin already set"
  fi
fi
echo ""

# Step 5: Deploy Credential Registry
echo "📜 Step 5/5: Deploying Credential Registry..."
CREDENTIAL_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/credential_registry.wasm \
  --source-account "$SECRET_KEY" \
  --network "$NETWORK" \
  --alias credential_registry 2>&1 | grep -oP 'C[A-Z0-9]{55}' | tail -1)

if [ -z "$CREDENTIAL_ID" ]; then
  echo "❌ Credential Registry deployment failed"
  exit 1
fi
echo "✅ Credential Registry deployed: $CREDENTIAL_ID"
echo ""

# Step 6: Save deployment artifacts
echo "💾 Saving deployment artifacts..."
mkdir -p deploy
cat > deploy/last_deploy.json <<EOF
{
  "network": "$NETWORK",
  "timestamp": "$TIMESTAMP",
  "contracts": {
    "verifier": {
      "id": "$VERIFIER_ID",
      "wasm": "target/wasm32v1-none/release/verifier.wasm"
    },
    "compliance_oracle": {
      "id": "$COMPLIANCE_ID",
      "wasm": "target/wasm32v1-none/release/compliance_oracle.wasm",
      "init": {
        "admin": "$PUBLIC_KEY",
        "tx": "$INIT_TX"
      }
    },
    "credential_registry": {
      "id": "$CREDENTIAL_ID",
      "wasm": "target/wasm32v1-none/release/credential_registry.wasm"
    }
  }
}
EOF
echo "✅ Deployment artifacts saved to deploy/last_deploy.json"
echo ""

# Summary
echo "🎉 Deployment Complete!"
echo ""
echo "Contract IDs:"
echo "  Verifier:            $VERIFIER_ID"
echo "  Compliance Oracle:   $COMPLIANCE_ID"
echo "  Credential Registry: $CREDENTIAL_ID"
echo ""
echo "Next steps:"
echo "  1. Update environments.toml with these IDs"
echo "  2. Update .env files in SDK/frontend with contract IDs"
echo "  3. Test with: stellar contract invoke --id <CONTRACT_ID> ..."
echo ""
