import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { sharedSkills, syncHarness } from './sync-harness.mjs'

function fixture(t) {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-sync-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), base)
    assert.ok(path.basename(root).startsWith('ai-agent-library-sync-'))
    rmSync(root, { recursive: true, force: true })
  })
  writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS.md — rules\n\nCommon contract.\n')
  for (const skill of [...sharedSkills, 'freshness-maintenance']) {
    mkdirSync(path.join(root, '.agents/skills', skill), { recursive: true })
    writeFileSync(path.join(root, '.agents/skills', skill, 'SKILL.md'), `---\nname: ${skill}\ndescription: Valid description\n---\n\n# Work\n\nOriginal instruction.\n`)
  }
  return root
}

test('check reports missing outputs without writing; generation is deterministic and excludes Codex-only skill', t => {
  const root = fixture(t)
  assert.equal(syncHarness(root).mismatches.length, 5)
  assert.equal(syncHarness(root).mismatches.length, 5)
  assert.equal(syncHarness(root, { write: true }).written.length, 5)
  assert.deepEqual(syncHarness(root), { mismatches: [], unexpected: [], written: [] })
  assert.equal(syncHarness(root, { write: true }).written.length, 0)
  assert.throws(() => readFileSync(path.join(root, '.claude/skills/freshness-maintenance/SKILL.md')), { code: 'ENOENT' })
})

test('source changes and binary resources propagate without modifying canonical input', t => {
  const root = fixture(t)
  syncHarness(root, { write: true })
  const source = path.join(root, '.agents/skills/new-doc/SKILL.md')
  const updated = readFileSync(source, 'utf8').replace('Original instruction.', 'Updated instruction.')
  writeFileSync(source, updated)
  mkdirSync(path.join(root, '.agents/skills/new-doc/assets'))
  const bytes = Buffer.from([0, 255, 1, 128])
  writeFileSync(path.join(root, '.agents/skills/new-doc/assets/fixture.bin'), bytes)
  assert.deepEqual(syncHarness(root).mismatches.sort(), ['.claude/skills/new-doc/SKILL.md', '.claude/skills/new-doc/assets/fixture.bin'].sort())
  syncHarness(root, { write: true })
  assert.equal(readFileSync(source, 'utf8'), updated)
  assert.match(readFileSync(path.join(root, '.claude/skills/new-doc/SKILL.md'), 'utf8'), /Updated instruction\./)
  assert.deepEqual(readFileSync(path.join(root, '.claude/skills/new-doc/assets/fixture.bin')), bytes)
  assert.equal(syncHarness(root).mismatches.length, 0)
})

test('changed generated content is detected; harmless checkout line endings do not drift', t => {
  const root = fixture(t)
  syncHarness(root, { write: true })
  const target = path.join(root, 'CLAUDE.md')
  const original = readFileSync(target, 'utf8')
  writeFileSync(target, original.replaceAll('\n', '\r\n'))
  assert.equal(syncHarness(root).mismatches.length, 0)
  writeFileSync(target, original.replace('Common contract.', 'Different contract.'))
  assert.deepEqual(syncHarness(root).mismatches, ['CLAUDE.md'])
})

test('unexpected compatibility instructions prevent writes and are never deleted', t => {
  const root = fixture(t)
  syncHarness(root, { write: true })
  const target = path.join(root, 'CLAUDE.md')
  const original = readFileSync(target, 'utf8')
  writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS.md\n\nChanged contract.\n')
  mkdirSync(path.join(root, '.claude/skills/unknown'))
  const unexpected = path.join(root, '.claude/skills/unknown/SKILL.md')
  writeFileSync(unexpected, 'User owned instruction.\n')
  const result = syncHarness(root, { write: true })
  assert.deepEqual(result.unexpected, ['.claude/skills/unknown/SKILL.md'])
  assert.deepEqual(result.written, [])
  assert.equal(readFileSync(target, 'utf8'), original)
  assert.equal(readFileSync(unexpected, 'utf8'), 'User owned instruction.\n')
})

test('directory links are rejected before writing through a generated destination', t => {
  const root = fixture(t)
  const outside = path.join(root, 'not-a-generated-directory')
  mkdirSync(outside)
  mkdirSync(path.join(root, '.claude'))
  symlinkSync(outside, path.join(root, '.claude/skills'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => syncHarness(root, { write: true }), /symlink/)
  assert.throws(() => readFileSync(path.join(outside, 'new-doc/SKILL.md')), { code: 'ENOENT' })
})

test('a dangling output file link never creates its target', t => {
  const root = fixture(t)
  const target = path.join(root, 'user-owned-missing-file.md')
  try { symlinkSync(target, path.join(root, 'CLAUDE.md'), 'file') } catch (error) {
    if (error.code === 'EPERM') return t.skip('File symlink creation requires platform permission; Linux CI covers this case')
    throw error
  }
  assert.throws(() => syncHarness(root, { write: true }), /symlink/)
  assert.throws(() => readFileSync(target), { code: 'ENOENT' })
})

test('canonical instruction links are rejected before reading or copying their content', t => {
  const root = fixture(t)
  const source = path.join(root, 'AGENTS.md')
  const target = path.join(root, 'private-source.md')
  writeFileSync(target, 'Not an instruction source.\n')
  rmSync(source)
  try { symlinkSync(target, source, 'file') } catch (error) {
    if (error.code === 'EPERM') return t.skip('File symlink creation requires platform permission; Linux CI covers this case')
    throw error
  }
  assert.throws(() => syncHarness(root, { write: true }), /symlink/)
  assert.throws(() => readFileSync(path.join(root, 'CLAUDE.md')), { code: 'ENOENT' })
})
