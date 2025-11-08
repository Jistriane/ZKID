# Comandos de conveniência ZKID Stellar

.PHONY: all install build test deploy clean help
.PHONY: sdk-build app-dev contracts-build circuits-build
.PHONY: deploy-testnet compile-circuits

# Default
all: install build

help:
	@echo "🔧 ZKID Stellar - Comandos disponíveis:"
	@echo ""
	@echo "  make install          - Instalar todas as dependências"
	@echo "  make build            - Build completo (SDK + contracts)"
	@echo "  make test             - Executar todos os testes"
	@echo "  make circuits-build   - Compilar circuitos ZK"
	@echo "  make deploy-testnet   - Deploy contratos na testnet"
	@echo "  make app-dev          - Iniciar frontend (dev)"
	@echo "  make clean            - Limpar artifacts"

install:
	@echo "📦 Instalando dependências..."
	npm install
	cd sdk/zkid-sdk && npm install
	cd frontend/zkid-app && npm install

build: sdk-build contracts-build
	@echo "✅ Build completo!"

sdk-build:
	@echo "🔨 Building SDK..."
	cd sdk/zkid-sdk && npm run build

app-dev:
	@echo "🚀 Iniciando frontend..."
	cd frontend/zkid-app && npm run dev

contracts-build:
	@echo "🦀 Building contratos Soroban..."
	cd contracts && cargo build --release

contracts-test:
	@echo "🧪 Testando contratos..."
	cd contracts && cargo test

circuits-build: compile-circuits

compile-circuits:
	@echo "⚡ Compilando circuitos ZK..."
	bash scripts/compile-circuits.sh

deploy-testnet:
	@echo "🚀 Deploy automático na Soroban testnet (usa SOROBAN_SECRET & PUBLIC_KEY do ambiente)"
	@if [ -z "$$SOROBAN_SECRET" ] || [ -z "$$PUBLIC_KEY" ]; then \
		echo "[ERR] Variáveis SOROBAN_SECRET e PUBLIC_KEY não definidas."; \
		echo "Exemplo: export SOROBAN_SECRET=S... PUBLIC_KEY=G..."; \
		exit 1; \
	fi
	bash scripts/deploy-contracts.sh

test:
	@echo "🧪 Executando testes..."
	cd sdk/zkid-sdk && npm test
	cd contracts && cargo test

clean:
	@echo "🧹 Limpando artifacts..."
	rm -rf circuits/build
	rm -rf sdk/zkid-sdk/dist
	rm -rf frontend/zkid-app/dist
	cd contracts && cargo clean

.SILENT: help

