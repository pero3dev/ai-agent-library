/**
 * md-utils.mjs — docs/ 検証スクリプト共通ユーティリティ
 *
 * 方針(CLAUDE.md / 開発環境整備計画):
 * - npm 依存ゼロ(Node 標準ライブラリのみ)。フックからも import されるため起動を最速に保つ
 * - フックで必要な限定 front matter と行走査のみを扱う。
 *   完全な Markdown のリンク・見出し構文は markdown-links.mjs のパーサを使う。
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
 * このリポジトリの front matter はトップレベルの 1 行値に限定する。
 * 対応しない YAML を黙って捨てず errors に残す。コメントは引用符外だけ除く。
 * 返り値: { fields: [{ key, value, line }], errors, endLine, unclosed } | null
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
  if (end === -1) return { fields: [], errors: [], endLine: -1, unclosed: true }
  const fields = []
  const errors = []
  for (let i = 1; i < end; i++) {
    const raw = lines[i]
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue
    const m = raw.match(/^([A-Za-z][\w-]*):(?:[ \t]+(.*))?$/)
    if (m) fields.push({ key: m[1], value: stripYamlComment(m[2] ?? '').trim(), line: i + 1 })
    else errors.push({ line: i + 1, message: 'front matter は「key: 値」の 1 行形式で書いてください(不正な行・入れ子・複数行値は使用できません)' })
  }
  return { fields, errors, endLine: end + 1, unclosed: false }
}

function stripYamlComment(value) {
  let quote = null
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (quote === '"' && char === '\\') { i++; continue }
    if (quote === "'" && char === "'" && value[i + 1] === "'") { i++; continue }
    if (quote) { if (char === quote) quote = null; continue }
    if (char === '"' || char === "'") quote = char
    else if (char === '#' && (i === 0 || /\s/.test(value[i - 1]))) return value.slice(0, i)
  }
  return value
}

/** 1 行文字列の限定 YAML 構文。複雑な YAML はテンプレートの引用文字列へ直す。 */
export function parseScalar(value) {
  if (value.startsWith('"')) {
    try { const parsed = JSON.parse(value); return typeof parsed === 'string' ? parsed : null } catch { return null }
  }
  if (value.startsWith("'")) {
    return /^'(?:[^']|'')*'$/.test(value) ? value.slice(1, -1).replaceAll("''", "'") : null
  }
  if (/^[\[\]{}&*!|>@`%?,\-:]/.test(value) || /:\s|[\r\n]/.test(value) || /^(?:null|true|false|~)$/i.test(value)) return null
  if (/^(?:[+]?\d+(?:\.\d*)?(?:e[+-]?\d+)?|[+]?\.\d+(?:e[+-]?\d+)?|[+]?\.inf|\.nan|0[xob][0-9a-f]+)$/i.test(value)) return null
  return value
}

/** 対応する文字列値を返す。不正な値は元の文字列を維持(検証は parseScalar)。 */
export function unquote(value) {
  return parseScalar(value) ?? value
}

/** tags: ["a", "b"] 形式を配列にする。形式不正なら null */
export function parseTagsArray(value) {
  const m = value.match(/^\[(.*)\]$/)
  if (!m) return null
  const inner = m[1].trim()
  if (!inner) return []
  // tag はケバブケースなので、引用符内のコンマや複雑な YAML 値は対象外。
  const tags = inner.split(',').map(s => parseScalar(s.trim()))
  return tags.some(tag => tag === null || tag === '') ? null : tags
}

/**
 * コードフェンス(``` / ~~~)の内外を判定しながら全行を列挙する。
 * fn(line, lineNo, inFence, kind) — 境界も inFence: true。kind は open/close/content/null。
 * CommonMark 準拠: 閉じフェンスは開きフェンスと同じ記号かつ同じ長さ以上
 * (```` の中に ``` を書く markdown-in-markdown の例を誤って閉じない)
 */
export function forEachLine(lines, fn) {
  let fenceChar = null
  let fenceLen = 0
  let openedAt = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const body = line.replace(/^(?: {0,3}>[ \t]?)+/, '')
    const m = body.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    let inFence = fenceChar !== null
    let kind = inFence ? 'content' : null
    if (m) {
      if (fenceChar === null && !(m[1][0] === '`' && m[2].includes('`'))) {
        fenceChar = m[1][0]
        fenceLen = m[1].length
        openedAt = i + 1
        inFence = true
        kind = 'open'
      } else if (m[1][0] === fenceChar && m[1].length >= fenceLen && !m[2].trim()) {
        fenceChar = null
        inFence = true
        kind = 'close'
      }
    }
    fn(line, i + 1, inFence, kind)
  }
  return { unclosedFence: fenceChar === null ? null : openedAt }
}

/** docs/ 配下の全 .md を列挙する({ abs, repoRel, section, isReadme }) */
export function collectDocs(repoRoot = REPO_ROOT) {
  const docsDir = path.join(repoRoot, 'docs')
  const out = []
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) { walk(abs); continue }
      if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue
      const relative = path.relative(docsDir, abs).split(path.sep)
      out.push({
        abs,
        repoRel: `docs/${relative.join('/')}`,
        section: relative[0],
        isReadme: relative.length === 2 && entry.name === 'README.md',
      })
    }
  }
  walk(docsDir)
  return out.sort((a, b) => a.repoRel.localeCompare(b.repoRel))
}

/**
 * パスが「大文字小文字まで厳密に」存在するかを readdir 突合で判定する。
 * Windows の FS は大小文字を区別しないため existsSync だけでは ubuntu の CI で
 * 壊れるリンクを見逃す。stopDir(通常はリポジトリルート)より上は検査しない。
 */
export function existsCaseSensitive(absPath, stopDir = REPO_ROOT, dirEntryCache = new Map()) {
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
  return existsCaseSensitive(parent, stopDir, dirEntryCache)
}

/** リポジトリルートからの相対パス(区切りは / に統一) */
export function toRepoRel(absPath, repoRoot = REPO_ROOT) {
  return path.relative(repoRoot, absPath).split(path.sep).join('/')
}

/** URL のパス・query・fragment を分ける。Web URL とローカル絶対パスを区別する。 */
export function splitLocalDestination(raw) {
  if (/^[A-Za-z]:[\\/]/.test(raw) || raw.startsWith('/') && !raw.startsWith('//') || raw.includes('\\')) {
    return { error: '絶対パス・バックスラッシュは使わずリポジトリ内の相対パスで書いてください' }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) return { external: true }
  const hashAt = raw.indexOf('#')
  const beforeHash = hashAt < 0 ? raw : raw.slice(0, hashAt)
  const queryAt = beforeHash.indexOf('?')
  try {
    const pathname = decodeURIComponent(queryAt < 0 ? beforeHash : beforeHash.slice(0, queryAt))
    const fragment = hashAt < 0 ? '' : decodeURIComponent(raw.slice(hashAt + 1))
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.startsWith('/') || /^[A-Za-z]:/.test(pathname)) {
      return { error: 'デコード後のパスがリポジトリ内の相対パスではありません' }
    }
    return { pathname, fragment, suffix: (queryAt < 0 ? '' : beforeHash.slice(queryAt)) + (hashAt < 0 ? '' : raw.slice(hashAt)) }
  } catch {
    return { error: 'パーセントエンコーディングが不正です' }
  }
}
