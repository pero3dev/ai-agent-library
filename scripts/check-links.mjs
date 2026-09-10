#!/usr/bin/env node
/**
 * Markdown パーサによる相対リンク・見出しアンカーとセクション収録表の検査。
 * docs/examples、root 運用文書、harness/ と製品別指示を対象とする。
 * 調査メモ、プレースホルダーを含む templates、依存・生成物は対象外。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectDocs, existsCaseSensitive, REPO_ROOT, splitLocalDestination, toRepoRel } from './lib/md-utils.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'

export function collectLinkTargets(repoRoot = REPO_ROOT) {
  const targets = new Map()
  const add = abs => targets.set(abs, { abs, repoRel: toRepoRel(abs, repoRoot) })
  const walk = dir => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(abs)
      } else if (entry.isFile() && entry.name.endsWith('.md')) add(abs)
    }
  }
  for (const dir of ['docs', 'examples', 'harness', 'scripts', '.agents', '.codex', '.claude']) walk(path.join(repoRoot, dir))
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) add(path.join(repoRoot, entry.name))
  }
  return [...targets.values()].sort((a, b) => a.repoRel.localeCompare(b.repoRel))
}

export function checkLinks(repoRoot = REPO_ROOT) {
  const problems = []
  let checkedLinks = 0
  const targets = collectLinkTargets(repoRoot)
  const parsed = new Map()
  const directoryCache = new Map() // 1 回の走査だけで共有し、編集後の再実行で古い一覧を使わない。
  const load = abs => {
    if (!parsed.has(abs)) parsed.set(abs, parseMarkdownLinks(readFileSync(abs, 'utf8')))
    return parsed.get(abs)
  }
  for (const target of targets) {
    for (const link of load(target.abs).links) {
      const raw = link.target
      const report = message => problems.push(`${target.repoRel}:${link.line}: リンク "${raw}" — ${message}`)
      const destination = splitLocalDestination(raw)
      if (destination.external) continue
      checkedLinks++
      if (destination.error) { report(destination.error); continue }
      const abs = destination.pathname ? path.resolve(path.dirname(target.abs), destination.pathname) : target.abs
      const rel = path.relative(repoRoot, abs)
      if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
        report('リポジトリの外を参照しています'); continue
      }
      if (!existsCaseSensitive(abs, repoRoot, directoryCache)) {
        report('リンク切れ(大文字小文字の不一致を含む)'); continue
      }
      if (!destination.fragment) continue
      let anchorFile = abs
      if (statSync(abs).isDirectory()) anchorFile = path.join(abs, 'README.md')
      if (!/\.md$/i.test(anchorFile)) continue // コード等の GitHub 行番号 fragment は見出し検査の対象外
      if (!existsCaseSensitive(anchorFile, repoRoot, directoryCache)) {
        report('ディレクトリのアンカーを解決する README.md がありません'); continue
      }
      if (!load(anchorFile).anchors.has(destination.fragment)) report(`見出しアンカー #${destination.fragment} がありません`)
    }
  }

  // 記事名は docs/ 横断で一意。README 収録表はラベルだけでなく実際の飛び先を検査。
  const docs = existsSync(path.join(repoRoot, 'docs')) ? collectDocs(repoRoot) : []
  const byName = new Map()
  const readmeLinked = new Map()
  for (const doc of docs) {
    if (doc.isReadme) {
      const paths = load(doc.abs).links.filter(link => link.inTable).flatMap(link => {
        const destination = splitLocalDestination(link.target)
        return destination.pathname ? [path.resolve(path.dirname(doc.abs), destination.pathname)] : []
      })
      readmeLinked.set(doc.section, new Set(paths))
    } else {
      const name = path.basename(doc.repoRel)
      if (!byName.has(name)) byName.set(name, [])
      byName.get(name).push(doc.repoRel)
    }
  }
  for (const [name, files] of byName) {
    if (files.length > 1) problems.push(`${files[1]}:1: ファイル名 ${name} が重複しています(docs/ 全体で一意: ${files.join(' / ')})`)
  }
  for (const doc of docs.filter(doc => !doc.isReadme)) {
    const linked = readmeLinked.get(doc.section)
    if (!linked) problems.push(`docs/${doc.section}/README.md:1: セクション README がありません`)
    else if (!linked.has(doc.abs)) problems.push(`docs/${doc.section}/README.md:1: 収録表に ${path.basename(doc.abs)} の正しいリンクがありません`)
  }
  return { problems, checkedLinks, checkedFiles: targets.length }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, checkedLinks, checkedFiles } = checkLinks()
  if (problems.length === 0) console.log(`OK: ${checkedFiles} files, ${checkedLinks} links`)
  else {
    for (const problem of problems) console.error(problem)
    console.error(`NG: ${problems.length} problem(s)(検証 ${checkedFiles} ファイル・${checkedLinks} リンク)`)
    process.exitCode = 1
  }
}
