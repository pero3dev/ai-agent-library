#!/usr/bin/env node
// Stable command/import path; implementation is TypeScript.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCli } from './check-harness.mts'
export * from './check-harness.mts'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { await runCli(import.meta.url) }
