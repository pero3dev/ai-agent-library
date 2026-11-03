#!/bin/bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
case "${1:-}" in
  "") content_root="$repo_root/ios/AILibrary/Content" ;;
  --fixtures) content_root="$repo_root/ios/AILibrary/TestContent" ;;
  *) echo "Usage: $0 [--fixtures]" >&2; exit 2 ;;
esac
if [ "$#" -gt 1 ]; then echo "Usage: $0 [--fixtures]" >&2; exit 2; fi
test_root="$(mktemp -d /private/tmp/ailibrary-ios-core.XXXXXX)"
trap 'rm -rf "$test_root"' EXIT
cd "$repo_root"
xcrun swiftc -module-cache-path "$test_root/module-cache" \
  ios/AILibrary/Sources/Models.swift \
  ios/AILibrary/Sources/NativeDocument.swift \
  ios/AILibrary/Sources/ContentValidator.swift \
  ios/AILibrary/Sources/ContentRepository.swift \
  ios/AILibrary/Sources/ReadingStore.swift \
  ios/tests/CoreSmoke.swift -o "$test_root/core-smoke"
"$test_root/core-smoke" "$content_root"
