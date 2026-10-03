'use client'

import { Background, Controls, MarkerType, ReactFlow } from '@xyflow/react'
import Link from 'next/link'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import sections from '../../generated/sections.json'

/**
 * セクション間依存のインタラクティブ図。
 * 原本: docs/00-overview/learning-roadmap.md の Mermaid 依存グラフ(そちらが正。
 * ノード・エッジを変更したら原本の Mermaid と同期すること)
 */

const POSITIONS = {
  overview: { x: 240, y: 0 },
  concepts: { x: 240, y: 120 },
  architecture: { x: 240, y: 240 },
  implementation: { x: 240, y: 360 },
  evaluation: { x: 240, y: 480 },
  operations: { x: 240, y: 600 },
  security: { x: 560, y: 300 },
  'case-studies': { x: 560, y: 540 },
  'coding-agents': { x: 560, y: 60 },
  business: { x: -80, y: 560 },
  'llm-foundations': { x: -80, y: 180 },
  'llm-internals': { x: -320, y: 180 },
  multimodal: { x: -80, y: 370 },
  'domain-agents': { x: 560, y: 720 },
  'ux-and-product': { x: -80, y: 720 },
  'human-ai': { x: 20, y: -140 }
}

// learning-roadmap.md の Mermaid と同じ依存(矢印 = 先に読むと理解が速い)。
// 第 3 要素 'dashed' は Mermaid の点線(-.->)に対応
const EDGES = [
  ['overview', 'concepts'],
  ['concepts', 'architecture'],
  ['architecture', 'implementation'],
  ['implementation', 'evaluation'],
  ['evaluation', 'operations'],
  ['concepts', 'security'],
  ['architecture', 'security'],
  ['implementation', 'case-studies'],
  ['security', 'case-studies'],
  ['operations', 'case-studies'],
  ['concepts', 'coding-agents'],
  ['security', 'coding-agents', 'dashed'],
  ['concepts', 'business'],
  ['evaluation', 'business', 'dashed'],
  ['concepts', 'llm-foundations', 'dashed'],
  ['llm-foundations', 'llm-internals', 'dashed'],
  ['implementation', 'multimodal', 'dashed'],
  ['implementation', 'domain-agents', 'dashed'],
  ['architecture', 'ux-and-product', 'dashed'],
  ['overview', 'human-ai', 'dashed']
]

/** next-themes が <html class="dark"> を付け外しするのを監視する(依存追加なしの簡易フック) */
function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const html = document.documentElement
    const update = () => setIsDark(html.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export function DependencyGraph() {
  const router = useRouter()
  const isDark = useIsDark()
  const [hovered, setHovered] = useState(null)

  // Keep user-node references stable during hover updates. React Flow retains
  // measured dimensions by reference; recreating nodes hides them until remeasured.
  const nodes = useMemo(() => sections.map(section => ({
    id: section.slug,
    position: POSITIONS[section.slug] ?? { x: 0, y: 0 },
    data: {
      label: (
        <div className="dep-node-label">
          <span className="dep-node-num">{section.num}</span>
          <span className="dep-node-title">{section.title.replace(/^\d\d\.\s*/, '')}</span>
          <span className="dep-node-count">{section.count} 本</span>
        </div>
      ),
      route: section.route,
      description: section.description
    },
    className: 'dep-node',
    ariaLabel: `${section.title}。Enter または Space でセクションへ移動`,
    style: { width: 200 }
  })), [])

  const edges = useMemo(() => EDGES.map(([source, target, variant]) => ({
    id: `${source}-${target}`,
    source,
    target,
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
    style: variant === 'dashed' ? { strokeWidth: 1.5, strokeDasharray: '6 4' } : { strokeWidth: 1.5 }
  })), [])

  const hoveredSection = hovered ? sections.find(s => s.slug === hovered) : null

  return (
    <div className="dep-graph">
      <div className="dep-graph-canvas" onKeyDownCapture={event => {
        const node = event.target.closest('.react-flow__node')
        const section = sections.find(item => item.slug === node?.dataset.id)
        if (section && ['Enter', ' '].includes(event.key)) { event.preventDefault(); router.push(section.route) }
      }} onFocusCapture={event => setHovered(event.target.closest('.react-flow__node')?.dataset.id || null)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          colorMode={isDark ? 'dark' : 'light'}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesFocusable
          ariaLabelConfig={{ 'node.a11yDescription.default': 'Tab でノードを選び、Enter または Space でセクションへ移動します。', 'controls.zoomIn.ariaLabel': '拡大', 'controls.zoomOut.ariaLabel': '縮小', 'controls.fitView.ariaLabel': '図全体を表示' }}
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          onNodeClick={(_, node) => router.push(node.data.route)}
          onNodeMouseEnter={(_, node) => setHovered(node.id)}
          onNodeMouseLeave={() => setHovered(null)}
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="dep-graph-panel" aria-live="polite">
        {hoveredSection ? (
          <>
            <p className="dep-panel-title">{hoveredSection.title}</p>
            <p className="dep-panel-desc">{hoveredSection.description}</p>
            <p className="dep-panel-hint">クリック、Enter または Space でセクションへ移動</p>
          </>
        ) : (
          <p className="dep-panel-hint">
            ノードにカーソルを合わせると概要を表示します。矢印は「先に読んでおくと理解が速い」という依存関係です。
          </p>
        )}
      </div>
      <p className="dep-panel-hint">矢印の先の章を読む前に、手前の章を読むと理解が速くなります。実線: 基本の前提関係。破線: 関連知識として推奨。</p>
      <section className="dependency-list" aria-label="依存関係の一覧">
        <h2>依存関係を一覧で読む</h2>
        <ul>{EDGES.map(([source, target, variant]) => {
          const before = sections.find(section => section.slug === source)
          const after = sections.find(section => section.slug === target)
          return <li key={`${source}-${target}`}><Link prefetch={false} href={after.route}>{after.title}</Link> を読む前に <Link prefetch={false} href={before.route}>{before.title}</Link> {variant === 'dashed' ? '(関連知識として推奨)' : '(基本の前提)'}</li>
        })}</ul>
      </section>
    </div>
  )
}
