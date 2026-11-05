#!/usr/bin/env bash
# Aplicação controlada do schema no banco EXCLUSIVO do projeto Compose.
# Requer o PostgreSQL já iniciado e .env.homologacao local; nunca alterar databases de terceiros.
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE=(docker compose --env-file .env.homologacao -f compose.homologacao.yml)
DB=( "${COMPOSE[@]}" exec -T db psql -X -U excelencia5_app -d excelencia5_homologacao -v ON_ERROR_STOP=1 )
if [[ ! -f .env.homologacao ]]; then
  echo "Arquivo .env.homologacao ausente; não apliquei nenhuma alteração." >&2
  exit 1
fi
if ! "${COMPOSE[@]}" ps --status running --services | grep -qx db; then
  echo "PostgreSQL de homologação não está em execução." >&2
  exit 1
fi
# Sem tabelas preexistentes: evita se conectar a um volume reutilizado por engano.
registrada=$("${DB[@]}" -tA -c "SELECT to_regclass('public.migracoes_homologacao') IS NOT NULL")
if [[ "$registrada" == "t" ]]; then
  aplicada=$("${DB[@]}" -tA -c "SELECT EXISTS (SELECT 1 FROM public.migracoes_homologacao WHERE nome='20261029000100_base_inicial')")
  if [[ "$aplicada" == "t" ]]; then
    echo "Migração já aplicada. Validando estrutura existente."
    "${DB[@]}" < db/homologacao/10_verificar_schema.sql
    exit 0
  fi
  echo "Tabela de controle existe sem marcador esperado; intervenção manual necessária." >&2
  exit 1
fi
if [[ "$("${DB[@]}" -tA -c "SELECT to_regclass('public.empresas') IS NOT NULL")" == "t" ]]; then
  echo "Tabela empresas já existe sem controle de migração; abortando por segurança." >&2
  exit 1
fi
echo "Aplicando schema base somente em excelencia5_homologacao..."
# Transação única: falhas não deixam migração parcial. Não imprime senha.
{
  cat db/homologacao/00_compatibilidade_supabase.sql
  cat supabase/migrations/20261029000100_base_inicial.sql
  printf '\nCREATE TABLE public.migracoes_homologacao (nome text PRIMARY KEY, aplicada_em timestamptz NOT NULL DEFAULT now());\n'
  printf "INSERT INTO public.migracoes_homologacao(nome) VALUES ('20261029000100_base_inicial');\n"
} | "${DB[@]}" -1 >/dev/null
echo "Schema aplicado. Executando verificações estruturais..."
"${DB[@]}" < db/homologacao/10_verificar_schema.sql
echo "Migração e validações concluídas."
