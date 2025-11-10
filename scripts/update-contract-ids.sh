#!/usr/bin/env bash
# Update contract IDs from deployment and regenerate TypeScript clients
# Usage: ./scripts/update-contract-ids.sh

set -e

echo "🔄 Updating Contract IDs from deployment..."
echo ""

# Read deployment info
if [ ! -f "deploy/last_deploy.json" ]; then
  echo "❌ Error: deploy/last_deploy.json not found"
  exit 1
fi

# Prefer jq if available for robust parsing
if command -v jq >/dev/null 2>&1; then
  VERIFIER_ID=$(jq -r '.contracts.verifier.id' deploy/last_deploy.json)
  REGISTRY_ID=$(jq -r '.contracts.credential_registry.id' deploy/last_deploy.json)
  ORACLE_ID=$(jq -r '.contracts.compliance_oracle.id' deploy/last_deploy.json)
else
  # Fallback parsing (simple grep/sed); assumes formatting similar to generated JSON
  VERIFIER_ID=$(grep '"verifier"' -A3 deploy/last_deploy.json | grep '"id"' | head -1 | sed -E 's/.*"id": "([A-Z0-9]+)".*/\1/')
  REGISTRY_ID=$(grep '"credential_registry"' -A3 deploy/last_deploy.json | grep '"id"' | head -1 | sed -E 's/.*"id": "([A-Z0-9]+)".*/\1/')
  ORACLE_ID=$(grep '"compliance_oracle"' -A4 deploy/last_deploy.json | grep '"id"' | head -1 | sed -E 's/.*"id": "([A-Z0-9]+)".*/\1/')
fi

if [ -z "$VERIFIER_ID" ] || [ -z "$REGISTRY_ID" ] || [ -z "$ORACLE_ID" ]; then
  echo "❌ Failed to extract one or more contract IDs (VERIFIER=$VERIFIER_ID REGISTRY=$REGISTRY_ID ORACLE=$ORACLE_ID)"
  exit 1
fi

echo "📍 Contract IDs from deployment:"
echo "  Verifier: $VERIFIER_ID"
echo "  Registry: $REGISTRY_ID"
echo "  Oracle:   $ORACLE_ID"
echo ""

# Step 1: Build contract packages with new IDs
echo "📦 Step 1/3: Generating TypeScript bindings..."

stellar contract bindings typescript \
  --contract-id "$VERIFIER_ID" \
  --output-dir packages/verifier \
  --overwrite \
  --network testnet

stellar contract bindings typescript \
  --contract-id "$REGISTRY_ID" \
  --output-dir packages/credential_registry \
  --overwrite \
  --network testnet

stellar contract bindings typescript \
  --contract-id "$ORACLE_ID" \
  --output-dir packages/compliance_oracle \
  --overwrite \
  --network testnet

echo "✅ TypeScript bindings generated"
echo ""

# Step 2: Build contract packages
echo "📦 Step 2/3: Building contract packages..."
(cd packages/verifier && npm install && npm run build)
(cd packages/credential_registry && npm install && npm run build)
(cd packages/compliance_oracle && npm install && npm run build)
echo "✅ Contract packages built"
echo ""

# Step 3: Update SDK contract configuration
echo "📝 Step 3/3: Updating SDK contract IDs..."
SDK_CONTRACTS_FILE="sdk/zkid-sdk/src/client/contracts.ts"

# Create a backup
cp "$SDK_CONTRACTS_FILE" "$SDK_CONTRACTS_FILE.bak"

# Update the contract IDs
sed -i "s/verifier: 'C[A-Z0-9]\{55\}'/verifier: '$VERIFIER_ID'/g" "$SDK_CONTRACTS_FILE"
sed -i "s/credentialRegistry: 'C[A-Z0-9]\{55\}'/credentialRegistry: '$REGISTRY_ID'/g" "$SDK_CONTRACTS_FILE"
sed -i "s/complianceOracle: 'C[A-Z0-9]\{55\}'/complianceOracle: '$ORACLE_ID'/g" "$SDK_CONTRACTS_FILE"

echo "✅ SDK contract IDs updated"
echo ""

# Step 4: Rebuild SDK
echo "🔨 Rebuilding SDK..."
(cd sdk/zkid-sdk && npm run build)
echo "✅ SDK rebuilt"
echo ""

echo "🎉 Contract IDs updated successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Test the SDK: npm test"
echo "  2. Restart frontend: npm run dev:frontend"
