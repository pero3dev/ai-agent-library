#!/usr/bin/env node
import { lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { collectLinkTargets } from './check-links.mjs'
import { generatedPath } from './lib/hook-core.mjs'
import { cli, git, parseOptions, ROOT } from './lib/tooling-common.mjs'
import { checkPublicRecords } from './lib/public-records.mjs'
import { isRecord } from './lib/json-guards.mjs'

/** @param {unknown} value @returns {value is string} */
const relativePath = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && !/[\x00-\x1f]/.test(value) && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) && value.split('/').every(part => part && part !== '.' && part !== '..')
/** @param {unknown} value @returns {value is string[]} */
const pathArray = value => Array.isArray(value) && value.length > 0 && value.every(relativePath) && new Set(value).size === value.length

/** @param {unknown} contract @returns {asserts contract is import('./types/diagnostics.d.mts').StructureContract} */
function assertStructure(contract) {
  if (!isRecord(contract) || contract.schema_version !== 1) throw new Error('structure.json: schema_version が不正です')
  for (const field of /** @type {const} */ (['root_files', 'top_directories', 'required_files', 'markdown_coverage_roots', 'retired_paths', 'retired_directories'])) {
    if (!pathArray(contract[field])) throw new Error(`structure.json: ${field} が不正です`)
  }
  // The loop checks the actual path arrays; metadata not consumed here stays unknown.
  const rootFiles = contract.root_files, topDirectories = contract.top_directories
  if (!pathArray(rootFiles) || !pathArray(topDirectories) || [...rootFiles, ...topDirectories].some(value => value.includes('/')) || rootFiles.some(value => topDirectories.includes(value))) throw new Error('structure.json: root のファイル・ディレクトリ区分が不正です')
  const retention = contract.retention
  if (!isRecord(retention) || retention.completed_evidence_minimum_days !== 90 || retention.inventory_threshold_bytes !== 500 * 1024 * 1024 || retention.automatic_deletion !== false || !Array.isArray(retention.deletion_requires) || !retention.deletion_requires.length) throw new Error('structure.json: 90 日保持・500 MiB 棚卸し・自動削除なしの契約が必要です')
}

export function loadStructure(root = ROOT) {
  for (const file of ['harness', 'harness/structure.json']) if (lstatSync(path.join(root, file)).isSymbolicLink()) throw new Error(`structure.json: 設定をリンク経由で読めません: ${file}`)
  /** @type {unknown} */
  const contract = JSON.parse(readFileSync(path.join(root, 'harness/structure.json'), 'utf8').replace(/^\uFEFF/, ''))
  assertStructure(contract)
  return contract
}

/** @param {string} [root] @param {{trackedFiles?: string[], linkCollector?: typeof collectLinkTargets}} [options] */
export function checkStructure(root = ROOT, { trackedFiles, linkCollector = collectLinkTargets } = {}) {
  root = path.resolve(root)
  const contract = loadStructure(root)
  const files = trackedFiles ?? git(root, 'ls-files', '-z').split('\0').filter(Boolean)
  const problems = []
  let unsafe = false
  for (const file of files) {
    if (!relativePath(file)) { problems.push(`追跡パスが不正です: ${file}`); unsafe = true; continue }
    const parts = file.split('/')
    if (parts.length === 1 && !contract.root_files.includes(file)) problems.push(`root に追加できないファイルです。計画・記録は project/ へ置いてください: ${file}`)
    if (parts.length > 1 && !contract.top_directories.includes(parts[0])) problems.push(`未許可のトップディレクトリです: ${file}`)
    if (generatedPath(file) || parts.some(part => ['node_modules', '__pycache__', '.harness-eval-scratch'].includes(part))) problems.push(`生成物・依存は追跡できません: ${file}`)
    const lower = file.toLowerCase()
    if (contract.retired_paths.some(retired => retired.toLowerCase() === lower) || contract.retired_directories.some(dir => lower === dir.toLowerCase() || lower.startsWith(`${dir.toLowerCase()}/`)) || /^(?:website\/)?scripts\/.*\.test\.[^/]+$/i.test(file)) problems.push(`廃止済みの配置です: ${file}`)
    let absolute = root
    for (const part of parts) {
      absolute = path.join(absolute, part)
      try {
        if (lstatSync(absolute).isSymbolicLink()) { problems.push(`追跡ファイルのリンクは検査できません: ${file}`); unsafe = true; break }
      } catch (error) { problems.push(`追跡ファイルを確認できません: ${file} (${error instanceof Error && 'code' in error ? error.code : 'unknown'})`); break }
    }
  }
  const tracked = new Set(files)
  for (const file of [...contract.root_files, ...contract.required_files]) if (!tracked.has(file)) problems.push(`必須の追跡ファイルがありません: ${file}`)
  // collectLinkTargets の入口自体がリンクの場合も、外部の本文を読みに行かない。
  for (const dir of ['docs', 'examples', 'project', 'harness', 'scripts', 'ios', '.agents', '.codex', '.claude', 'research']) {
    try { if (lstatSync(path.join(root, dir)).isSymbolicLink()) { problems.push(`リンク検査の入口をリンクにはできません: ${dir}`); unsafe = true } } catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') { problems.push(`${dir}: ${error instanceof Error && 'code' in error ? error.code : 'unknown'}`); unsafe = true } }
  }
  if (!unsafe) {
    try { problems.push(...checkPublicRecords(root, files, contract)) } catch (error) { problems.push(`公開記録の検査に失敗しました: ${error instanceof Error ? error.message : String(error)}`) }
    try {
      const targets = new Set(linkCollector(root).map(target => target.repoRel))
      for (const file of files) if (/\.md$/i.test(file) && (contract.markdown_coverage_roots.some(dir => file.startsWith(`${dir}/`)) || contract.required_files.includes(file)) && !targets.has(file)) problems.push(`Markdown がリンク検査から脱落しています: ${file}`)
    } catch (error) { problems.push(`リンク対象の収集に失敗しました: ${error instanceof Error ? error.message : String(error)}`) }
  }
  return { schema_version: 1, tracked_files: files.length, root_files: files.filter(file => !file.includes('/')).length, root_markdown_files: files.filter(file => !file.includes('/') && /\.md$/i.test(file)).length, problems, verified: problems.length === 0, evidence: 'static' }
}

await cli(import.meta.url, () => {
  const options = parseOptions(process.argv.slice(2), ['root'])
  const result = checkStructure(options.root ?? ROOT)
  if (!result.verified) process.exitCode = 1
  return result
})
