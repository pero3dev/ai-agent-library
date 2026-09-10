import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { matchesPattern, parseRegistry, readRegistry, selectSystems } from './freshness-registry.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const now = '2026-09-10T07:23:00+09:00'
const row = (id, docs = '`docs/01-concepts/*.md`', research = '`research/core/*.md`', cadence = 42) =>
  `| \`${id}\` | 系統 ${id} | ${docs} | ${research} | ${cadence} |`
const table = (...rows) => [
  '<!-- freshness-registry:start -->',
  '',
  '| ID | 系統 | 記事対象 | 調査起点 | 周期(日) |',
  '| --- | --- | --- | --- | --- |',
  ...rows,
  '',
  '<!-- freshness-registry:end -->'
].join('\n')
const system = (id, cadenceDays = 42) => ({ id, title: id, docs: ['docs/example.md'], research: ['research/example.md'], cadenceDays })
const selectedIds = (...args) => selectSystems(...args).map(item => item.id)

function fixture(t, markdown = table(row('one')), extraFiles = []) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'freshness-registry-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  for (const file of ['docs/01-concepts/agent-loop.md', 'docs/01-concepts/README.md', 'research/core/agent-loop.md', ...extraFiles]) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
    writeFileSync(path.join(directory, file), '# Example\n')
  }
  writeFileSync(path.join(directory, 'ROADMAP.md'), markdown)
  return directory
}

test('the ROADMAP catalog covers every learning article and retains all sixteen systems', () => {
  const registry = readRegistry(root)
  assert.equal(registry.length, 16)
  assert.ok(new Set(registry.flatMap(item => item.docs)).size >= 199)
  assert.ok(registry.every(item => item.docs.length && item.research.length && item.cadenceDays > 0))
  assert.ok(registry.every(item => item.docs.every(file => !file.endsWith('/README.md'))))
  assert.ok(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8').includes('<!-- freshness-watchlist:start -->'))
})

test('pure parsing accepts CRLF, multiple patterns and literal code paths', () => {
  const parsed = parseRegistry(table(row('one', '`docs/01-concepts/*.md`; `docs/03-implementation/*prompt*.md`')).replaceAll('\n', '\r\n'))
  assert.deepEqual(parsed, [{ id: 'one', title: '系統 one', docPatterns: ['docs/01-concepts/*.md', 'docs/03-implementation/*prompt*.md'], researchPatterns: ['research/core/*.md'], cadenceDays: 42 }])
  assert.equal(matchesPattern('docs/03-implementation/openai-prompting.md', parsed[0].docPatterns[1]), true)
  assert.equal(matchesPattern('docs/03-implementation/nested/openai-prompting.md', parsed[0].docPatterns[1]), false)
  assert.equal(matchesPattern('docs/03-implementation/openai-promptingXmd', 'docs/03-implementation/openai-prompting.md'), false)
})

test('catalog rejects duplicate IDs, malformed structure and invalid cadence', () => {
  for (const markdown of [table(row('one'), row('one')), table(row('UpperCase')), table(row('one', undefined, undefined, 0)), table(row('one', undefined, undefined, 367)), `${table(row('one'))}\n<!-- freshness-registry:start -->`, table(row('one')).replace('記事対象', '変更された列')]) {
    assert.throws(() => parseRegistry(markdown), /Freshness registry/)
  }
})

test('catalog rejects traversal, absolute paths, recursive globs and cross-tree paths', () => {
  for (const target of ['`docs/../private.md`', '`C:/docs/private.md`', '`/docs/private.md`', '`docs/**/*.md`', '`research/core/*.md`', '`docs\\private.md`']) {
    assert.throws(() => parseRegistry(table(row('one', target))), /対象パス/)
  }
})

test('readRegistry resolves actual paths and excludes README without modifying sources', t => {
  const directory = fixture(t)
  assert.deepEqual(readRegistry(directory), [{ id: 'one', title: '系統 one', docs: ['docs/01-concepts/agent-loop.md'], research: ['research/core/agent-loop.md'], cadenceDays: 42 }])
})

test('missing target, case mismatch and unassigned articles fail closed', t => {
  const missing = fixture(t, table(row('one', '`docs/01-concepts/missing.md`')))
  assert.throws(() => readRegistry(missing), /実在する対象がありません/)
  const wrongCase = fixture(t, table(row('one', '`docs/01-concepts/Agent-loop.md`')))
  assert.throws(() => readRegistry(wrongCase), /実在する対象がありません/)
  const uncovered = fixture(t, table(row('one')), ['docs/02-architecture/new-topic.md'])
  assert.throws(() => readRegistry(uncovered), /系統に所属しない記事.*new-topic/)
})

test('overlapping memberships are allowed and concrete paths are deduplicated', t => {
  const directory = fixture(t, table(row('one', '`docs/01-concepts/*.md`; `docs/01-concepts/agent-loop.md`'), row('two')))
  assert.equal(readRegistry(directory)[0].docs.length, 1)
  assert.equal(readRegistry(directory)[1].docs.length, 1)
})

test('rotation uses verified observations, not file modification or attempted dates', () => {
  const registry = ['new', 'old', 'recent', 'failed'].map(id => system(id))
  const state = { systems: {
    old: { last_verified_at: '2026-07-01' },
    recent: { last_verified_at: '2026-09-09' },
    failed: { last_attempted_at: '2026-09-09', last_updated: '2026-09-09' }
  } }
  assert.deepEqual(selectedIds(registry, state, { now, mode: 'rotation' }), ['new', 'failed', 'old'])
})

test('weekly focus reserves the third slot for the nearest pending deadline', () => {
  const registry = ['old', 'models-prompting', 'coding-agents', 'urgent', 'later'].map(id => system(id))
  const state = { systems: { urgent: { last_verified_at: '2026-09-09' } }, pending: [
    { system_id: 'later', due_at: '2026-10-01' },
    { system_id: 'urgent', due_at: '2026-09-14' }
  ] }
  assert.deepEqual(selectedIds(registry, state, { mode: 'weekly_focus', now }), ['models-prompting', 'coding-agents', 'urgent'])
  assert.deepEqual(selectedIds(registry, state, { mode: 'rotation', now }), ['coding-agents', 'later', 'models-prompting'])
})

test('six weekly focus and rotation pairs cover the full catalog despite repeated urgent work', () => {
  const registry = readRegistry(root)
  const state = { systems: {}, pending: [{ system_id: 'compliance', due_at: '2026-09-01' }] }
  const covered = new Set()
  for (let week = 0; week < 6; week++) {
    for (const [mode, day] of [['weekly_focus', 0], ['rotation', 3]]) {
      const date = new Date(Date.UTC(2026, 8, 14 + 7 * week + day))
      for (const entry of selectSystems(registry, state, { mode, now: date })) {
        covered.add(entry.id)
        state.systems[entry.id] = { last_attempted_at: date.toISOString(), last_verified_at: date.toISOString() }
      }
    }
  }
  assert.equal(covered.size, 16)
})

test('retry time respects timezone and its exact boundary; manual can explicitly retry', () => {
  const registry = [system('one'), system('two')]
  const state = { systems: { one: { next_retry_at: '2026-09-10T07:24:00+09:00' } } }
  assert.deepEqual(selectedIds(registry, state, { now }), ['two'])
  assert.deepEqual(selectedIds(registry, state, { now: '2026-09-09T22:24:00Z' }), ['one', 'two'])
  assert.deepEqual(selectedIds(registry, state, { now, mode: 'manual', ids: ['one'] }), ['one'])
})

test('closed or deferred pending items do not occupy the weekly spare slot', () => {
  const registry = ['models-prompting', 'coding-agents', 'old', 'recent'].map(id => system(id))
  const state = { systems: { recent: { last_verified_at: '2026-09-09' } }, pending: [
    { system_id: 'recent', status: 'resolved', due_at: '2026-09-01' },
    { system_id: 'recent', next_retry_at: '2026-09-11' }
  ] }
  assert.deepEqual(selectedIds(registry, state, { mode: 'weekly_focus', now }), ['models-prompting', 'coding-agents', 'old'])
})

test('unknown identifiers, invalid dates and invalid bounds fail instead of selecting arbitrary work', () => {
  const registry = [system('one')]
  for (const options of [{ limit: 0 }, { limit: 4 }, { mode: 'typo' }, { now: '2026-02-30' }, { now: '2026-09-10T24:00:00Z' }, { now: '2026-09-10T07:23:00' }, { mode: 'manual', ids: ['missing'] }, { mode: 'manual', ids: ['one', 'one'] }]) {
    assert.throws(() => selectSystems(registry, {}, { now, ...options }), /Freshness registry/)
  }
  for (const state of [{ systems: { missing: {} } }, { systems: { one: { last_verified_at: '2027-01-01' } } }, { systems: { one: { next_retry_at: 'not-a-date' } } }, { pending: 'one' }]) {
    assert.throws(() => selectSystems(registry, state, { now }), /Freshness registry/)
  }
})

test('selection does not mutate state or catalog and is deterministic for ties', () => {
  const registry = [system('two'), system('one')]
  const state = { systems: {}, pending: [] }
  const before = JSON.stringify({ registry, state })
  assert.deepEqual(selectedIds(registry, state, { now }), ['one', 'two'])
  assert.equal(JSON.stringify({ registry, state }), before)
})

test('cadence arrival is required and its exact boundary is eligible', () => {
  const registry = [system('one', 7)]
  const state = { systems: { one: { last_verified_at: '2026-09-03T00:00:00Z' } } }
  assert.deepEqual(selectedIds(registry, state, { now: '2026-09-09T23:59:59Z' }), [])
  assert.deepEqual(selectedIds(registry, state, { now: '2026-09-10T00:00:00Z' }), ['one'])
})

test('automatic selection skips repeat observations on the same JST day and occupied systems before limiting', () => {
  const registry = ['one', 'two', 'three', 'four'].map(id => system(id, 7))
  const state = { systems: { one: { last_attempted_at: '2026-09-09T15:00:00Z' } }, pending: [{ system_id: 'one' }] }
  assert.deepEqual(selectedIds(registry, state, { now: '2026-09-10T01:00:00Z', excludeIds: ['two', 'three'] }), ['four'])
  assert.deepEqual(selectedIds(registry, state, { now: '2026-09-10T01:00:00Z', mode: 'manual', ids: ['one'] }), ['one'])
})
