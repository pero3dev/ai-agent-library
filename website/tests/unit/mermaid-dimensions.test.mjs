import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { svgDimensions, diagramDimensions } from '../../lib/mermaid-dimensions.mjs'
import { renderMermaidAssets } from '../../scripts/render-mermaid-assets.mjs'

const key = 'aeadd4058b26a4e88295f971'
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="813.36" height="1141" viewBox="0 0 813.36 1141"><text>図</text></svg>'

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mermaid-dimensions-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'generated'), { recursive: true })
  await mkdir(path.join(root, 'public/_mermaid'), { recursive: true })
  await writeFile(path.join(root, 'generated/mermaid-charts.json'), JSON.stringify({ [key]: 'flowchart TD\nA --> B' }))
  return root
}

test('SVG dimensions preserve the actual root size rather than nested content', () => {
  assert.deepEqual(svgDimensions(svg), { width: 813.36, height: 1141 })
  assert.deepEqual(svgDimensions('<?xml version="1.0"?><svg width="8.125e2" height=\'1.141e3\'><rect width="1" height="1"/></svg>'), { width: 812.5, height: 1141 })
  assert.throws(() => svgDimensions('<g><svg width="1" height="1"/></g>'), /missing SVG root/)
})

test('invalid, missing, percentage and nonfinite dimensions fail the build', () => {
  for (const width of ['', '0', '-1', 'NaN', 'Infinity', '1e999', '100%', '0x100', '12px']) {
    assert.throws(() => svgDimensions(`<svg width="${width}" height="10"></svg>`), /invalid width/)
  }
  assert.throws(() => svgDimensions('<svg width="10"></svg>'), /invalid height/)
})

test('dimension lookup rejects missing references and keeps the theme-specific size', () => {
  const manifest = { schema_version: 1, diagrams: { [key]: { light: { width: 10, height: 20 }, dark: { width: 12, height: 24 } } } }
  assert.deepEqual(diagramDimensions(manifest, key, 'dark'), { width: 12, height: 24 })
  assert.throws(() => diagramDimensions(manifest, 'b'.repeat(24), 'light'), /Missing or invalid/)
  assert.throws(() => diagramDimensions(manifest, key, 'other'), /Invalid/)
  assert.throws(() => diagramDimensions({ ...manifest, schema_version: 2 }, key, 'light'), /Invalid/)
  manifest.diagrams[key].light.width = Infinity
  assert.throws(() => diagramDimensions(manifest, key, 'light'), /Missing or invalid/)
})

test('fresh rendering writes a complete light/dark dimensions manifest', async t => {
  const root = await fixture(t)
  const calls = []
  const result = await renderMermaidAssets({ root, render: async (pending, { assetDir }) => {
    calls.push(...pending)
    for (const entry of pending) await writeFile(path.join(assetDir, `${entry.key}-${entry.theme}.svg`), svg)
  } })
  assert.deepEqual(calls.map(entry => entry.theme), ['light', 'dark'])
  assert.deepEqual(result, { diagrams: 1, generated: 2 })
  const manifest = JSON.parse(await readFile(path.join(root, 'generated/mermaid-dimensions.json')))
  assert.deepEqual(diagramDimensions(manifest, key, 'light'), { width: 813.36, height: 1141 })
  assert.deepEqual(diagramDimensions(manifest, key, 'dark'), { width: 813.36, height: 1141 })
})

test('fully cached assets rebuild missing or stale metadata without launching a renderer', async t => {
  const root = await fixture(t)
  for (const theme of ['light', 'dark']) await writeFile(path.join(root, 'public/_mermaid', `${key}-${theme}.svg`), svg)
  await writeFile(path.join(root, 'generated/mermaid-dimensions.json'), '{"stale":true}')
  const result = await renderMermaidAssets({ root, render: async () => assert.fail('cached assets must not launch a browser') })
  assert.deepEqual(result, { diagrams: 1, generated: 0 })
  const first = await readFile(path.join(root, 'generated/mermaid-dimensions.json'), 'utf8')
  await rm(path.join(root, 'generated/mermaid-dimensions.json'))
  await renderMermaidAssets({ root, render: async () => assert.fail('cached assets must not launch a browser') })
  assert.equal(await readFile(path.join(root, 'generated/mermaid-dimensions.json'), 'utf8'), first)
})

test('an invalid cached SVG rejects metadata instead of reintroducing unreserved images', async t => {
  const root = await fixture(t)
  await writeFile(path.join(root, 'public/_mermaid', `${key}-light.svg`), svg.replace('width="813.36"', 'width="100%"'))
  await writeFile(path.join(root, 'public/_mermaid', `${key}-dark.svg`), svg)
  await assert.rejects(renderMermaidAssets({ root, render: async () => assert.fail('assets are cached') }), /invalid width/)
})
