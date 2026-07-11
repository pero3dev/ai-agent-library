#!/usr/bin/env node
/**
 * validate-docs.mjs — docs/ の front matter / 固定 H2 / TODO(要確認) 書式の検証 CLI
 *
 * 使い方:
 *   node scripts/validate-docs.mjs --all               # docs/ 配下の全 .md を検証(CI 用)
 *   node scripts/validate-docs.mjs <file> [<file>...]  # 指定ファイルのみ(docs/ 外・.md 以外は黙ってスキップ)
 *   node scripts/validate-docs.mjs --all --warn-only=front-matter,h2,todo
 *
 * --warn-only は移行時の保険(指定した検査をエラー → 警告に降格して CI を通す)。
 * 恒常的に付けたままにしない(CLAUDE.md のレビュー観点を無効化する運用は不可)。
 *
 * 出力: `docs/...:行: [検査名] メッセージ` を 1 問題 1 行。エラー 0 なら "OK: N files" のみ。
 * exit code: エラーあり = 1 / なし = 0
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { collectDocs, REPO_ROOT, toRepoRel } from './lib/md-utils.mjs'
import { validateDoc } from './lib/validate-core.mjs'

const args = process.argv.slice(2)
if (args.includes('--help') || args.length === 0) {
  console.log(
    [
      '使い方: node scripts/validate-docs.mjs (--all | <file>...) [--warn-only=front-matter,h2,todo]',
      '  --all        docs/ 配下の全 .md を検証する(CI で使用)',
      '  <file>...    指定ファイルのみ検証する(docs/ 外や .md 以外は黙ってスキップ = フック互換)',
      '  --warn-only  指定した検査をエラーから警告に降格する(移行時の一時的な保険。恒常使用はしない)',
    ].join('\n')
  )
  process.exit(0)
}

const warnOnly = new Set(
  args
    .filter(a => a.startsWith('--warn-only='))
    .flatMap(a => a.slice('--warn-only='.length).split(','))
    .filter(Boolean)
)

/** 検証対象を確定する */
let targets
if (args.includes('--all')) {
  targets = collectDocs()
} else {
  targets = []
  for (const arg of args) {
    if (arg.startsWith('--')) continue
    const abs = path.resolve(arg)
    const repoRel = toRepoRel(abs)
    // docs/ 配下の .md のみが対象。それ以外は黙ってスキップ(フックから無差別に呼べるように)
    if (/^docs\/[^/]+\/[^/]+\.md$/.test(repoRel)) {
      targets.push({ abs, repoRel })
    }
  }
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
