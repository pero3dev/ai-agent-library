import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('..', import.meta.url))
const immutableNotice = 'tests/unit/ios-core-performance-notice-20261031.test.mjs'

/** @param {string} [repository] @param {NodeJS.Platform} [platform] */
export function unitTestPlan(repository: string = root, platform: NodeJS.Platform = process.platform) {
  const discovered = readdirSync(path.join(repository, 'tests/unit'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
    .map((entry) => `tests/unit/${entry.name}`).sort()
  // This preregistered test is itself byte-bound by the hosted observation.
  // Keep its original POSIX-only source; Linux/macOS execute every original case.
  const notRun = platform === 'win32' && discovered.includes(immutableNotice) ? [immutableNotice] : []
  return { files: discovered.filter((file) => !notRun.includes(file)), not_run: notRun }
}

export function runCli() {
  const plan = unitTestPlan()
  for (const file of plan.not_run) console.error(`not-run: ${file} (immutable POSIX fixture; Linux/macOS CI executes the original test)`)
  if (!plan.files.length) throw new Error('No root unit tests discovered')
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=4', ...process.argv.slice(2), ...plan.files], { cwd: root, stdio: 'inherit', windowsHide: true })
  if (result.error) console.error(result.error.message)
  if (result.signal) process.kill(process.pid, result.signal)
  else process.exitCode = result.status ?? 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { runCli() }
