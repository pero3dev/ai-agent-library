#!/bin/bash
set -euo pipefail
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <Content directory> [expected article count]" >&2
  exit 2
fi
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
audit_root="$(mktemp -d /private/tmp/ailibrary-package-audit.XXXXXX)"
trap 'rm -rf "$audit_root"' EXIT
xcrun swiftc -module-cache-path "$audit_root/module-cache" \
  "$repo_root/ios/AILibrary/Sources/Models.swift" \
  "$repo_root/ios/AILibrary/Sources/NativeDocument.swift" \
  "$repo_root/ios/AILibrary/Sources/ContentValidator.swift" \
  "$repo_root/ios/AILibrary/Sources/ReadingStore.swift" \
  "$repo_root/ios/tests/PackageAudit.swift" -o "$audit_root/package-audit"
"$audit_root/package-audit" "$@"
