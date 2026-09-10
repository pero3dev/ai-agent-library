#!/usr/bin/env node
/**
 * validate-docs.mjs — docs/ の front matter / 固定 H2 / TODO(要確認) 書式の検証 CLI
 *
 * 使い方:
 *   node scripts/validate-docs.mjs --all               # docs/ 配下の全 .md を検証(CI 用)
 *   node scripts/validate-docs.mjs <file> [<file>...]  # 指定した docs/ 配下の .md ファイルを検証
 *   node scripts/validate-docs.mjs --all --warn-only=front-matter,h2,todo
 *
 * --warn-only は移行時の保険(指定した検査をエラー → 警告に降格して CI を通す)。
 * 恒常的に付けたままにしない(CLAUDE.md のレビュー観点を無効化する運用は不可)。
 *
 * 出力: `docs/...:行: [検査名] メッセージ` を 1 問題 1 行。エラー 0 なら "OK: N files" のみ。
 * exit code: エラーあり = 1 / なし = 0
 */
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { collectDocs, REPO_ROOT, toRepoRel } from './lib/md-utils.mjs'
import { validateDoc } from './lib/validate-core.mjs'

const args = process.argv.slice(2)
if (args.length === 1 && args[0] === '--help') {
  console.log(
    [
      '使い方: node scripts/validate-docs.mjs (--all | <file>...) [--warn-only=front-matter,h2,todo]',
      '  --all        docs/ 配下の全 .md を検証する(CI で使用)',
      '  <file>...    指定ファイルのみ検証する(docs/ 外・.md 以外・対象なしはエラー)',
      '  --warn-only  指定した検査をエラーから警告に降格する(移行時の一時的な保険。恒常使用はしない)',
    ].join('\n')
  )
  process.exit(0)
}

const warnOnly = new Set()
const checkNames = new Set(['front-matter', 'h2', 'todo', 'filename', 'fence'])
// collectDocs はリンクを追跡しない。--all でリンク先の記事を黙って除外して
// 全件成功と表示しないよう、対象探索の前にリンク自体を検出する。
function assertNoLinkedDocs(dir) {
  if (lstatSync(dir).isSymbolicLink()) throw new Error(`--all の対象に symlink / junction は指定できません: ${toRepoRel(dir)}`)
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`--all の対象に symlink / junction は指定できません: ${toRepoRel(target)}`)
    if (entry.isDirectory()) assertNoLinkedDocs(target)
  }
}
/** 引数と全対象を先に確定する。入力の誤りは --warn-only でも成功にしない。 */
let targets
try {
  let all = false
  const files = []
  for (const arg of args) {
    if (arg === '--all') {
      if (all) throw new Error('--all は 1 回だけ指定してください')
      all = true
    } else if (arg.startsWith('--warn-only=')) {
      const names = arg.slice('--warn-only='.length).split(',')
      if (names.some(name => !checkNames.has(name))) throw new Error(`--warn-only の検査名が不正です: ${names.join(',')} (使用可能: ${[...checkNames].join(',')})`)
      for (const name of names) warnOnly.add(name)
    } else if (arg.startsWith('-')) {
      throw new Error(`未対応の引数です: ${arg} (--help は単独で指定してください)`)
    } else {
      files.push(arg)
    }
  }
  if (all && files.length) throw new Error('--all と個別ファイルは併用できません')
  if (all) assertNoLinkedDocs(path.join(REPO_ROOT, 'docs'))
  targets = all ? collectDocs() : files.map(arg => ({ abs: path.resolve(arg), repoRel: toRepoRel(path.resolve(arg)) }))
  if (!targets.length) throw new Error('検証対象がありません。--all または docs/ 配下の .md ファイルを指定してください')
  for (const target of targets) {
    if (!/^docs\/.*\.md$/i.test(target.repoRel)) throw new Error(`対象はこのリポジトリの docs/ 配下の .md ファイルで指定してください: ${target.repoRel}`)
    if (!statSync(target.abs).isFile()) throw new Error(`通常ファイルではありません: ${target.repoRel}`)
    if (!/^docs\/.*\.md$/i.test(toRepoRel(realpathSync(target.abs)))) throw new Error(`参照先が docs/ 配下にありません: ${target.repoRel}`)
  }
} catch (error) {
  console.error(`引数・対象エラー: ${error.message}`)
  process.exit(1)
}

let errorCount = 0
let warnCount = 0
const filesWithError = new Set()

for (const t of targets) {
  let text
  try {
    text = readFileSync(t.abs, 'utf8')
  } catch {
    console.error(`${t.repoRel}:1: [front-matter] ファイルを読み込めません`)
    errorCount++
    filesWithError.add(t.repoRel)
    continue
  }
  for (const issue of validateDoc(t.repoRel, text)) {
    const demoted = warnOnly.has(issue.check)
    const label = demoted ? `warning:${issue.check}` : issue.check
    console.error(`${t.repoRel}:${issue.line}: [${label}] ${issue.message}`)
    if (demoted) {
      warnCount++
    } else {
      errorCount++
      filesWithError.add(t.repoRel)
    }
  }
}

if (errorCount === 0) {
  const warnNote = warnCount > 0 ? `(警告 ${warnCount} 件)` : ''
  console.log(`OK: ${targets.length} files${warnNote}`)
  process.exit(0)
} else {
  console.error(`NG: ${errorCount} error(s) in ${filesWithError.size} file(s)(検証 ${targets.length} ファイル)`)
  process.exit(1)
}
