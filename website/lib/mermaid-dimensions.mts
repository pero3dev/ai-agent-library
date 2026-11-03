const diagramPattern = /^[a-f0-9]{24}$/
const positiveNumber = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

export interface DiagramSize { width: number; height: number }
export interface DiagramManifest { schema_version: number; diagrams: Record<string, Partial<Record<'light' | 'dark', DiagramSize>>> }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function validSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function svgDimensions(svg: string, label = 'Mermaid SVG'): DiagramSize {
  const root = /^\s*(?:<\?xml[^>]*>\s*)?<svg\b([^>]*)>/i.exec(svg)
  if (!root) throw new Error(`${label}: missing SVG root`)
  const size = (name: 'width' | 'height') => {
    const attribute = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(root[1])
    const raw = attribute?.[2].trim()
    const value = raw && positiveNumber.test(raw) ? Number(raw) : NaN
    if (!validSize(value)) throw new Error(`${label}: invalid ${name}`)
    return value
  }
  return { width: size('width'), height: size('height') }
}

export function diagramDimensions(manifest: unknown, diagram: string, theme: string): DiagramSize {
  if (!record(manifest) || manifest.schema_version !== 1 || !diagramPattern.test(diagram) || !['light', 'dark'].includes(theme)) {
    throw new Error('Invalid Mermaid dimensions manifest reference')
  }
  const diagramEntry = record(manifest.diagrams) ? manifest.diagrams[diagram] : undefined
  const value = record(diagramEntry) ? diagramEntry[theme] : undefined
  if (!record(value) || !validSize(value.width) || !validSize(value.height)) throw new Error(`Missing or invalid Mermaid dimensions: ${diagram}-${theme}`)
  return { width: value.width, height: value.height }
}
