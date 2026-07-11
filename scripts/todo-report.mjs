#!/usr/bin/env node
/**
 * todo-report.mjs — TODO(要確認) の棚卸しレポート
 *
 * docs/ 配下の全 TODO(要確認) 行を収集し、「最終確認: YYYY-MM」の月でグルーピングして出力する。
 * 四半期の定期メンテナンス(ROADMAP.md「定期メンテナンス」節)の起点に使う。
 *
 * 使い方:
 *   node scripts/todo-report.mjs                 # Markdown レポート(古い月から)
 *   node scripts/todo-report.mjs --before 2026-04  # 指定月より前のものだけ
 *   node scripts/todo-report.mjs --json          # 機械可読出力(スキルからの利用向け)
 *
 * これは検証ではなくレポートなので常に exit 0(書式の逸脱は validate-docs.mjs が検出する)。
 */
import { readFileSync } from 'node:fs'
import { collectDocs, forEachLine, toLines } from './lib/md-utils.mjs'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const beforeIdx = args.indexOf('--before')
const before = beforeIdx !== -1 ? args[beforeIdx + 1] : null
if (beforeIdx !== -1 && !/^\d{4}-\d{2}$/.test(before ?? '')) {
  console.error('--before は YYYY-MM 形式で指定してください(例: --before 2026-04)')
  process.exit(1)
}

const todos = [] // { file, line, month, text }
for (const d of collectDocs()) {
  const text = readFileSync(d.abs, 'utf8')
  forEachLine(toLines(text), (line, lineNo, inFence) => {
    if (inFence || !line.includes('TODO(要確認)')) return
    const months = [...line.matchAll(/最終確認: (\d{4}-\d{2})/g)]
    const month = months.at(-1)?.[1] ?? '(最終確認なし)'
    if (before && month !== '(最終確認なし)' && month >= before) return
    const body = line.replace(/^>\s*\*\*TODO\(要確認\):\*\*\s*/, '').trim()
    todos.push({ file: d.repoRel, line: lineNo, month, text: body })
  })
}

if (asJson) {
  console.log(JSON.stringify(todos, null, 2))
  process.exit(0)
}

const byMonth = new Map()
for (const t of todos) {
  if (!byMonth.has(t.month)) byMonth.set(t.month, [])
  byMonth.get(t.month).push(t)
}
const months = [...byMonth.keys()].sort()

console.log(`# TODO(要確認) 棚卸しレポート${before ? `(${before} より前)` : ''}`)
console.log('')
console.log('| 最終確認 | 件数 | ファイル数 |')
console.log('| --- | --- | --- |')
for (const m of months) {
  const items = byMonth.get(m)
  console.log(`| ${m} | ${items.length} | ${new Set(items.map(i => i.file)).size} |`)
}
console.log(`| 合計 | ${todos.length} | ${new Set(todos.map(t => t.file)).size} |`)
for (const m of months) {
  console.log('')
  console.log(`## ${m}`)
  console.log('')
  for (const t of byMonth.get(m)) {
    const excerpt = t.text.length > 80 ? `${t.text.slice(0, 80)}…` : t.text
    console.log(`- ${t.file}:L${t.line} — ${excerpt}`)
  }
}
