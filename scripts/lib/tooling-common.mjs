import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
export const jsonFile = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
export function filesUnder(root, relative) {
  const dir = path.join(root, relative)
  let stat
  try { stat = lstatSync(dir) } catch (error) { if (error.code === 'ENOENT') return []; throw error }
  if (stat.isSymbolicLink()) throw new Error(`設定の symlink は検査対象にできません: ${relative}`)
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.name === 'node_modules' || entry.name === '.git') return []
    if (entry.isSymbolicLink()) throw new Error(`設定の symlink は検査対象にできません: ${name}`)
    return entry.isDirectory() ? filesUnder(root, name) : [name]
  }).sort()
}
export function parseOptions(args, allowed = []) {
  const result = {}
  for (let i = 0; i < args.length; i++) {
    const name = args[i].replace(/^--/, '')
    if (!args[i].startsWith('--') || !allowed.includes(name) || result[name] !== undefined) throw new Error(`未対応・重複の引数: ${args[i]}`)
    const value = args[++i]
    if (!value || value.startsWith('--')) throw new Error(`--${name} の値が必要です`)
    result[name] = value
  }
  return result
}
export async function cli(importUrl, action) {
  if (!process.argv[1] || path.resolve(process.argv[1]) !== fileURLToPath(importUrl)) return
  try { console.log(JSON.stringify(await action(), null, 2)) } catch (error) { console.error(error.message); process.exitCode = 1 }
}
export function verificationManifest(root = ROOT) {
  const manifest = jsonFile(path.join(root, 'harness/verification.json'))
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.checks)) throw new Error('検証一覧の schema_version / checks が不正です')
  const ids = new Set()
  for (const row of manifest.checks) {
    if (!/^[a-z][a-z0-9-]*$/.test(row.id) || ids.has(row.id) || !row.command || !row.job || !row.cwd || !Array.isArray(row.os) || !row.os.length || !Array.isArray(row.prerequisites) || !row.evidence) throw new Error(`検証一覧の項目が不正です: ${row.id}`)
    if (row.os.some(os => !['linux', 'win32', 'darwin'].includes(os))) throw new Error(`未対応の OS: ${row.id}`)
    const relative = path.relative(root, path.resolve(root, row.cwd))
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`検査 cwd が作業領域外です: ${row.id}`)
    ids.add(row.id)
  }
  return manifest
}

export function versionSupported(text, name) {
  const version = /(?:Python\s+|v?)(\d+)\.(\d+)(?:\.\d+)?/.exec(text ?? '')
  if (!version) return 'unknown'
  const [major, minor] = version.slice(1).map(Number)
  return (name === 'python' ? major > 3 || major === 3 && minor >= 11 : major >= 22) ? 'supported' : 'unsupported'
}
export function resolvePython({ root, python, platform = process.platform, execute = (binary, args) => execFileSync(binary, args, { encoding: 'utf8', timeout: 10000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }) } = {}) {
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
