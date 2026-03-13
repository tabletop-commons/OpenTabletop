#!/usr/bin/env bash
# Bundle the multi-file OpenAPI spec into a single file for distribution.
# Output: spec/bundled/openapi.yaml
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/spec/bundled"

mkdir -p "$OUTPUT_DIR"

echo "Bundling OpenAPI spec..."
npx @redocly/cli bundle "$PROJECT_ROOT/spec/openapi.yaml" \
  --output "$OUTPUT_DIR/openapi.yaml"

echo "Bundled spec written to: $OUTPUT_DIR/openapi.yaml"
