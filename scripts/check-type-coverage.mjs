#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { main } from './check-type-coverage.mts'
export * from './check-type-coverage.mts'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
