#!/bin/bash
# Server-side deploy for citadel. Lives at /opt/citadel/citadel/deploy.sh,
# installed there by scripts/install-release.sh.
#
# Invoked by ci-upload.sh over SSH, and equally safe to run by hand:
#
#     cd /opt/citadel/citadel && ./deploy.sh
#
# That symmetry is the point: debugging a deploy never requires pushing a commit.
# The prior trial accumulated tidying commits on main precisely because it had
# no way to try a fix without pushing one - on a pipeline where pushing main
# deployed.
#
# citadel serves BYTES BUILT IN CI. There is no build step here and no Node on
# the server, so "green in CI, broken in the image" has nowhere to hide: the
# artifact CI tested is the artifact served.
#
# It never removes the target directory, .env, or any Docker volume. Deleting
# CI-owned files is install-release.sh's job and nothing else's.

set -euo pipefail

# ---------------------------- PROJECT CONFIG ----------------------------
APP_DIR="${APP_DIR:-/opt/citadel/citadel}"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"

# Server-owned, never shipped by CI (not in release-manifest.sh).
ENV_FILE="${DEPLOY_ENV_FILE:-$APP_DIR/.env}"

# Unique per platform on this shared VPS.
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-citadel-web}"

HEALTH_PORT="${HEALTH_PORT:-8080}"
HEALTH_RETRIES="${HEALTH_RETRIES:-20}"
HEALTH_SLEEP_SEC="${HEALTH_SLEEP_SEC:-2}"

# One list, shared with ci-upload.sh, which checks it on the VPS BEFORE the
# swap -- the only point at which failing early actually protects anything.
. "$APP_DIR/scripts/required-env.sh"
# -------------------------- END PROJECT CONFIG --------------------------

export COMPOSE_PROJECT_NAME

cd "$APP_DIR"

# --------------------------- Prerequisites -----------------------------
docker compose version >/dev/null 2>&1 || { echo "the docker compose plugin is missing"; exit 1; }

# ------------------------- Env validation, again -----------------------
# ⚠️ NOT "before swapping" -- install-release.sh has already replaced every
# CI-owned path by the time this runs. The check that protects the running
# release lives in ci-upload.sh; this one is the second line of defence, for a
# hand-run ./deploy.sh where no upload happened.
if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE."
  echo "It is SERVER-OWNED and CI never writes it. Copy deploy.env.example and fill it in."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

for name in $REQUIRED_ENV; do
  eval "value=\${$name:-}"
  [ -n "$value" ] || { echo "$name is missing from $ENV_FILE"; exit 1; }

  # Case-folded, because shell `case` globs are case-sensitive: a check for
  # *your-domain* happily lets YOUR-DOMAIN.org through - the exact placeholder,
  # in the exact casing the instructions use.
  lowered=$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')
  case "$lowered" in
    *your-domain*|*example.com*|*changeme*|*copy-from*)
      echo "$name still holds a placeholder: $value"; exit 1 ;;
  esac
done

# ------------------------- Release identity ----------------------------
# ★ H2: /version must report the DEPLOYED commit, from outside the server.
#
# A static site has no process to ask, so the answer is written into the served
# directory here. RELEASE_SHA is CI-owned - written by the deploy step from
# CI_COMMIT_SHA, which is the SHA the gate approved. Three things then have to
# agree: what the gate permitted, what was uploaded, and what /version reports.
if [ -f "$APP_DIR/RELEASE_SHA" ]; then
  COMMIT_SHA=$(tr -d '[:space:]' < "$APP_DIR/RELEASE_SHA")
else
  COMMIT_SHA="unknown"
  echo "WARNING: no RELEASE_SHA - /version cannot answer what is deployed."
fi

printf '{"commit":"%s","service":"citadel","deployedAt":"%s"}\n' \
  "$COMMIT_SHA" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$APP_DIR/dist/version.json"
printf '{"status":"ok","service":"citadel"}\n' > "$APP_DIR/dist/health.json"

# ----------------------------- Migrations ------------------------------
# ★ BEFORE the app restarts, and the ONLY thing that touches the schema.
#
# The runner refuses an edited migration by checksum, so a file changed after
# deployment fails here rather than diverging silently across environments.
# ⚠️ THERE IS NO LOCAL `db` SERVICE, DELIBERATELY.
#
# `db-citadel` belongs to the SERVER-OWNED stack at /opt/citadel, and this
# compose JOINS its network with `external: true`. Standing up a second database
# here would be worse than an error: backup.sh would keep backing up the
# original while the app wrote to the new one, and the backup would go green
# forever against a database nobody was using.
#
# So a missing network is refused by name. `external: true` means compose will
# not create it, and the failure otherwise surfaces as an obscure DNS error
# inside the migrate container.
if ! docker network inspect citadel_citadel >/dev/null 2>&1; then
  echo "The citadel_citadel network does not exist."
  echo "It belongs to the server-owned stack: cd /opt/citadel && docker compose up -d"
  echo "Nothing has been changed. The previous release is still serving."
  exit 1
fi

echo "-> Applying migrations against the shared db-citadel"
docker compose -f "$COMPOSE_FILE" run --rm migrate || {
  echo "Migrations failed. The app has NOT been restarted — the previous release is still serving."
  echo "The database is server-owned; its logs are in the /opt/citadel stack:"
  echo "  cd /opt/citadel && docker compose logs --tail=60 db-citadel"
  exit 1
}

# --------------------------- Port collision ----------------------------
# The 8085 lesson, made mechanical. Another platform on this shared VPS taking
# the port produces a compose failure whose message does not mention the port.
PORT="${HOST_APP_PORT:-8087}"
if ss -tlnp 2>/dev/null | grep -q ":${PORT} " ; then
  if ! docker compose -f "$COMPOSE_FILE" ps --format '{{.Names}}' 2>/dev/null | grep -q .; then
    echo "Port ${PORT} is already in use by something that is not this stack."
    echo "Pick a free port, set HOST_APP_PORT in $ENV_FILE, and redeploy."
    exit 1
  fi
fi

# ------------------------------- Deploy --------------------------------
# `up -d` recreates the container against the new ./dist bind mount. No volumes
# are removed: `down -v`, `docker volume rm` and `prune --volumes` must never
# appear in a routine deploy - they are silent, unrecoverable data loss.
echo "-> Starting citadel ($COMMIT_SHA)"
docker compose -f "$COMPOSE_FILE" up -d --force-recreate

# ---------------------------- Health check -----------------------------
# ★ Probed from INSIDE the container, on the app's own port. "Container running"
# is not "app serving", and the proxy in front of it answering 200 says nothing
# about what is behind it.
echo "-> Waiting for citadel to serve"
ok=0
for _ in $(seq 1 "$HEALTH_RETRIES"); do
  if docker compose -f "$COMPOSE_FILE" exec -T web \
       wget -qO- "http://127.0.0.1:${HEALTH_PORT}/health" >/dev/null 2>&1; then
    ok=1; break
  fi
  sleep "$HEALTH_SLEEP_SEC"
done

if [ "$ok" -ne 1 ]; then
  echo "citadel did not become healthy. Logs follow - read these, not the CI output."
  docker compose -f "$COMPOSE_FILE" logs --tail=120
  exit 1
fi

# The deploy is not finished until it is externally verifiable.
served=$(docker compose -f "$COMPOSE_FILE" exec -T web \
           wget -qO- "http://127.0.0.1:${HEALTH_PORT}/version" 2>/dev/null || echo '')
echo "-> /version reports: $served"
case "$served" in
  *"$COMMIT_SHA"*) echo "Deployed $COMMIT_SHA" ;;
  *) echo "WARNING: /version does not report $COMMIT_SHA. The deploy may not have taken."; exit 1 ;;
esac
