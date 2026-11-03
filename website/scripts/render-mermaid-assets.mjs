#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { main } from './render-mermaid-assets.mts'
export * from './render-mermaid-assets.mts'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
