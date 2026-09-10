#!/usr/bin/env node
/**
 * Markdown パーサによる相対リンク・見出しアンカーとセクション収録表の検査。
 * docs/examples、root/project 運用文書、harness/ と製品別指示を対象とする。
 * research は索引と --include で明示した Markdown を検査する。
 * その他の調査メモ、プレースホルダーを含む templates、依存・生成物は対象外。
 */
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectDocs, existsCaseSensitive, REPO_ROOT, splitLocalDestination, toRepoRel } from './lib/md-utils.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'

export function collectLinkTargets(repoRoot = REPO_ROOT, { additionalFiles = [] } = {}) {
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
  for (const dir of ['docs', 'examples', 'project', 'harness', 'scripts', '.agents', '.codex', '.claude']) walk(path.join(repoRoot, dir))
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) add(path.join(repoRoot, entry.name))
  }
  const researchIndex = path.join(repoRoot, 'research/README.md')
  const selected = [...(existsSync(researchIndex) ? ['research/README.md'] : []), ...additionalFiles]
  for (const file of selected) {
    if (typeof file !== 'string' || !file.endsWith('.md') || file.includes('\\') || file.includes('\0') || path.posix.isAbsolute(file) || path.win32.isAbsolute(file) || file.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`追加対象はリポジトリ相対の Markdown ファイルで指定してください: ${file}`)
    const abs = path.join(repoRoot, file)
    if (!existsCaseSensitive(abs, repoRoot)) throw new Error(`追加対象がありません(大文字小文字を含む): ${file}`)
    let current = repoRoot
    for (const part of file.split('/')) {
      current = path.join(current, part)
      if (lstatSync(current).isSymbolicLink()) throw new Error(`追加対象の symlink は検査できません: ${file}`)
    }
    if (!lstatSync(abs).isFile()) throw new Error(`追加対象は Markdown ファイルで指定してください: ${file}`)
    add(abs)
  }
  return [...targets.values()].sort((a, b) => a.repoRel.localeCompare(b.repoRel))
}

export function checkLinks(repoRoot = REPO_ROOT, options = {}) {
  const problems = []
  let checkedLinks = 0
  const targets = collectLinkTargets(repoRoot, options)
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
  try {
    const args = process.argv.slice(2)
    const additionalFiles = []
    if (args.length === 1 && args[0] === '--help') console.log('node scripts/check-links.mjs [--include <repo-relative.md>]...\n既定の文書・project/・research/README.md に追加して、指定 Markdown のリンクを検査します。')
    else {
      for (let index = 0; index < args.length; index++) {
        if (args[index] !== '--include') throw new Error(`未知の引数: ${args[index]}`)
        const file = args[++index]
        if (!file || file.startsWith('--')) throw new Error('--include の Markdown ファイルが必要です')
        additionalFiles.push(file)
      }
      const { problems, checkedLinks, checkedFiles } = checkLinks(REPO_ROOT, { additionalFiles })
      if (problems.length === 0) console.log(`OK: ${checkedFiles} files, ${checkedLinks} links`)
      else {
        for (const problem of problems) console.error(problem)
        console.error(`NG: ${problems.length} problem(s)(検証 ${checkedFiles} ファイル・${checkedLinks} リンク)`)
        process.exitCode = 1
      }
    }
  } catch (error) {
    console.error(`check-links: ${error.message}`)
    process.exitCode = 1
  }
}
