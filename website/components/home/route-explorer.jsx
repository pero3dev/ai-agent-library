'use client'

import Link from 'next/link'
import { useState } from 'react'
import { READER_ROUTES } from './data'

/** 読者タイプ別の学習ルート(タブ + ステップ表示)。原本: docs/00-overview/learning-roadmap.md */
export function RouteExplorer() {
  const [activeKey, setActiveKey] = useState('A')
  const route = READER_ROUTES.find(r => r.key === activeKey)

  return (
    <div className="route-explorer">
      <div className="route-tabs" role="tablist" aria-label="読者タイプ">
        {READER_ROUTES.map(r => (
          <button
            key={r.key}
            role="tab"
            aria-selected={r.key === activeKey}
            className={`route-tab${r.key === activeKey ? ' is-active' : ''}`}
            onClick={() => setActiveKey(r.key)}
          >
            <span className="route-tab-key">{r.key}</span>
            {r.label}
          </button>
        ))}
      </div>
      <div className="route-panel" role="tabpanel">
        <p className="route-persona">{route.persona}</p>
        <ol className="route-steps">
          {route.steps.map((step, i) => (
            <li key={step.href} className="route-step">
              <span className="route-step-num">{i + 1}</span>
              <div className="route-step-body">
                <Link href={step.href}>{step.title}</Link>
                <p>{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="route-more">
          セクション間の依存は <Link href="/roadmap">依存マップ</Link>、詳しい読み順は{' '}
          <Link href="/docs/overview/learning-roadmap">学習ロードマップ</Link> を参照してください。
        </p>
      </div>
    </div>
  )
}
