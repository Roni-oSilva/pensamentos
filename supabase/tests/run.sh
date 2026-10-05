#!/usr/bin/env bash
# Aplica as migrations + seed e roda os testes de RLS em um Postgres DESCARTÁVEL.
#  - Local:  bash supabase/tests/run.sh        (precisa do PostgreSQL instalado; cria um cluster temporário)
#  - CI:     DATABASE_URL=postgres://... bash supabase/tests/run.sh   (banco vazio, superusuário)
# NUNCA aponte DATABASE_URL para seu banco do Supabase real: o bootstrap cria roles/schemas de teste.
set -euo pipefail
cd "$(dirname "$0")"
HERE="$PWD"

if [ -n "${DATABASE_URL:-}" ]; then
  PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)
  run() { "${PSQL[@]}" -f "$1"; }
else
  PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
  DIR=$(mktemp -d); PORT=54329
  as_pg() { if [ "$(id -u)" = 0 ]; then chown -R postgres "$DIR"; su postgres -c "$*"; else bash -c "$*"; fi; }
  as_pg "$PGBIN/initdb -D $DIR/data -A trust >/dev/null"
  as_pg "$PGBIN/pg_ctl -D $DIR/data -o \"-p $PORT -k $DIR -c listen_addresses=''\" -l $DIR/log -w start >/dev/null"
  trap 'as_pg "$PGBIN/pg_ctl -D $DIR/data -m immediate stop >/dev/null" || true; rm -rf "$DIR"' EXIT
  run() { as_pg "psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q -d postgres -f $1"; }
fi

run "$HERE/bootstrap_local.sql"
for f in "$HERE"/../migrations/*.sql; do echo "migration: $(basename "$f")"; run "$f"; done
run "$HERE/../seed.sql"
OUT=$(run "$HERE/rls.test.sql" 2>&1) || { echo "$OUT" | grep -E "ERROR|FALHOU" ; exit 1; }
echo "$OUT" | grep "TODOS OS TESTES"
