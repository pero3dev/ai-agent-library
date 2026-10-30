import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { FAILURE_INVENTORY, shouldCaptureUnitFailure, createInventoryDirectory, collectUnitFailureInventory } from '../../ios/tests/capture-simulator-unit-failure.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fixtureLimits = { ...FAILURE_INVENTORY, commandMs: 2000, sharedMs: 10000 }
function fixture(t, scripts = []) {
  const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'full-unit-inventory-')))
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }))
  const evidence = path.join(workspace, '.local/ios-published-candidate/evidence')
  fs.mkdirSync(evidence, { recursive: true }); fs.writeFileSync(path.join(evidence, 'environment.log'), 'Xcode 16.4\nBuild version fixture\n')
  const directory = path.join(workspace, FAILURE_INVENTORY.relativeDirectory), calls = []
  const spawnProcess = (binary, args, options) => {
    assert.equal(binary, 'xcrun')
    assert.deepEqual(args, calls.length === 0 ? ['simctl', 'list', 'runtimes', '--json'] : ['simctl', 'list', 'devices', '--json'])
    const index = calls.length; calls.push({ binary, args, options })
    const code = scripts[index] ?? `process.stdout.write(${JSON.stringify(index === 0 ? '{"runtimes":[]}' : '{"devices":{} }')})`
    return typeof code === 'function' ? code(options, index) : spawn(process.execPath, ['-e', code], options)
  }
  const options = { workspace, unitOutcome: 'failure', jobStatus: 'failure', spawnProcess, limits: fixtureLimits,
    context: { run: 'fixture', expected_source_head: 'a'.repeat(40) }, environment: { PATH: process.env.PATH,
      DEVELOPER_DIR: '/Applications/Xcode_16.4.app/Contents/Developer', GITHUB_TOKEN: 'never-pass', AWS_SECRET_ACCESS_KEY: 'never-pass' } }
  return { workspace, evidence, directory, calls, options,
    json: name => JSON.parse(fs.readFileSync(path.join(directory, name))),
    bytes: name => fs.readFileSync(path.join(directory, name)) }
}

test('production limits are fixed and success, skipped or cancelled jobs create no output or probes', async () => {
  assert.equal(FAILURE_INVENTORY.commandMs, 30000); assert.equal(FAILURE_INVENTORY.sharedMs, 75000)
  assert.equal(FAILURE_INVENTORY.outputBytes, 1024 * 1024)
  for (const [unitOutcome, jobStatus] of [['success', 'success'], ['skipped', 'failure'], ['failure', 'cancelled'], ['failure', 'success'], [undefined, undefined]]) {
    assert.equal(shouldCaptureUnitFailure(unitOutcome, jobStatus), false)
    const result = await collectUnitFailureInventory({ unitOutcome, jobStatus,
      spawnProcess() { assert.fail('Skipped collection must not spawn') } })
    assert.equal(result.status, 'skipped'); assert.deepEqual(result.probes, [])
  }
  assert.equal(shouldCaptureUnitFailure('failure', 'failure'), true)
})

test('failure captures exactly two read-only snapshots with bounded source/toolchain context and no secret env', async t => {
  const h = fixture(t), result = await collectUnitFailureInventory(h.options)
  assert.equal(result.status, 'captured'); assert.equal(result.unit_outcome, 'failure'); assert.equal(h.calls.length, 2)
  assert.equal(result.diagnostic_only_no_unit_result_rewrite, true)
  for (const [i, name] of ['runtimes', 'devices'].entries()) {
    const r = h.json(name + '.exit.json'), bytes = h.bytes(name + '.stdout.bin')
    assert.equal(r.code, 0); assert.equal(r.signal, null); assert.equal(r.stop, null); assert.equal(r.error, null)
    assert.equal(r.captured_output_complete, true); assert.equal(r.json.expected_top_level_shape, true)
    assert.equal(r.raw_stdout_SHA256, sha(bytes)); assert.equal(r.captured_stdout_SHA256, sha(bytes))
    assert.equal(r.raw_stderr_SHA256, sha(Buffer.alloc(0))); assert.equal(r.uncaptured_stream_bytes, 0)
    assert.equal(r.post_unit_failure, true); assert.equal(r.name, name); assert.ok(r.started_at.endsWith('Z'))
    assert.equal(h.calls[i].options.env.GITHUB_TOKEN, undefined); assert.equal(h.calls[i].options.env.AWS_SECRET_ACCESS_KEY, undefined)
  }
  const context = h.json('context.json'), original = fs.readFileSync(path.join(h.evidence, 'environment.log'))
  assert.equal(context.toolchain.SHA256, sha(original)); assert.equal(context.toolchain.bytes, original.length)
  assert.equal(context.workspace, undefined); assert.equal(h.json('runtimes.intent.json').workspace, undefined)
})

test('a nonzero diagnostic command stays distinct from valid output and does not prevent the second read', async t => {
  const h = fixture(t, ['process.stdout.write("partial evidence"); process.stderr.write("fixture warning"); process.exitCode=23'])
  const result = await collectUnitFailureInventory(h.options), first = result.probes[0]
  assert.equal(result.status, 'diagnostic-incomplete'); assert.equal(result.unit_outcome, 'failure'); assert.equal(h.calls.length, 2)
  assert.equal(first.code, 23); assert.equal(first.stop, null); assert.equal(first.captured_output_complete, true)
  assert.equal(first.json.status, 'not-attempted-incomplete-command'); assert.equal(h.bytes('runtimes.stdout.bin').toString(), 'partial evidence')
  assert.equal(h.bytes('runtimes.stderr.bin').toString(), 'fixture warning'); assert.equal(result.probes[1].code, 0)
})

test('invalid JSON or unknown top-level shape is retained without pretending the command itself failed', async t => {
  for (const payload of [Buffer.from('{broken'), Buffer.from('null'), Buffer.from('{"runtimes":{}}'), Buffer.from('7b2272756e74696d6573223a5b22ff225d7d', 'hex')]) {
    const h = fixture(t, [`process.stdout.write(Buffer.from('${payload.toString('base64')}','base64'))`]), result = await collectUnitFailureInventory(h.options)
    assert.equal(result.status, 'diagnostic-incomplete'); assert.equal(result.probes[0].code, 0)
    assert.equal(result.probes[0].json.expected_top_level_shape, false); assert.deepEqual(h.bytes('runtimes.stdout.bin'), payload)
    assert.equal(h.calls.length, 2)
  }
})

test('unknown stderr, invalid UTF8 and unterminated binary bytes are preserved with independent hashes', async t => {
  const unknown = Buffer.from([0xff, 0xfe, 0xc3, 0x28, 0, 65, 13]), text = Buffer.from('警告: authentication required\n')
  const stderr = Buffer.concat([unknown, text])
  const code = `process.stdout.write('{"runtimes":[]}');process.stderr.write(Buffer.from('${stderr.toString('base64')}','base64'))`
  const h = fixture(t, [code]), result = await collectUnitFailureInventory(h.options), r = result.probes[0]
  assert.equal(result.status, 'captured'); assert.deepEqual(h.bytes('runtimes.stderr.bin'), stderr)
  assert.equal(r.raw_stderr_SHA256, sha(stderr)); assert.equal(r.captured_stderr_SHA256, sha(stderr)); assert.equal(r.raw_stderr_bytes, stderr.length)
  assert.ok(Buffer.byteLength(r.stderr_tail) <= FAILURE_INVENTORY.tailBytes * 3)
})

test('per-probe combined1MiB cap kills the fixture while preserving all in-budget binary stdout and stderr', async t => {
  const h = fixture(t, ['process.stdout.write(Buffer.alloc(100,65));process.stderr.write(Buffer.alloc(1048576,66));setInterval(()=>{},1000)'])
  const result = await collectUnitFailureInventory(h.options), r = result.probes[0]
  assert.equal(r.stop, 'output-cap'); assert.equal(r.signal, 'SIGKILL'); assert.equal(r.captured_output_complete, false)
  assert.ok(r.observed_stream_bytes > FAILURE_INVENTORY.outputBytes)
  assert.equal(r.captured_stdout_bytes + r.captured_stderr_bytes, FAILURE_INVENTORY.outputBytes)
  assert.equal(r.raw_stdout_SHA256, sha(Buffer.alloc(r.raw_stdout_bytes, 65))); assert.equal(r.raw_stderr_SHA256, sha(Buffer.alloc(r.raw_stderr_bytes, 66)))
  assert.equal(r.captured_stdout_SHA256, sha(h.bytes('runtimes.stdout.bin'))); assert.equal(r.captured_stderr_SHA256, sha(h.bytes('runtimes.stderr.bin')))
  assert.equal(r.uncaptured_stream_bytes, r.observed_stream_bytes - FAILURE_INVENTORY.outputBytes)
  assert.equal(h.calls.length, 2); assert.equal(result.unit_outcome, 'failure')
})

test('command timeout is distinct from command exit and its child closes before later diagnostics', async t => {
  const children = [], closed = new Set(), events = []
  let firstClose
  t.after(async () => {
    for (const child of children) {
      if (!child.pid || closed.has(child)) continue
      let timer
      const closing = new Promise((resolve, reject) => {
        child.once('close', resolve)
        timer = setTimeout(() => reject(new Error('Owned timeout fixture did not close after cleanup')), 1000)
      })
      try {
        try { if (process.platform === 'win32') child.kill('SIGKILL'); else process.kill(-child.pid, 'SIGKILL') }
        catch { child.kill('SIGKILL') }
        await closing
      } finally { clearTimeout(timer) }
    }
  })
  const start = (options, code, label) => {
    const child = spawn(process.execPath, ['-e', code], options); children.push(child)
    child.once('close', (code, signal) => {
      closed.add(child); events.push(label + '-close')
      if (label === 'first') firstClose = { code, signal }
    })
    return child
  }
  const h = fixture(t, [options => start(options, 'setInterval(()=>{},1000)', 'first'), options => {
    assert.deepEqual(events, ['first-close'], 'The timed-out child must close before the second spawn')
    events.push('second-spawn')
    return start(options, 'process.stdout.write(JSON.stringify({ devices: {} }))', 'second')
  }]), limits = { ...fixtureLimits, commandMs: 30 }
  // Keep the real30ms timer; fixture receipt/path I/O must not consume its injected command clock.
  const result = await collectUnitFailureInventory({ ...h.options, now: () => 0, limits }), r = result.probes[0]
  assert.equal(r.stop, 'command-timeout'); assert.equal(r.code, null); assert.equal(r.signal, 'SIGKILL')
  assert.equal(r.timeout_scope, 'command'); assert.equal(r.timeout_ms, 30); assert.equal(r.captured_output_complete, false)
  assert.equal(h.calls.length, 2); assert.equal(result.status, 'diagnostic-incomplete')
  assert.equal(children.length, 2); assert.ok(children.every(child => Number.isInteger(child.pid) && child.pid > 0))
  assert.deepEqual(firstClose, { code: null, signal: 'SIGKILL' })
  assert.deepEqual(events, ['first-close', 'second-spawn', 'second-close'])
  assert.equal(closed.size, 2); assert.equal(result.probes[1].process_created, true)
  assert.equal(h.json('devices.intent.json').timeout_ms, 30); assert.equal(h.json('devices.intent.json').timeout_scope, 'command')
})

test('shared deadline clips a probe timeout and never grants an extra full command budget', async t => {
  const h = fixture(t, ['setInterval(()=>{},1000)', 'setInterval(()=>{},1000)'])
  const result = await collectUnitFailureInventory({ ...h.options, limits: { ...fixtureLimits, commandMs: 500, sharedMs: 25 } })
  assert.ok(result.probes.length >= 1 && result.probes.length <= 2)
  assert.equal(result.probes[0].stop, 'shared-deadline'); assert.equal(result.probes[0].timeout_scope, 'shared')
  assert.ok(result.probes.every(r => r.timeout_ms <= 25)); assert.equal(result.status, 'diagnostic-incomplete')
})

test('an exhausted shared budget after the first fixture prevents the second spawn', async t => {
  let offset = 0
  const h = fixture(t, [options => { const child = spawn(process.execPath, ['-e', 'process.stdout.write("{\\"runtimes\\":[]}")'], options)
    child.on('close', () => { offset += 20000 }); return child }])
  const result = await collectUnitFailureInventory({ ...h.options, now: () => performance.now() + offset })
  assert.equal(h.calls.length, 1); assert.equal(result.shared_deadline_reached, true); assert.deepEqual(result.not_started, ['devices'])
  assert.equal(result.status, 'diagnostic-incomplete'); assert.equal(fs.existsSync(path.join(h.directory, 'devices.intent.json')), false)
})

test('normal cancellation stops the owned fixture, retains its partial bytes and blocks another command', async t => {
  const signals = new EventEmitter(), h = fixture(t, [options => {
    const child = spawn(process.execPath, ['-e', 'process.stdout.write("partial");setInterval(()=>{},1000)'], options)
    child.stdout.once('data', () => signals.emit('SIGTERM')); return child }])
  const result = await collectUnitFailureInventory({ ...h.options, signals })
  assert.equal(result.status, 'cancelled'); assert.equal(result.cancelled_signal, 'SIGTERM'); assert.equal(h.calls.length, 1)
  assert.equal(result.probes[0].stop, 'cancelled-SIGTERM'); assert.equal(result.probes[0].signal, 'SIGKILL')
  assert.equal(h.bytes('runtimes.stdout.bin').toString(), 'partial'); assert.deepEqual(result.not_started, ['devices'])
  assert.equal(signals.listenerCount('SIGTERM'), 0); assert.equal(signals.listenerCount('SIGINT'), 0)
})

test('synchronous or asynchronous spawn errors are receipts, not invented exit codes or successful snapshots', async t => {
  for (const factory of [() => { throw new Error('fixture spawn failed') }, options => spawn('/nonexistent-full-fixture-binary', [], options)]) {
    const h = fixture(t, [factory]), result = await collectUnitFailureInventory(h.options)
    assert.ok(result.probes[0].error); assert.equal(result.probes[0].captured_output_complete, false)
    assert.equal(result.probes[0].json.status, 'not-attempted-incomplete-command'); assert.equal(h.calls.length, 2)
    assert.equal(result.status, 'diagnostic-incomplete'); assert.equal(result.unit_outcome, 'failure')
  }
})

test('unsafe, pre-existing or noncanonical output paths fail closed without overwriting existing data', async t => {
  const h = fixture(t)
  for (const outputDirectory of [path.join(h.workspace, 'outside-owned-location'), h.directory + '/../unit-failure-inventory']) {
    await assert.rejects(() => collectUnitFailureInventory({ ...h.options, outputDirectory })); assert.equal(h.calls.length, 0)
  }
  fs.mkdirSync(h.directory); fs.writeFileSync(path.join(h.directory, 'keep'), 'unchanged')
  await assert.rejects(() => collectUnitFailureInventory(h.options)); assert.equal(h.calls.length, 0)
  assert.equal(fs.readFileSync(path.join(h.directory, 'keep'), 'utf8'), 'unchanged')
})

test('parent and dangling-leaf symlinks are rejected before any subprocess or outside write', { skip: process.platform === 'win32' }, async t => {
  const first = fixture(t), local = path.join(first.workspace, '.local')
  fs.rmSync(local, { recursive: true }); fs.symlinkSync(os.tmpdir(), local, 'dir')
  await assert.rejects(() => collectUnitFailureInventory(first.options)); assert.equal(first.calls.length, 0)
  const second = fixture(t); fs.symlinkSync(path.join(second.workspace, 'missing'), second.directory, 'dir')
  await assert.rejects(() => collectUnitFailureInventory(second.options)); assert.equal(second.calls.length, 0)
})

test('owned evidence filenames reject traversal and existing files remain byte-identical', t => {
  const h = fixture(t), output = createInventoryDirectory(h.workspace)
  output.put('one.json', { exact: 'first' }); const before = h.bytes('one.json')
  assert.throws(() => output.put('one.json', { exact: 'second' })); assert.deepEqual(h.bytes('one.json'), before)
  for (const name of ['../escape', '/absolute', 'dir/escape', 'dir\\escape']) assert.throws(() => output.put(name, Buffer.from('no')))
})

test('original pipefail unit and tee failures stay nonzero while a healthy pipeline performs no diagnostic', { skip: process.platform === 'win32' }, async t => {
  for (const [code, teeFailure] of [[0, false], [70, false], [0, true]]) {
    const h = fixture(t), target = path.join(h.workspace, teeFailure ? 'missing/unit.log' : 'unit.log')
    const unit = spawnSync('/bin/bash', ['-c', 'set -euo pipefail; "$UNIT_NODE" -e "$UNIT_FIXTURE" 2>&1 | tee "$TEE_TARGET"'],
      { env: { PATH: '/usr/bin:/bin', UNIT_NODE: process.execPath, UNIT_FIXTURE: `process.stdout.write("fixture\\n");process.exit(${code})`, TEE_TARGET: target } })
    const original = unit.status, failed = code !== 0 || teeFailure
    assert.equal(original === 0, !failed); if (code === 70) assert.equal(original, 70)
    const result = await collectUnitFailureInventory({ ...h.options, unitOutcome: failed ? 'failure' : 'success', jobStatus: failed ? 'failure' : 'success' })
    assert.equal(unit.status, original); assert.equal(h.calls.length, failed ? 2 : 0)
    assert.equal(result.unit_outcome, failed ? 'failure' : 'success')
  }
})
