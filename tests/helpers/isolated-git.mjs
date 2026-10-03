import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Only the test process and its children inherit this environment. User config is never changed.
const directory = mkdtempSync(path.join(os.tmpdir(), 'ai-agent-library-empty-git-config-'))
const emptyConfig = path.join(directory, 'config')
writeFileSync(emptyConfig, '')
process.once('exit', () => {
  if (path.dirname(directory) === os.tmpdir() && path.basename(directory).startsWith('ai-agent-library-empty-git-config-')) rmSync(directory, { recursive: true, force: true })
})
const override = [['commit.gpgsign', 'false'], ['tag.gpgsign', 'false'], ['core.hooksPath', directory], ['init.defaultBranch', 'main']]
export function isolatedGitEnv(environment = process.env) {
  const result = { ...environment, GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: String(override.length) }
  for (const key of Object.keys(result)) if (/^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(key)) delete result[key]
  override.forEach(([key, value], i) => { result[`GIT_CONFIG_KEY_${i}`] = key; result[`GIT_CONFIG_VALUE_${i}`] = value })
  return result
}
export function isolateGitForTests() { Object.assign(process.env, isolatedGitEnv()) }
export function fixtureGit(args, options = {}) { return execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', `core.hooksPath=${directory}`, ...args], { ...options, env: isolatedGitEnv(options.env) }) }
export function fixtureGitSpawn(args, options = {}) { return spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', `core.hooksPath=${directory}`, ...args], { ...options, env: isolatedGitEnv(options.env) }) }
