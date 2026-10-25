import dimensions from '../../generated/mermaid-dimensions.json'
import { diagramDimensions } from '../../lib/mermaid-dimensions.mjs'

export function StaticMermaid({ diagram, label }) {
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const light = diagramDimensions(dimensions, diagram, 'light')
  const dark = diagramDimensions(dimensions, diagram, 'dark')
  return <figure className="static-mermaid" data-mermaid-renderer="strict-static">
    <img className="mermaid-light" src={`${prefix}/_mermaid/${diagram}-light.svg`} alt={label} loading="lazy" {...light} />
    <img className="mermaid-dark" src={`${prefix}/_mermaid/${diagram}-dark.svg`} alt={label} loading="lazy" {...dark} />
    <figcaption>{label}</figcaption>
    <details className="mermaid-original" data-pagefind-ignore="all">
      <summary aria-label={`${label}を元の大きさで表示`}>図を元の大きさで表示</summary>
      <p>図の中をスクロールして読めます。キーボードでは図の領域へ Tab で移動し、矢印キーを使います。読み終わったら、この見出しをもう一度選ぶと閉じます。</p>
      <div className="mermaid-original-scroll" tabIndex={0} role="region" aria-label={`${label}のスクロール領域`}>
        <img className="mermaid-light" src={`${prefix}/_mermaid/${diagram}-light.svg`} alt={label} loading="lazy" {...light} />
        <img className="mermaid-dark" src={`${prefix}/_mermaid/${diagram}-dark.svg`} alt={label} loading="lazy" {...dark} />
      </div>
    </details>
  </figure>
}
