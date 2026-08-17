# Single source of truth for which repository paths constitute a release.
#
# Sourced by BOTH scripts/ci-upload.sh (what to ship) and
# scripts/install-release.sh (what to replace on the VPS). One list, so the
# two can never drift.
#
# Everything listed is CI-OWNED: deleted from the target and replaced on every
# deploy. Anything NOT listed is VPS-OWNED and never touched - .env, named
# Docker volumes, backups, operator-created files.
#
# ---------------------------------------------------------------------------
# citadel ships `dist`, not source. The pipeline runs `vite build` at the gated
# SHA and the VPS serves the emitted bytes with a stock Caddy image - no Node,
# no npm install and no build toolchain on the server.
#
# Note what is NOT here: node_modules and src. The tar archives exactly this
# list, so the test step's node_modules cannot ride along. That matters - a
# sibling project streamed 132 MB per deploy until its excludes were fixed, and
# .dockerignore does not apply to a tar.
# ---------------------------------------------------------------------------
# ⚠️ `migrations` was missing until 17 Aug. Phase D built the story-content
# tables, proved them against a real Postgres, and never shipped them -- the
# same shape as the defect DEC-023 exists to fix, one layer down.
RELEASE_PATHS="dist migrations citadel.Caddyfile docker-compose.prod.yml deploy.sh deploy.env.example scripts RELEASE_SHA"
