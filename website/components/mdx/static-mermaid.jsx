export function StaticMermaid({ diagram, label }) {
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return <figure className="static-mermaid" data-mermaid-renderer="strict-static">
    <img className="mermaid-light" src={`${prefix}/_mermaid/${diagram}-light.svg`} alt={label} loading="lazy" />
    <img className="mermaid-dark" src={`${prefix}/_mermaid/${diagram}-dark.svg`} alt={label} loading="lazy" />
    <figcaption>{label}</figcaption>
  </figure>
}
