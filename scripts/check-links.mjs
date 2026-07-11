#!/usr/bin/env node
/**
 * check-links.mjs — 相対リンク切れ + セクション README 収録表の漏れを検証する CLI
 *
 * sync-content.mjs は同種の問題を「警告のみ」で通すが、こちらは exit 1 で失敗させる(CI 用)。
 *
 * 対象: docs/(全 .md)・examples/(全 .md)・GLOSSARY.md・ルート README.md
 * 対象外: research/(調査メモ)・templates/(プレースホルダーリンクを含む)・*-PLAN.md・ROADMAP.md
 *
 * 検査:
 *   1. フェンス外の相対リンク(.md・画像・ディレクトリ)が「大文字小文字まで厳密に」存在すること
 *      (Windows の FS は大小文字を区別しないため readdir 突合で判定 — ubuntu の CI との差異を吸収)
 *   2. docs/<sec>/*.md(README 除く)が所属セクション README の収録表でリンク化されていること
 *
 * exit code: 問題あり = 1 / なし = 0
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { collectDocs, existsCaseSensitive, forEachLine, REPO_ROOT, toLines, toRepoRel } from './lib/md-utils.mjs'

/** 検査対象ファイルを列挙する */
function collectTargets() {
  const targets = collectDocs().map(d => ({ abs: d.abs, repoRel: d.repoRel }))
  const walk = dir => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue
        walk(abs)
      } else if (e.name.endsWith('.md')) {
        targets.push({ abs, repoRel: toRepoRel(abs) })
      }
    }
  }
  walk(path.join(REPO_ROOT, 'examples'))
  for (const name of ['GLOSSARY.md', 'README.md']) {
    targets.push({ abs: path.join(REPO_ROOT, name), repoRel: name })
  }
  return targets
}

/** 1 行から inline リンクの飛び先を抽出する(](target) 形式。タイトル付き "..." は除去) */
function extractLinkTargets(line) {
  const out = []
  for (const m of line.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    out.push(m[1])
  }
  return out
}

const problems = []
let checkedLinks = 0

const targets = collectTargets()
for (const t of targets) {
  const text = readFileSync(t.abs, 'utf8')
  forEachLine(toLines(text), (line, lineNo, inFence) => {
    if (inFence) return
    for (const raw of extractLinkTargets(line)) {
      // 外部リンク・アンカーのみ・サイト絶対パスは対象外
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue // http:, https:, mailto: など
      if (raw.startsWith('#')) continue
      if (raw.startsWith('/')) {
        problems.push(`${t.repoRel}:${lineNo}: ルート絶対パス "${raw}" は使わず相対パスで書いてください`)
        continue
      }
      let target
      try {
        target = decodeURI(raw.split('#')[0])
      } catch {
        problems.push(`${t.repoRel}:${lineNo}: リンク "${raw}" のパーセントエンコーディングが不正です`)
        continue
      }
      if (!target) continue
      checkedLinks++
      const abs = path.resolve(path.dirname(t.abs), target)
      if (!existsCaseSensitive(abs)) {
        problems.push(`${t.repoRel}:${lineNo}: リンク切れ "${raw}"(大文字小文字の不一致を含む)`)
      }
    }
  })
}

// --- ドキュメントファイル名の docs/ 横断一意性(CLAUDE.md 命名規約) ---
const docs = collectDocs()
const byName = new Map()
for (const d of docs.filter(d => !d.isReadme)) {
  const name = path.basename(d.repoRel)
  if (!byName.has(name)) byName.set(name, [])
  byName.get(name).push(d.repoRel)
}
for (const [name, files] of byName) {
  if (files.length > 1) {
    problems.push(`${files[1]}:1: ファイル名 ${name} が重複しています(docs/ 全体・セクション横断で一意にする規約: ${files.join(' / ')})`)
  }
}

// --- セクション README の収録表の漏れ(sync-content.mjs parseReadmeOrder と同じ判定) ---
const readmeLinked = new Map() // section -> Set<name(拡張子なし)>
for (const d of docs.filter(d => d.isReadme)) {
  const text = readFileSync(d.abs, 'utf8')
  const names = [...text.matchAll(/^\|\s*\[([\w-]+)\.md\]\(/gm)].map(m => m[1])
  readmeLinked.set(d.section, new Set(names))
}
for (const d of docs.filter(d => !d.isReadme)) {
  const name = path.basename(d.repoRel, '.md')
  const linked = readmeLinked.get(d.section)
  if (!linked) {
    problems.push(`docs/${d.section}/README.md:1: セクション README がありません`)
  } else if (!linked.has(name)) {
    problems.push(
      `docs/${d.section}/README.md:1: 収録表に ${name}.md のリンクがありません(執筆済みはリンク化する規約です)`
    )
  }
}

if (problems.length === 0) {
  console.log(`OK: ${targets.length} files, ${checkedLinks} links`)
  process.exit(0)
} else {
  for (const p of problems) console.error(p)
  console.error(`NG: ${problems.length} problem(s)(検証 ${targets.length} ファイル・${checkedLinks} リンク)`)
  process.exit(1)
}
