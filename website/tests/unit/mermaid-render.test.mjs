import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import mermaid from 'mermaid'
import { compileMdx } from 'nextra/compile'
import nextConfig from '../../next.config.mjs'
import { renderMermaidChart } from '../../lib/mermaid-render.mjs'

test('the actual Nextra compiler Mermaid import resolves to the safe renderer in both bundlers', async () => {
  const compiled = await compileMdx('```mermaid\nflowchart LR\n  A --> B\n```', {
    mdxOptions: { outputFormat: 'program' }, filePath: 'diagram.mdx'
  })
  const specifier = compiled.match(/import \{\s*Mermaid\s*\} from ["']([^"']+)["']/)?.[1]
  assert.equal(specifier, '@theguild/remark-mermaid/mermaid')
  const expected = fileURLToPath(new URL('../../components/mdx/mermaid.jsx', import.meta.url))
  const alias = nextConfig.turbopack.resolveAlias[specifier]
  assert.equal(fileURLToPath(new URL(`../../${alias}`, import.meta.url)), expected)
  const webpackConfig = nextConfig.webpack({
    watchOptions: { ignored: /node_modules/ }, resolve: { alias: {} }, module: { rules: [] }
  }, { defaultLoaders: { babel: {} } })
  assert.equal(webpackConfig.resolve.alias[`${specifier}$`], expected)
})

test('installed Mermaid preserves site-controlled security keys', () => {
  const keys = mermaid.mermaidAPI.defaultConfig.secure
  for (const key of ['secure', 'securityLevel', 'startOnLoad', 'suppressErrorRendering']) {
    assert.ok(keys.includes(key), `${key} must not be configurable by article content`)
  }
})

test('each render and theme change initializes strict mode before rendering', async () => {
  const events = []
  const mock = {
    initialize(config) { events.push(['initialize', config]) },
    async render(id, chart, container) {
      events.push(['render', id, chart, container])
      return { svg: '<svg></svg>', bindFunctions() { assert.fail('chart events must not be bound') } }
    }
  }
  const container = {}
  for (const dark of [false, true, false]) {
    assert.equal(await renderMermaidChart(mock, {
      id: 'diagram', chart: 'flowchart LR\\nA --> B', dark, container
    }), '<svg></svg>')
    const [initialize, render] = events.splice(0)
    assert.equal(initialize[0], 'initialize')
    assert.equal(initialize[1].securityLevel, 'strict')
    assert.equal(initialize[1].theme, dark ? 'dark' : 'default')
    assert.equal(initialize[1].startOnLoad, false)
    assert.equal(initialize[1].suppressErrorRendering, true)
    assert.equal(Object.hasOwn(initialize[1], 'secure'), false)
    assert.deepEqual(render, ['render', 'diagram', 'flowchart LR\nA --> B', container])
  }
})

test('concurrent diagrams do not replace an in-flight configuration and failures do not block the queue', async () => {
  let completeFirst
  const gate = new Promise(resolve => { completeFirst = resolve })
  const events = []
  const mock = {
    initialize(config) { events.push(config.theme) },
    async render(id) {
      if (id === 'first') {
        await gate
        throw new Error('ordinary rendering failure')
      }
      return { svg: '<svg></svg>' }
    }
  }
  const first = renderMermaidChart(mock, { id: 'first', chart: 'flowchart LR\nA --> B', dark: false })
  const failure = assert.rejects(first, /ordinary rendering failure/)
  const second = renderMermaidChart(mock, { id: 'second', chart: 'flowchart LR\nC --> D', dark: true })
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(events, ['default'])
  completeFirst()
  await failure
  assert.equal(await second, '<svg></svg>')
  assert.deepEqual(events, ['default', 'dark'])
})

test('unmounted or superseded diagrams do not render or return stale SVG', async () => {
  const untouched = {
    initialize() { assert.fail('cancelled render must not initialize') },
    render() { assert.fail('cancelled render must not render') }
  }
  const options = { id: 'diagram', chart: 'flowchart LR\nA --> B', dark: false }
  assert.equal(await renderMermaidChart(untouched, { ...options, isCurrent: () => false }), null)
  let current = true
  const mock = {
    initialize() {},
    async render() { current = false; return { svg: '<svg></svg>' } }
  }
  assert.equal(await renderMermaidChart(mock, { ...options, isCurrent: () => current }), null)
})
