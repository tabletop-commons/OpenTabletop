#!/usr/bin/env bash
# Generate SDK code from the OpenAPI spec using openapi-generator-cli.
# Prerequisites: Java 11+, npx
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SPEC="$PROJECT_ROOT/spec/bundled/openapi.yaml"

if [ ! -f "$SPEC" ]; then
  echo "Bundled spec not found. Run ./scripts/bundle-spec.sh first."
  exit 1
fi

echo "=== Generating Rust SDK ==="
npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC" \
  -g rust \
  -o "$PROJECT_ROOT/sdks/rust/generated" \
  --additional-properties=packageName=opentabletop,library=reqwest

echo "=== Generating Python SDK ==="
npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC" \
  -g python \
  -o "$PROJECT_ROOT/sdks/python/generated" \
  --additional-properties=packageName=opentabletop,library=httpx

echo "=== Generating TypeScript SDK ==="
npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC" \
  -g typescript-fetch \
  -o "$PROJECT_ROOT/sdks/javascript/generated" \
  --additional-properties=npmName=opentabletop,supportsES6=true

echo "SDK generation complete. Review generated/ directories and merge into src/."
