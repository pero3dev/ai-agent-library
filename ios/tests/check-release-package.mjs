#!/usr/bin/env node
export * from './check-release-package.mts'
import { runCli } from './check-release-package.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli()
