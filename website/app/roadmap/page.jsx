import Link from 'next/link'
import { DependencyGraph } from '../../components/roadmap/dependency-graph'

export const metadata = {
  title: '依存マップ',
  description: '8 セクションの依存関係をインタラクティブに辿れます。'
}

export default function RoadmapPage() {
  return (
    <main className="page-shell">
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
