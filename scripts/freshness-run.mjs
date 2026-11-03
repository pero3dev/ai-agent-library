#!/usr/bin/env node
// Bootstrap remains usable before npm ci; Node removes the adjacent implementation's types.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { main } from './freshness-run.mts'
export * from './freshness-run.mts'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await main(), null, 2)) }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
}
