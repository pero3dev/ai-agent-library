import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PILOT, selectExact17, deviceRows, proveOwner, expectedCases, verifyFunctional, ownedDMG, requiresConsent, cleanupDeadline, pilotCancellation } from '../../ios/tests/ios17-functional-pilot.mjs'
const uuid = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'
const runtime = { version: '17.0', name: 'iOS 17.0', identifier: PILOT.runtime, buildversion: 'observed-build', isAvailable: true }
const context = { repository: 'pero3dev/ai-agent-library', event: 'pull_request', source_head: 'a'.repeat(40), run_id: '123', run_attempt: '1' }
const token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const owner = { ...context, token, name: `AILibrary-ios17-123-1-${token}`, UUID: uuid, runtime: PILOT.runtime,
  type: PILOT.device, preexisting_UUIDs: [], creation_exit: 0 }
const inventory = device => ({ devices: { [PILOT.runtime]: device ? [device] : [] } })
const device = { udid: uuid, name: owner.name, deviceTypeIdentifier: PILOT.device, state: 'Booted', isAvailable: true }
const source = count => 'final class NativeInlineTests {\n' + Array.from({ length: count }, (_, i) => `    func testCase${i}() {}`).join('\n') + '\n}'

test('pilot selects only one available exact17.0, never17.5', () => {
  assert.deepEqual(selectExact17({ runtimes: [runtime] }), runtime)
  assert.equal(selectExact17({ runtimes: [{ ...runtime, version: '17.5', name: 'iOS 17.5' }] }), null)
  assert.equal(selectExact17({ runtimes: [{ ...runtime, isAvailable: false }] }), null)
  assert.throws(() => selectExact17({ runtimes: [runtime, runtime] }))
  assert.throws(() => selectExact17({ runtimes: [{ ...runtime, identifier: 'another' }] }))
  assert.throws(() => selectExact17({ runtimes: [{ ...runtime, isAvailable: undefined }] }))
})
test('device inventory and owner preserve UUID/source/runtime/type boundaries', () => {
  assert.equal(proveOwner(owner, context, inventory(device)).state, 'Booted')
  assert.equal(proveOwner(owner, context, inventory(null)), null)
  assert.throws(() => deviceRows({ devices: { x: [device, device] } }))
  assert.throws(() => proveOwner({ ...owner, preexisting_UUIDs: [uuid] }, context, inventory(device)))
  assert.throws(() => proveOwner(owner, { ...context, source_head: 'b'.repeat(40) }, inventory(device)))
  assert.throws(() => proveOwner(owner, context, inventory({ ...device, name: 'unrelated' })))
  assert.throws(() => proveOwner(owner, context, inventory({ ...device, deviceTypeIdentifier: 'iPhone16' })))
})
test('functional case contract is source37or46 plus exactly one native UI case', () => {
  assert.equal(expectedCases(source(37)).length, 38)
  assert.equal(expectedCases(source(46)).length, 47)
  assert.throws(() => expectedCases(source(36)))
  assert.throws(() => expectedCases(source(37).replace('testCase1()', 'testCase0()')))
})
test('raw functional result rejects skipped/extra/repeated cases and wrong runtime/device', () => {
  const expected = expectedCases(source(37)), tree = {
    testNodes: [{ nodeType: 'Test Suite', result: 'Passed', children: expected.map(nodeIdentifier => ({ nodeType: 'Test Case', result: 'Passed', nodeIdentifier })) }],
    devices: [{ deviceId: uuid, osVersion: '17.0', platform: 'iOS Simulator', modelName: 'iPhone 15' }] }
  assert.equal(verifyFunctional(tree, expected, owner), 38)
  const copy = () => structuredClone(tree)
  const skipped = copy(); skipped.testNodes[0].children[0].result = 'Skipped'; assert.throws(() => verifyFunctional(skipped, expected, owner))
  const duplicate = copy(); duplicate.testNodes[0].children.push(duplicate.testNodes[0].children[0]); assert.throws(() => verifyFunctional(duplicate, expected, owner))
  const missing = copy(); missing.testNodes[0].children.pop(); assert.throws(() => verifyFunctional(missing, expected, owner))
  for (const [key, value] of [['osVersion', '17.5'], ['deviceId', 'BBBBBBBB-BBBB-CCCC-DDDD-EEEEEEEEEEEE'], ['modelName', 'iPhone 16']]) {
    const bad = copy(); bad.devices[0][key] = value; assert.throws(() => verifyFunctional(bad, expected, owner))
  }
})
test('runtime export selection is bounded owned regular-file metadata, not DMG validity', t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ios17-pilot-'))); t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const folder = path.join(root, 'export'); fs.mkdirSync(folder)
  assert.throws(() => ownedDMG(folder)); const file = path.join(folder, 'runtime.dmg'); fs.writeFileSync(file, 'synthetic')
  assert.equal(ownedDMG(folder), file); fs.writeFileSync(path.join(folder, 'second.dmg'), 'synthetic'); assert.throws(() => ownedDMG(folder))
  fs.unlinkSync(path.join(folder, 'second.dmg'))
  if (process.platform !== 'win32') {
    const alias = path.join(root, 'alias'); fs.symlinkSync(folder, alias, 'dir'); assert.throws(() => ownedDMG(alias))
    fs.symlinkSync(file, path.join(folder, 'linked.dmg')); assert.throws(() => ownedDMG(folder))
  }
})

test('account or new-consent instructions are rejected without interactive acceptance', () => {
  for (const text of ['Sign in with Apple Account', 'authentication required', 'Accept the license agreement', 'new agreement required']) assert.equal(requiresConsent(text), true)
  assert.equal(requiresConsent('Downloading iOS 17.0 Simulator Runtime'), false)
})


test('normal cancellation stops only the bound owned child and preserves cleanup work', () => {
  const events = new EventEmitter(), state = pilotCancellation(events), stopped = []
  const first = reason => stopped.push(['first', reason])
  state.bindOwnedStop(first); events.emit('SIGTERM')
  assert.equal(state.signal, 'SIGTERM'); assert.throws(() => state.assertWorkAllowed())
  assert.deepEqual(stopped, [['first', 'cancelled-SIGTERM']])
  state.releaseOwnedStop(first)
  events.emit('SIGINT'); assert.equal(stopped.length, 1)
  const between = reason => stopped.push(['between', reason])
  state.bindOwnedStop(between); assert.equal(stopped.length, 2)
  state.releaseOwnedStop(between); state.beginCleanup()
  state.bindOwnedStop(reason => stopped.push(['cleanup', reason]))
  events.emit('SIGTERM'); events.emit('SIGINT')
  assert.equal(stopped.length, 2); assert.equal(state.signal, 'SIGTERM')
  assert.deepEqual(state.received, ['SIGTERM', 'SIGINT'])
  assert.throws(() => state.assertWorkAllowed())
  state.close(); assert.equal(events.listenerCount('SIGTERM'), 0); assert.equal(events.listenerCount('SIGINT'), 0)
})
test('cleanup deadline is at most two minutes from cleanup start and within shared total', () => {
  assert.equal(cleanupDeadline(0, 1000), 1000 + PILOT.cleanupMs)
  assert.equal(cleanupDeadline(0, PILOT.workMs), PILOT.workMs + PILOT.cleanupMs)
  assert.equal(cleanupDeadline(0, PILOT.workMs + 50000), PILOT.workMs + PILOT.cleanupMs)
  assert.ok(cleanupDeadline(0, PILOT.workMs + PILOT.cleanupMs + 1) < PILOT.workMs + PILOT.cleanupMs + 1)
  assert.throws(() => cleanupDeadline(1, 0)); assert.throws(() => cleanupDeadline(0, NaN))
})
test('real normal SIGTERM stops a detached owned Node child, reaches finally and survives cleanup SIGINT',
  { skip: process.platform === 'win32', timeout: 10000 }, async t => {
    const moduleURL = new URL('../../ios/tests/ios17-functional-pilot.mjs', import.meta.url).href
    const code = `
      import { spawn } from 'node:child_process';
      import { pilotCancellation } from ${JSON.stringify(moduleURL)};
      const state = pilotCancellation(); let child, work, failure, cleanupStopped = false;
      try {
        child = spawn(process.execPath, ['-e', "console.log('ready');setInterval(()=>{},1000)"], { detached:true, stdio:['ignore','pipe','ignore'] });
        const stop = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} };
        state.bindOwnedStop(stop);
        child.stdout.once('data', () => console.log(JSON.stringify({phase:'work-ready',pid:child.pid})));
        work = await new Promise(resolve => child.on('close', (code, signal) => { state.releaseOwnedStop(stop); resolve({code,signal}); }));
        state.assertWorkAllowed();
      } catch (error) { failure = error.message; }
      finally {
        state.beginCleanup(); state.bindOwnedStop(() => { cleanupStopped = true; });
        console.log(JSON.stringify({phase:'cleanup-start'}));
        await new Promise(resolve => setTimeout(resolve, 250));
        console.log(JSON.stringify({phase:'done',work,failure,cancelled:state.signal,received:state.received,cleanupStopped}));
        state.close(); process.exitCode = state.signal ? 1 : 0;
      }`
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    const messages = []; let output = '', stderr = '', workPID = null, done = false
    t.after(() => {
      if (child.exitCode === null && child.signalCode === null) { try { process.kill(-child.pid, 'SIGKILL') } catch {} }
      if (!done && workPID) { try { process.kill(-workPID, 'SIGKILL') } catch {} }
    })
    child.stderr.on('data', bytes => { stderr += bytes })
    child.stdout.on('data', bytes => {
      output += bytes
      while (output.includes('\n')) {
        const end = output.indexOf('\n'), message = JSON.parse(output.slice(0, end)); output = output.slice(end + 1); messages.push(message)
        if (message.phase === 'work-ready') { workPID = message.pid; process.kill(child.pid, 'SIGTERM') }
        if (message.phase === 'cleanup-start') process.kill(child.pid, 'SIGINT')
        if (message.phase === 'done') done = true
      }
    })
    const result = await new Promise(resolve => child.on('close', (code, signal) => resolve({code, signal})))
    assert.equal(stderr, ''); assert.deepEqual(result, {code:1, signal:null})
    assert.deepEqual(messages.map(row => row.phase), ['work-ready', 'cleanup-start', 'done'])
    const last = messages.at(-1)
    assert.equal(last.cancelled, 'SIGTERM'); assert.deepEqual(last.received, ['SIGTERM','SIGINT'])
    assert.equal(last.work.signal, 'SIGKILL'); assert.equal(last.cleanupStopped, false); assert.match(last.failure, /cancelled/)
  })


import { postbootRecoveryAllowed, readPostbootInventory } from '../../ios/tests/ios17-functional-pilot.mjs'
const timeoutReceipt = () => ({ name: 'devices-after-boot', stage: 'owned-boot', binary: 'xcrun',
  arguments: ['simctl', 'list', 'devices', '--json'], timeout_ms: 60000, code: null, signal: 'SIGKILL',
  error: null, stop: 'command-or-shared-deadline', cancelled_signal: null, resource_failure: false,
  captured_output_complete: false, elapsed_ms: 79650, observed_stream_bytes: 0,
  captured_stdout_bytes: 0, captured_stderr_bytes: 0 })
const timeoutError = () => Object.assign(new Error('original inventory timeout'), { pilotCommand: timeoutReceipt() })
function postbootHarness({ first = timeoutError(), second = inventory(device),
  remaining = () => 120000, duringPlan = () => {}, validate = value => assert.equal(proveOwner(owner, context, value)?.state, 'Booted') } = {}) {
  const events = new EventEmitter(), cancellation = pilotCancellation(events), reads = [], plans = []
  const run = () => readPostbootInventory({ cancellation, remainingMs: remaining, validate,
    recordRecovery: plan => { plans.push(plan); duringPlan(events) },
    read: async (label, fullCapFailure) => {
      reads.push({ label, fullCapFailure })
      const value = reads.length === 1 ? first : second
      if (value instanceof Error) throw value
      return value
    } })
  return { run, events, cancellation, reads, plans }
}
test('postboot metadata recovery requires the exact silent full-cap timeout and a full next cap', () => {
  assert.equal(postbootRecoveryAllowed(timeoutReceipt(), 60000, null), true)
  const rejected = [
    ['name', 'devices-after-boot-recovery'], ['name', 'devices-before-test'], ['name', 'cleanup-before'],
    ['stage', 'cleanup'], ['binary', 'other'], ['arguments', ['simctl', 'boot', uuid]],
    ['arguments', ['simctl', 'list', 'devices', '--json', 'extra']], ['timeout_ms', 59999],
    ['code', 1], ['code', 0], ['signal', null], ['signal', 'SIGTERM'], ['error', 'spawn failed'],
    ['stop', null], ['stop', 'output-cap'], ['stop', 'resource-floor-or-cap'],
    ['cancelled_signal', 'SIGINT'], ['resource_failure', true], ['resource_failure', undefined],
    ['captured_output_complete', true], ['elapsed_ms', 59999], ['elapsed_ms', NaN],
    ['observed_stream_bytes', 1], ['captured_stdout_bytes', 1], ['captured_stderr_bytes', 1]
  ]
  for (const [key, value] of rejected) {
    assert.equal(postbootRecoveryAllowed({ ...timeoutReceipt(), [key]: value }, 120000, null), false, key + ':' + String(value))
  }
  for (const remaining of [59999.999, 0, -1, NaN, Infinity, '60000']) assert.equal(postbootRecoveryAllowed(timeoutReceipt(), remaining, null), false)
  for (const receipt of [null, {}, { ...timeoutReceipt(), arguments: null }]) assert.equal(postbootRecoveryAllowed(receipt, 120000, null), false)
  assert.equal(postbootRecoveryAllowed(timeoutReceipt(), 120000, 'SIGTERM'), false)
})
test('postboot first success validates once without a recovery plan or another read', async t => {
  let validations = 0
  const h = postbootHarness({ first: inventory(device), validate: value => { validations++; assert.equal(proveOwner(owner, context, value).state, 'Booted') } })
  t.after(() => h.cancellation.close())
  assert.deepEqual(await h.run(), inventory(device)); assert.equal(validations, 1)
  assert.deepEqual(h.reads, [{ label: 'devices-after-boot', fullCapFailure: undefined }]); assert.deepEqual(h.plans, [])
})
test('postboot eligible timeout performs one distinct full-cap read then the same owner and Booted validation', async t => {
  const first = timeoutError(), h = postbootHarness({ first })
  t.after(() => h.cancellation.close())
  assert.deepEqual(await h.run(), inventory(device))
  assert.equal(h.reads.length, 2); assert.equal(h.reads[1].label, 'devices-after-boot-recovery')
  assert.equal(h.reads[1].fullCapFailure, first)
  assert.equal(h.plans.length, 1); assert.equal(h.plans[0].required_timeout_ms, 60000)
  assert.equal(h.plans[0].maximum_fresh_reads, 1); assert.equal(h.plans[0].read_only, true)
  assert.equal(h.plans[0].plan_is_not_execution_proof, true)
})
test('postboot recovery rejects all other command failures without an extra read', async t => {
  const failures = [new Error('ordinary failure'), new SyntaxError('invalid first JSON')]
  for (const patch of [{ timeout_ms: 50000 }, { error: 'spawn error' }, { stop: 'output-cap' },
    { resource_failure: true }, { resource_failure: undefined }, { cancelled_signal: 'SIGTERM' },
    { signal: 'SIGTERM' }, { code: 1 }, { captured_stdout_bytes: 1 }, { name: 'devices-before-test' }]) {
    const error = timeoutError(); Object.assign(error.pilotCommand, patch); failures.push(error)
  }
  for (const first of failures) {
    const h = postbootHarness({ first }); t.after(() => h.cancellation.close())
    await assert.rejects(h.run(), error => error === first)
    assert.equal(h.reads.length, 1); assert.equal(h.plans.length, 0)
  }
})
test('postboot second command or JSON failure remains terminal and never invokes a third read', async t => {
  for (const second of [timeoutError(), new Error('second spawn error'), new SyntaxError('invalid recovery JSON')]) {
    const h = postbootHarness({ second }); t.after(() => h.cancellation.close())
    await assert.rejects(h.run(), error => error === second)
    assert.equal(h.reads.length, 2); assert.equal(h.plans.length, 1)
  }
})
test('postboot parsed JSON ownership or Booted failures never trigger another read', async t => {
  const badInventories = [inventory(null), inventory({ ...device, name: 'unrelated' }),
    inventory({ ...device, state: 'Shutdown' }), inventory({ ...device, deviceTypeIdentifier: 'wrong' }),
    { devices: { [PILOT.runtime]: [device, device] } }]
  for (const bad of badInventories) {
    for (const recovered of [false, true]) {
      const h = postbootHarness(recovered ? { second: bad } : { first: bad }); t.after(() => h.cancellation.close())
      await assert.rejects(h.run()); assert.equal(h.reads.length, recovered ? 2 : 1)
      assert.equal(h.plans.length, recovered ? 1 : 0)
    }
  }
})
test('postboot insufficient or shrinking shared budget preserves the first failure without a fresh read', async t => {
  for (const values of [[59999], [NaN], [60000, 59999], [60000, NaN]]) {
    let index = 0; const first = timeoutError(), h = postbootHarness({ first, remaining: () => values[Math.min(index++, values.length - 1)] })
    t.after(() => h.cancellation.close())
    await assert.rejects(h.run(), error => error === first)
    assert.equal(h.reads.length, 1); assert.equal(h.plans.length, values.length === 1 ? 0 : 1)
  }
})
test('postboot cancellation before or after the recovery plan prevents the fresh read', async t => {
  const before = postbootHarness(); t.after(() => before.cancellation.close())
  before.events.emit('SIGTERM'); await assert.rejects(before.run(), /Pilot cancelled/)
  assert.equal(before.reads.length, 0); assert.equal(before.plans.length, 0)
  const after = postbootHarness({ duringPlan: events => events.emit('SIGINT') }); t.after(() => after.cancellation.close())
  await assert.rejects(after.run(), /Pilot cancelled/)
  assert.equal(after.reads.length, 1); assert.equal(after.plans.length, 1)
})


import { runtimeReceipt, readRuntimeSnapshot, ensureDownloadedRuntime } from '../../ios/tests/ios17-functional-pilot.mjs'
function acquisitionHarness({ downloaded = { runtimes: [runtime] }, imported = { runtimes: [runtime] }, importError = null, recordError = null } = {}) {
  const calls = [], snapshots = [], plans = []
  const record = (name, value) => {
    calls.push(['record', name])
    if (recordError) throw recordError
    if (name === 'runtime-import-plan.json') plans.push(structuredClone(value))
    else snapshots.push({ name, value: structuredClone(value) })
  }
  const run = () => ensureDownloadedRuntime({ record,
    query: async label => {
      calls.push(['query', label])
      const value = label === 'runtimes-after-download' ? downloaded : imported
      if (value instanceof Error) throw value
      return value
    },
    importRuntime: async () => { calls.push(['import']); if (importError) throw importError } })
  return { run, calls, snapshots, plans }
}
test('runtime snapshots preserve distinct available identities and locations without copying device-type bulk', async () => {
  const rows = { runtimes: [
    { ...runtime, platform: 'iOS Simulator', platformIdentifier: 'com.apple.platform.iphonesimulator', bundlePath: '/runtime-a.simruntime',
      runtimeRoot: '/runtime-a/RuntimeRoot', architectures: ['arm64'], supportedArchitectures: ['arm64', 'x86_64'], supportedDeviceTypes: ['omitted'] },
    { ...runtime, bundlePath: '/runtime-b.simruntime', runtimeRoot: '/runtime-b/RuntimeRoot', supportedDeviceTypes: ['omitted'] }
  ] }
  const copy = structuredClone(rows), events = [], recorded = []
  const actual = await readRuntimeSnapshot('runtimes-before-test', async label => { events.push(label); return rows },
    (name, value) => { events.push(name); recorded.push(value) })
  assert.equal(actual, rows); assert.deepEqual(rows, copy)
  assert.deepEqual(events, ['runtimes-before-test', 'runtimes-before-test.json'])
  assert.deepEqual(recorded[0], runtimeReceipt(rows)); assert.equal(recorded[0].runtimes.length, 2)
  assert.equal(recorded[0].runtimes[0].runtimeRoot, '/runtime-a/RuntimeRoot')
  assert.equal(recorded[0].runtimes[1].bundlePath, '/runtime-b.simruntime')
  assert.deepEqual(recorded[0].runtimes[0].supportedArchitectures, ['arm64', 'x86_64'])
  assert.equal(recorded[0].runtimes[0].platformIdentifier, 'com.apple.platform.iphonesimulator')
  assert.ok(recorded[0].runtimes.every(row => !Object.hasOwn(row, 'supportedDeviceTypes')))
  assert.throws(() => selectExact17(actual), /Ambiguous exact17.0 runtime/)
})
test('runtime already available after download is recorded and does not issue explicit import', async () => {
  const h = acquisitionHarness()
  assert.deepEqual(await h.run(), runtime)
  assert.deepEqual(h.calls, [['query', 'runtimes-after-download'], ['record', 'runtimes-after-download.json'], ['record', 'runtime-import-plan.json']])
  assert.equal(h.snapshots.length, 1); assert.equal(h.plans[0].explicit_import_planned, false)
  assert.equal(h.plans[0].exact17_available_after_download, true)
  assert.equal(h.plans[0].maximum_explicit_imports, 1); assert.equal(h.plans[0].plan_is_not_execution_proof, true)
})
test('missing runtime after download permits one import and records both inventories before selection', async () => {
  const h = acquisitionHarness({ downloaded: { runtimes: [] } })
  assert.deepEqual(await h.run(), runtime)
  assert.deepEqual(h.calls, [['query', 'runtimes-after-download'], ['record', 'runtimes-after-download.json'],
    ['record', 'runtime-import-plan.json'], ['import'], ['query', 'runtimes-after-import'], ['record', 'runtimes-after-import.json']])
  assert.equal(h.plans[0].explicit_import_planned, true); assert.equal(h.snapshots.length, 2)
})
test('ambiguous downloaded runtime identities are persisted and rejected before any import', async () => {
  const downloaded = { runtimes: [{ ...runtime, runtimeRoot: '/first' }, { ...runtime, runtimeRoot: '/second' }] }
  const h = acquisitionHarness({ downloaded })
  await assert.rejects(h.run(), /Ambiguous exact17.0 runtime/)
  assert.deepEqual(h.calls, [['query', 'runtimes-after-download'], ['record', 'runtimes-after-download.json']])
  assert.equal(h.plans.length, 0); assert.equal(h.snapshots[0].value.runtimes.length, 2)
  assert.deepEqual(h.snapshots[0].value.runtimes.map(row => row.runtimeRoot), ['/first', '/second'])
})
test('an import that leaves runtime missing or unavailable fails without a second import', async () => {
  for (const imported of [{ runtimes: [] }, { runtimes: [{ ...runtime, isAvailable: false }] }]) {
    const h = acquisitionHarness({ downloaded: { runtimes: [] }, imported })
    await assert.rejects(h.run(), /Exact17.0 unavailable after import/)
    assert.equal(h.calls.filter(row => row[0] === 'import').length, 1)
    assert.deepEqual(h.snapshots.map(row => row.name), ['runtimes-after-download.json', 'runtimes-after-import.json'])
  }
})
test('ambiguous post-import identities are recorded and rejected with no deduplication or retry', async () => {
  const h = acquisitionHarness({ downloaded: { runtimes: [] }, imported: { runtimes: [runtime, { ...runtime, runtimeRoot: '/other' }] } })
  await assert.rejects(h.run(), /Ambiguous exact17.0 runtime/)
  assert.equal(h.calls.filter(row => row[0] === 'import').length, 1)
  assert.equal(h.snapshots.length, 2); assert.equal(h.snapshots[1].value.runtimes.length, 2)
})
test('acquisition read, evidence-write, or import failures remain terminal without more work', async () => {
  const readFailure = new Error('inventory command failed'), recordFailure = new Error('evidence cap reached'), importFailure = new Error('import failed')
  const first = acquisitionHarness({ downloaded: readFailure }); await assert.rejects(first.run(), error => error === readFailure)
  assert.deepEqual(first.calls, [['query', 'runtimes-after-download']])
  const evidence = acquisitionHarness({ downloaded: { runtimes: [] }, recordError: recordFailure }); await assert.rejects(evidence.run(), error => error === recordFailure)
  assert.equal(evidence.calls.some(row => row[0] === 'import'), false)
  const imported = acquisitionHarness({ downloaded: { runtimes: [] }, importError: importFailure }); await assert.rejects(imported.run(), error => error === importFailure)
  assert.equal(imported.calls.filter(row => row[0] === 'query').length, 1)
  const after = acquisitionHarness({ downloaded: { runtimes: [] }, imported: readFailure }); await assert.rejects(after.run(), error => error === readFailure)
  assert.equal(after.calls.filter(row => row[0] === 'import').length, 1); assert.equal(after.snapshots.length, 1)
})
test('acquisition preserves exact-version and metadata validation rather than accepting a fallback', async () => {
  const other = { runtimes: [{ ...runtime, version: '17.5', name: 'iOS 17.5' }] }
  const h = acquisitionHarness({ downloaded: other, imported: other })
  await assert.rejects(h.run(), /Exact17.0 unavailable after import/)
  assert.equal(h.calls.filter(row => row[0] === 'import').length, 1)
  for (const patch of [{ name: 'wrong' }, { identifier: 'wrong' }, { isAvailable: undefined }, { buildversion: '' }]) {
    const invalid = acquisitionHarness({ downloaded: { runtimes: [{ ...runtime, ...patch }] } })
    await assert.rejects(invalid.run()); assert.equal(invalid.snapshots.length, 1)
    assert.equal(invalid.calls.some(row => row[0] === 'import'), false)
  }
})

import { createHash } from 'node:crypto'
import { DOWNLOAD_OUTPUT_LIMITS, commandOutputCapture } from '../../ios/tests/ios17-functional-pilot.mjs'
const progressLine = (value = '77.6', ending = '\r') => `Downloading iOS 17.0 Simulator (21A328): ${value}% (5.86 GB of 7.56 GB)${ending}`
const wireHash = bytes => createHash('sha256').update(bytes).digest('hex')
const captureHarness = (name = 'runtime-download') => {
  const stops = [], capture = commandOutputCapture(name, reason => stops.push(reason))
  return { capture, stops }
}
const feedInPieces = (capture, bytes, size) => {
  for (let i = 0; i < bytes.length; i += size) capture.stdout(bytes.subarray(i, i + size))
}

test('download keeps first two exact progress records and hashes more than4MiB of complete wire', () => {
  const { capture, stops } = captureHarness(), line = Buffer.from(progressLine())
  const count = Math.ceil(PILOT.outputBytes / line.length) + 100, raw = createHash('sha256')
  const batch = Buffer.from(progressLine().repeat(1000)); let remaining = count
  while (remaining) {
    const take = Math.min(1000, remaining), chunk = batch.subarray(0, take * line.length)
    capture.stdout(chunk); raw.update(chunk); remaining -= take
  }
  const result = capture.finish(), r = result.receipt
  assert.deepEqual(stops, []); assert.deepEqual(result.stdout, Buffer.concat([line, line]))
  assert.equal(r.observed_stream_bytes, count * line.length); assert.ok(r.observed_stream_bytes > PILOT.outputBytes)
  assert.equal(r.raw_stdout_bytes, r.observed_stream_bytes); assert.equal(r.raw_stdout_sha256, raw.digest('hex'))
  assert.equal(r.captured_stdout_sha256, wireHash(result.stdout)); assert.equal(r.deduplicated_progress_records, count - 2)
  assert.equal(r.deduplicated_progress_bytes, (count - 2) * line.length); assert.equal(r.uncaptured_stream_bytes, 0)
  assert.equal(r.raw_stderr_bytes, 0); assert.equal(r.raw_stderr_sha256, wireHash(Buffer.alloc(0)))
  assert.equal(r.captured_output_complete, false); assert.ok(r.max_pending_stdout_bytes <= 256)
})

test('changed progress is retained and unknown stdout or any stderr resets exact consecutive matching', () => {
  const a = progressLine(), b = progressLine('77.7'), unknown = 'warning: repeated message\r'
  const first = captureHarness(); first.capture.stdout(Buffer.from(a.repeat(4) + b.repeat(3) + unknown.repeat(3) + b.repeat(3)))
  const one = first.capture.finish()
  assert.equal(one.stdout.toString(), a.repeat(2) + b.repeat(2) + unknown.repeat(3) + b.repeat(2))
  assert.equal(one.receipt.deduplicated_progress_records, 4); assert.deepEqual(first.stops, [])
  const second = captureHarness(), stderr = Buffer.from('authentication required\nSign in with Apple Account\n')
  second.capture.stdout(Buffer.from(a.repeat(4))); second.capture.stderr(stderr.subarray(0, 11))
  second.capture.stderr(stderr.subarray(11)); second.capture.stdout(Buffer.from(a.repeat(4)))
  const two = second.capture.finish()
  assert.equal(two.stdout.toString(), a.repeat(4)); assert.deepEqual(two.stderr, stderr)
  assert.equal(two.receipt.raw_stderr_sha256, wireHash(stderr)); assert.equal(two.receipt.captured_stderr_sha256, wireHash(stderr))
  assert.equal(requiresConsent(two.stdout + '\n' + two.stderr), true)
  assert.equal(two.receipt.uncaptured_stream_bytes, 0); assert.deepEqual(second.stops, [])
})

test('only the bounded complete known ASCII grammar qualifies and every other byte is preserved', () => {
  const payloads = [
    'Downloading iOS 17.5 Simulator (21A328): 77.6% (5.86 GB of 7.56 GB)\r',
    'Downloading iOS 17.0 Simulator (21A328): 100.1% (5.86 GB of 7.56 GB)\r',
    'Downloading iOS 17.0 Simulator (21A328): -1% (5.86 GB of 7.56 GB)\r',
    'Downloading iOS 17.0 Simulator (21A328): Done. Accept license agreement\n',
    'Downloading iOS 17.0 Simulator (21A328): Installing (Authentication required)...\r',
    'Downloading iOS 17.0 Simulator (' + 'A'.repeat(33) + '): Done.\n',
    'Downloading iOS 17.0 Simulator (21A328): Done.' + ' '.repeat(65) + '\n',
    '\t' + progressLine(), 'warning: ' + progressLine(),
    progressLine().replace('GB of', 'TB of'), progressLine().replace('21A328', '21A_328'),
    progressLine().replace('77.6', '77.600'),
    '日本語の警告\r', 'unknown\x00binary\xff\xfe\r'
  ]
  for (const value of payloads) {
    const bytes = Buffer.from(value, value.includes('\xff') ? 'latin1' : 'utf8'), h = captureHarness()
    h.capture.stdout(Buffer.concat([bytes, bytes, bytes, bytes])); const result = h.capture.finish()
    assert.deepEqual(result.stdout, Buffer.concat([bytes, bytes, bytes, bytes]), JSON.stringify(value))
    assert.equal(result.receipt.deduplicated_progress_bytes, 0); assert.equal(result.receipt.captured_output_complete, true)
    assert.deepEqual(h.stops, [])
  }
  const binary = Buffer.from([0xff, 0xfe, 0xc3, 0x28, 0, 13, 10]), h = captureHarness()
  h.capture.stdout(Buffer.concat([binary, binary, binary])); assert.deepEqual(h.capture.finish().stdout, Buffer.concat([binary, binary, binary]))
})

test('CRLF split across one-byte and varied chunk boundaries produces identical retained bytes and hashes', () => {
  const known = progressLine('77.6', '\r\n'), changed = progressLine('78', '\n')
  const bytes = Buffer.from(known.repeat(5) + '日本語\r\n' + changed.repeat(4) + progressLine('77.6', ''))
  const expected = captureHarness(); expected.capture.stdout(bytes); const baseline = expected.capture.finish()
  for (const size of [1, 2, 3, 7, 31, 256, 257, bytes.length]) {
    const h = captureHarness(); feedInPieces(h.capture, bytes, size); const result = h.capture.finish()
    assert.deepEqual(result.stdout, baseline.stdout, 'chunk=' + size)
    assert.deepEqual(result.receipt, baseline.receipt, 'chunk=' + size); assert.deepEqual(h.stops, [])
  }
  assert.ok(baseline.stdout.toString().endsWith(progressLine('77.6', '')))
  assert.equal(baseline.receipt.deduplicated_progress_records, 5)
})

test('known Installing, Mounting and Done records retain changes, exact whitespace and delimiter identity', () => {
  const prefix = 'Downloading iOS 17.0 Simulator (21A328): '
  const lines = ['Installing (registering download)...\r', 'Installing (Mounting)...            \r',
    'Installing (Mounting)...\r', 'Done.                   \n', 'Done.\r\n', 'Done.\r']
  const h = captureHarness(), bytes = Buffer.from(lines.map(line => (prefix + line).repeat(4)).join(''))
  h.capture.stdout(bytes); const result = h.capture.finish()
  assert.equal(result.stdout.toString(), lines.map(line => (prefix + line).repeat(2)).join(''))
  assert.equal(result.receipt.deduplicated_progress_records, 2 * lines.length)
  assert.equal(result.receipt.raw_stdout_sha256, wireHash(bytes)); assert.deepEqual(h.stops, [])
})

test('long and unterminated records pass through without unbounded pending memory or false matching', () => {
  const line = Buffer.from('x'.repeat(1025) + '\r\n'), known = Buffer.from(progressLine().repeat(4))
  const tail = Buffer.from(progressLine('77.6', '').repeat(7)), bytes = Buffer.concat([line, known, tail])
  const h = captureHarness(); feedInPieces(h.capture, bytes, 1); const result = h.capture.finish()
  assert.deepEqual(result.stdout, Buffer.concat([line, Buffer.from(progressLine().repeat(2)), tail]))
  assert.equal(result.receipt.max_pending_stdout_bytes, DOWNLOAD_OUTPUT_LIMITS.recordBytes)
  assert.equal(result.receipt.deduplicated_progress_records, 2); assert.equal(result.receipt.uncaptured_stream_bytes, 0)
  assert.deepEqual(h.stops, [])
  const exact256 = Buffer.from('x'.repeat(255) + '\r\n'), boundary = captureHarness()
  feedInPieces(boundary.capture, exact256, 1)
  assert.deepEqual(boundary.capture.finish().stdout, exact256)
})

test('unknown unterminated stdout still hits the4MiB retained cap with bounded pending bytes', () => {
  const h = captureHarness(), chunk = Buffer.alloc(65536, 120), raw = createHash('sha256')
  for (let i = 0; i < PILOT.outputBytes / chunk.length; i++) { h.capture.stdout(chunk); raw.update(chunk) }
  const extra = Buffer.from('y'); h.capture.stdout(extra); raw.update(extra)
  const result = h.capture.finish(), r = result.receipt
  assert.deepEqual(h.stops, ['output-cap']); assert.equal(result.stdout.length, PILOT.outputBytes)
  assert.ok(result.stdout.every(byte => byte === 120)); assert.equal(r.observed_stream_bytes, PILOT.outputBytes + 1)
  assert.equal(r.raw_stdout_sha256, raw.digest('hex')); assert.equal(r.uncaptured_stream_bytes, 1)
  assert.equal(r.deduplicated_progress_bytes, 0); assert.equal(r.captured_output_complete, false)
  assert.equal(r.retained_output_cap_exceeded, true); assert.equal(r.raw_wire_cap_exceeded, false)
  assert.equal(r.max_pending_stdout_bytes, 256)
})

test('non-download command names preserve the original combined4MiB raw cap without any progress filtering', () => {
  for (const name of ['devices-after-boot', 'runtime-import', 'runtime-download-recovery', 'first-launch-status']) {
    const h = captureHarness(name), bytes = Buffer.from(progressLine().repeat(4)); h.capture.stdout(bytes)
    const result = h.capture.finish(); assert.deepEqual(result.stdout, bytes)
    assert.equal(result.receipt.raw_wire_cap_bytes, PILOT.outputBytes); assert.equal(result.receipt.output_capture_policy, 'raw-v1')
    assert.equal(result.receipt.deduplicated_progress_bytes, 0); assert.equal(result.receipt.captured_output_complete, true)
  }
  const h = captureHarness('devices-after-boot'), out = Buffer.alloc(PILOT.outputBytes - 3, 65), err = Buffer.from('xyz')
  h.capture.stdout(out); h.capture.stderr(err.subarray(0, 1)); h.capture.stderr(err.subarray(1))
  assert.deepEqual(h.stops, []); h.capture.stderr(Buffer.from('!'))
  const result = h.capture.finish(); assert.deepEqual(result.stdout, out); assert.deepEqual(result.stderr, err)
  assert.deepEqual(h.stops, ['output-cap']); assert.equal(result.receipt.raw_stderr_bytes, 4)
  assert.equal(result.receipt.raw_stderr_sha256, wireHash(Buffer.from('xyz!')))
  assert.equal(result.receipt.retained_stream_bytes, PILOT.outputBytes); assert.equal(result.receipt.uncaptured_stream_bytes, 1)
})

test('download stderr has no filtering and shares exactly the4MiB retained budget with stdout', () => {
  const h = captureHarness(), out = Buffer.from('prefix\n'), err = Buffer.alloc(PILOT.outputBytes - out.length, 69)
  h.capture.stdout(out); h.capture.stderr(err); assert.deepEqual(h.stops, [])
  h.capture.stderr(Buffer.from('!')); const result = h.capture.finish()
  assert.deepEqual(result.stdout, out); assert.deepEqual(result.stderr, err)
  assert.deepEqual(h.stops, ['output-cap']); assert.equal(result.receipt.retained_stream_bytes, PILOT.outputBytes)
  assert.equal(result.receipt.deduplicated_progress_bytes, 0); assert.equal(result.receipt.uncaptured_stream_bytes, 1)
})

test('download raw wire has an independent explicit64MiB cap, including stderr, with a distinct terminal reason', () => {
  assert.equal(DOWNLOAD_OUTPUT_LIMITS.wireBytes, 64 * 1024 ** 2)
  const batch = Buffer.from(progressLine().repeat(1024))
  const feed = (capture, total) => {
    let remaining = total
    while (remaining) { const chunk = batch.subarray(0, Math.min(batch.length, remaining)); capture.stdout(chunk); remaining -= chunk.length }
  }
  const exact = captureHarness(); feed(exact.capture, DOWNLOAD_OUTPUT_LIMITS.wireBytes - 1)
  exact.capture.stderr(Buffer.from('!')); assert.deepEqual(exact.stops, [])
  const one = exact.capture.finish(); assert.equal(one.receipt.observed_stream_bytes, DOWNLOAD_OUTPUT_LIMITS.wireBytes)
  assert.ok(one.receipt.retained_stream_bytes < 1024); assert.equal(one.stderr.toString(), '!')
  assert.equal(one.receipt.uncaptured_stream_bytes, 0)
  const exceeded = captureHarness(); feed(exceeded.capture, DOWNLOAD_OUTPUT_LIMITS.wireBytes)
  exceeded.capture.stderr(Buffer.from('!')); const two = exceeded.capture.finish()
  assert.deepEqual(exceeded.stops, ['download-wire-cap']); assert.equal(two.receipt.observed_stream_bytes, DOWNLOAD_OUTPUT_LIMITS.wireBytes + 1)
  assert.ok(two.receipt.retained_stream_bytes < 1024); assert.equal(two.receipt.output_limit_reason, 'download-wire-cap')
  assert.equal(two.receipt.raw_wire_cap_exceeded, true); assert.equal(two.receipt.retained_output_cap_exceeded, false)
  assert.equal(two.receipt.uncaptured_stream_bytes, 1); assert.equal(two.receipt.captured_output_complete, false)
})

test('all observed bytes remain hashed after the first output limit without any additional retention or limit callbacks', () => {
  const h = captureHarness(), first = Buffer.alloc(PILOT.outputBytes + 10, 120), last = Buffer.from('unknown after stop\n')
  h.capture.stdout(first); h.capture.stdout(last); h.capture.stderr(Buffer.from('stderr after stop'))
  const result = h.capture.finish()
  assert.deepEqual(h.stops, ['output-cap']); assert.equal(result.stdout.length, PILOT.outputBytes); assert.equal(result.stderr.length, 0)
  assert.equal(result.receipt.raw_stdout_sha256, wireHash(Buffer.concat([first, last])))
  assert.equal(result.receipt.raw_stderr_sha256, wireHash(Buffer.from('stderr after stop')))
  assert.equal(result.receipt.uncaptured_stream_bytes, 10 + last.length + Buffer.byteLength('stderr after stop'))
})

test('finish preserves a pending partial diagnostic, is idempotent, and cannot clear cancellation state', t => {
  const h = captureHarness(), events = new EventEmitter(), state = pilotCancellation(events), reasons = []
  t.after(() => state.close()); state.bindOwnedStop(reason => reasons.push(reason))
  const bytes = Buffer.from('authentication required: Apple Account')
  h.capture.stdout(bytes.subarray(0, 9)); events.emit('SIGTERM'); h.capture.stdout(bytes.subarray(9))
  const result = h.capture.finish()
  assert.deepEqual(result.stdout, bytes); assert.equal(result.receipt.captured_output_complete, true)
  assert.equal(requiresConsent(result.stdout.toString()), true); assert.equal(h.capture.finish(), result)
  assert.throws(() => h.capture.stdout(Buffer.from('late')), /already finished/)
  assert.equal(state.signal, 'SIGTERM'); assert.deepEqual(reasons, ['cancelled-SIGTERM'])
  assert.throws(() => state.assertWorkAllowed()); assert.deepEqual(h.stops, [])
})
