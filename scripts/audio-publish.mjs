#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { runPublication } from './audio/publication.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log('node scripts/audio-publish.mjs [--apply] [--auto-merge] [--minimum-batch 3] [--state-dir ABSOLUTE] [--manifest ABSOLUTE]')
  console.log('Default: validate local ready manifests only. --apply uploads immutable public assets and opens a catalog-only PR. --auto-merge refreshes an owned outdated branch without rewriting history, queues changed sources for regeneration, and waits for all protected checks on the new head.')
} else {
  try {
    const commonGit = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim()
    const options = { root, stateDir: path.resolve(root, commonGit, 'audio-learning'), manifestFiles: undefined }
    for (let index = 0; index < args.length; index++) {
      const arg = args[index]
      if (arg === '--apply') options.apply = true
      else if (arg === '--auto-merge') options.autoMerge = true
      else if (arg === '--dry-run') options.apply = false
      else if (arg === '--minimum-batch') options.minimumBatch = Number(args[++index])
      else if (['--state-dir', '--manifest'].includes(arg)) {
        const value = args[++index]
        if (!value || !path.isAbsolute(value)) throw new Error(`${arg} requires an absolute path`)
        if (arg === '--state-dir') options.stateDir = value
        else (options.manifestFiles ??= []).push(value)
      } else throw new Error(`Unknown argument: ${arg}`)
    }
    const result = await runPublication(options)
    console.log(JSON.stringify(result, null, 2))
    if (result.held.length && !result.ready.length) process.exitCode = 2
  } catch (error) { console.error(JSON.stringify({ status: 'blocked', reason: error.message })); process.exitCode = 1 }
}
