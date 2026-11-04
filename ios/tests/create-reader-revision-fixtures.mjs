export * from './create-reader-revision-fixtures.mts'
import { runCli } from './create-reader-revision-fixtures.mts'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
