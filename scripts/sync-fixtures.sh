#!/bin/bash
# Python reposundaki shared fixture'ları JS tarafına kopyalar.
# Kullanım: ./scripts/sync-fixtures.sh

set -e

PYTHON_FIXTURES="$(dirname "$0")/../../pii-tool/tests/fixtures"
JS_FIXTURES="$(dirname "$0")/../tests/fixtures"

if [ ! -d "$PYTHON_FIXTURES" ]; then
  echo "Hata: Python fixtures klasörü bulunamadı: $PYTHON_FIXTURES"
  exit 1
fi

mkdir -p "$JS_FIXTURES"
cp "$PYTHON_FIXTURES"/*.json "$JS_FIXTURES/"
echo "Fixture'lar senkronize edildi:"
ls "$JS_FIXTURES"
