import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { addSecurityMeta } from '../../lib/export-policy.mjs'

test('export CSP permits exact inline hydration and applies before resources', () => {
  const body = 'self.__next_f.push([1,"日本語"]);'
  const html = `<html><head><script>${body}</script><script src="/_next/app.js"></script></head><body></body></html>`
  const output = addSecurityMeta(html)
  const hash = createHash('sha256').update(body).digest('base64')
  const policy = output.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]
  assert.ok(output.indexOf('Content-Security-Policy') < output.indexOf('<script>'))
  assert.match(policy, new RegExp(`sha256-${hash.replace(/[+]/g, '\\+')}`))
  assert.ok(!policy.split('; ').find(part => part.startsWith('script-src')).includes('unsafe-inline'))
  for (const directive of ["object-src 'none'", "base-uri 'self'", "form-action 'none'"]) assert.ok(policy.includes(directive))
  assert.ok(!policy.includes('frame-ancestors'))
  assert.match(output, /name="referrer" content="strict-origin-when-cross-origin"/)
})

test('loopback media permission belongs only to the isolated native-audio fixture', () => {
  const html = '<html><head></head><body></body></html>'
  assert.ok(!addSecurityMeta(html).includes('http://127.0.0.1:*'))
  assert.ok(addSecurityMeta(html, { audioFixture: true }).includes('http://127.0.0.1:*'))
})
