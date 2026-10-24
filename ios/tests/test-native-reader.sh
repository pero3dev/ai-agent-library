#!/bin/bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
simulator_id="${IOS_SIMULATOR_ID:-}"
if [[ ! "$simulator_id" =~ ^[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}$ ]]; then
  echo 'Set IOS_SIMULATOR_ID to an available iPhone Simulator UUID from xcrun simctl list devices available.' >&2
  exit 2
fi
cd "$repo_root"
evidence_root="$repo_root/.local/ios-native-evidence"
mkdir -p "$evidence_root"
result_path="$evidence_root/native-ui-$(date -u +%Y%m%dT%H%M%SZ).xcresult"
xcodebuild -project ios/AILibrary.xcodeproj -scheme AILibrary \
  -destination "platform=iOS Simulator,id=$simulator_id" \
  -destination-timeout 60 -derivedDataPath .local/ios-derived-data \
  -resultBundlePath "$result_path" -parallel-testing-enabled NO -jobs 2 \
  -only-testing:AILibraryUITests CODE_SIGNING_ALLOWED=NO test
