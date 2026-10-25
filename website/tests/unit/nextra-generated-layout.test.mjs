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
  const nodeTypes = vm.runInNewContext(schemas.slice(start, end) + '\n({ element, reactNode })', { z, isValidElement })
  const theme = readFileSync(new URL('./schemas.js', entry), 'utf8')
    .replace(/^import [^\n]+\n/gm, '')
    .replace(/export \{\n  LayoutPropsSchema\n\};\s*$/, 'globalThis.schema = LayoutPropsSchema;')
  const context = { z, jsx, Fragment, ...nodeTypes, Search: () => null, LastUpdated: () => null }
  vm.runInNewContext(theme, context)
  return context.schema
}

function render(source, props) {
  const context = {
    z, LayoutPropsSchema: installedSchema(),
    _c: count => Array(count).fill(Symbol.for('react.memo_cache_sentinel')),
    jsx: (type, value) => ({ type, props: value }),
    jsxs: (type, value) => ({ type, props: value }),
    ThemeProvider: 'ThemeProvider', SkipNavLink: 'SkipNavLink', MobileNav: 'MobileNav',
    ConfigProvider: 'ConfigProvider', ThemeConfigProvider: 'ThemeConfigProvider'
  }
  vm.runInNewContext(source.replace(/^import [^\n]+\n/gm, '')
    .replace(/export \{\n  Layout\n\};\s*$/, 'globalThis.layout = Layout;'), context)
  return context.layout(props)
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
  assert.equal(Object.hasOwn(tree.props.value, 'children'), false)
  const config = tree.props.children.props.children[2]
  assert.equal(config.type, 'ConfigProvider')
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
