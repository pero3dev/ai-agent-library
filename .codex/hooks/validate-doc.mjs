#!/usr/bin/env node
// codex PostToolUse: イベント形式と判定の正本は共通 core。
import { runEditHook } from '../../scripts/lib/hook-core.mjs'
await runEditHook('validate', import.meta.url)
