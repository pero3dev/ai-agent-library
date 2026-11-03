import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import { createElement, Fragment, isValidElement } from 'react'
import { jsx } from 'react/jsx-runtime'
import { z } from 'zod'
import { adaptNextraLayoutSource, generatedLayoutSource } from '../../lib/nextra-generated-layout.mjs'

const entry = new URL(import.meta.resolve('nextra-theme-docs'))
const installed = readFileSync(new URL('./layout.js', entry), 'utf8')

function installedSchema() {
  const nextra = new URL(import.meta.resolve('nextra/schemas'))
  const schemas = readFileSync(nextra, 'utf8')
  const start = schemas.indexOf('const element = z.custom(')
  const end = schemas.indexOf('const stringOrElement =', start)
  assert.ok(start >= 0 && end > start)
  const nodeTypes: unknown = vm.runInNewContext(schemas.slice(start, end) + '\n({ element, reactNode })', { z, isValidElement })
  assert(nodeTypes && typeof nodeTypes === 'object')
  const theme = readFileSync(new URL('./schemas.js', entry), 'utf8')
    .replace(/^import [^\n]+\n/gm, '')
    .replace(/export \{\n  LayoutPropsSchema\n\};\s*$/, 'globalThis.schema = LayoutPropsSchema;')
  const context: Record<string, unknown> = { z, jsx, Fragment, ...nodeTypes, Search: () => null, LastUpdated: () => null }
  vm.runInNewContext(theme, context)
  return context.schema
}

interface TestElement { type: unknown; props: Record<string, unknown> }
function element(value: unknown): TestElement {
  assert(value && typeof value === 'object' && 'type' in value && 'props' in value)
  assert(value.props && typeof value.props === 'object')
  return { type: value.type, props: Object.fromEntries(Object.entries(value.props)) }
}
function render(source: string, props: unknown) {
  const context: Record<string, unknown> = {
    z, LayoutPropsSchema: installedSchema(),
    _c: (count: number) => Array(count).fill(Symbol.for('react.memo_cache_sentinel')),
    jsx: (type: unknown, value: unknown) => ({ type, props: value }),
    jsxs: (type: unknown, value: unknown) => ({ type, props: value }),
    ThemeProvider: 'ThemeProvider', SkipNavLink: 'SkipNavLink', MobileNav: 'MobileNav',
    ConfigProvider: 'ConfigProvider', ThemeConfigProvider: 'ThemeConfigProvider'
  }
  vm.runInNewContext(source.replace(/^import [^\n]+\n/gm, '')
    .replace(/export \{\n  Layout\n\};\s*$/, 'globalThis.layout = Layout;'), context)
  assert(typeof context.layout === 'function')
  return element(Reflect.apply(context.layout, undefined, [props]))
}

test('installed Nextra layout reproduces the missing children validation failure', () => {
  assert.throws(() => render(installed, { children: createElement('article'), pageMap: [] }),
    error => typeof error === 'string' && error.includes('children') && error.includes('nonoptional'))
})

test('generated layout validates full props and keeps children out of theme configuration', () => {
  const child = createElement('article', null, '本文')
  const navbar = createElement('nav')
  const footer = createElement('footer')
  const tree = render(generatedLayoutSource(), { children: child, pageMap: [], navbar, footer })
  assert.equal(tree.type, 'ThemeConfigProvider')
  const themeValue = tree.props.value
  assert(themeValue && typeof themeValue === 'object')
  assert.equal(Object.hasOwn(themeValue, 'children'), false)
  const children = element(tree.props.children).props.children
  assert(Array.isArray(children))
  const config = element(children[2])
  assert.equal(config.type, 'ConfigProvider')
  assert(Array.isArray(config.props.children))
  assert.equal(config.props.children[1], child)
  assert.equal(config.props.navbar, navbar)
  assert.equal(config.props.footer, footer)
})

test('generated layout still rejects invalid props and React children', () => {
  for (const props of [
    { children: createElement('article'), pageMap: [], darkMode: 'invalid' },
    { children: { invalid: true }, pageMap: [] }
  ]) assert.throws(() => render(generatedLayoutSource(), props), error => typeof error === 'string')
})

test('adapter fails closed on unreviewed dependency versions and changed source patterns', () => {
  const options = { version: '4.6.1', filename: '/site/node_modules/nextra-theme-docs/dist/layout.js', outputFilename: '/site/generated/nextra-layout.mjs' }
  assert.throws(() => adaptNextraLayoutSource(installed, { ...options, version: '4.6.2' }), /requires review/)
  assert.throws(() => adaptNextraLayoutSource(installed.replace('safeParse(themeConfig)', 'parse(themeConfig)'), options), /requires review/)
  assert.throws(() => adaptNextraLayoutSource(installed + installed, options), /requires review/)
  const source = adaptNextraLayoutSource(installed, options)
  assert.match(source, /from "\.\.\/node_modules\/nextra-theme-docs\/dist\/schemas"/)
  assert.doesNotMatch(source, /from "\.\/schemas"/)
})
