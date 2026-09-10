#!/usr/bin/env node
/**
 * sync-content.mjs — docs/(正本)→ website/content/(生成物)の同期スクリプト
 *
 * 方針(project/plans/engineering/website.md §4-5):
 * - 原本の Markdown は一切変更しない。変換はすべてこのスクリプトに集約する
 * - コードフェンス内のリンク・見出しは書き換えない
 * - content/ と generated/ は毎回再生成(いずれも git 管理外)
 *
 * 生成物:
 * - content/<セクション>/<記事>.md … 記事本体(リンクをルートへ書き換え、front matter 補完)
 * - content/<セクション>/_meta.js  … サイドバーの並び順(セクション README の収録表の順)
 * - generated/sections.json    … セクション一覧(トップページ・セクショングリッド用)
 * - generated/glossary.json    … 用語集の構造化データ(概念カード・W4 用語ページ用)
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { applyDecorations } from '../lib/doc-decorations.mjs'
import { findUnsafeMdx } from '../lib/mdx-safety.mjs'
import { readmeArticleOrder, rewriteMarkdownRoutes } from '../lib/markdown-routes.mjs'
import { forEachLine, parseFrontMatter, parseTagsArray, toLines, unquote } from '../../scripts/lib/md-utils.mjs'

// 原本は素の Markdown としてパースし(remark-mdx を含めない = 本文の < や { を JSX と誤解釈しない)、
// 装飾コンポーネントを注入した結果を MDX として直列化する(エスケープは remark-mdx が正しく行う)
// remark-math を両側に入れ、$...$ / $$...$$ を数式ノードとして扱う(本文の markdown エスケープ
// {}・_・\ を数式内に適用させない = KaTeX へ素の LaTeX を渡す)。レンダリングは next.config の latex:true。
const mdParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkFrontmatter, ['yaml'])
const mdxWriter = unified()
  .use(remarkStringify, { bullet: '-', emphasis: '*', rule: '-' })
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkMdx)

// 生成した MDX を「MDX として」再パースして安全性を検証するためのパーサ。
// docs 本文はメンテナが書く前提だが、素の Markdown 中の生 HTML(<script> 等)や
// 行頭 import/export は remark-mdx 直列化で「実行される MDX」へ昇格しうる(検証済み)。
// そこで sync が注入する 3 コンポーネント以外の JSX / ESM / {式} / 生 HTML を拒否する。
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEBSITE_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(WEBSITE_ROOT, '..')
const DOCS_DIR = path.join(REPO_ROOT, 'docs')
const CONTENT_SRC = path.join(WEBSITE_ROOT, 'content-src')
const OUT_DIR = path.join(WEBSITE_ROOT, 'content')
const GEN_DIR = path.join(WEBSITE_ROOT, 'generated')

/** ドキュメント群の配信ベースパス(next.config.mjs の contentDirBasePath と一致させること) */
const BASE_PATH = '/docs'

/** セクションディレクトリ名(NN-name)→ ルートセグメント(name) */
const stripOrder = name => name.replace(/^\d\d-/, '')

/** サイドバー・トップページでのセクション表示名 */
const SECTION_TITLES = {
  overview: '00. 概要',
  concepts: '01. 基礎概念',
  architecture: '02. 設計',
  implementation: '03. 実装',
  evaluation: '04. 評価',
  operations: '05. 運用',
  security: '06. セキュリティ',
  'case-studies': '07. ケーススタディ',
  'coding-agents': '08. コーディングエージェント',
  business: '09. ビジネス実務',
  'llm-foundations': '10. LLM 基礎',
  'llm-internals': '11. LLM 内部構造',
  multimodal: '12. モダリティ応用',
  'domain-agents': '13. ドメイン応用',
  'ux-and-product': '14. UX・プロダクト',
  'human-ai': '15. 人と AI の協働'
}

const warnings = [] // 非致命(サイドバー末尾送りなど)
const errors = [] // 致命(未解決リンク・読込失敗・許可されない MDX)。1 件でも exit 1

/* ---------- MDX 安全性ガード(C3) ---------- */

/** 生成 MDX を再パースし、許可コンポーネント以外の JSX / ESM / {式} / 生 HTML を検出したら errors に積む */
function assertSafeMdx(mdx, repoRel) {
  const bad = findUnsafeMdx(mdx)
  if (bad.length) {
    errors.push(
      `${repoRel}: 許可されない MDX 構造 → ${[...bad].join(' / ')}(docs 本文に生 HTML・import/export・{式} を書かない。図は Mermaid コードフェンス内に)`
    )
  }
}

/* ---------- パースユーティリティ ---------- */

function getFrontMatterBlock(text) {
  return parseFrontMatter(toLines(text))
}

function getTitle(text) {
  const fm = getFrontMatterBlock(text)
  const field = fm?.fields.find(field => field.key === 'title')
  if (field) return unquote(field.value)
  return text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null
}

function getFrontMatterField(text, name) {
  const fm = getFrontMatterBlock(text)
  const field = fm?.fields.find(field => field.key === name)
  return field ? unquote(field.value) : null
}

function getFrontMatterTags(text) {
  const fm = getFrontMatterBlock(text)
  const field = fm?.fields.find(field => field.key === 'tags')
  return field ? (parseTagsArray(field.value) ?? []) : []
}

/** セクション README の収録表から、ファイルの掲載順を得る */
function parseReadmeOrder(text) {
  return readmeArticleOrder(mdParser.parse(text))
}

/** セクション README の H1 直後の説明段落(トップページのセクショングリッド用) */
function parseReadmeDescription(text) {
  let seenH1 = false
  for (const line of text.split('\n')) {
    if (/^#\s/.test(line)) {
      seenH1 = true
      continue
    }
    if (!seenH1) continue
    const t = line.trim()
    if (t && !/^[#\-|>*]/.test(t)) return t
  }
  return ''
}

/** コードフェンスを除去したテキストを返す(GLOSSARY の書式例フェンス対策) */
function stripCodeFences(text) {
  const lines = []
  forEachLine(toLines(text), (line, _lineNo, inFence) => lines.push(inFence ? '' : line))
  return lines.join('\n')
}

/** GLOSSARY.md → 構造化データ。見出しは「用語名(English)」形式(全角括弧) */
function parseGlossary(text, routeMap) {
  const entries = []
  const body = stripCodeFences(text)
  for (const block of body.split(/^### /m).slice(1)) {
    const [headingLine, ...rest] = block.split('\n')
    // 見出しは「用語名(English)」形式(括弧は ASCII/全角の両方を許容)。括弧なし見出し(LLM-as-a-Judge 等)も許容
    const hm = headingLine.trim().match(/^(.+?)\s*(?:[（(](.+?)[）)])?$/)
    if (!hm) continue
    const name = hm[1].trim()
    const english = hm[2]?.trim() ?? null
    const paragraph = rest.join('\n').trim().split(/\n\s*\n/)[0] ?? ''
    const linkMatch = paragraph.match(/\]\((docs\/[^)#\s]+\.md)\)/)
    const href = linkMatch ? (routeMap.get(linkMatch[1]) ?? null) : null
    const summary = paragraph
      .replace(/\s*→\s*\[[^\]]*\]\([^)]*\)\s*/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\n/g, '')
      .trim()
    entries.push({ name, english, summary, href })
  }
  return entries
}

/* ---------- 収集 ---------- */

async function collectFiles() {
  const routeMap = new Map() // 'docs/01-concepts/agent-loop.md' -> '/docs/concepts/agent-loop'
  const files = [] // { abs, repoRel, outRel, section, slug }
  const sections = [] // { dirName, slug }

  const entries = await readdir(DOCS_DIR, { withFileTypes: true })
  for (const e of entries.filter(d => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const slug = stripOrder(e.name)
    sections.push({ dirName: e.name, slug })
    for (const f of (await readdir(path.join(DOCS_DIR, e.name))).filter(f => f.endsWith('.md'))) {
      const repoRel = `docs/${e.name}/${f}`
      const base = f === 'README.md' ? 'index' : f.replace(/\.md$/, '')
      const route = base === 'index' ? `${BASE_PATH}/${slug}` : `${BASE_PATH}/${slug}/${base}`
      routeMap.set(repoRel, route)
      files.push({ abs: path.join(DOCS_DIR, e.name, f), repoRel, outRel: `${slug}/${base}.md`, section: slug, slug: base })
    }
  }

  // 用語集は W4 以降カスタムページ(/glossary、app/glossary/page.jsx)が表示の正。
  // content には生成せず、docs からのリンクだけ /glossary へ書き換える
  routeMap.set('GLOSSARY.md', '/glossary')

  // examples/python 配下の各サンプル README を取り込む(各ディレクトリの README.md が対象)
  const EXAMPLE_DIRS = [
    'tool-use',
    'structured-output',
    'evaluation-harness',
    'rag-basics',
    'mcp-server',
    'multi-agent'
  ]
  for (const name of EXAMPLE_DIRS) {
    routeMap.set(`examples/python/${name}/README.md`, `${BASE_PATH}/examples/python-${name}`)
    files.push({
      abs: path.join(REPO_ROOT, 'examples', 'python', name, 'README.md'),
      repoRel: `examples/python/${name}/README.md`,
      outRel: `examples/python-${name}.md`,
      section: 'examples',
      slug: `python-${name}`
    })
  }
  routeMap.set('examples/tests/README.md', `${BASE_PATH}/examples/regression-tests`)
  files.push({
    abs: path.join(REPO_ROOT, 'examples', 'tests', 'README.md'),
    repoRel: 'examples/tests/README.md',
    outRel: 'examples/regression-tests.md',
    section: 'examples',
    slug: 'regression-tests'
  })

  return { routeMap, files, sections }
}

/* ---------- 変換 ---------- */

function ensureFrontMatter(text, repoRel) {
  if (text.startsWith('---\n')) return text
  const m = text.match(/^#\s+(.+)$/m)
  const title = (m ? m[1] : path.posix.basename(repoRel, '.md')).trim().replace(/"/g, '\\"')
  return `---\ntitle: "${title}"\n---\n\n${text}`
}

/** OUT_DIR 配下の .md/.mdx から、ビルドで生成されるべきルート一覧を導出する(C5 のルート網羅チェック用) */
async function collectContentRoutes(dir, base = '') {
  const routes = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      routes.push(...(await collectContentRoutes(path.join(dir, entry.name), rel)))
    } else if (/\.mdx?$/.test(entry.name)) {
      const stripped = rel.replace(/\.mdx?$/, '').replace(/\/index$/, '').replace(/^index$/, '')
      routes.push(stripped ? `${BASE_PATH}/${stripped}` : BASE_PATH)
    }
  }
  return routes
}

/* ---------- メイン ---------- */

async function main() {
  const { routeMap, files, sections } = await collectFiles()
  const includeDrafts = process.env.INCLUDE_DRAFTS === '1'

  // 全ファイルを一度だけ読み、CRLF を LF へ正規化する(C2)。読み込み失敗は致命(C4)
  const texts = new Map()
  for (const file of files) {
    try {
      texts.set(file.repoRel, (await readFile(file.abs, 'utf8')).replace(/\r\n/g, '\n'))
    } catch {
      errors.push(`読み込み失敗: ${file.repoRel}`)
    }
  }

  // draft は既定で公開しない(C7)。INCLUDE_DRAFTS=1 のときだけ含める。
  // 除外した記事はルートも消し、そこへのリンクを未解決(=致命)として検出させる
  const activeFiles = files.filter(file => {
    const text = texts.get(file.repoRel)
    if (text != null && getFrontMatterField(text, 'status') === 'draft' && !includeDrafts) {
      routeMap.delete(file.repoRel)
      return false
    }
    return true
  })
  const droppedDrafts = files.length - activeFiles.length
  if (droppedDrafts > 0) console.log(`draft を ${droppedDrafts} 本除外しました(INCLUDE_DRAFTS=1 で含める)`)

  // 用語の自動リンク用データ(長い語を優先してマッチさせるため名前の長い順)
  const glossaryText = (await readFile(path.join(REPO_ROOT, 'GLOSSARY.md'), 'utf8')).replace(/\r\n/g, '\n')
  const glossaryJson = parseGlossary(glossaryText, routeMap)
  const glossaryForLinks = glossaryJson
    .filter(e => e.href && e.summary)
    .sort((a, b) => b.name.length - a.name.length)

  // ディレクトリ自体は消さず中身だけ再生成する(Windows の CWD ロック等による EBUSY を避ける)
  for (const dir of [OUT_DIR, GEN_DIR]) {
    await mkdir(dir, { recursive: true })
    for (const entry of await readdir(dir)) {
      await rm(path.join(dir, entry), { recursive: true, force: true })
    }
  }

  // 記事の変換と、タイトル・README・タグ情報の収集
  const titles = new Map() // repoRel -> title
  const readmeTexts = new Map() // sectionSlug -> README 原文
  const articleMeta = [] // タグ別一覧用 { title, route, level, tags }
  let count = 0
  for (const file of activeFiles) {
    const text = texts.get(file.repoRel)
    if (text == null) continue // 読込失敗は上で errors に記録済み
    titles.set(file.repoRel, getTitle(text))
    if (file.slug === 'index' && file.section) readmeTexts.set(file.section, text)
    if (file.repoRel.startsWith('docs/') && file.slug !== 'index') {
      articleMeta.push({
        title: getTitle(text),
        route: routeMap.get(file.repoRel),
        level: getFrontMatterField(text, 'level'),
        tags: getFrontMatterTags(text)
      })
    }

    let out = ensureFrontMatter(text, file.repoRel)
    // 定型構造の自動装飾(TODO・アンチパターン・チェックリスト・用語リンク)→ MDX として出力
    const tree = mdParser.parse(out)
    errors.push(...rewriteMarkdownRoutes(tree, file.repoRel, routeMap))
    applyDecorations(tree, { route: routeMap.get(file.repoRel), glossary: glossaryForLinks })
    out = String(mdxWriter.stringify(tree))
    assertSafeMdx(out, file.repoRel) // C3: 許可外の JSX / ESM / {式} / 生 HTML を拒否

    const outPath = path.join(OUT_DIR, file.outRel.replace(/\.md$/, '.mdx'))
    await mkdir(path.dirname(outPath), { recursive: true })
    await writeFile(outPath, out, 'utf8')
    count++
  }

  // トップレベルの並び順(_meta.js)
  const topMeta = { index: 'はじめに' }
  for (const s of sections) topMeta[s.slug] = SECTION_TITLES[s.slug] ?? s.slug
  topMeta.examples = 'サンプルコード'
  await writeFile(path.join(OUT_DIR, '_meta.js'), `export default ${JSON.stringify(topMeta, null, 2)}\n`, 'utf8')

  // セクション内の並び順: README の収録表の順に、front matter の title を付けて並べる
  for (const s of sections) {
    const readme = readmeTexts.get(s.slug) ?? ''
    const order = parseReadmeOrder(readme)
    const meta = { index: 'セクション概要' }
    for (const slug of order) {
      meta[slug] = titles.get(`docs/${s.dirName}/${slug}.md`) ?? slug
    }
    const inSection = activeFiles.filter(f => f.section === s.slug && f.slug !== 'index').map(f => f.slug)
    for (const slug of inSection) {
      if (!(slug in meta)) {
        warnings.push(`${s.dirName}/README.md の収録表に ${slug}.md がない(サイドバー末尾に回る)`)
      }
    }
    await writeFile(path.join(OUT_DIR, s.slug, '_meta.js'), `export default ${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  }

  // generated/sections.json(トップページのセクショングリッド用)
  const sectionsJson = sections.map(s => ({
    slug: s.slug,
    num: s.dirName.slice(0, 2),
    title: SECTION_TITLES[s.slug] ?? s.slug,
    description: parseReadmeDescription(readmeTexts.get(s.slug) ?? ''),
    route: `${BASE_PATH}/${s.slug}`,
    count: activeFiles.filter(f => f.section === s.slug && f.slug !== 'index').length
  }))
  await writeFile(path.join(GEN_DIR, 'sections.json'), JSON.stringify(sectionsJson, null, 2), 'utf8')

  // generated/glossary.json(概念カード・用語ページ用)
  await writeFile(path.join(GEN_DIR, 'glossary.json'), JSON.stringify(glossaryJson, null, 2), 'utf8')

  // generated/tags.json(タグ別一覧ページ用)。件数の多い順 → 同数はタグ名順
  const tagMap = new Map()
  for (const a of articleMeta) {
    for (const tag of a.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, [])
      tagMap.get(tag).push({ title: a.title, route: a.route, level: a.level })
    }
  }
  const tagsJson = [...tagMap.entries()]
    .map(([tag, articles]) => ({ tag, count: articles.length, articles }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  await writeFile(path.join(GEN_DIR, 'tags.json'), JSON.stringify(tagsJson, null, 2), 'utf8')

  // 手書きページ(content-src/)を最後に重ねる(同名は手書きが勝つ)
  await cp(CONTENT_SRC, OUT_DIR, { recursive: true, force: true })

  // generated/routes.json(C5: postbuild のルート網羅チェックが照合する期待ルート一覧)
  const routes = (await collectContentRoutes(OUT_DIR)).sort()
  await writeFile(path.join(GEN_DIR, 'routes.json'), JSON.stringify(routes, null, 2), 'utf8')

  console.log(
    `sync 完了: 記事 ${count} 本 / セクション ${sections.length} / 用語 ${glossaryJson.length} 語 / ルート ${routes.length} → content/ + generated/`
  )
  if (warnings.length) {
    console.log(`\n警告 ${warnings.length} 件:`)
    for (const w of warnings) console.log(`  - ${w}`)
  }
  if (errors.length) {
    console.error(`\nエラー ${errors.length} 件(sync を中断します):`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
