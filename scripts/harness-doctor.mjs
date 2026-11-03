#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { parse as toml } from 'smol-toml'
import { cli, git, jsonFile, parseOptions, resolvePython, ROOT, versionSupported, NODE_REQUIREMENT } from './lib/tooling-common.mjs'

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
/** @param {Record<string, unknown>} value @param {string} key */
function observationString(value, key) {
  const text = value[key]
  if (typeof text !== 'string') throw new Error('実観測の文字列項目が不正です')
  return text
}
/** @param {string} [file] @param {Date} [now] @returns {(import('./types/diagnostics.d.mts').Observation & {classification: string, rerun_in_this_command: boolean})[]} */
export function readObservations(file, now = new Date()) {
  if (!file) return []
  if (/(?:^|[\\/])(?:auth\.json|history\.jsonl|sessions|archived_sessions)(?:[\\/]|$)/i.test(file) || statSync(file).size > 1024 * 1024) throw new Error('実観測の限定 JSON ファイルを指定してください')
  const value = jsonFile(file)
  if (!record(value) || value.schema_version !== 1 || !Array.isArray(value.observations) || value.observations.length > 100) throw new Error('observations の形式が不正です')
  const allowed = ['kind', 'surface', 'binary', 'version', 'result', 'observed_at', 'evidence']
  return value.observations.map((/** @type {unknown} */ row) => {
    if (!record(row) || Object.keys(row).some(key => !allowed.includes(key) || typeof row[key] !== 'string' || row[key].length > 4096) || typeof row.result !== 'string' || !['passed', 'failed', 'unknown'].includes(row.result) || typeof row.observed_at !== 'string' || ['kind', 'surface', 'observed_at', 'evidence'].some(key => typeof row[key] !== 'string' || !row[key].trim()) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(row.observed_at) || !Number.isFinite(Date.parse(row.observed_at)) || Date.parse(row.observed_at) > now.getTime()) throw new Error('実観測の日時・結果・項目が不正です')
    if (new Date(row.observed_at).toISOString() !== row.observed_at.replace(/(?<!\.\d{3})Z$/, '.000Z')) throw new Error('実観測の日時が不正です')
    return { ...row, kind: observationString(row, 'kind'), surface: observationString(row, 'surface'), evidence: observationString(row, 'evidence'), result: /** @type {import('./types/diagnostics.d.mts').Observation['result']} */ (row.result), observed_at: row.observed_at, classification: 'reported-observation', rerun_in_this_command: false }
  })
}
/** @param {string} name @param {string[]} args @param {string} root @returns {import('./types/diagnostics.d.mts').ToolProbe} */
function probe(name, args, root) {
  try {
    const locations = execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', [name], { encoding: 'utf8', cwd: root, timeout: 5000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim().split(/\r?\n/)
    // Windows の .cmd を文字列で再解釈せず、同じ npm shim の JS entry を Node で呼ぶ。
    let binary = locations[0]
    let command = binary, parameters = args
    if (process.platform === 'win32' && /\.cmd$/i.test(binary)) {
      if (name !== 'codex') return { name, binary, result: 'unknown', reason: 'cmd shim は診断で実行しません' }
      const entry = path.join(path.dirname(binary), 'node_modules/@openai/codex/bin/codex.js')
      if (!existsSync(entry)) return { name, binary, result: 'unknown', reason: 'npm Codex entry を確認できません' }
      command = process.execPath; parameters = [entry, ...args]
    }
    const version = execFileSync(command, parameters, { encoding: 'utf8', cwd: root, timeout: 10000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim().split(/\r?\n/)[0]
    return { name, binary, version, result: 'passed', evidence: 'version-command', ...(name === 'codex' ? { model_compatibility: 'unknown' } : {}) }
  } catch { return { name, result: 'unknown', reason: '未導入または版の取得に失敗' } }
}
/** @param {unknown} config @param {string} source @param {string} root */
export function selectedConfig(config, source, root) {
  if (!record(config)) throw new Error('設定はobjectで指定してください')
  /** @type {{key: string, value: string | boolean, source: string, classification: string, hook_trust?: string}[]} */
  const result = []
  for (const name of ['model', 'sandbox_mode', 'approval_policy']) if (config[name] !== undefined) result.push({ key: name, value: typeof config[name] === 'string' ? config[name].slice(0, 512) : 'invalid-type', source, classification: 'configured' })
  if (record(config.features) && config.features.hooks !== undefined) result.push({ key: 'features.hooks', value: typeof config.features.hooks === 'boolean' ? config.features.hooks : 'invalid-type', source, classification: 'configured' })
  const project = record(config.projects) ? config.projects[root] : undefined
  const trust = record(project) ? project.trust_level : undefined
  if (trust !== undefined) result.push({ key: 'project.trust_level', value: typeof trust === 'string' ? trust.slice(0, 512) : 'invalid-type', source, classification: 'configured', hook_trust: 'unknown' })
  return result
}
/** @param {string} [root] @param {{observations?: string, python?: string, personalConfig?: string, probes?: typeof probe}} [options] */
export function doctor(root = ROOT, { observations, python, personalConfig = path.join(os.homedir(), '.codex/config.toml'), probes = probe } = {}) {
  const now = new Date()
  const settings = [], warnings = []
  for (const source of [...new Set([personalConfig, path.join(root, '.codex/config.toml')])]) {
    if (!source || !existsSync(source)) continue
    try { settings.push(...selectedConfig(toml(readFileSync(source, 'utf8')), source, root)) } catch { warnings.push(`設定を解析できません: ${source}`) }
  }
  const common = path.resolve(root, git(root, 'rev-parse', '--git-common-dir'))
  const installed = path.join(common, 'harness-tools/codex/node_modules/.bin/codex.cmd')
  return {
    schema_version: 1, checked_at: now.toISOString(), root, platform: process.platform,
    git: { commit: git(root, 'rev-parse', 'HEAD'), branch: git(root, 'branch', '--show-current'), common_dir: common, changed_paths: git(root, 'status', '--porcelain').split('\n').filter(Boolean) },
    tools: ['node', 'git', 'gh', 'python', 'codex'].map(name => { const tool = probes(name, ['--version'], root); return ['node', 'python'].includes(name) ? { ...tool, requirement: { minimum: name === 'node' ? NODE_REQUIREMENT : '3.11', result: versionSupported(tool.version, name) } } : tool }),
    python_selection: resolvePython({ root, python }),
    additional_codex: { binary: installed, present: existsSync(installed), model_compatibility: 'unknown', source: 'common Git directory' },
    settings, effective_overrides: 'コマンドライン・親セッションの上書きは未観測です。設定ファイルだけでは実効値を確定しません。',
    hooks: { codex_configured: existsSync(path.join(root, '.codex/hooks.json')), claude_configured: existsSync(path.join(root, '.claude/settings.json')), trusted: 'unknown', fired: 'unknown' },
    observations: readObservations(observations, now), warnings,
    evidence_boundary: '版の取得と設定の存在だけでは、モデルの利用可否・hook実発火・read-only強制を確認したことにはなりません。'
  }
}
await cli(import.meta.url, () => { const options = parseOptions(process.argv.slice(2), ['root', 'observations', 'python']); return doctor(options.root ?? ROOT, options) })
