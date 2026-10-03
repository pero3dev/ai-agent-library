import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkPublicRecords, profileOccurrences, redactProfilePaths, sha256 } from '../../scripts/lib/public-records.mjs'

test('profile redaction covers Windows, JSON escapes, macOS and Linux without exposing names', () => {
  for (const home of [['C:', 'Users', 'fixture'].join('\\'), ['C:', 'Users', 'fixture'].join('\\\\'), ['', 'Users', 'fixture'].join('/'), ['', 'home', 'fixture'].join('/')]) {
    const text = `${home}/repo/file.json`
    assert.equal(profileOccurrences(text), 1)
    assert.match(redactProfilePaths(text), /^<user-home>\/repo\/file.json$/)
    assert.equal(profileOccurrences(redactProfilePaths(text)), 0)
  }
  assert.equal(profileOccurrences('https://example.com/home/guide'), 0)
  assert.equal(profileOccurrences("import('./home/route-explorer')"), 0)
  assert.equal(profileOccurrences('../home/fixture'), 0)
  for (const home of [['C:', 'Users', 'fixture'].join('\\'), ['', 'home', 'fixture'].join('/')]) {
    assert.equal(redactProfilePaths(`| error \`${home}\` |`), '| error `<user-home>` |')
    assert.equal(redactProfilePaths(`"${home}"`), '"<user-home>"')
  }
})

test('public record inspection rejects an intermediate directory link before reading its target', t => {
  const base = path.resolve(os.tmpdir())
  const fixture = mkdtempSync(path.join(base, 'ai-agent-library-public-records-link-'))
  t.after(() => { assert.equal(path.dirname(fixture), base); rmSync(fixture, { recursive: true, force: true }) })
  const root = path.join(fixture, 'repository'), external = path.join(fixture, 'outside')
  mkdirSync(path.join(root, 'project'), { recursive: true })
  mkdirSync(external)
  // The requested target does not exist: rejection must be on the link, not a target read failure.
  symlinkSync(external, path.join(root, 'project/records'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => checkPublicRecords(root, ['project/records/unreadable.json'], { public_records: { max_bytes: 64, extensions: ['.json'], legacy: {} } }), /リンクは検査できません/)
})

test('records limits and privacy exceptions freeze exact bytes and reject additions or changes', t => {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-public-records-'))
  t.after(() => { assert.equal(path.dirname(root), base); rmSync(root, { recursive: true, force: true }) })
  mkdirSync(path.join(root, 'project/records'), { recursive: true })
  const write = (file, bytes) => writeFileSync(path.join(root, file), bytes)
  const contract = { public_records: { max_bytes: 64, extensions: ['.md', '.json'], legacy: {} } }
  assert.throws(() => checkPublicRecords(root, ['../outside.json'], contract), /正規相対パス/)
  for (const [file, bytes] of [['project/records/new.png', Buffer.from([0, 1])], ['project/records/new.zip', Buffer.from([0, 2])], ['project/records/large.json', 'x'.repeat(65)]]) {
    write(file, bytes)
    assert.equal(checkPublicRecords(root, [file], contract).length, 1)
    contract.public_records.legacy[file] = { sha256: sha256(bytes), reason: 'Existing evidence retained at the approved baseline' }
    assert.deepEqual(checkPublicRecords(root, [file], contract), [])
    write(file, Buffer.from([0, 3]))
    if (!file.endsWith('.json')) assert.equal(checkPublicRecords(root, [file], contract).length, 1)
  }
  const file = 'project/records/fixed.json'
  const text = ['', 'home', 'fixture', 'repo'].join('/')
  write(file, text)
  assert.equal(checkPublicRecords(root, [file], contract).length, 1)
  contract.public_records.legacy[file] = { sha256: sha256(text), reason: 'Digest-linked original; separate sanitized summary', privacy_exception: true }
  assert.deepEqual(checkPublicRecords(root, [file], contract), [])
  write(file, `${text} changed`)
  assert.equal(checkPublicRecords(root, [file], contract).length, 2)
})
