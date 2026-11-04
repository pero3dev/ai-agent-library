export * from './native-failure-attachments.mts'
import { runCli } from './native-failure-attachments.mts'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
