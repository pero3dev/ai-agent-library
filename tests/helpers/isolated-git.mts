import { execFileSync, spawnSync } from 'node:child_process'
import type { ExecFileSyncOptions, ExecFileSyncOptionsWithStringEncoding, SpawnSyncOptions, SpawnSyncOptionsWithStringEncoding, SpawnSyncReturns } from 'node:child_process'
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
/** @param {NodeJS.ProcessEnv} [environment] @returns {NodeJS.ProcessEnv} */
export function isolatedGitEnv(environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  /** @type {NodeJS.ProcessEnv} */
  const result: NodeJS.ProcessEnv = { ...environment, GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: String(override.length) }
  for (const key of Object.keys(result)) if (/^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(key)) delete result[key]
  override.forEach(([key, value], i) => { result[`GIT_CONFIG_KEY_${i}`] = key; result[`GIT_CONFIG_VALUE_${i}`] = value })
  return result
}
export function isolateGitForTests() { Object.assign(process.env, isolatedGitEnv()) }
/** @overload @param {string[]} args @param {import('node:child_process').ExecFileSyncOptionsWithStringEncoding} options @returns {string} */
/** @overload @param {string[]} args @param {import('node:child_process').ExecFileSyncOptions} [options] @returns {string | Buffer} */
/** @param {string[]} args @param {import('node:child_process').ExecFileSyncOptions} [options] */
export function fixtureGit(args: string[], options: ExecFileSyncOptionsWithStringEncoding): string
export function fixtureGit(args: string[], options?: ExecFileSyncOptions): string | Buffer
export function fixtureGit(args: string[], options: ExecFileSyncOptions = {}): string | Buffer { return execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', `core.hooksPath=${directory}`, ...args], { ...options, env: isolatedGitEnv(options.env) }) }
/** @overload @param {string[]} args @param {import('node:child_process').SpawnSyncOptionsWithStringEncoding} options @returns {import('node:child_process').SpawnSyncReturns<string>} */
/** @overload @param {string[]} args @param {import('node:child_process').SpawnSyncOptions} [options] @returns {import('node:child_process').SpawnSyncReturns<string | Buffer>} */
/** @param {string[]} args @param {import('node:child_process').SpawnSyncOptions} [options] */
export function fixtureGitSpawn(args: string[], options: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string>
export function fixtureGitSpawn(args: string[], options?: SpawnSyncOptions): SpawnSyncReturns<string | Buffer>
export function fixtureGitSpawn(args: string[], options: SpawnSyncOptions = {}): SpawnSyncReturns<string | Buffer> { return spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', `core.hooksPath=${directory}`, ...args], { ...options, env: isolatedGitEnv(options.env) }) }
