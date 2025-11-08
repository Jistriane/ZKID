#!/usr/bin/env bash
# ZKID Stellar orchestration script
# Uso: ./scripts/start-all.sh [--skip-circuits] [--with-bot] [--port <frontendPort>] [--no-test]
# Este script instala deps, builda contratos/SDK, (opcional) recompila circuitos e inicia frontend (+ bot).
set -euo pipefail

SKIP_CIRCUITS=false
WITH_BOT=false
FRONTEND_PORT=5173
RUN_TESTS=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-circuits) SKIP_CIRCUITS=true; shift;;
    --with-bot) WITH_BOT=true; shift;;
    --port) FRONTEND_PORT="$2"; shift 2;;
    --no-test) RUN_TESTS=false; shift;;
    -h|--help)
      echo "ZKID Stellar - start-all.sh"
      echo "Opções:"
      echo "  --skip-circuits   Não recompila circuitos (usa artifacts existentes)"
      echo "  --with-bot        Inicia também o Eliza bot (porta 3000)"
      echo "  --port <n>        Porta do frontend (default 5173)"
      echo "  --no-test         Pula etapa de testes"
      exit 0;;
    *) echo "Argumento desconhecido: $1"; exit 1;;
  esac
done

log() { printf "\n[➡] %s\n" "$1"; }
warn() { printf "\n[⚠] %s\n" "$1"; }
err() { printf "\n[❌] %s\n" "$1"; }

log "Verificando dependências básicas"
command -v node >/dev/null || { err "Node.js não encontrado"; exit 1; }
command -v cargo >/dev/null || { err "Cargo (Rust) não encontrado"; exit 1; }
command -v stellar >/dev/null || warn "CLI 'stellar' não encontrada (deploy automatizado indisponível)."

if ! $SKIP_CIRCUITS; then
  command -v circom >/dev/null || warn "circom não encontrado — circuitos não serão recompilados." && true
  command -v snarkjs >/dev/null || warn "snarkjs não encontrado — circuitos não serão recompilados." && true
fi

log "Instalando dependências (monorepo + SDK + frontend)"
make install

log "Build contratos + SDK"
make build

if $RUN_TESTS; then
  log "Executando testes (SDK + contratos)"
  make test || { err "Falha nos testes"; exit 1; }
else
  warn "Etapa de testes foi pulada (--no-test)"
fi

if ! $SKIP_CIRCUITS && command -v circom >/dev/null && command -v snarkjs >/dev/null; then
  log "Recompilando circuitos"
  make circuits-build || warn "Falha na recompilação dos circuitos — prosseguindo com artifacts existentes"
else
  warn "Circuitos não recompilados (skip ou dependências ausentes)"
fi

log "Iniciando frontend (porta $FRONTEND_PORT)"
# Exporta variáveis opcionais de ambiente aqui se necessário
# export VERIFIER_ID=...
# export CREDENTIAL_REGISTRY_ID=...
# export COMPLIANCE_ORACLE_ID=...

( cd frontend/zkid-app && PORT=$FRONTEND_PORT npm run dev ) & FRONTEND_PID=$!

if $WITH_BOT; then
  log "Iniciando Eliza bot (porta 3000)"
  ( cd eliza_bot && npm run dev ) & BOT_PID=$!
fi

log "Sistema iniciado"
cat <<EOF
Processos em execução:
  Frontend PID: $FRONTEND_PID
  Bot PID: ${BOT_PID:-(não iniciado)}

Para parar tudo:
  kill $FRONTEND_PID ${BOT_PID:-} 2>/dev/null || true
EOF

wait
