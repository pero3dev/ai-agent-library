/**
 * ビルド後処理(WEBSITE-PLAN §8 W5):
 * 1. Pagefind で検索インデックスを生成(ソースは .next/server/app のプリレンダー HTML)
 * 2. 静的エクスポート(out/)が存在する場合、生成したインデックスを out/_pagefind へ複製する
 *    — next build(output: 'export')は public/ を out/ へコピーした「後」に postbuild が走るため、
 *      複製しないと out/ に前回ビルドの古いインデックスが残る
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'

execSync('npx pagefind --site .next/server/app --output-path public/_pagefind', {
  stdio: 'inherit'
})

if (existsSync('out')) {
  rmSync('out/_pagefind', { recursive: true, force: true })
  cpSync('public/_pagefind', 'out/_pagefind', { recursive: true })
  console.log('postbuild: public/_pagefind → out/_pagefind に複製しました')
}
