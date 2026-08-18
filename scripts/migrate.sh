#!/bin/sh
# The migration runner — DEPENDENCY-FREE, on purpose.
#
# ============================================================================
# WHY THIS IS SHELL AND NOT NODE
# ============================================================================
# citadel ships `dist`, not `node_modules` — the SPA is built in CI and served
# by a stock Caddy, which is the whole point of that design. So the migrate
# container had a Node script importing `postgres` and no package to import:
#
#   Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'postgres'
#
# checklist-api's Node runner works because that repo builds an image and
# installs its dependencies. citadel has no Dockerfile. Adding one, or running
# `npm install` inside the deploy, would buy a driver at the cost of a network
# fetch on every deploy and an image to maintain for one script.
#
# psql is already in the postgres image. This needs nothing else.
#
# It keeps what mattered about the Node runner:
#   · a CHECKSUM per applied migration, so an edited deployed file is caught
#   · a ledger the application role cannot read or write
#   · it connects as the PRIVILEGED account, and migrations are its only use

set -eu

: "${DB_HOST:?DB_HOST is not set}"
: "${DB_NAME:?DB_NAME is not set}"
: "${OWNER_DB_USER:?OWNER_DB_USER is not set}"
: "${OWNER_DB_PASSWORD:?OWNER_DB_PASSWORD is not set}"
DB_PORT="${DB_PORT:-5432}"
MIGRATIONS="${MIGRATIONS_DIR:-/app/migrations}"

export PGPASSWORD="$OWNER_DB_PASSWORD"
psql() { command psql -h "$DB_HOST" -p "$DB_PORT" -U "$OWNER_DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -qtA "$@"; }

echo "-> Waiting for $DB_HOST:$DB_PORT"
i=0
until psql -c 'select 1' >/dev/null 2>&1; do
  i=$((i+1)); [ "$i" -gt 30 ] && { echo "database did not become reachable"; exit 1; }
  sleep 2
done

# The ledger is the owner's. The application role has no access to it at all.
psql -c "create table if not exists schema_migration (
           name text primary key,
           checksum text not null,
           applied_at timestamptz not null default now())" >/dev/null
psql -c "revoke all on schema_migration from public" >/dev/null

applied_any=0
for file in "$MIGRATIONS"/*.sql; do
  [ -e "$file" ] || { echo "no migrations found in $MIGRATIONS"; exit 1; }
  name=$(basename "$file")
  sum=$(sha256sum "$file" | cut -d' ' -f1)
  was=$(psql -c "select checksum from schema_migration where name = '$name'")

  if [ -n "$was" ] && [ "$was" != "$sum" ]; then
    # A deployed migration is immutable. Every existing deployment stored the
    # old checksum; editing the file breaks all of them. Correct it with a NEW
    # migration.
    echo
    echo "$name has been EDITED since it was applied."
    echo "  applied checksum: $was"
    echo "  current checksum: $sum"
    echo
    echo "A deployed migration is immutable. Write a new migration instead."
    exit 1
  fi

  if [ -n "$was" ]; then
    echo "  skip     $name"
    continue
  fi

  printf '  apply    %s … ' "$name"
  # The role password is supplied as a transaction-scoped setting rather than
  # written into the migration, so no credential is ever committed.
  #
  # ⚠️ THE FILE'S OWN begin;/commit; ARE STRIPPED, AND THAT IS LOAD-BEARING.
  #
  # Every migration here opens and closes its own transaction. Wrapping one in
  # another produces a NESTED begin -- which Postgres only warns about -- and
  # the file's commit then closes the OUTER transaction. The ledger insert
  # after it would run outside any transaction, so a migration could apply and
  # go unrecorded, and the next deploy would try to apply it again.
  #
  # One transaction, opened here: the migration and its ledger row commit
  # together or not at all.
  {
    echo "begin;"
    [ -n "${APP_DB_PASSWORD:-}" ] && echo "set local app.role_password = '$(printf '%s' "$APP_DB_PASSWORD" | sed "s/'/''/g")';"
    grep -viE '^[[:space:]]*(begin|commit)[[:space:]]*;[[:space:]]*$' "$file"
    echo "insert into schema_migration (name, checksum) values ('$name', '$sum');"
    echo "commit;"
  } | psql -f - >/dev/null

  # ============================================================================
  # ★ VERIFY THE CLAIM. DO NOT REPORT SUCCESS -- CONFIRM IT.
  # ============================================================================
  # An earlier version of this runner printed "ok" and "migrations up to date"
  # while applying NOTHING: busybox sed rejected a GNU-only flag, the stripped
  # SQL was never produced, and the ledger row never landed. The deploy would
  # have gone green with an empty schema behind it.
  #
  # Re-reading the ledger costs one query and makes that impossible.
  confirmed=$(psql -c "select checksum from schema_migration where name = '$name'")
  if [ "$confirmed" != "$sum" ]; then
    echo "FAILED"
    echo
    echo "$name reported no error but is NOT recorded as applied."
    echo "  expected checksum: $sum"
    echo "  in the ledger:     ${confirmed:-<nothing>}"
    echo "Refusing to continue. Nothing further has been applied."
    exit 1
  fi
  echo "ok"
  applied_any=1
done

[ "$applied_any" -eq 0 ] && echo "  nothing to apply"
echo
echo "migrations up to date"
