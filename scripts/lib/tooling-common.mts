import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isRecord, errorMessage } from './json-guards.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
/** @param {string} root @param {...string} args */
export const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
/** @param {string} file @returns {unknown} */
export const jsonFile = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
/** @param {string} root @param {string} relative @returns {string[]} */
export function filesUnder(root: string, relative: string): string[] {
  const dir = path.join(root, relative)
  let stat
  try { stat = lstatSync(dir) } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []; throw error }
  if (stat.isSymbolicLink()) throw new Error(`設定の symlink は検査対象にできません: ${relative}`)
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.name === 'node_modules' || entry.name === '.git') return []
    if (entry.isSymbolicLink()) throw new Error(`設定の symlink は検査対象にできません: ${name}`)
    return entry.isDirectory() ? filesUnder(root, name) : [name]
  }).sort()
}
/** @param {string[]} args @param {string[]} [allowed] */
export function parseOptions(args: string[], allowed: string[] = []) {
  /** @type {Partial<Record<string, string>>} */
  const result: Partial<Record<string, string>> = {}
  for (let i = 0; i < args.length; i++) {
    const name = args[i].replace(/^--/, '')
    if (!args[i].startsWith('--') || !allowed.includes(name) || result[name] !== undefined) throw new Error(`未対応・重複の引数: ${args[i]}`)
    const value = args[++i]
    if (!value || value.startsWith('--')) throw new Error(`--${name} の値が必要です`)
    result[name] = value
  }
  return result
}
/** @param {string} importUrl @param {() => unknown | Promise<unknown>} action */
export async function cli(importUrl: string, action: () => unknown | Promise<unknown>) {
  if (!process.argv[1] || path.resolve(process.argv[1]) !== fileURLToPath(importUrl)) return
  try { console.log(JSON.stringify(await action(), null, 2)) } catch (error) { console.error(errorMessage(error)); process.exitCode = 1 }
}
/** @param {string} [root] @returns {import('./tooling-types.d.mts').VerificationManifest} */
export function verificationManifest(root: string = ROOT): import('./tooling-types.d.mts').VerificationManifest {
  const manifest = jsonFile(path.join(root, 'harness/verification.json'))
  if (!isRecord(manifest) || manifest.schema_version !== 1 || !Array.isArray(manifest.checks)) throw new Error('検証一覧の schema_version / checks が不正です')
  if (!Array.isArray(manifest.external_evidence) || !manifest.external_evidence.every((value) => typeof value === 'string') || !Array.isArray(manifest.excluded_actions) || !manifest.excluded_actions.every((value) => typeof value === 'string')) throw new Error('検証一覧の external_evidence / excluded_actions は文字列配列で指定してください')
  const ids = new Set()
  /** @type {import('./tooling-types.d.mts').VerificationCheck[]} */
  const checks: import('./tooling-types.d.mts').VerificationCheck[] = []
  for (const row of (manifest.checks as unknown[])) {
    if (!isRecord(row) || typeof row.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(row.id) || ids.has(row.id) || typeof row.command !== 'string' || !row.command || typeof row.job !== 'string' || !row.job || typeof row.cwd !== 'string' || !row.cwd || !Array.isArray(row.os) || !row.os.length || !Array.isArray(row.prerequisites) || typeof row.evidence !== 'string' || !row.evidence) throw new Error(`検証一覧の項目が不正です: ${isRecord(row) ? row.id : 'unknown'}`)
    const supportedOS = row.os.filter((os) => os === 'linux' || os === 'win32' || os === 'darwin')
    if (supportedOS.length !== row.os.length) throw new Error(`未対応の OS: ${row.id}`)
    if (!row.prerequisites.every((value) => typeof value === 'string')) throw new Error(`検証一覧の前提条件が不正です: ${row.id}`)
    const relative = path.relative(root, path.resolve(root, row.cwd))
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`検査 cwd が作業領域外です: ${row.id}`)
    ids.add(row.id)
    checks.push({ ...row, id: row.id, command: row.command, job: row.job, cwd: row.cwd, os: supportedOS, prerequisites: row.prerequisites, evidence: row.evidence })
  }
  const scheduled = manifest.scheduled_checks ?? []
  if (!Array.isArray(scheduled)) throw new Error('scheduled_checks は配列で指定してください')
  const scheduledChecks = scheduled.map((row: unknown) => {
    if (!isRecord(row) || typeof row.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(row.id) || ids.has(row.id) || typeof row.workflow !== 'string' || !/^\.github\/workflows\/[a-z0-9-]+\.yml$/.test(row.workflow) || typeof row.command !== 'string' || !row.command || typeof row.evidence !== 'string' || !row.evidence || !Array.isArray(row.prerequisites) || !row.prerequisites.every(value => typeof value === 'string')) throw new Error('scheduled_checks の項目が不正です')
    ids.add(row.id)
    return { id: row.id, workflow: row.workflow, command: row.command, evidence: row.evidence, prerequisites: row.prerequisites as string[] }
  })
  return { ...manifest, schema_version: 1, checks, external_evidence: manifest.external_evidence, excluded_actions: manifest.excluded_actions, scheduled_checks: scheduledChecks }
}

export const NODE_REQUIREMENT = '^22.22.2 || ^24.15.0 || >=26.0.0'
/** @param {string | null | undefined} text @param {string} name */
export function versionSupported(text: string | null | undefined, name: string) {
  const version = /(?:Python\s+|v?)(\d+)\.(\d+)(?:\.(\d+))?/.exec(text ?? '')
  if (!version) return 'unknown'
  const [major, minor, patch = 0] = version.slice(1).map((value) => Number(value ?? 0))
  return (name === 'python' ? major > 3 || major === 3 && minor >= 11 : major >= 26 || major === 24 && minor >= 15 || major === 22 && (minor > 22 || minor === 22 && patch >= 2)) ? 'supported' : 'unsupported'
}
/** @param {import('./tooling-types.d.mts').PythonOptions} [options] */
export function resolvePython({ root, python, platform = process.platform, execute = (binary, args) => execFileSync(binary, args, { encoding: 'utf8', timeout: 10000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }) }: import('./tooling-types.d.mts').PythonOptions = {}) {
  if (python && (!path.isAbsolute(python) || !existsSync(python))) throw new Error('--python は既存の Python 実行ファイルの絶対パスで指定してください')
  let managed = null
  if (root && !python) {
    try { managed = path.resolve(root, git(root, 'rev-parse', '--git-common-dir'), 'harness-tools/python', platform === 'win32' ? 'Scripts/python.exe' : 'bin/python') } catch { /* Git checkout 以外では個別指定/PATHだけを使う。 */ }
  }
  const candidates = python ? [{ binary: python, args: [] }] : [...(managed && existsSync(managed) ? [{ binary: managed, args: [] }] : []), { binary: 'python', args: [] }, ...(platform === 'win32' ? [{ binary: 'py', args: ['-3.11'] }, { binary: 'py', args: ['-3'] }] : [{ binary: 'python3', args: [] }])]
  for (const candidate of candidates) {
    try {
      const version = execute(candidate.binary, [...candidate.args, '--version']).trim()
      if (versionSupported(version, 'python') === 'supported') return { ...candidate, version, result: 'supported', evidence: 'version-command' }
    } catch { /* 該当しない候補を飛ばし、環境は変更しない。 */ }
  }
  return { result: 'unknown', reason: 'Python 3.11+ を利用できる候補が見つかりません' }
}
