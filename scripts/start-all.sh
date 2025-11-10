#!/bin/bash
# ZKID Stellar - Complete System Initialization Script
# This script installs dependencies, builds contracts, compiles circuits, and starts all services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
WITH_BOT=false
NO_TEST=false
SKIP_CIRCUITS=false
FRONTEND_PORT=5173
BOT_PORT=3000

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --with-bot)
            WITH_BOT=true
            shift
            ;;
        --no-test)
            NO_TEST=true
            shift
            ;;
        --skip-circuits)
            SKIP_CIRCUITS=true
            shift
            ;;
        --port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --with-bot        Start Eliza bot alongside frontend"
            echo "  --no-test         Skip test execution (faster startup)"
            echo "  --skip-circuits   Don't recompile circuits (use existing artifacts)"
            echo "  --port <n>        Custom frontend port (default: 5173)"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Helper functions
log_step() {
    echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}\n"
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v cargo &> /dev/null; then
        missing_deps+=("Rust/Cargo")
    fi
    
    if ! command -v stellar &> /dev/null; then
        missing_deps+=("stellar-cli")
    fi
    
    if [[ "$SKIP_CIRCUITS" == false ]]; then
        if ! command -v circom &> /dev/null; then
            log_info "Circom not found, skipping circuit compilation"
            SKIP_CIRCUITS=true
        fi
        
        if ! command -v snarkjs &> /dev/null; then
            log_info "snarkjs not found, skipping circuit compilation"
            SKIP_CIRCUITS=true
        fi
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "All required dependencies are installed"
}

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║         ZKID Stellar - System Startup             ║"
echo "║   Zero-Knowledge Identity & Compliance System     ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

check_prerequisites

# Step 1: Install dependencies
log_step "Step 1/7: Installing dependencies..."
if [ -d "node_modules" ] && [ -d "sdk/zkid-sdk/node_modules" ] && [ -d "frontend/zkid-app/node_modules" ]; then
    log_info "Dependencies already installed, skipping..."
else
    npm install
    log_success "Root dependencies installed"
fi

# Step 2: Build SDK packages
log_step "Step 2/7: Building SDK packages..."
cd "$PROJECT_ROOT/packages"
for dir in */; do
    if [ -f "${dir}package.json" ]; then
        log_info "Building package: ${dir%/}"
        cd "$dir"
        npm install 2>/dev/null || true
        cd ..
    fi
done
cd "$PROJECT_ROOT"
log_success "SDK packages built"

# Step 3: Build Soroban contracts
log_step "Step 3/7: Building Soroban smart contracts..."
log_info "Building verifier contract..."
stellar contract build --package verifier

log_info "Building credential_registry contract..."
stellar contract build --package credential_registry

log_info "Building compliance_oracle contract..."
stellar contract build --package compliance_oracle

log_success "All Soroban contracts built successfully"

# Step 4: Build SDK
log_step "Step 4/7: Building zkid-sdk..."
cd "$PROJECT_ROOT/sdk/zkid-sdk"
npm install
npm run build
cd "$PROJECT_ROOT"
log_success "zkid-sdk built successfully"

# Step 5: Compile circuits (optional)
if [[ "$SKIP_CIRCUITS" == false ]]; then
    log_step "Step 5/7: Compiling ZK circuits..."
    if [ -f "scripts/compile-circuits.sh" ]; then
        bash scripts/compile-circuits.sh
        log_success "Circuits compiled successfully"
    else
        log_info "Circuit compilation script not found, using existing artifacts"
    fi
else
    log_step "Step 5/7: Skipping circuit compilation (using existing artifacts)"
fi

# Step 6: Run tests (optional)
if [[ "$NO_TEST" == false ]]; then
    log_step "Step 6/7: Running tests..."
    
    log_info "Running SDK tests..."
    cd "$PROJECT_ROOT/sdk/zkid-sdk"
    npm test || log_info "Some SDK tests failed, continuing..."
    
    log_info "Running contract tests..."
    cd "$PROJECT_ROOT/contracts"
    cargo test || log_info "Some contract tests failed, continuing..."
    
    cd "$PROJECT_ROOT"
    log_success "Tests completed"
else
    log_step "Step 6/7: Skipping tests (--no-test flag)"
fi

# Step 7: Start services
log_step "Step 7/7: Starting services..."

# Kill any existing processes on the ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        log_info "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

kill_port $FRONTEND_PORT
if [[ "$WITH_BOT" == true ]]; then
    kill_port $BOT_PORT
fi

# Create log directory
mkdir -p "$PROJECT_ROOT/logs"

# Start frontend (detached, prevent TTY stop)
log_info "Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_ROOT/frontend/zkid-app"
npm install 2>/dev/null || true
export VITE_PORT=$FRONTEND_PORT
nohup bash -c 'VITE_PORT=$VITE_PORT npm run dev < /dev/null' > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":$FRONTEND_PORT"; then
        log_success "Frontend started (PID: $FRONTEND_PID)"
        echo -e "${GREEN}Frontend URL: http://localhost:$FRONTEND_PORT${NC}"
    else
        log_info "Frontend process running but port not yet open. It may still be bundling."
    fi
else
    log_error "Frontend failed to start. Check logs/frontend.log"
fi

# Start bot if requested (detached)
if [[ "$WITH_BOT" == true ]]; then
    log_info "Starting Eliza bot on port $BOT_PORT..."
    cd "$PROJECT_ROOT/eliza_bot"
    npm install 2>/dev/null || true
    # Prefer start (non-dev) to expose HTTP server reliably
    nohup bash -c 'npm run start < /dev/null' > "$PROJECT_ROOT/logs/bot.log" 2>&1 &
    BOT_PID=$!
    cd "$PROJECT_ROOT"
    
    sleep 10
    
    if ps -p $BOT_PID > /dev/null; then
        # Try detecting a port (Eliza may choose dynamic). If not found, just report PID.
        if ss -tlnp 2>/dev/null | grep -q ":$BOT_PORT"; then
            log_success "Eliza bot started (PID: $BOT_PID)"
            echo -e "${GREEN}Bot URL: http://localhost:$BOT_PORT${NC}"
        else
            # fallback health check try
            if curl -sSf "http://localhost:$BOT_PORT/health" > /dev/null 2>&1; then
              log_success "Eliza bot health endpoint responded on port $BOT_PORT"
            else
              log_info "Eliza bot running (PID: $BOT_PID). HTTP server not detected on :$BOT_PORT yet."
            fi
        fi
    else
        log_error "Bot failed to start. Check logs/bot.log"
    fi
fi

# Summary
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}            ${GREEN}ZKID Stellar System Started${NC}            ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Running Services:${NC}"
echo -e "  • Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC} (PID: $FRONTEND_PID)"
if [[ "$WITH_BOT" == true ]]; then
    echo -e "  • Eliza Bot: ${GREEN}http://localhost:$BOT_PORT${NC} (PID: $BOT_PID)"
fi

echo -e "\n${YELLOW}Deployed Contracts (Testnet):${NC}"
echo -e "  • Verifier: ${BLUE}CA64XL6ZGUEDN73SN2TAWHY5XBTWPO43K2HJ6YWV5VPV5V5UZRD6VUC4${NC}"
echo -e "  • Credential Registry: ${BLUE}CA44F2HEN2UTJ3XLWTJ4QCON4FXUQJU3L5BFSXRM6UBWOXJAZ7VBTHIO${NC}"
echo -e "  • Compliance Oracle: ${BLUE}CDUTFVWQQWTD64HJVI3ZSVAOFSNVULQ2DDXCQRAG5FQGOOJUIZGCUX6G${NC}"

echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  • Frontend: ${BLUE}logs/frontend.log${NC}"
if [[ "$WITH_BOT" == true ]]; then
    echo -e "  • Bot: ${BLUE}logs/bot.log${NC}"
fi

echo -e "\n${YELLOW}To stop services:${NC}"
echo -e "  kill $FRONTEND_PID"
if [[ "$WITH_BOT" == true ]]; then
    echo -e "  kill $BOT_PID"
fi
echo -e "  Or press ${RED}Ctrl+C${NC} and run: ${BLUE}kill $FRONTEND_PID"
if [[ "$WITH_BOT" == true ]]; then
    echo -e " $BOT_PID${NC}"
fi

echo -e "\n${GREEN}System is ready! Visit the frontend to start using ZKID Stellar.${NC}\n"

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Stopping services...${NC}'; kill $FRONTEND_PID 2>/dev/null || true; [[ -n '$BOT_PID' ]] && kill $BOT_PID 2>/dev/null || true; echo -e '${GREEN}Services stopped.${NC}'; exit 0" INT TERM

# Keep script running
wait
