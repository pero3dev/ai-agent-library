export * from './prepare-playwright-linux-deps.mts'
import { runCli } from './prepare-playwright-linux-deps.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli(import.meta.url)
