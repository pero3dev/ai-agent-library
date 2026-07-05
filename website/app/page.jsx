import Link from 'next/link'
import { AntiPatternRoots } from '../components/home/anti-pattern-roots'
import { ConceptCards } from '../components/home/concept-cards'
import { Hero } from '../components/home/hero'
import { RouteExplorer } from '../components/home/route-explorer'
import { SectionGrid } from '../components/home/section-grid'
import '../components/home/home.css'

export const metadata = {
  title: 'AI Agent Library — 実務の設計判断のための学習ドキュメント'
}

export default function HomePage() {
  return (
    <main className="home">
      <Hero />

      <section id="routes">
        <p className="home-section-kicker">LEARNING ROUTES</p>
        <h2 className="home-section-title">読者タイプ別の学習ルート</h2>
        <p className="home-section-lead">
          全部を順番に読む必要はありません。いまの役割に合わせて、読む順序を選んでください。
        </p>
        <RouteExplorer />
      </section>

      <section>
        <p className="home-section-kicker">CORE CONCEPTS</p>
        <h2 className="home-section-title">重要概念</h2>
        <p className="home-section-lead">
          このライブラリの中心となる概念です。すべての用語は <Link href="/glossary">用語集</Link>{' '}
          から該当ドキュメントへ辿れます。
        </p>
        <ConceptCards />
      </section>

      <section>
        <p className="home-section-kicker">ANTI-PATTERNS</p>
        <h2 className="home-section-title">つまずく前に — アンチパターンの 3 つの共通根</h2>
        <p className="home-section-lead">
          Agent 開発の失敗の多くは、この 3 つの根から生えています。詳細は{' '}
          <Link href="/docs/case-studies/common-anti-patterns">アンチパターン集(横断)</Link>{' '}
          で自己診断できます。
        </p>
        <AntiPatternRoots />
      </section>

      <section>
        <p className="home-section-kicker">ALL SECTIONS</p>
        <h2 className="home-section-title">セクション一覧</h2>
        <p className="home-section-lead">概念から運用・セキュリティまで、全 8 セクション。</p>
        <SectionGrid />
      </section>
    </main>
  )
}
