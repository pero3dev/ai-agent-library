/**
 * ビルド後処理(WEBSITE-PLAN §8 W5):
 * 1. Pagefind で検索インデックスを生成(ソースは .next/server/app のプリレンダー HTML)
 * 2. 静的エクスポート(out/)が存在する場合、生成したインデックスを out/_pagefind へ複製する
 *    — next build(output: 'export')は public/ を out/ へコピーした「後」に postbuild が走るため、
 *      複製しないと out/ に前回ビルドの古いインデックスが残る
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'

execSync('npx pagefind --site .next/server/app --output-path public/_pagefind', {
  stdio: 'inherit'
})

if (existsSync('out')) {
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
}
