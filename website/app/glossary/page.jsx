import { GlossaryExplorer } from '../../components/glossary/glossary-explorer'
import glossary from '../../generated/glossary.json'

export const metadata = {
  title: '用語集',
  description: 'AI Agent 関連の用語を五十音順・アルファベット順に整理し、解説記事への入口を提供します。'
}

export default function GlossaryPage() {
  return (
    <main className="page-shell">
      <p className="home-section-kicker">GLOSSARY</p>
      <h1 className="page-title">用語集</h1>
      <p className="page-lead">
        全 {glossary.length} 語。各用語のカードから、定義の正となる解説記事へ移動できます(正本:
        リポジトリの GLOSSARY.md)。
      </p>
      <GlossaryExplorer entries={glossary} />
    </main>
  )
}
