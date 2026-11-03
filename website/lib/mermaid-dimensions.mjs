const diagramPattern = /^[a-f0-9]{24}$/
const positiveNumber = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

function validSize(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function svgDimensions(svg, label = 'Mermaid SVG') {
  const root = /^\s*(?:<\?xml[^>]*>\s*)?<svg\b([^>]*)>/i.exec(svg)
  if (!root) throw new Error(`${label}: missing SVG root`)
  const size = name => {
    const attribute = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(root[1])
    const raw = attribute?.[2].trim()
    const value = raw && positiveNumber.test(raw) ? Number(raw) : NaN
    if (!validSize(value)) throw new Error(`${label}: invalid ${name}`)
    return value
  }
  return { width: size('width'), height: size('height') }
}

export function diagramDimensions(manifest, diagram, theme) {
  if (manifest?.schema_version !== 1 || !diagramPattern.test(diagram) || !['light', 'dark'].includes(theme)) {
    throw new Error('Invalid Mermaid dimensions manifest reference')
  }
  const value = manifest.diagrams?.[diagram]?.[theme]
  if (!validSize(value?.width) || !validSize(value?.height)) throw new Error(`Missing or invalid Mermaid dimensions: ${diagram}-${theme}`)
  return { width: value.width, height: value.height }
}
