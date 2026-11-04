#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { cli, parseOptions, resolvePython, ROOT, verificationManifest } from './lib/tooling-common.mjs'
export function describeChecks(root = ROOT, platform = process.platform) {
  const manifest = verificationManifest(root)
  return { schema_version: 1, mode: 'inventory-only', platform, checks: manifest.checks.map((row) => ({ ...row, availability: row.os.some((os) => os === platform) ? 'requires-prerequisites' : 'other-os', result: 'not-run' })), scheduled_checks: (manifest.scheduled_checks ?? []).map(row => ({ ...row, result: 'not-run', execution: 'trusted-main-schedule-or-authorized-dispatch' })), external_evidence: manifest.external_evidence, excluded_actions: manifest.excluded_actions }
}
/** @param {string} command @param {import('./types/diagnostics.d.mts').CheckCommandOptions} [options] @returns {import('./types/diagnostics.d.mts').ExecutableCheck} */
export function checkCommand(command: string, { root, python, platform = process.platform, node = process.execPath, npmEntry = process.env.npm_execpath }: import('./types/diagnostics.d.mts').CheckCommandOptions = {}): import('./types/diagnostics.d.mts').ExecutableCheck {
  if (typeof command !== 'string' || /[;&|<>`$\r\n]/.test(command)) throw new Error('検査はシェル式を含まないコマンドで指定してください')
  const [binary, ...args] = command.trim().split(/\s+/)
  if (!['node', 'npm', 'python', 'actionlint'].includes(binary)) throw new Error(`検査用ではない実行ファイル: ${binary}`)
  if (binary === 'npm' && !['test', 'audit', 'run'].includes(args[0])) throw new Error('check:ci は npm の検査コマンドだけを実行します')
  if (args.some((arg) => /deploy|publish|paid-api|api-key/i.test(arg))) throw new Error('公開・有料 API 操作は check:ci の対象外です')
  if (binary === 'node') return { binary: node, args }
  if (binary === 'python') {
    const selected = resolvePython({ root, python, platform })
    if (selected.result !== 'supported' || !('binary' in selected)) throw new Error(selected.reason)
    return { binary: selected.binary, args: [...selected.args, ...args] }
  }
  if (binary === 'npm' && platform === 'win32') {
    const entry = npmEntry && path.basename(npmEntry) === 'npm-cli.js' ? npmEntry : path.join(path.dirname(node), 'node_modules/npm/bin/npm-cli.js')
    if (!existsSync(entry)) throw new Error('npm CLI が見つかりません。npm run check:ci 経由で実行してください')
    return { binary: node, args: [entry, ...args] }
  }
  return { binary, args }
}
/** @param {string} root @param {import('./lib/tooling-types.d.mts').VerificationCheck} row @param {import('./types/diagnostics.d.mts').ExecutableCheck} command */
function executeCheck(root: string, row: import('./lib/tooling-types.d.mts').VerificationCheck, command: import('./types/diagnostics.d.mts').ExecutableCheck) {
  const result = spawnSync(command.binary, command.args, { cwd: path.resolve(root, row.cwd), encoding: 'utf8', timeout: 20 * 60 * 1000, maxBuffer: 16 * 1024 * 1024, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.error || result.status !== 0) throw Object.assign(new Error(result.error?.message ?? `検査が終了コード ${result.status} で失敗しました`), { status: result.status, stderr: output || result.error?.message })
  return output
}
/** @param {string} root @param {string} requested @param {import('./types/diagnostics.d.mts').CheckExecutionOptions} [options] */
export function runChecks(root: string, requested: string, { python, platform = process.platform, execute = (row, command) => executeCheck(root, row, command) }: import('./types/diagnostics.d.mts').CheckExecutionOptions = {}) {
  const manifest = verificationManifest(root)
  const ids = requested.split(',')
  if (!ids.length || new Set(ids).size !== ids.length || ids.some((id) => !manifest.checks.some((row) => row.id === id))) throw new Error('実行する検査 ID を重複なく指定してください')
  const rows = ids.map((id) => {
    const row = manifest.checks.find((row) => row.id === id)
    if (!row) throw new Error(`検査 ID がありません: ${id}`)
    return row
  })
  // 全計画を先に検査し、引数エラーのときは一部だけ実行しない。
  const plans = rows.map((row) => ({ row, command: checkCommand(row.command, { root, python, platform }) }))
  const results = []
  for (const { row, command } of plans) {
    if (!row.os.some((os) => os === platform)) { results.push({ id: row.id, result: 'not-run', reason: 'other-os' }); continue }
    if (row.id === 'website-build' && process.env.STATIC_EXPORT !== '1') { results.push({ id: row.id, result: 'not-run', reason: 'STATIC_EXPORT=1 が必要です' }); continue }
    const started = new Date().toISOString()
    try {
      const output = execute(row, command)
      results.push({ id: row.id, command: row.command, executable: command.binary, arguments: command.args, cwd: row.cwd, evidence: row.evidence, started_at: started, completed_at: new Date().toISOString(), result: 'passed', output: String(output).slice(-16000) })
    } catch (error) {
      const details = error instanceof Error ? error : new Error(String(error))
      results.push({ id: row.id, command: row.command, cwd: row.cwd, evidence: row.evidence, started_at: started, completed_at: new Date().toISOString(), result: 'failed', exit_code: 'status' in details ? details.status : null, output: String('stderr' in details ? details.stderr : details.message).slice(-16000) })
    }
  }
  return { schema_version: 1, mode: 'selected-execution', platform, results, verified: results.every((row) => row.result === 'passed') }
}
export async function runCli(importUrl: string = import.meta.url) {
await cli(importUrl, () => {
  const options = parseOptions(process.argv.slice(2), ['root', 'run', 'python'])
  if (!options.run) return describeChecks(options.root ?? ROOT)
  const result = runChecks(options.root ?? ROOT, options.run, options)
  if (!result.verified) process.exitCode = 1
  return result
})
}
await runCli()
