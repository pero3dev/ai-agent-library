import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { AuthorshipError, readScriptAuthorship, recordScriptAuthorship, seedScriptAuthorship } from '../../scripts/audio/authorship.mjs'

const digest = script => createHash('sha256').update(JSON.stringify(script)).digest('hex')
function fixture(t) {
  const jobDir = mkdtempSync(path.join(os.tmpdir(), 'audio-authorship-'))
  t.after(() => rmSync(jobDir, { recursive: true, force: true }))
  const script = { chapters: [{ title: '記憶と状態', turns: ['原稿です。'] }] }
  const binding = { article_path: 'docs/01-concepts/memory-and-state.md', source_digest: 'a'.repeat(64), script_sha256: digest(script) }
  writeFileSync(path.join(jobDir, 'script.json'), JSON.stringify(script, null, 2))
  return { jobDir, script, binding }
}

test('authorless legacy scripts are Claude, but a job with history never infers missing authors', t => {
  const { jobDir, binding } = fixture(t)
  assert.equal(readScriptAuthorship(jobDir, { ...binding, script_sha256: null }), null)
  assert.deepEqual(readScriptAuthorship(jobDir, binding).agents, ['claude'])
  assert.equal(readScriptAuthorship(jobDir, binding).legacy, true)
  recordScriptAuthorship(jobDir, { ...binding, script_sha256: 'b'.repeat(64), agents: ['codex'] })
  assert.throws(() => readScriptAuthorship(jobDir, binding), /current script record is missing/)
  assert.throws(() => readScriptAuthorship(jobDir, { ...binding, script_sha256: null }), /current script is unavailable/)
})

test('hash records are immutable, canonical, source-bound and idempotent', t => {
  const { jobDir, binding } = fixture(t)
  const first = recordScriptAuthorship(jobDir, { ...binding, agents: ['claude', 'codex'] })
  assert.deepEqual(first.agents, ['codex', 'claude'])
  assert.deepEqual(recordScriptAuthorship(jobDir, { ...binding, agents: ['codex', 'claude'] }), first)
  assert.throws(() => recordScriptAuthorship(jobDir, { ...binding, agents: ['claude'] }), /different writers/)
  assert.throws(() => readScriptAuthorship(jobDir, { ...binding, source_digest: 'c'.repeat(64) }), /binding mismatch/)
  assert.throws(() => readScriptAuthorship(jobDir, { ...binding, article_path: 'docs/01-concepts/other.md' }), /binding mismatch/)
  const orphan = { ...binding, script_sha256: 'd'.repeat(64), agents: ['claude'] }
  recordScriptAuthorship(jobDir, orphan)
  assert.deepEqual(readScriptAuthorship(jobDir, binding), first)
})

test('invalid, torn and unrecognized author records fail closed', t => {
  const { jobDir, binding } = fixture(t)
  for (const agents of [[], ['human'], ['codex', 'codex']]) assert.throws(() => recordScriptAuthorship(jobDir, { ...binding, agents }), AuthorshipError)
  recordScriptAuthorship(jobDir, { ...binding, agents: ['codex'] })
  const file = path.join(jobDir, 'authorship', `${binding.script_sha256}.json`)
  const valid = JSON.parse(readFileSync(file, 'utf8'))
  for (const invalid of ['{', JSON.stringify({ ...valid, agents: ['human'] }), JSON.stringify({ ...valid, script_sha256: 'b'.repeat(64) }), JSON.stringify({ ...valid, source_digest: 'b'.repeat(64) }), JSON.stringify({ ...valid, schema_version: 2 })]) {
    writeFileSync(file, invalid)
    assert.throws(() => readScriptAuthorship(jobDir, binding), AuthorshipError)
  }
  rmSync(file)
  assert.throws(() => readScriptAuthorship(jobDir, binding), /history is empty/)
  assert.throws(() => readScriptAuthorship(jobDir, { ...binding, script_sha256: null }), /history is empty/)
})

test('operator seed reads canonical current script, pins the expected hash and cannot overwrite authors', t => {
  const { jobDir, binding } = fixture(t)
  const input = { ...binding, expected_script_sha256: binding.script_sha256, agents: ['codex'] }
  assert.throws(() => seedScriptAuthorship(jobDir, { ...input, expected_script_sha256: 'b'.repeat(64) }), /expected hash/)
  assert.deepEqual(seedScriptAuthorship(jobDir, input).agents, ['codex'])
  assert.equal(seedScriptAuthorship(jobDir, input).legacy, false)
  assert.throws(() => seedScriptAuthorship(jobDir, { ...input, agents: ['claude'] }), /different writers/)
  writeFileSync(path.join(jobDir, 'script.json'), JSON.stringify({ changed: true }))
  assert.throws(() => seedScriptAuthorship(jobDir, input), /expected hash/)
})

test('authorship history cannot redirect reads or writes through a directory link', t => {
  const { jobDir, binding } = fixture(t)
  const target = path.join(jobDir, 'elsewhere')
  mkdirSync(target)
  symlinkSync(target, path.join(jobDir, 'authorship'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => readScriptAuthorship(jobDir, binding), /regular directory/)
  assert.throws(() => recordScriptAuthorship(jobDir, { ...binding, agents: ['codex'] }), /regular directory/)
  rmSync(target, { recursive: true })
  assert.throws(() => readScriptAuthorship(jobDir, binding), /regular directory/)
})

test('an unreadable history remains an article-level authorship error', t => {
  const { jobDir, binding } = fixture(t)
  recordScriptAuthorship(jobDir, { ...binding, agents: ['codex'] })
  const original = fs.readdirSync
  fs.readdirSync = () => { throw Object.assign(new Error('simulated access denied'), { code: 'EACCES' }) }
  syncBuiltinESMExports()
  try { assert.throws(() => readScriptAuthorship(jobDir, binding), error => error instanceof AuthorshipError && /access denied/.test(error.message)) }
  finally { fs.readdirSync = original; syncBuiltinESMExports() }
})
