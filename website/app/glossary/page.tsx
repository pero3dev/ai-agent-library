import { pageMetadata } from '../../lib/page-metadata.mjs'
import { GlossaryExplorer } from '../../components/deferred-pages'
import glossary from '../../generated/glossary.json'

export const metadata = pageMetadata("/glossary", "用語集", "AI Agent 関連の用語を五十音順・アルファベット順に整理し、解説記事への入口を提供します。")

export default function GlossaryPage() {
  return (
    <main id="nextra-skip-nav" tabIndex={-1} className="page-shell">
      <p className="home-section-kicker">GLOSSARY</p>
      <h1 className="page-title">用語集</h1>
      <p className="page-lead">
        全 {glossary.length} 語。各用語のカードから、定義や詳しい解説を読む記事へ移動できます。
      </p>
      <GlossaryExplorer entries={glossary} />
    </main>
  )
}
