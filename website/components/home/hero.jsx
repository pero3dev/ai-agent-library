import Link from 'next/link'

/**
 * ヒーローセクション。右側の Agent ループ図は純 CSS アニメーション
 * (prefers-reduced-motion では静止。静止でも図として成立するデザイン)。
 */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="hero-kicker">AI Agent Library</p>
        <h1 className="hero-title">
          用語の説明ではなく、
          <br />
          <em>実務の設計判断</em>を学ぶ。
        </h1>
        <p className="hero-lead">
          AI Agent の概念・設計・実装・評価・運用・セキュリティを体系的に。全 37 本のドキュメントに、設計判断の基準・アンチパターン・チェックリストを収録しています。
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="#routes">
            学習ルートを選ぶ
          </Link>
          <Link className="btn btn-ghost" href="/docs">
            ドキュメント一覧
          </Link>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="loop-ring">
          <div className="loop-arc" />
          <span className="loop-node loop-node-1">観測</span>
          <span className="loop-node loop-node-2">思考</span>
          <span className="loop-node loop-node-3">行動</span>
          <span className="loop-center">
            Agent
            <br />
            ループ
          </span>
        </div>
      </div>
    </section>
  )
}
