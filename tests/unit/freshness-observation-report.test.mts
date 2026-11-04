import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeObservations } from '../../scripts/freshness-observation-report.mjs'
import type { ObservationRun } from '../../scripts/lib/freshness-types.d.mts'
const registry = [{ id: 'models', title: 'Models', cadenceDays: 7, docPatterns: ['docs/models/*.md'] }]
/** @param {string} date @param {boolean} scope */
const run = (date: string, scope: boolean) => [{ file: 'research/freshness-runs/test.json', record: { completed_at: `${date}T00:00:00Z`, observations: [{ system_id: 'models', status: 'unchanged', affected_docs: ['docs/models/a.md'] }], ...(scope ? { coverage: [{ system_id: 'models', scope: 'declared-system', status: 'verified', verified_on: date, description: 'vendor releases and declared target claims' }] } : {}) } }]
test('period within target and overdue are calculated from explicit verified coverage', () => {
  assert.equal(summarizeObservations(registry, run('2026-10-01', true), { today: '2026-10-03' }).systems[0].status, 'current')
  assert.equal(summarizeObservations(registry, run('2026-09-20', true), { today: '2026-10-03' }).systems[0].status, 'overdue')
})
test('missing records and partial vendor observations remain unknown, never complete', () => {
  const missing = summarizeObservations(registry, [], { today: '2026-10-03' }).systems[0]
  assert.equal(missing.status, 'unknown'); assert.equal(missing.last_verified_at, null)
  const partial = summarizeObservations(registry, run('2026-10-01', false), { today: '2026-10-03' }).systems[0]
  assert.equal(partial.status, 'unknown'); assert.equal(partial.last_partial_observation_on, '2026-10-01')
})

const articles = [{ ...registry[0], docs: ['docs/models/a.md', 'docs/models/b.md'] }]
const articleRun = (doc: string, date = '2026-10-01'): ObservationRun => ({ file: `research/freshness-observations/${doc.split('/').at(-1)}.json`, record: {
  completed_at: '2026-10-01T00:00:00Z',
  coverage: [{ system_id: 'models', scope: 'declared-article', status: 'verified', doc, verified_on: date, description: '公開仕様と提供条件', claims: ['記事に記載した提供条件'], sources: [{ url: 'https://example.com/spec', accessed_at: `${date}T00:00:00Z` }] }]
} })
test('all declared articles across runs are needed; one missing article never completes a system', () => {
  const first = summarizeObservations(articles, [articleRun(articles[0].docs[0])], { today: '2026-10-03' }).systems[0]
  assert.equal(first.status, 'unknown'); assert.deepEqual(first.article_progress, { verified: 1, total: 2 })
  const all = summarizeObservations(articles, articles[0].docs.map(doc => articleRun(doc)), { today: '2026-10-03' }).systems[0]
  assert.equal(all.status, 'current'); assert.deepEqual(all.article_progress, { verified: 2, total: 2 }); assert.equal(all.last_verified_at, '2026-10-01')
})
test('oldest article controls expiry, duplicates do not add progress and new articles cannot extend its cycle', () => {
  const runs = [articleRun(articles[0].docs[0]), articleRun(articles[0].docs[1], '2026-10-04'), articleRun(articles[0].docs[1], '2026-10-05')]
  const result = summarizeObservations(articles, runs, { today: '2026-10-09' }).systems[0]
  assert.equal(result.status, 'overdue'); assert.equal(result.last_verified_at, '2026-10-01'); assert.equal(result.next_due_on, '2026-10-08')
  assert.deepEqual(result.article_progress, { verified: 1, total: 2 })
})
test('invalid dates, future dates, outside docs, failed observations and claims without sources do not count', () => {
  const failed = articleRun(articles[0].docs[0]); failed.record.observations = [{ system_id: 'models', status: 'failed', affected_docs: [articles[0].docs[0]] }]
  const noSources = articleRun(articles[0].docs[1]); noSources.record.coverage![0].sources = []
  const cases = [articleRun('docs/models/outside.md'), articleRun(articles[0].docs[0], '2026-02-30'), articleRun(articles[0].docs[0], '2026-10-10'), failed, noSources]
  const result = summarizeObservations(articles, cases, { today: '2026-10-03' }).systems[0]
  assert.equal(result.status, 'unknown'); assert.deepEqual(result.article_progress, { verified: 0, total: 2 })
})
test('legacy system coverage remains independent of partial article progress', () => {
  const result = summarizeObservations(articles, [...run('2026-10-01', true), articleRun(articles[0].docs[0], '2026-10-02')], { today: '2026-10-03' }).systems[0]
  assert.equal(result.last_verified_at, '2026-10-01'); assert.equal(result.status, 'current'); assert.deepEqual(result.article_progress, { verified: 1, total: 2 })
})

test('model article aggregation retains the existing three-vendor completion requirement', () => {
  const models = [{ ...articles[0], id: 'models-prompting' }]
  const runs = models[0].docs.map(doc => { const run = articleRun(doc); run.record.coverage![0].system_id = 'models-prompting'; return run })
  assert.equal(summarizeObservations(models, runs, { today: '2026-10-03' }).systems[0].status, 'unknown')
  runs[0].record.vendor_checks = ['anthropic', 'openai', 'google'].map(vendor => ({ vendor, release_notes: 'unchanged', deprecations: 'unchanged', pricing: 'unchanged' }))
  assert.equal(summarizeObservations(models, runs, { today: '2026-10-03' }).systems[0].status, 'current')
})

test('a later partial cycle preserves the historical system completion date', () => {
  const runs = [articleRun(articles[0].docs[0]), articleRun(articles[0].docs[1], '2026-10-02'), articleRun(articles[0].docs[1], '2026-10-20')]
  const result = summarizeObservations(articles, runs, { today: '2026-10-20' }).systems[0]
  assert.equal(result.last_verified_at, '2026-10-01'); assert.equal(result.status, 'overdue')
  assert.deepEqual(result.article_progress, { verified: 1, total: 2 })
})
