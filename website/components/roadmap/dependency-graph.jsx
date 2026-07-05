'use client'

import { Background, Controls, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  'coding-agents': { x: 560, y: 60 }
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
  ['security', 'coding-agents', 'dashed']
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

  const nodes = sections.map(section => ({
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
    style: { width: 200 }
  }))

  const edges = EDGES.map(([source, target, variant]) => ({
    id: `${source}-${target}`,
    source,
    target,
    animated: false,
    style: variant === 'dashed' ? { strokeWidth: 1.5, strokeDasharray: '6 4' } : { strokeWidth: 1.5 }
  }))

  const hoveredSection = hovered ? sections.find(s => s.slug === hovered) : null

  return (
    <div className="dep-graph">
      <div className="dep-graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          colorMode={isDark ? 'dark' : 'light'}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
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
            <p className="dep-panel-hint">クリックでセクションへ移動</p>
          </>
        ) : (
          <p className="dep-panel-hint">
            ノードにカーソルを合わせると概要を表示します。矢印は「先に読んでおくと理解が速い」という依存関係です。
          </p>
        )}
      </div>
    </div>
  )
}
