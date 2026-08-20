#!/usr/bin/env bash
# derive-asset.sh — take a master image down to a slot's DECLARED weight budget.
#
# ============================================================================
# THE BUDGET IS READ FROM THE CONTENT, NEVER PASSED IN.
# ============================================================================
# EVS-5 made `max_bytes` a property a slot declares BEFORE anything fills it,
# because a budget agreed after the art arrives is a budget the art sets. This
# is that rule with a command attached: it looks the number up, and it fails
# rather than writing something over it.
#
# ⚠️ IT BINDS NOTHING. Producing a derivative is not inclusion review. The slot's
# `inclusion_reviewed` stays false until Q10 names a reviewer, and the
# provisional band renders until it does.
#
#   ./scripts/derive-asset.sh <master-image> <slot-id>
#   ./scripts/derive-asset.sh ~/VA-012-master.png slot.plan.bimaristan-cutaway
#
# Uses `sips`, which ships with macOS. On another platform substitute any
# encoder — the contract is the byte budget, not the tool.

set -euo pipefail

MASTER="${1:-}"
SLOT="${2:-}"
[ -n "$MASTER" ] && [ -n "$SLOT" ] || { echo "usage: $0 <master-image> <slot-id>" >&2; exit 2; }
[ -f "$MASTER" ] || { echo "no such file: $MASTER" >&2; exit 2; }

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# ⚠️ The slot id is passed to node as an ARGUMENT, never interpolated into
# script text. A value from the command line pasted into source is an injection
# waiting for a slot id with a quote in it.
DECLARED=$(node scripts/lib/slot-lookup.mjs "$SLOT") || exit 3
BUDGET=$(printf '%s' "$DECLARED" | cut -d' ' -f1)
TARGET=$(printf '%s' "$DECLARED" | cut -d' ' -f2)
ALT_KEY=$(printf '%s' "$DECLARED" | cut -d' ' -f3)

echo "slot      $SLOT"
echo "budget    $BUDGET bytes"
echo "target    $TARGET"
echo "alt text  $ALT_KEY"
echo

command -v sips >/dev/null || { echo "sips not found — substitute an encoder; the budget is the contract" >&2; exit 2; }

# Step quality down until it fits. Deliberately crude: the point is the refusal
# at the end, not the search.
mkdir -p "$(dirname "$TARGET")"
for Q in 85 75 65 55 45; do
  sips -s format jpeg -s formatOptions "$Q" --resampleWidth 1600 \
       "$MASTER" --out "$TARGET" >/dev/null 2>&1
  SIZE=$(wc -c < "$TARGET" | tr -d ' ')
  echo "  quality $Q -> $SIZE bytes"
  if [ "$SIZE" -le "$BUDGET" ]; then
    echo
    echo "PASS  $SIZE bytes, within the declared budget of $BUDGET."
    echo
    echo "Two things remain, and neither is this script's:"
    echo "  1. Set candidate_file on the slot to /${TARGET#public/}"
    echo "  2. Inclusion review (Q10). Until a reviewer is NAMED the slot stays"
    echo "     inclusion_reviewed: false, and the provisional band renders."
    exit 0
  fi
done

rm -f "$TARGET"
{
  echo
  echo "FAIL  cannot reach $BUDGET bytes at 1600px without dropping below quality 45."
  echo "      Either the master needs a different crop, or the budget was set too"
  echo "      tight for this asset — a decision to take deliberately and record on"
  echo "      the slot, not to work around here."
} >&2
exit 1
