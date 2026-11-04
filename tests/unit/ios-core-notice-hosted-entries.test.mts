import assert from 'node:assert/strict'
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test, { type TestContext } from 'node:test'

const helperRoot = new URL('../../ios/tests/notice-hosted-20261031/', import.meta.url)
const repository = new URL('../../', import.meta.url)

function fakeMain(argv: string[]) {
  appendFileSync(process.env.NOTICE_ENTRY_LOG!, JSON.stringify({ main: argv }) + '\n')
  if (process.env.NOTICE_ENTRY_FAIL === '1') throw new Error('intentional fake main failure')
}
function fakeCleanup() {
  appendFileSync(process.env.NOTICE_ENTRY_LOG!, 'installed\n')
  return () => { appendFileSync(process.env.NOTICE_ENTRY_LOG!, 'removed\n') }
}
function shadowDependency() { throw new Error('The copied schema must resolve the repository dependency') }

function entryFixture(t: TestContext, stage: 'producer' | 'verifier', argv: unknown) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'notice-ts-entry-'))
  t.after(() => {
    assert.equal(path.dirname(root), os.tmpdir())
    assert.ok(path.basename(root).startsWith('notice-ts-entry-'))
    rmSync(root, { recursive: true, force: true })
  })
  mkdirSync(path.join(root, 'installation'))
  const name = stage + '-entry'
  copyFileSync(new URL(name + '.mts', helperRoot), path.join(root, name + '.mts'))
  writeFileSync(path.join(root, name + '.mjs'), "import './" + name + ".mts';\n")
  writeFileSync(path.join(root, stage + '-argv.json'), JSON.stringify(argv))
  const module = stage === 'producer' ? 'core-performance-runner.mjs' : 'verify-core-performance-notice-20261031.mjs'
  // Only import/export glue is generated; executable fixture bodies are typed.
  writeFileSync(path.join(root, 'installation', module), "import {appendFileSync} from 'node:fs';\nexport const main=" + fakeMain.toString() + ';\n'
    + (stage === 'producer' ? 'export const installProcessCleanup=' + fakeCleanup.toString() + ';\n' : ''))
  const log = path.join(root, 'events.log')
  const run = (fail = false) => spawnSync(process.execPath, [path.join(root, name + '.mjs')], {
    cwd: root, env: { ...process.env, NOTICE_ENTRY_LOG: log, NOTICE_ENTRY_FAIL: fail ? '1' : '0' },
    encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024
  })
  return { run, events: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] }
}

test('the copied Notice schema retains repository-root dependency resolution', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'notice-schema-'))
  t.after(() => {
    assert.equal(path.dirname(root), os.tmpdir())
    assert.ok(path.basename(root).startsWith('notice-schema-'))
    rmSync(root, { recursive: true, force: true })
  })
  const copied = path.join(root, 'workflow-schema.mts')
  copyFileSync(new URL('workflow-schema.mts', helperRoot), copied)
  const shadow = path.join(root, 'node_modules/js-yaml')
  mkdirSync(shadow, { recursive: true })
  writeFileSync(path.join(shadow, 'package.json'), JSON.stringify({ type: 'module', exports: './index.mjs' }))
  writeFileSync(path.join(shadow, 'index.mjs'), '(' + shadowDependency.toString() + ')()')
  const result = spawnSync(process.execPath, [copied], {
    cwd: repository, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr)
  const receipt: unknown = JSON.parse(result.stdout)
  assert.ok(receipt !== null && typeof receipt === 'object' && 'state' in receipt && 'paths' in receipt)
  assert.equal(receipt.state, 'workflow-schema-accepted')
  assert.equal(receipt.paths, 6)
})

test('the producer forwards exact argv and removes cleanup on success and failure', t => {
  const argv = ['--run', '--repo', '/owned/git', '--revision', 'a'.repeat(40), '--target', 'arm64-apple-macosx14.0']
  for (const fail of [false, true]) {
    const fixture = entryFixture(t, 'producer', argv), result = fixture.run(fail)
    assert.equal(result.status, fail ? 1 : 0, result.stderr)
    assert.deepEqual(fixture.events(), ['installed', JSON.stringify({ main: argv }), 'removed'])
  }
})

test('the verifier forwards exact argv without producer cleanup', t => {
  const argv = ['--observation', '/owned/observation', '--corpus', '/owned/Content', '--revision', 'b'.repeat(40)]
  const fixture = entryFixture(t, 'verifier', argv), result = fixture.run()
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(fixture.events(), [JSON.stringify({ main: argv })])
})

for (const stage of ['producer', 'verifier'] as const) test(stage + ': malformed argv is refused before any implementation call', t => {
  for (const argv of [null, {}, ['--run', 42]]) {
    const fixture = entryFixture(t, stage, argv), result = fixture.run()
    assert.equal(result.status, 1)
    assert.deepEqual(fixture.events(), [])
  }
})
