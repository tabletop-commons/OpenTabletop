#!/usr/bin/env bash
# Validate ADR format and sequential numbering.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADR_DIR="$(dirname "$SCRIPT_DIR")/docs/src/adr"
ERRORS=0

echo "Validating ADRs in $ADR_DIR..."

# Check sequential numbering
EXPECTED=1
for file in "$ADR_DIR"/[0-9][0-9][0-9][0-9]-*.md; do
  [ -f "$file" ] || continue
  BASENAME=$(basename "$file")
  NUMBER=$(echo "$BASENAME" | grep -oP '^\d{4}')
  NUMBER_INT=$((10#$NUMBER))

  if [ "$NUMBER_INT" -ne "$EXPECTED" ]; then
    echo "ERROR: Expected ADR-$(printf '%04d' $EXPECTED), found $BASENAME (gap in numbering)"
    ERRORS=$((ERRORS + 1))
  fi

  # Check frontmatter
  if ! head -5 "$file" | grep -q "^status:"; then
    echo "ERROR: $BASENAME missing 'status' in frontmatter"
    ERRORS=$((ERRORS + 1))
  fi
  if ! head -5 "$file" | grep -q "^date:"; then
    echo "ERROR: $BASENAME missing 'date' in frontmatter"
    ERRORS=$((ERRORS + 1))
  fi

  EXPECTED=$((EXPECTED + 1))
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS error(s) found"
  exit 1
else
  echo "OK: All $((EXPECTED - 1)) ADRs valid"
fi
