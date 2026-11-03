// Mermaid keeps global configuration. Serialize initialize + render together so
// lazily mounted diagrams and theme changes cannot replace an in-flight config.
import type { Mermaid } from 'mermaid'
let renderQueue: Promise<unknown> = Promise.resolve()

export interface MermaidRenderer<Container = Element> {
  initialize(config: Parameters<Mermaid['initialize']>[0]): void
  render(id: string, chart: string, container?: Container): Promise<{ svg: string }>
}
export function renderMermaidChart<Container = Element>(mermaid: MermaidRenderer<Container>, { id, chart, dark, container, isCurrent = () => true }: {
  id: string; chart: string; dark: boolean; container?: Container; isCurrent?: () => boolean
}) {
  const rendering = renderQueue.then(async () => {
    if (!isCurrent()) return null
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      // Keep Mermaid's default secure keys; chart directives must not change
      // securityLevel, secure, or the other site-controlled security settings.
      suppressErrorRendering: true,
      fontFamily: 'inherit',
      themeCSS: 'margin: 1.5rem auto 0;',
      theme: dark ? 'dark' : 'default'
    })
    const { svg } = await mermaid.render(id, chart.replaceAll('\\n', '\n'), container)
    // Do not bind chart-supplied events. Only the strict renderer's SVG is used.
    return isCurrent() ? svg : null
  })
  // An invalid chart must not prevent later diagrams from rendering.
  renderQueue = rendering.catch(() => {})
  return rendering
}
