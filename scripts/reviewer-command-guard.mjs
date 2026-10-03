#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sha = '[a-f0-9]{40}'
const file = '[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)*'
const branch = '[a-z][a-z0-9-]*/[a-z0-9]+(?:-[a-z0-9]+)*'
/** Exact single commands only: no shell composition, expansion, option-like revisions or candidate execution. */
export function reviewerCommandAllowed(command) {
  if (typeof command !== 'string' || /[\r\n;&|<>`$\\]/.test(command) || command.includes('..')) return false
  return [
    new RegExp(`^git show ${sha}:${file}$`),
    new RegExp(`^git ls-tree -r --name-only ${sha}$`),
    new RegExp(`^node scripts/(?:harness|freshness)-policy\\.mjs --base ${sha} --head ${sha} --branch ${branch} --print-digest$`),
  ].some(pattern => pattern.test(command))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let input = ''; for await (const chunk of process.stdin) input += chunk
    const event = JSON.parse(input)
    if (event.tool_name !== 'Bash' || !reviewerCommandAllowed(event.tool_input?.command)) throw new Error('reviewer は指定 SHA の git show / ls-tree と trusted policy の --print-digest のみ実行できます')
  } catch (error) { console.error(error.message); process.exitCode = 2 }
}
