/**
 * md-utils.mjs — docs/ 検証スクリプト共通ユーティリティ
 *
 * 方針(CLAUDE.md / 開発環境整備計画):
 * - npm 依存ゼロ(Node 標準ライブラリのみ)。フックからも import されるため起動を最速に保つ
 * - パースは正規表現 + 行走査(website/scripts/sync-content.mjs の getFrontMatterBlock /
 *   rewriteLinks のフェンス判定と同じ手法)。remark は使わない
 */
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** リポジトリルート(scripts/lib/ からの相対で解決。cwd に依存しない) */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** CRLF / BOM を正規化して行配列にする */
export function toLines(text) {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n')
}

/**
 * front matter ブロックを行単位で解析する。
 * 返り値: { fields: [{ key, value, line }], endLine, unclosed } | null(front matter なし)
 * line は 1 始まり。value は前後空白を除いた生文字列(引用符は剥がさない)
 */
export function parseFrontMatter(lines) {
  if (lines[0] !== '---') return null
  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      end = i
      break
    }
  }
  if (end === -1) return { fields: [], endLine: -1, unclosed: true }
  const fields = []
  for (let i = 1; i < end; i++) {
    const raw = lines[i]
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue
    const m = raw.match(/^([A-Za-z][\w-]*):(.*)$/)
    if (m) fields.push({ key: m[1], value: m[2].trim(), line: i + 1 })
  }
  return { fields, endLine: end + 1, unclosed: false }
}

/** 値の前後の引用符("...")を剥がす */
export function unquote(value) {
  return value.replace(/^"(.*)"$/, '$1')
}

/** tags: ["a", "b"] 形式を配列にする。形式不正なら null */
export function parseTagsArray(value) {
  const m = value.match(/^\[(.*)\]$/)
  if (!m) return null
  const inner = m[1].trim()
  if (!inner) return []
  return inner.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
}

/**
 * コードフェンス(``` / ~~~)の内外を判定しながら全行を列挙する。
 * fn(line, lineNo, inFence) — フェンスの開始行・終了行自体も inFence: true で渡す
 * CommonMark 準拠: 閉じフェンスは開きフェンスと同じ記号かつ同じ長さ以上
 * (```` の中に ``` を書く markdown-in-markdown の例を誤って閉じない)
 */
export function forEachLine(lines, fn) {
  let fenceChar = null
  let fenceLen = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^\s*(`{3,}|~{3,})/)
    let inFence = fenceChar !== null
    if (m) {
      if (fenceChar === null) {
        fenceChar = m[1][0]
        fenceLen = m[1].length
        inFence = true
      } else if (m[1][0] === fenceChar && m[1].length >= fenceLen) {
        fenceChar = null
        inFence = true
      }
    }
    fn(line, i + 1, inFence)
  }
}

/** docs/ 配下の全 .md を列挙する({ abs, repoRel, section, isReadme }) */
export function collectDocs(repoRoot = REPO_ROOT) {
  const docsDir = path.join(repoRoot, 'docs')
  const out = []
  for (const sec of readdirSync(docsDir, { withFileTypes: true })) {
    if (!sec.isDirectory()) continue
    for (const f of readdirSync(path.join(docsDir, sec.name))) {
      if (!f.endsWith('.md')) continue
      out.push({
        abs: path.join(docsDir, sec.name, f),
        repoRel: `docs/${sec.name}/${f}`,
        section: sec.name,
        isReadme: f === 'README.md',
      })
    }
  }
  return out.sort((a, b) => a.repoRel.localeCompare(b.repoRel))
}

const dirEntryCache = new Map()

/**
 * パスが「大文字小文字まで厳密に」存在するかを readdir 突合で判定する。
 * Windows の FS は大小文字を区別しないため existsSync だけでは ubuntu の CI で
 * 壊れるリンクを見逃す。stopDir(通常はリポジトリルート)より上は検査しない。
 */
export function existsCaseSensitive(absPath, stopDir = REPO_ROOT) {
  const norm = path.resolve(absPath)
  const stop = path.resolve(stopDir)
  if (norm.toLowerCase() === stop.toLowerCase()) return existsSync(norm)
  const parent = path.dirname(norm)
  if (parent === norm) return existsSync(norm) // ファイルシステムルートに到達
  let entries = dirEntryCache.get(parent)
  if (entries === undefined) {
    try {
      entries = new Set(readdirSync(parent))
    } catch {
      entries = null
    }
    dirEntryCache.set(parent, entries)
  }
  if (entries === null || !entries.has(path.basename(norm))) return false
  return existsCaseSensitive(parent, stopDir)
}

/** リポジトリルートからの相対パス(区切りは / に統一) */
export function toRepoRel(absPath, repoRoot = REPO_ROOT) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/')
}
