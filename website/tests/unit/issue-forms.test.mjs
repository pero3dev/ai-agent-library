import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

test('reader Issue Forms parse with required GitHub fields and unique prefill identifiers', () => {
  const names = new Set()
  for (const filename of ['article-correction.yml', 'content-request.yml']) {
    const form = parse(readFileSync(new URL(`../../../.github/ISSUE_TEMPLATE/${filename}`, import.meta.url), 'utf8'))
    assert.equal(typeof form.name, 'string'); assert.equal(typeof form.description, 'string')
    assert.ok(!names.has(form.name)); names.add(form.name)
    assert.ok(Array.isArray(form.body) && form.body.length > 0)
    assert.ok(Array.isArray(form.labels) && form.labels.length > 0)
    const ids = new Set()
    for (const field of form.body) {
      assert.ok(['markdown', 'input', 'textarea'].includes(field.type))
      if (field.type === 'markdown') assert.equal(typeof field.attributes.value, 'string')
      else { assert.equal(typeof field.attributes.label, 'string'); assert.ok(/^[a-z][a-z0-9_-]*$/.test(field.id)); assert.ok(!ids.has(field.id)); ids.add(field.id) }
      if (field.validations) assert.equal(typeof field.validations.required, 'boolean')
    }
    if (filename === 'article-correction.yml') { assert.ok(ids.has('article')); assert.ok(ids.has('updated')) }
  }
})
