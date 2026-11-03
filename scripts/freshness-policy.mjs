#!/usr/bin/env node
// Run only the adjacent trusted implementation; candidate code is never imported.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { main } from './freshness-policy.mts'
export * from './freshness-policy.mts'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
