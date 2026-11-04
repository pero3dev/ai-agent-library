import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { articleFreshness } from '../../lib/article-freshness.mts'
import { observationReport } from '../../../scripts/freshness-observation-report.mjs'
import { readRegistry } from '../../../scripts/freshness-registry.mjs'
import type { FreshnessReport } from '../../lib/content-types.ts'

const root = new URL('../../../', import.meta.url)
const report = observationReport(fileURLToPath(root))
test('all declared learning articles retain every system membership', () => {
  const registry = readRegistry(fileURLToPath(root))
  for (const doc of new Set(registry.flatMap(system => system.docs))) {
    assert.deepEqual(articleFreshness(doc, report).map(system => system.id), registry.filter(system => system.docs.includes(doc)).map(system => system.id))
    assert(articleFreshness(doc, report).length > 0)
  }
})
test('article check date takes priority; legacy system check and no record are explicit fallbacks', () => {
  const fixture: FreshnessReport = structuredClone(report)
  const system = fixture.systems[0], doc = system.articles[0].doc
  system.last_verified_at = '2026-11-01'
  system.articles[0].last_verified_at = '2026-10-31'
  assert.deepEqual(articleFreshness(doc, fixture)[0], { id: system.id, title: system.title, last_verified_at: '2026-10-31', scope: 'article' })
  system.articles[0].last_verified_at = null
  assert.equal(articleFreshness(doc, fixture)[0].last_verified_at, '2026-11-01')
  assert.equal(articleFreshness(doc, fixture)[0].scope, 'system')
  system.last_verified_at = null
  assert.equal(articleFreshness(doc, fixture)[0].last_verified_at, null)
  assert.deepEqual(articleFreshness('not-an-article', fixture), [])
})
