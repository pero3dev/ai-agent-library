export * from './capture-simulator-unit-failure.mts'
import { runCli } from './capture-simulator-unit-failure.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli()
