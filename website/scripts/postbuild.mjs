/**
 * ビルド後処理(project/plans/engineering/website.md §8 W5):
 * 1. Pagefind で検索インデックスを生成(ソースは .next/server/app のプリレンダー HTML)
 * 2. 静的エクスポート(out/)が存在する場合、生成したインデックスを out/_pagefind へ複製する
 *    — next build(output: 'export')は public/ を out/ へコピーした「後」に postbuild が走るため、
 *      複製しないと out/ に前回ビルドの古いインデックスが残る
 */
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createIndex, close } from 'pagefind'
import { checkExportSkipTargets, missingSectionLinks } from '../lib/export-checks.mjs'
import { materializeExportSegments } from '../lib/export-segments.mjs'
import { addTitleSearchAliases } from '../lib/search-titles.mjs'
import { addSecurityMeta, initialScriptBudget } from '../lib/export-policy.mjs'
import { publicUrl } from '../lib/page-metadata.mjs'

// Rust 側の辞書と browser Intl の分割が違っても、完全な日本語タイトルを失わない。
// HTML は読み取り、索引へ渡すコピーにのみ別名を追加する。
const source = '.next/server/app'
const { index, errors: indexErrors } = await createIndex()
if (indexErrors.length || !index) throw new Error(indexErrors.join('\n'))
let pages = 0
try {
  for (const entry of readdirSync(source, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue
    const file = join(entry.parentPath, entry.name)
    const url = `/${relative(source, file).replace(/\\/g, '/')}`
    const added = await index.addHTMLFile({ url, content: addTitleSearchAliases(readFileSync(file, 'utf8')) })
    if (added.errors.length) throw new Error(added.errors.join('\n'))
    if (added.file) pages++
  }
  rmSync('public/_pagefind', { recursive: true, force: true })
  const written = await index.writeFiles({ outputPath: 'public/_pagefind' })
  if (written.errors.length) throw new Error(written.errors.join('\n'))
  console.log(`postbuild: 日本語タイトル別名付き Pagefind 索引 ${pages} HTML`)
} finally {
  await close()
}

if (existsSync('out')) {
  // Hash the exact emitted inline scripts per document. Put policy before every
  // resource, including Next's hydration scripts, rather than enabling unsafe-inline.
  for (const entry of readdirSync('out', { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      const file = join(entry.parentPath, entry.name)
      writeFileSync(file, addSecurityMeta(readFileSync(file, 'utf8'), { audioFixture: process.env.AUDIO_TEST_CATALOG === 'tests/browser/fixtures/audio-catalog.json' && process.env.NEXT_PUBLIC_BASE_PATH === '/__audio-test' }))
    }
  }
  const segments = materializeExportSegments('out')
  console.log(`postbuild: セグメント互換出力 ${segments.created} 件追加、${segments.existing} 件は同一内容を確認`)

  rmSync('out/_pagefind', { recursive: true, force: true })
  cpSync('public/_pagefind', 'out/_pagefind', { recursive: true })
  console.log('postbuild: public/_pagefind → out/_pagefind に複製しました')

  // ルート網羅チェック(C5): sync が出力した期待ルート generated/routes.json が
  // すべて out/ に HTML として生成されているか照合する。古い .next キャッシュ等で
  // 一部ルートが欠落したまま「ビルド成功」する事故を、ここで確実に失敗へ変える。
  const routes = JSON.parse(readFileSync('generated/routes.json', 'utf8'))
  const missing = routes.filter(route => {
    const rel = route.replace(/^\//, '')
    return !existsSync(`out/${rel}.html`) && !existsSync(`out/${rel}/index.html`)
  })
  if (missing.length) {
    console.error(`postbuild: 期待ルート ${routes.length} 件中 ${missing.length} 件が out/ に未生成:`)
    for (const m of missing.slice(0, 20)) console.error(`  - ${m}`)
    if (missing.length > 20) console.error(`  … 他 ${missing.length - 20} 件`)
    process.exit(1)
  }
  console.log(`postbuild: ルート網羅チェック OK(${routes.length}/${routes.length})`)
  const descriptions = new Set()
  const pagesMetadata = JSON.parse(readFileSync('generated/pages.json', 'utf8'))
  let articleCount = 0
  for (const route of routes) {
    const rel = route === '/' ? 'index' : route.slice(1)
    const document = readFileSync(existsSync(`out/${rel}.html`) ? `out/${rel}.html` : `out/${rel}/index.html`, 'utf8')
    const url = publicUrl(route).replaceAll('&', '&amp;')
    if (!document.includes(`rel="canonical" href="${url}"`) || !document.includes(`property="og:url" content="${url}"`)) throw new Error(`metadata URL欠落: ${route}`)
    if (/\/docs\/[^/]+\/[^/]+$/.test(route)) {
      articleCount++
      descriptions.add(document.match(/name="description" content="([^"]+)"/)?.[1])
      const page = pagesMetadata[route]
      if (page?.source_path.startsWith('docs/') && !document.includes(`article=${encodeURIComponent(page.source_path)}&amp;updated=${page.last_updated}`)) throw new Error(`正本パスと更新日を埋めた誤り報告リンク欠落: ${route}`)
    }
    if (/Search documentation|On This Page/.test(document)) throw new Error(`英語の既定UI残存: ${route}`)
    if (/^\/docs\/[^/]+$/.test(route) && /収録予定ドキュメント|計画段階/.test(document)) throw new Error(`公開索引に執筆管理文言: ${route}`)
  }
  if (descriptions.size !== articleCount || descriptions.has(undefined)) throw new Error(`記事固有description不足: ${descriptions.size}/${articleCount}`)
  const sitemap = readFileSync('out/sitemap.xml', 'utf8')
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
  if (locations.length !== routes.length || routes.some(route => !locations.includes(publicUrl(route)))) throw new Error('sitemapとルート一覧が不一致')
  if (!readFileSync('out/robots.txt', 'utf8').includes(publicUrl('/sitemap.xml'))) throw new Error('robots sitemap指定欠落')
  const articleFile = 'out/docs/concepts/tool-use.html'
  const budget = initialScriptBudget(readFileSync(articleFile, 'utf8'), source => readFileSync(join('out', source), 'utf8'), process.env.NEXT_PUBLIC_BASE_PATH || '')
  console.log(`postbuild: metadata ${routes.length}ページ / description ${descriptions.size}種類 / CSPとreferrer全HTML / 初期JS ${JSON.stringify(budget)}`)

  const skip = checkExportSkipTargets('out')
  const docsIndex = existsSync('out/docs.html') ? 'out/docs.html' : 'out/docs/index.html'
  const html = readFileSync(docsIndex, 'utf8')
  // サイドバーのリンクで漏れを隠さないよう、記事本文だけを対象にする。
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? ''
  const sections = JSON.parse(readFileSync('generated/sections.json', 'utf8'))
  const missingSections = missingSectionLinks(article, sections, process.env.NEXT_PUBLIC_BASE_PATH || '')
  if (skip.errors.length || missingSections.length) {
    for (const error of skip.errors) console.error(`postbuild: ${error}`)
    for (const route of missingSections) console.error(`postbuild: /docs 本文にセクションリンクがありません: ${route}`)
    process.exit(1)
  }
  console.log(`postbuild: skip target OK(${skip.count} HTML)、/docs のセクション網羅 OK(${sections.length})`)
}
