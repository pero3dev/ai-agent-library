#!/usr/bin/env node
export * from './check-built-app-icon.mts'
import { runCli } from './check-built-app-icon.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli()
