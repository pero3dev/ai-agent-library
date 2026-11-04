#!/usr/bin/env node
export * from './capture-built-app-icon.mts'
import { runCli } from './capture-built-app-icon.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
