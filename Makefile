# Comandos de conveniência ZKID Stellar

.PHONY: all install build test deploy clean help
.PHONY: sdk-build app-dev contracts-build circuits-build
.PHONY: deploy-testnet compile-circuits
.PHONY: vk-age vk-country vk-income

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
	@echo "  make vk-age           - Definir VK do circuito de idade no Verifier"
	@echo "  make vk-country       - Definir VK do circuito de país no Verifier"
	@echo "  make vk-income        - Definir VK do circuito de renda no Verifier"
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

# ---------- VK helpers ----------
vk-age:
	@echo "🗝️  Definindo VK (idade) no Verifier..."
	@if [ -z "$$SOROBAN_SECRET" ]; then echo "[ERR] Defina SOROBAN_SECRET antes (export SOROBAN_SECRET=SA...)"; exit 1; fi
	node scripts/set-vk.mjs --circuit age

vk-country:
	@echo "🗝️  Definindo VK (país) no Verifier..."
	@if [ -z "$$SOROBAN_SECRET" ]; then echo "[ERR] Defina SOROBAN_SECRET antes (export SOROBAN_SECRET=SA...)"; exit 1; fi
	node scripts/set-vk.mjs --circuit country

vk-income:
	@echo "🗝️  Definindo VK (renda) no Verifier..."
	@if [ -z "$$SOROBAN_SECRET" ]; then echo "[ERR] Defina SOROBAN_SECRET antes (export SOROBAN_SECRET=SA...)"; exit 1; fi
	node scripts/set-vk.mjs --circuit income

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

