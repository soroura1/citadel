# The single list of variables a deploy requires.
#
# Sourced by BOTH scripts/ci-upload.sh (which checks the VPS BEFORE swapping
# anything) and deploy.sh (which checks again before starting). One list, so the
# two can never drift — the same reasoning as release-manifest.sh.
#
# ⚠️ ADDING A NAME HERE BREAKS EVERY EXISTING DEPLOYMENT until each server's
# .env is edited by hand. That is trap T25, and it is the intended behaviour:
# the alternative is a service that starts with configuration it needs missing.
REQUIRED_ENV="APP_BASE_URL API_UPSTREAM OWNER_DB_PASSWORD APP_DB_PASSWORD"
