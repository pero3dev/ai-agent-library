import { pageMetadata } from '../../lib/page-metadata.mjs'
import Link from 'next/link'
import { DependencyGraph } from '../../components/deferred-pages'
import sections from '../../generated/sections.json'

export const metadata = pageMetadata("/roadmap", "依存マップ", "16セクションの前提関係を、矢印付きの図と依存関係一覧から辿れます。")

export default function RoadmapPage() {
  return (
    <main id="nextra-skip-nav" tabIndex={-1} className="page-shell">
      <p className="home-section-kicker">DEPENDENCY MAP</p>
      <h1 className="page-title">依存マップ</h1>
      <p className="page-lead">
        セクション間の「先に読んでおくと理解が速い」依存関係です。ノードをクリックすると各セクションへ移動します。読者タイプ別のおすすめの読み順は{' '}
        <Link href="/#routes">学習ルート</Link> または{' '}
        <Link href="/docs/overview/learning-roadmap">学習ロードマップ</Link> を参照してください。
      </p>
      <DependencyGraph />
    </main>
  )
}
