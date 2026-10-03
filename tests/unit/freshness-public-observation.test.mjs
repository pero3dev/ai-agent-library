import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { publicObservation, writePublicObservation } from '../../scripts/freshness-public-observation.mjs'
const fixture = () => ({ run_id: 'test-observation', started_at: '2026-10-03T00:00:00Z', finished_at: '2026-10-03T01:00:00Z', systems: ['models-prompting'], public_observations: [{ system_id: 'models-prompting', status: 'unchanged', summary: '公開資料のモデル一覧を確認。その他の主張は未確認。', affected_docs: ['docs/03-implementation/llm-landscape.md'], sources: [{ url: 'https://example.com/models', accessed_at: '2026-10-03T00:20:00Z' }] }], auth: 'never-export', notes: ['local-secret'], pending: [{ reason: 'private' }] })
test('public observations export an allowlist and preserve partial coverage', () => {
  const result = publicObservation(fixture())
  assert.deepEqual(result.coverage, [])
  assert.equal(result.observations.length, 1)
  assert.doesNotMatch(JSON.stringify(result), /never-export|local-secret|private/)
})
test('failed observations cannot be exported as system completion', () => {
  const value = fixture(); value.public_observations[0].status = 'unverifiable'; value.public_coverage = [{ system_id: 'models-prompting', scope: 'declared-system', status: 'verified', verified_on: '2026-10-03', description: '範囲内確認を完了' }]
  assert.throws(() => publicObservation(value), /未完了/)
})

test('public exports are append-only and reject linked output directories', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'freshness-export-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const value = publicObservation(fixture())
  const file = writePublicObservation(root, value)
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, file), 'utf8')), value)
  assert.throws(() => writePublicObservation(root, value), /上書き/)
  assert.throws(() => writePublicObservation(root, { run_id: '../outside' }), /run_id/)
  const target = path.join(root, 'outside'), linked = path.join(root, 'linked')
  mkdirSync(target); mkdirSync(linked)
  symlinkSync(target, path.join(linked, 'research'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => writePublicObservation(linked, value), /symlink/)
})

test('vendor completion requires public sources retrieved within the actual observation interval', () => {
  const checkpoint = fixture()
  checkpoint.completed_systems = ['models-prompting']; checkpoint.pending = []
  checkpoint.public_coverage = [{ system_id: 'models-prompting', scope: 'declared-system', status: 'verified', verified_on: '2026-10-03', description: '対象確認を完了しました。' }]
  checkpoint.vendor_checks = ['anthropic', 'openai', 'google'].map(vendor => ({ vendor, release_notes: 'unchanged', deprecations: 'unchanged', pricing: 'unchanged', summary: '宣言範囲の確認を完了しました。', sources: [] }))
  assert.throws(() => publicObservation(checkpoint), /vendor.*根拠/)
  for (const row of checkpoint.vendor_checks) row.sources = [{ url: 'https://example.com/official', accessed_at: '2026-10-03T00:20:00Z' }]
  assert.equal(publicObservation(checkpoint).coverage.length, 1)
  for (const source of [{ url: 'https://example.com/official', accessed_at: '2026-10-02T23:00:00Z' }, { url: 'https://172.16.0.1/official', accessed_at: '2026-10-03T00:20:00Z' }, { url: 'https://user:password@example.com/official', accessed_at: '2026-10-03T00:20:00Z' }]) {
    checkpoint.vendor_checks[0].sources = [source]
    assert.throws(() => publicObservation(checkpoint), /観測区間|公開一次/)
  }
})

test('a listed system cannot imply coverage without a real observation', () => {
  const checkpoint = fixture(); checkpoint.systems.push('coding-agents')
  assert.throws(() => publicObservation(checkpoint), /実観測/)
})
