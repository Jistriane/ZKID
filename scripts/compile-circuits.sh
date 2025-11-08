#!/usr/bin/env bash
# Wrapper solicitado pelo Makefile para compilar circuitos
# Encaminha para scripts/build-circuits.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/build-circuits.sh" "$@"
