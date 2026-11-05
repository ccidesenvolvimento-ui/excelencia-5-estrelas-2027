#!/usr/bin/env bash
# Verifica estrutura e autorizações no PostgreSQL EXCLUSIVO da homologação.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env.homologacao ]]; then
  echo "Arquivo .env.homologacao ausente" >&2
  exit 1
fi
docker compose --env-file .env.homologacao -f compose.homologacao.yml \
  exec -T db psql -X -U excelencia5_app -d excelencia5_homologacao -v ON_ERROR_STOP=1 \
  < db/homologacao/21_testar_runtime.sql
