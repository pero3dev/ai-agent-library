import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeObservations } from '../../scripts/freshness-observation-report.mjs'
const registry = [{ id: 'models', title: 'Models', cadenceDays: 7, docPatterns: ['docs/models/*.md'] }]
const run = (date, scope) => [{ file: 'research/freshness-runs/test.json', record: { completed_at: `${date}T00:00:00Z`, observations: [{ system_id: 'models', status: 'unchanged', affected_docs: ['docs/models/a.md'] }], ...(scope ? { coverage: [{ system_id: 'models', scope: 'declared-system', status: 'verified', verified_on: date, description: 'vendor releases and declared target claims' }] } : {}) } }]
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
