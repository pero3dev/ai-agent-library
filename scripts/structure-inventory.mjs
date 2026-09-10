#!/usr/bin/env node
import { lstatSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { loadStructure } from './check-structure.mjs'
import { generatedPath } from './lib/hook-core.mjs'
import { cli, git, parseOptions, ROOT } from './lib/tooling-common.mjs'

const key = value => process.platform === 'win32' ? path.resolve(value).toLowerCase() : path.resolve(value)
const within = (parent, child) => { const relative = path.relative(parent, child); return relative === '' || relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) }
const labels = { source: '追跡正本・実装', dependencies: '依存', site_generated: 'サイト生成物', git_metadata: 'Git metadata', evaluation: '評価・実行記録と作業コピー', helper_tools: '補助ツール', local_other: 'その他のローカルファイル' }
const gitMetadataFiles = new Set(['HEAD', 'ORIG_HEAD', 'FETCH_HEAD', 'MERGE_HEAD', 'MERGE_MODE', 'MERGE_MSG', 'AUTO_MERGE', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'BISECT_LOG', 'BISECT_NAMES', 'BISECT_EXPECTED_REV', 'BISECT_START', 'COMMIT_EDITMSG', 'SQUASH_MSG', 'config', 'config.worktree', 'description', 'index', 'packed-refs', 'shallow', 'commondir', 'gitdir'])

// 明示した測定入口も祖先の junction/symlink を含めて確認する。内部リンクは walk で除外する。
function checkedDirectory(directory) {
  const absolute = path.resolve(directory)
  const volume = path.parse(absolute).root
  let current = volume
  for (const part of absolute.slice(volume.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part)
    if (lstatSync(current).isSymbolicLink()) throw new Error('測定入口または祖先が symlink/junction です')
  }
  if (!lstatSync(absolute).isDirectory()) throw new Error('測定入口はディレクトリで指定してください')
  return realpathSync.native(absolute)
}

export function inventoryRoots(candidates) {
  const unique = [...new Map(candidates.map(row => [key(row.path), { ...row, path: path.resolve(row.path) }])).values()]
  return unique.map(row => {
    const ancestor = unique.filter(other => key(other.path) !== key(row.path) && within(other.path, row.path)).sort((a, b) => a.path.length - b.path.length)[0]
    return { ...row, status: ancestor ? 'covered-by-parent' : 'measured', ...(ancestor ? { covered_by: ancestor.path } : {}) }
  })
}

export function inventoryCategory(absolute, { common, checkouts }) {
  if (within(common, absolute)) {
    const relative = path.relative(common, absolute).split(path.sep).join('/')
    if (/^harness-tools(?:\/|$)/.test(relative)) return 'helper_tools'
    if (/^(?:harness|freshness|harness-eval|harness-evaluations)(?:\/|$)/.test(relative)) return 'evaluation'
    if (/^(?:objects|refs|logs|hooks|info|worktrees|rr-cache|lfs)(?:\/|$)/.test(relative) || gitMetadataFiles.has(relative.replace(/\.lock$/, ''))) return 'git_metadata'
    return 'local_other'
  }
  const checkout = checkouts.filter(row => within(row.path, absolute)).sort((a, b) => b.path.length - a.path.length)[0]
  if (!checkout) return 'local_other'
  const relative = path.relative(checkout.path, absolute).split(path.sep).join('/')
  if (relative === '.git') return 'git_metadata'
  if (relative.split('/').includes('node_modules')) return 'dependencies'
  if (generatedPath(relative)) return 'site_generated'
  return checkout.tracked.has(relative) ? 'source' : 'local_other'
}

export function measureInventory(scopes, context) {
  const groups = Object.fromEntries(Object.entries(labels).map(([name, label]) => [name, { label, files: 0, bytes: 0, tracked_paths: 0 }]))
  const links = [], errors = [], other = []
  const roots = inventoryRoots(scopes)
  for (const checkout of context.checkouts) for (const relative of checkout.tracked) groups[inventoryCategory(path.join(checkout.path, relative), context)].tracked_paths++
  const visit = absolute => {
    let stat
    try { stat = lstatSync(absolute) } catch (error) { errors.push({ path: absolute, code: error.code ?? 'unknown' }); return }
    if (stat.isSymbolicLink()) { links.push(absolute); return }
    if (stat.isDirectory()) {
      let entries
      try { entries = readdirSync(absolute) } catch (error) { errors.push({ path: absolute, code: error.code ?? 'unknown' }); return }
      for (const entry of entries) visit(path.join(absolute, entry))
    } else if (stat.isFile()) {
      const group = groups[inventoryCategory(absolute, context)]
      group.files++; group.bytes += stat.size
    } else other.push(absolute)
  }
  for (const scope of roots.filter(row => row.status === 'measured')) visit(scope.path)
  return { roots, groups, totals: Object.values(groups).reduce((total, row) => ({ files: total.files + row.files, bytes: total.bytes + row.bytes, tracked_paths: total.tracked_paths + row.tracked_paths }), { files: 0, bytes: 0, tracked_paths: 0 }), skipped_links: links, skipped_special_files: other, errors, completeness: links.length || errors.length || other.length ? 'partial' : 'complete-within-measured-roots' }
}

export function structureInventory(root = ROOT, { worktrees = false, gitReader = git } = {}) {
  root = checkedDirectory(root)
  if (key(checkedDirectory(gitReader(root, 'rev-parse', '--show-toplevel'))) !== key(root)) throw new Error('--root は Git checkout のルートを指定してください')
  const contract = loadStructure(root)
  const common = checkedDirectory(path.resolve(root, gitReader(root, 'rev-parse', '--git-common-dir')))
  const checkouts = [{ path: root, tracked: new Set(gitReader(root, 'ls-files', '-z').split('\0').filter(Boolean)) }]
  const scopes = [{ path: root, kind: 'current-checkout' }, { path: common, kind: 'common-git' }]
  const registered = gitReader(root, 'worktree', 'list', '--porcelain', '-z').split('\0').filter(field => field.startsWith('worktree ')).map(field => field.slice(9))
  const additional = []
  for (const directory of registered) {
    if (key(directory) === key(root)) continue
    const row = { path: directory }
    if (!worktrees) { row.status = 'not-requested'; additional.push(row); continue }
    try {
      const verified = checkedDirectory(directory)
      const ownCommon = checkedDirectory(path.resolve(verified, gitReader(verified, 'rev-parse', '--git-common-dir')))
      if (key(ownCommon) !== key(common) || key(checkedDirectory(gitReader(verified, 'rev-parse', '--show-toplevel'))) !== key(verified)) throw new Error('同一 common Git の登録 checkout と確認できません')
      checkouts.push({ path: verified, tracked: new Set(gitReader(verified, 'ls-files', '-z').split('\0').filter(Boolean)) })
      scopes.push({ path: verified, kind: 'registered-worktree' })
      row.path = verified; row.status = 'selected'
    } catch { row.status = 'unavailable-or-different-common-git' }
    additional.push(row)
  }
  const result = measureInventory(scopes, { common, checkouts })
  for (const row of additional) {
    const covering = result.roots.find(scope => scope.status === 'measured' && within(scope.path, row.path))
    row.storage = covering ? 'included-in-measured-root' : 'not-measured'
    if (covering) row.covered_by = covering.path
    row.tracked_inventory = row.status === 'selected' ? 'included' : 'not-measured'
  }
  return { schema_version: 1, checked_at: new Date().toISOString(), root, common_dir: common, measurement: 'regular-file-logical-bytes', allocation_measured: false, measured_file_contents_read: false, configuration_read: ['harness/structure.json'], automatic_deletion: false, ...result, worktrees: additional, excluded_scope: ['登録されていない兄弟ディレクトリ・独立コピーは探索しません。', 'symlink/junction と特殊ファイルは辿らず、容量へ加算しません。'], classification: 'common Git 内の評価領域・補助ツールは配下の依存もそれぞれの用途へ計上し、他区分へ重複加算しません。追跡数は選択 checkout の Git index、容量は実在する通常ファイルです。', retention: { ...contract.retention, inventory_required: result.totals.bytes >= contract.retention.inventory_threshold_bytes, evidence_age_assessed: false, note: '閾値は棚卸しの目安です。完了後 90 日経過だけで削除を許可せず、所有・利用終了・証拠保存・復旧方法・実体パスを別途確認します。' } }
}

export function parseInventoryOptions(args) {
  let worktrees = false
  const values = []
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--worktrees') {
      if (worktrees) throw new Error('重複の引数: --worktrees')
      worktrees = true
    } else {
      const pair = [args[index], args[++index]]
      parseOptions(pair, ['root'])
      values.push(...pair)
    }
  }
  return { ...parseOptions(values, ['root']), worktrees }
}

await cli(import.meta.url, () => { const options = parseInventoryOptions(process.argv.slice(2)); return structureInventory(options.root ?? ROOT, options) })
