/**
 * validate-core.mjs — 1 ドキュメントの検証コア
 *
 * CLAUDE.md のレビュー観点 1(テンプレート準拠)と 3(TODO(要確認) 書式)を機械化する。
 * scripts/validate-docs.mjs(CLI / CI)と .claude/hooks/validate-doc.mjs(編集後フック)が共用。
 * ファイル内で閉じる検査のみを行う(リンク網羅・README 収録表は scripts/check-links.mjs)。
 */
import { forEachLine, parseFrontMatter, parseTagsArray, toLines, unquote } from './md-utils.mjs'

/** front matter category の許容値(templates/doc-template.md の enum と一致させる) */
export const CATEGORIES = [
  'overview',
  'concepts',
  'architecture',
  'implementation',
  'evaluation',
  'operations',
  'security',
  'case-studies',
  'coding-agents',
  'business',
  'llm-foundations',
  'llm-internals',
  'multimodal',
  'domain-agents',
  'ux-and-product',
  'human-ai',
]

export const REQUIRED_FIELDS = ['title', 'category', 'level', 'status', 'last_updated', 'tags']
const LEVELS = ['basic', 'intermediate', 'advanced']
const STATUSES = ['draft', 'published']

/** テンプレートの固定 H2(この並び順で存在しなければならない) */
export const FIXED_H2 = [
  'この記事の目的',
  '対象読者',
  '前提知識',
  '本文',
  '実務での注意点',
  '関連トピック',
  '参考資料',
  'TODO・未確認事項',
]

const TAG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
// TODO(要確認) の正式書式(括弧・コロンはすべて半角 = 既存 181 件の実態と一致)。
// 閉じ括弧内に前置テキストがある実例(例: 「(本文は 2026-07 時点の値。最終確認: 2026-07)」)や、
// 直後の箇条書きへ続ける「(…最終確認: 2026-07):」の実例があるため、
// 「行頭の blockquote 太字タグ」と「行末が 最終確認: YYYY-MM) (+省略可能な :)で終わる」ことを検査する
const TODO_LINE_RE = /^> \*\*TODO\(要確認\):\*\* .+最終確認: \d{4}-(0[1-9]|1[0-2])\):?$/
// 全角括弧・空白入りの変形タグ(全文検索を壊すため禁止。（/） = 全角括弧)
const TODO_VARIANT_RE = /TODO\s*[(（]\s*要確認\s*[)）]/

/**
 * 1 ドキュメントを検証する。
 * @param {string} repoRel リポジトリルートからの相対パス(docs/NN-section/name.md、区切りは /)
 * @param {string} text ファイル内容
 * @returns {{line: number, check: 'front-matter'|'h2'|'todo', message: string}[]}
 */
export function validateDoc(repoRel, text) {
  const issues = []
  const push = (line, check, message) => issues.push({ line, check, message })
  const lines = toLines(text)
  const isReadme = /\/README\.md$/.test(repoRel)
  const sectionName = repoRel.match(/^docs\/\d\d-([a-z0-9-]+)\//)?.[1] ?? null

  // front matter を先に解析し、本文スキャンから front matter 領域を除外する
  // (YAML コメントの「# ...」行を H1 として誤検知しないため)
  const fm = parseFrontMatter(lines)
  const fmEndLine = fm && !fm.unclosed ? fm.endLine : 0

  // --- 本文の見出し・TODO 行を収集(フェンス外・front matter 外のみ) ---
  const h1s = [] // { line, text }
  const h2s = [] // { line, text }
  const h3s = [] // { line, text }
  const todoIssues = []
  forEachLine(lines, (line, lineNo, inFence) => {
    if (inFence || lineNo <= fmEndLine) return
    let m
    if ((m = line.match(/^#\s+(.+?)\s*$/))) h1s.push({ line: lineNo, text: m[1] })
    else if ((m = line.match(/^##\s+(.+?)\s*$/))) h2s.push({ line: lineNo, text: m[1] })
    else if ((m = line.match(/^###\s+(.+?)\s*$/))) h3s.push({ line: lineNo, text: m[1] })
    if (line.includes('TODO(要確認)')) {
      if (!TODO_LINE_RE.test(line)) {
        todoIssues.push({
          line: lineNo,
          message:
            'TODO(要確認) の書式が不正です。「> **TODO(要確認):** 内容(最終確認: YYYY-MM)」(括弧・コロンは半角)に統一してください',
        })
      }
    } else if (TODO_VARIANT_RE.test(line)) {
      todoIssues.push({
        line: lineNo,
        message: 'TODO タグが変形しています(全角括弧・空白入りなど)。全文検索のため「TODO(要確認)」(半角括弧)に統一してください',
      })
    }
  })
  for (const t of todoIssues) push(t.line, 'todo', t.message)

  // README.md は front matter / テンプレート H2 の対象外(TODO 書式のみ検査)
  if (isReadme) return issues

  // --- front matter ---
  let title = null
  if (!fm) {
    push(1, 'front-matter', 'front matter がありません(--- で始まる YAML ブロックが必要です)')
  } else if (fm.unclosed) {
    push(1, 'front-matter', 'front matter が閉じられていません(--- が見つかりません)')
  } else {
    const byKey = new Map()
    for (const f of fm.fields) {
      if (byKey.has(f.key)) push(f.line, 'front-matter', `フィールド ${f.key} が重複しています`)
      byKey.set(f.key, f)
      if (!REQUIRED_FIELDS.includes(f.key)) {
        push(
          f.line,
          'front-matter',
          `未知のフィールド ${f.key} があります(front matter は機械可読メタデータ 6 フィールドのみ: ${REQUIRED_FIELDS.join(' / ')})`
        )
      }
    }
    for (const key of REQUIRED_FIELDS) {
      if (!byKey.has(key)) push(fm.endLine, 'front-matter', `必須フィールド ${key} がありません`)
    }

    const get = key => (byKey.has(key) ? { ...byKey.get(key), plain: unquote(byKey.get(key).value) } : null)

    const titleF = get('title')
    if (titleF) {
      title = titleF.plain
      if (!title) push(titleF.line, 'front-matter', 'title が空です')
    }

    const categoryF = get('category')
    if (categoryF) {
      if (!CATEGORIES.includes(categoryF.plain)) {
        push(categoryF.line, 'front-matter', `category "${categoryF.plain}" は不正です(${CATEGORIES.join(' | ')})`)
      } else if (sectionName && categoryF.plain !== sectionName) {
        push(
          categoryF.line,
          'front-matter',
          `category "${categoryF.plain}" が所属ディレクトリ(${sectionName})と一致しません`
        )
      }
    }

    const levelF = get('level')
    if (levelF && !LEVELS.includes(levelF.plain)) {
      push(levelF.line, 'front-matter', `level "${levelF.plain}" は不正です(${LEVELS.join(' | ')})`)
    }

    const statusF = get('status')
    if (statusF && !STATUSES.includes(statusF.plain)) {
      push(statusF.line, 'front-matter', `status "${statusF.plain}" は不正です(${STATUSES.join(' | ')})`)
    }

    const luF = get('last_updated')
    if (luF) {
      const m = luF.plain.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      const d = m ? new Date(`${luF.plain}T00:00:00Z`) : null
      if (!m || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== luF.plain) {
        push(luF.line, 'front-matter', `last_updated "${luF.plain}" は YYYY-MM-DD の実在日付ではありません`)
      } else if (d.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        // タイムゾーン差(JST と CI の UTC)を考慮して 1 日だけ猶予を持たせる
        push(luF.line, 'front-matter', `last_updated "${luF.plain}" が未来の日付です`)
      }
    }

    const tagsF = get('tags')
    if (tagsF) {
      const tags = parseTagsArray(tagsF.value)
      if (tags === null) {
        push(tagsF.line, 'front-matter', 'tags は ["tag-a", "tag-b"] 形式の 1 行配列で書いてください')
      } else {
        for (const tag of tags) {
          if (!TAG_RE.test(tag)) {
            push(tagsF.line, 'front-matter', `tag "${tag}" は英語ケバブケース(小文字英数字とハイフン)ではありません`)
          }
        }
      }
    }
  }

  // --- H1 とテンプレート固定 H2 ---
  if (h1s.length !== 1) {
    push(h1s[1]?.line ?? 1, 'h2', `H1 見出しはファイルに 1 つだけ必要です(現在 ${h1s.length} 個)`)
  }
  if (title !== null && h1s.length >= 1 && h1s[0].text !== title) {
    push(h1s[0].line, 'h2', `H1 "${h1s[0].text}" が front matter の title "${title}" と一致しません`)
  }

  const fixedFound = [] // 出現順の { name, line }
  for (const name of FIXED_H2) {
    const hits = h2s.filter(h => h.text === name)
    if (hits.length === 0) {
      push(1, 'h2', `固定 H2 「## ${name}」がありません(テンプレートの固定セクションは削除・改名不可)`)
    } else if (hits.length > 1) {
      push(hits[1].line, 'h2', `固定 H2 「## ${name}」が重複しています`)
    }
    if (hits.length > 0) fixedFound.push({ name, line: hits[0].line })
  }
  for (let i = 1; i < fixedFound.length; i++) {
    if (fixedFound[i].line < fixedFound[i - 1].line) {
      push(
        fixedFound[i].line,
        'h2',
        `固定 H2 「## ${fixedFound[i].name}」の位置がテンプレートの順序と異なります(「## ${fixedFound[i - 1].name}」より前にあります)`
      )
    }
  }

  // 独自 H2 は「固定 H2 のあと」にのみ追加可(CLAUDE.md 最重要ルール 2)
  const fixedSet = new Set(FIXED_H2)
  const lastFixedLine = fixedFound.length > 0 ? Math.max(...fixedFound.map(f => f.line)) : 0
  for (const h of h2s) {
    if (fixedSet.has(h.text)) continue
    if (h.line < lastFixedLine) {
      push(
        h.line,
        'h2',
        `独自 H2 「## ${h.text}」が固定 H2 の並びの途中にあります(独自 H2 は固定セクションのあとにのみ追加可)`
      )
    }
  }

  // 「実務での注意点」の中に ### アンチパターン / ### チェックリスト が必要
  const notesH2 = h2s.find(h => h.text === '実務での注意点')
  if (notesH2) {
    const nextH2Line = h2s.find(h => h.line > notesH2.line)?.line ?? Infinity
    for (const name of ['アンチパターン', 'チェックリスト']) {
      const inside = h3s.some(h => h.text === name && h.line > notesH2.line && h.line < nextH2Line)
      if (!inside) {
        push(
          notesH2.line,
          'h2',
          `「## 実務での注意点」の中に「### ${name}」がありません(該当しない場合も「該当なし(理由)」を書いて残す規約です)`
        )
      }
    }
  }

  return issues
}
