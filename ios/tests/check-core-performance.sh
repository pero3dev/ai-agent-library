#!/bin/bash
set -euo pipefail
# No implicit compilation or benchmark execution. The Node CLI requires --run.
script_root="$(cd "$(dirname "$0")" && pwd)"
exec "${NODE_BINARY:-node}" "$script_root/core-performance-runner.mjs" "$@"
