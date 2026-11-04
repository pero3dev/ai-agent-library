#!/usr/bin/env node
export * from './native-content-audit.mts'
import { runCli } from './native-content-audit.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli()
