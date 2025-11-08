#!/usr/bin/env bash
set -euo pipefail

echo "🚀 ZKID Stellar - Quick Setup for Circuit Compilation"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Install snarkjs
echo ""
echo "📦 Installing snarkjs globally..."
npm install -g snarkjs
echo "✅ snarkjs: $(snarkjs --version | head -1)"

# Install circom binary
echo ""
echo "📦 Installing circom binary..."

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" = "Linux" ]; then
    if [ "$ARCH" = "x86_64" ]; then
        CIRCOM_URL="https://github.com/iden3/circom/releases/latest/download/circom-linux-amd64"
    else
        echo "⚠️  Unsupported architecture: $ARCH. Building from source..."
        git clone https://github.com/iden3/circom.git /tmp/circom-build
        cd /tmp/circom-build
        cargo build --release
        cargo install --path circom
        cd -
        rm -rf /tmp/circom-build
        echo "✅ circom built from source"
        circom --version
        exit 0
    fi
elif [ "$OS" = "Darwin" ]; then
    if [ "$ARCH" = "arm64" ]; then
        CIRCOM_URL="https://github.com/iden3/circom/releases/latest/download/circom-macos-arm64"
    else
        CIRCOM_URL="https://github.com/iden3/circom/releases/latest/download/circom-macos-amd64"
    fi
else
    echo "❌ Unsupported OS: $OS"
    echo "Please install manually from: https://docs.circom.io/getting-started/installation/"
    exit 1
fi

# Download and install circom
echo "Downloading from: $CIRCOM_URL"
curl -L "$CIRCOM_URL" -o /tmp/circom
chmod +x /tmp/circom

# Install to user's local bin
mkdir -p "$HOME/.local/bin"
mv /tmp/circom "$HOME/.local/bin/circom"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo ""
    echo "⚠️  Add to your PATH by running:"
    echo "   echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
    echo "   source ~/.bashrc"
    echo ""
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ circom: $($HOME/.local/bin/circom --version)"

# Install circomlib
echo ""
echo "📦 Installing circomlib..."
npm install circomlib
echo "✅ circomlib installed"

echo ""
echo "✅ All tools installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure ~/.local/bin is in your PATH"
echo "   2. Run: bash scripts/build-circuits.sh"
echo "   3. Or follow manual steps in README.md section 3"
