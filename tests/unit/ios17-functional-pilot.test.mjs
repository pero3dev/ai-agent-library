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

import { evaluateResourceThresholds, resourceThresholdMonitor } from '../../ios/tests/ios17-functional-pilot.mjs'
function resourceHarness({ free = PILOT.freeBytes, owned = PILOT.ownedBytes, initialStop = null,
  command = 'functional', stage = 'functional', elapsed = () => 12.5 } = {}) {
  let stop = initialStop, resourceFailure = false, freeValue = free, ownedValue = owned, monitor
  const events = [], read = value => { if (typeof value === 'function') return value(); return value }
  monitor = resourceThresholdMonitor({ command, stage,
    readFree: () => { events.push('free'); return read(freeValue) },
    readOwned: () => { events.push('owned'); return read(ownedValue) },
    kill: reason => { events.push(['kill', reason, monitor.firstFailure]); if (reason.startsWith('resource-')) resourceFailure = true; stop ??= reason },
    stopReason: () => stop, elapsedMs: () => { events.push('elapsed'); return elapsed() } })
  return { monitor, events, get stop() { return stop }, get resourceFailure() { return resourceFailure },
    values(nextFree, nextOwned) { freeValue = nextFree; ownedValue = nextOwned } }
}

test('resource evaluator retains exact floor/cap boundaries and free-first OR short circuit', () => {
  for (const free of [PILOT.freeBytes - 1, PILOT.freeBytes, PILOT.freeBytes + 1]) {
    for (const owned of [PILOT.ownedBytes - 1, PILOT.ownedBytes, PILOT.ownedBytes + 1]) {
      const calls = [], sample = {}
      const failed = evaluateResourceThresholds(() => { calls.push('free'); return free }, () => { calls.push('owned'); return owned }, sample)
      assert.equal(failed, free < PILOT.freeBytes || owned > PILOT.ownedBytes)
      assert.deepEqual(calls, free < PILOT.freeBytes ? ['free'] : ['free', 'owned'])
      assert.equal(sample.free_bytes, free); assert.equal(sample.free_completed, true)
      assert.equal(sample.owned_bytes, free < PILOT.freeBytes ? null : owned)
      assert.equal(sample.owned_completed, free >= PILOT.freeBytes)
    }
  }
})

test('free-floor failure skips owned, requests the original kill first and records measured zero honestly', () => {
  const h = resourceHarness({ free: 0, owned: () => assert.fail('short-circuited owned probe') })
  h.monitor.poll(); const r = h.monitor.firstFailure
  assert.deepEqual(h.events, ['free', ['kill', 'resource-floor-or-cap', null], 'elapsed'])
  assert.equal(h.stop, 'resource-floor-or-cap'); assert.equal(h.resourceFailure, true)
  assert.equal(r.free_bytes, 0); assert.equal(r.free_value_status, 'observed')
  assert.equal(r.owned_bytes, null); assert.equal(r.owned_value_status, 'not-completed')
  assert.equal(r.violated_check, 'free-floor'); assert.equal(r.observation_error, false)
  assert.equal(r.phase, 'monitor'); assert.equal(r.command, 'functional'); assert.equal(r.stage, 'functional')
  assert.equal(r.elapsed_ms, 12.5); assert.equal(r.stop_already_set, null)
})

test('owned-cap failure uses the same single free and owned measurements without a diagnostic rescan', () => {
  const h = resourceHarness({ free: PILOT.freeBytes, owned: PILOT.ownedBytes + 1 })
  h.monitor.poll(); const r = h.monitor.firstFailure
  assert.deepEqual(h.events, ['free', 'owned', ['kill', 'resource-floor-or-cap', null], 'elapsed'])
  assert.equal(r.free_bytes, PILOT.freeBytes); assert.equal(r.owned_bytes, PILOT.ownedBytes + 1)
  assert.equal(r.free_floor_bytes, PILOT.freeBytes); assert.equal(r.owned_cap_bytes, PILOT.ownedBytes)
  assert.equal(r.violated_check, 'owned-cap'); assert.equal(r.observation_error_probe, null)
  const receipt = JSON.parse(JSON.stringify({ resource_failure: h.resourceFailure, resource_observation: r }))
  assert.deepEqual(receipt.resource_observation, r); assert.equal(receipt.resource_failure, true)
})

test('FS exceptions retain their identity in the evaluator and the original separate monitor classification', () => {
  for (const side of ['free', 'owned']) {
    const error = Object.assign(new Error('private path must not be retained'), { code: side === 'free' ? 'ENOSPC' : 'EACCES' })
    const sample = {}, probes = { free: () => { if (side === 'free') throw error; return PILOT.freeBytes }, owned: () => { throw error } }
    let caught; try { evaluateResourceThresholds(probes.free, probes.owned, sample) } catch (value) { caught = value }
    assert.equal(caught, error); assert.equal(sample.active_probe, side)
    const h = resourceHarness({ free: probes.free, owned: probes.owned }); h.monitor.poll(); const r = h.monitor.firstFailure
    assert.equal(h.stop, 'resource-observation-failed'); assert.equal(h.resourceFailure, true)
    assert.equal(r.observation_error, true); assert.equal(r.observation_error_probe, side); assert.equal(r.observation_error_code, error.code)
    assert.equal(r.violated_check, null); assert.equal(r.free_bytes, side === 'free' ? null : PILOT.freeBytes)
    assert.equal(r.owned_bytes, null); assert.ok(!JSON.stringify(r).includes('private path'))
  }
})

test('first resource sample is immutable across later thresholds, healthy polls and FS errors', () => {
  const h = resourceHarness({ free: PILOT.freeBytes - 1 }); h.monitor.poll()
  const first = h.monitor.firstFailure, text = JSON.stringify(first)
  h.values(PILOT.freeBytes + 100, PILOT.ownedBytes + 100); h.monitor.poll()
  h.values(() => { throw Object.assign(new Error('later'), { code: 'EIO' }) }, PILOT.ownedBytes); h.monitor.poll()
  h.values(PILOT.freeBytes, PILOT.ownedBytes); h.monitor.poll()
  assert.equal(h.monitor.firstFailure, first); assert.equal(JSON.stringify(first), text); assert.equal(Object.isFrozen(first), true)
  assert.throws(() => { first.free_bytes = 999 }, TypeError)
  assert.equal(h.stop, 'resource-floor-or-cap'); assert.equal(h.events.filter(x => x === 'free').length, 4)
  assert.equal(h.events.filter(x => x === 'owned').length, 2)
  const errorFirst = resourceHarness({ free: () => { throw Object.assign(new Error('first'), { code: 'EIO' }) } })
  errorFirst.monitor.poll(); const error = errorFirst.monitor.firstFailure
  errorFirst.values(0, 0); errorFirst.monitor.poll()
  assert.equal(errorFirst.monitor.firstFailure, error); assert.equal(errorFirst.stop, 'resource-observation-failed')
})

test('earlier cancellation, deadline or output stops retain priority while the original resource boolean becomes true', () => {
  for (const previous of ['cancelled-SIGTERM', 'command-or-shared-deadline', 'output-cap']) {
    const h = resourceHarness({ free: PILOT.freeBytes - 1, initialStop: previous }); h.monitor.poll()
    assert.equal(h.stop, previous); assert.equal(h.resourceFailure, true); assert.equal(h.monitor.firstFailure.stop_already_set, previous)
    assert.equal(h.monitor.firstFailure.violated_check, 'free-floor')
  }
})

test('healthy or cleanup polls do not latch samples, read metadata callbacks or add FS probes', () => {
  const h = resourceHarness({ elapsed: () => assert.fail('no failed observation') })
  for (let i = 0; i < 4; i++) h.monitor.poll()
  assert.deepEqual(h.events, ['free', 'owned', 'free', 'owned', 'free', 'owned', 'free', 'owned'])
  assert.equal(h.monitor.firstFailure, null); assert.equal(h.resourceFailure, false); assert.equal(h.stop, null)
  const cleanup = resourceHarness({ free: () => assert.fail('cleanup free read'), owned: () => assert.fail('cleanup owned read') })
  cleanup.monitor.poll(true); assert.deepEqual(cleanup.events, []); assert.equal(cleanup.monitor.firstFailure, null)
  h.values(0, 0); h.monitor.poll(); const first = h.monitor.firstFailure
  h.monitor.poll(true); assert.equal(h.monitor.firstFailure, first)
})

test('nonfinite probe values keep original comparisons while telemetry uses null with an explicit value status', () => {
  for (const [free, owned] of [[NaN, PILOT.ownedBytes], [Infinity, PILOT.ownedBytes + 1], [PILOT.freeBytes, Infinity], [-Infinity, 0]]) {
    const sample = {}, calls = []
    const failed = evaluateResourceThresholds(() => { calls.push('free'); return free }, () => { calls.push('owned'); return owned }, sample)
    assert.equal(failed, free < PILOT.freeBytes || owned > PILOT.ownedBytes)
    assert.equal(calls.includes('owned'), !(free < PILOT.freeBytes))
    const h = resourceHarness({ free, owned }); h.monitor.poll()
    assert.equal(h.monitor.firstFailure !== null, failed)
    if (failed) {
      if (!Number.isFinite(free)) { assert.equal(h.monitor.firstFailure.free_bytes, null); assert.equal(h.monitor.firstFailure.free_value_status, 'not-finite-number') }
      if (!(free < PILOT.freeBytes) && !Number.isFinite(owned)) { assert.equal(h.monitor.firstFailure.owned_bytes, null); assert.equal(h.monitor.firstFailure.owned_value_status, 'not-finite-number') }
    }
  }
})

test('monitor receipt stays below2KiB without error messages or paths, and telemetry getters cannot mask the stop', () => {
  const error = new Error('/private/never-retain/' + 'x'.repeat(10000))
  Object.defineProperty(error, 'code', { get() { throw new Error('getter failure') } })
  const h = resourceHarness({ command: '\u0000'.repeat(10000), stage: '\u0000'.repeat(10000),
    initialStop: '\u0000'.repeat(10000), free: () => { throw error }, elapsed: () => { throw new Error('clock observer failed') } })
  h.monitor.poll(); const r = h.monitor.firstFailure, json = JSON.stringify(r)
  assert.ok(Buffer.byteLength(json) <= 2048); assert.equal(r.elapsed_ms, null); assert.equal(r.observation_error_code, null)
  assert.equal(r.observation_error, true); assert.equal(r.free_bytes, null); assert.equal(r.owned_bytes, null)
  assert.ok(!json.includes('/private/')); assert.equal(h.resourceFailure, true); assert.equal(h.stop, '\u0000'.repeat(10000))
  const missingCode = resourceHarness({ free: () => { throw undefined } }); missingCode.monitor.poll()
  assert.equal(missingCode.monitor.firstFailure.observation_error, true); assert.equal(missingCode.monitor.firstFailure.observation_error_code, null)
})

test('a healthy monitor has an explicitly nullable receipt rather than invented measurement history', () => {
  const h = resourceHarness(); h.monitor.poll()
  const receipt = JSON.parse(JSON.stringify({ resource_observation: h.monitor.firstFailure }))
  assert.deepEqual(receipt, { resource_observation: null }); assert.deepEqual(h.events, ['free', 'owned'])
})

async function ownedResourceFixture(t, cancelled) {
  const child = spawn(process.execPath, ['-e', 'process.stdout.write("ready");setInterval(()=>{},1000)'],
    { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let closed = false, stop = null, resourceFailure = false, monitor
  const close = new Promise(resolve => child.on('close', (code, signal) => { closed = true; resolve({ code, signal }) }))
  t.after(() => { if (!closed) { try { process.kill(-child.pid, 'SIGKILL') } catch {} } })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('fixture readiness timeout')), 2000)
    child.stdout.once('data', () => { clearTimeout(timer); resolve() }); child.once('error', reject)
  })
  const events = new EventEmitter(), cancellation = pilotCancellation(events), ordering = []
  t.after(() => cancellation.close())
  const kill = reason => {
    ordering.push({ reason, latched: monitor?.firstFailure ?? null })
    if (reason.startsWith('resource-')) resourceFailure = true
    stop ??= reason; try { process.kill(-child.pid, 'SIGKILL') } catch {}
  }
  monitor = resourceThresholdMonitor({ command: 'fixture-child', stage: 'functional',
    readFree: () => PILOT.freeBytes - 1, readOwned: () => assert.fail('short-circuit'),
    kill, stopReason: () => stop, elapsedMs: () => 10 })
  cancellation.bindOwnedStop(kill)
  if (cancelled) events.emit('SIGTERM')
  monitor.poll(); const result = await close; cancellation.releaseOwnedStop(kill)
  assert.deepEqual(result, { code: null, signal: 'SIGKILL' })
  assert.equal(resourceFailure, true); assert.equal(ordering.at(-1).latched, null)
  assert.equal(stop, cancelled ? 'cancelled-SIGTERM' : 'resource-floor-or-cap')
  assert.equal(monitor.firstFailure.stop_already_set, cancelled ? 'cancelled-SIGTERM' : null)
  assert.equal(monitor.firstFailure.free_bytes, PILOT.freeBytes - 1)
  if (cancelled) { assert.equal(cancellation.signal, 'SIGTERM'); assert.throws(() => cancellation.assertWorkAllowed()) }
}

test('production monitor kills an actual owned fixture before retaining its first resource observation',
  { skip: process.platform === 'win32' }, async t => ownedResourceFixture(t, false))
test('actual fixture cancellation remains the original stop when the monitor also observes a resource violation',
  { skip: process.platform === 'win32' }, async t => ownedResourceFixture(t, true))

import { ownedLogicalBytes, ownedSizeProbe, withOwnedSizeBreakdown } from '../../ios/tests/ios17-functional-pilot.mjs'
const breakdownRoot = path.resolve(os.tmpdir(), 'ailibrary-owned-size-fixture')
const fakeOwnedStat = (size, kind = 'file', blocks = 1) => ({ size, blocks,
  mode: { file: 32768, directory: 16384, symlink: 40960, fifo: 4096, socket: 49152, character: 8192, block: 24576, other: 0 }[kind],
  isSymbolicLink: () => kind === 'symlink', isDirectory: () => kind === 'directory' })
function fakeOwnedTree(spec, root = breakdownRoot) {
  const operations = [], folders = new Map(), stats = new Map()
  const add = (folder, rows) => {
    folders.set(folder, rows.map(row => row.name))
    for (const row of rows) {
      const file = path.join(folder, row.name)
      stats.set(file, row.error ?? row.stat ?? fakeOwnedStat(row.size ?? 0, row.kind ?? (row.children ? 'directory' : 'file'), row.blocks ?? 1))
      if (row.children) add(file, row.children)
    }
  }
  add(root, spec)
  const io = {
    readdirSync(folder) { operations.push(['readdir', folder]); if (!folders.has(folder)) throw new Error('unexpected directory read'); return folders.get(folder) },
    lstatSync(file) { operations.push(['lstat', file]); const st = stats.get(file); if (st instanceof Error) throw st; assert.ok(st); return st }
  }
  return { root, io, operations, stats, folders }
}
function originalOwnedReduction(folder, io) {
  return io.readdirSync(folder).reduce((sum, name) => {
    const file = path.join(folder, name), st = io.lstatSync(file)
    return sum + (st.isSymbolicLink() ? 0 : st.isDirectory() ? originalOwnedReduction(file, io) : st.size)
  }, 0)
}
const breakdownPrettyBytes = value => Buffer.byteLength(JSON.stringify({ owned_size_breakdown: value }, null, 2) + '\n')
function ownedMonitorHarness(tree, { free = PILOT.freeBytes, previous = null } = {}) {
  let stop = previous, killed = false, monitor, freeValue = free
  const probe = ownedSizeProbe(tree.root, tree.io), events = []
  monitor = resourceThresholdMonitor({ command: 'functional', stage: 'functional',
    readFree: () => { events.push('free'); return freeValue },
    readOwned: () => { events.push('owned'); return probe.read() },
    kill: reason => { if (!killed) assert.equal(monitor.ownedSizeBreakdown, null); events.push(['kill', reason]); killed = true; stop ??= reason },
    stopReason: () => stop, elapsedMs: () => 7,
    readOwnedBreakdown: () => { assert.equal(killed, true); events.push('format'); return probe.snapshot() } })
  return { monitor, probe, events, get stop() { return stop }, free(value) { freeValue = value } }
}

test('owned production walker retains original recursive total and exact FS operation order for all counted kinds', () => {
  const sameInode = { ...fakeOwnedStat(11), ino: 42, dev: 9, nlink: 2 }
  const spec = [{ name: 'first', size: 2 }, { name: 'dir', stat: fakeOwnedStat(9000, 'directory'), children: [
    { name: 'hard-a', stat: sameInode }, { name: 'hard-b', stat: sameInode }, { name: 'pipe', size: 3, kind: 'fifo' }] },
    { name: 'link', size: 8000, kind: 'symlink' }, { name: 'last', size: 5, kind: 'socket' }]
  const old = fakeOwnedTree(spec), next = fakeOwnedTree(spec), expected = originalOwnedReduction(old.root, old.io)
  const probe = ownedSizeProbe(next.root, next.io)
  assert.equal(probe.read(), expected); assert.equal(expected, 32)
  assert.deepEqual(next.operations, old.operations)
  const beforeSnapshot = JSON.stringify(next.operations), r = probe.snapshot()
  assert.equal(JSON.stringify(next.operations), beforeSnapshot)
  assert.equal(r.total_logical_bytes, expected); assert.equal(r.counted_entries_seen, 5)
  assert.ok(r.entries.some(row => row.path === 'dir/hard-a')); assert.ok(r.entries.some(row => row.path === 'dir/hard-b'))
  assert.ok(!r.entries.some(row => row.path === 'dir' || row.path === 'link'))
})

test('numeric walker preserves nested reduction grouping rather than flattening floating additions', () => {
  const spec = [{ name: 'big', size: 2 ** 53 }, { name: 'nested', children: [{ name: 'negative', size: -(2 ** 53) }, { name: 'one', size: 1 }] }]
  const old = fakeOwnedTree(spec), next = fakeOwnedTree(spec)
  assert.equal(ownedLogicalBytes(next.root, null, next.io), originalOwnedReduction(old.root, old.io))
  assert.deepEqual(next.operations, old.operations)
})

test('same-walk collector keeps largest eight entries in descending order with encounter-order ties', () => {
  const sizes = [1, 12, 3, 11, 5, 10, 7, 9, 8, 6, 4, 2, 12, 0]
  const tree = fakeOwnedTree(sizes.map((size, i) => ({ name: 'f' + i, size, blocks: 100 + i }))), probe = ownedSizeProbe(tree.root, tree.io)
  const total = probe.read(), r = probe.snapshot()
  const expected = sizes.map((size, i) => ({ size, i })).sort((a, b) => b.size - a.size || a.i - b.i).slice(0, 8)
  assert.equal(r.entries.length, 8); assert.deepEqual(r.entries.map(row => row.path), expected.map(row => 'f' + row.i))
  assert.deepEqual(r.entries.map(row => row.logical_bytes), expected.map(row => row.size))
  assert.deepEqual(r.entries.map(row => row.blocks_raw), expected.map(row => 100 + row.i))
  assert.equal(r.listed_logical_bytes + r.unlisted_logical_bytes, total)
  assert.equal(r.unlisted_entries_seen, sizes.length - 8); assert.equal(r.omitted_by_budget, 0)
  assert.equal(r.complete, true); assert.equal(r.selection_complete, true); assert.equal(r.atomic, false); assert.equal(r.blocks_unit, null)
})

test('walker performs exactly one lstat and one size read per counted entry without extra metadata FS calls', () => {
  let sizeReads = 0, blocksReads = 0
  const st = { ...fakeOwnedStat(0), get size() { sizeReads++; return 123 }, get blocks() { blocksReads++; return 7 } }
  const tree = fakeOwnedTree([{ name: 'only', stat: st }]), probe = ownedSizeProbe(tree.root, tree.io)
  assert.equal(probe.read(), 123); const operations = tree.operations.slice()
  for (let i = 0; i < 3; i++) assert.equal(probe.snapshot().entries[0].blocks_raw, 7)
  assert.equal(sizeReads, 1); assert.equal(blocksReads, 1); assert.deepEqual(tree.operations, operations)
  assert.equal(operations.filter(x => x[0] === 'lstat').length, 1)
})

test('original lstat exception identity survives and a partial walk never invents total or remainder', () => {
  const error = Object.assign(new Error('private path in original error'), { code: 'EACCES' })
  const tree = fakeOwnedTree([{ name: 'known', size: 10 }, { name: 'missing', error }]), probe = ownedSizeProbe(tree.root, tree.io)
  let caught; try { probe.read() } catch (value) { caught = value }
  assert.equal(caught, error); const before = tree.operations.slice(), r = probe.snapshot()
  assert.equal(r.complete, false); assert.equal(r.selection_complete, false); assert.equal(r.total_logical_bytes, null)
  assert.equal(r.unlisted_logical_bytes, null); assert.equal(r.listed_logical_bytes, 10)
  assert.equal(r.counted_entries_seen, 1); assert.equal(r.entries[0].path, 'known'); assert.deepEqual(tree.operations, before)
  assert.ok(!JSON.stringify(r).includes('private path'))
})

test('nested directory enumeration failure remains the original throw with only previously observed entries', () => {
  const tree = fakeOwnedTree([{ name: 'a', size: 1 }, { name: 'd', children: [{ name: 'b', size: 2 }] }])
  const original = tree.io.readdirSync, error = new Error('rename race')
  tree.io.readdirSync = folder => { if (folder === path.join(tree.root, 'd')) throw error; return original(folder) }
  const probe = ownedSizeProbe(tree.root, tree.io)
  assert.throws(() => probe.read(), value => value === error)
  const r = probe.snapshot(); assert.equal(r.complete, false); assert.equal(r.total_logical_bytes, null)
  assert.deepEqual(r.entries.map(row => row.path), ['a'])
})

test('relative path display omits long, unsafe, outside and redacted names without retaining absolute paths', () => {
  const names = ['x'.repeat(10000), '猫'.repeat(1000), 'line\nname', 'bad\ud800name', 'back\\name', '../outside', 'private@example.com', 'token=secret']
  const tree = fakeOwnedTree(names.map((name, i) => ({ name, size: i + 1 }))), probe = ownedSizeProbe(tree.root, tree.io)
  probe.read(); const r = probe.snapshot(), text = JSON.stringify(r)
  assert.ok(r.entries.length <= 8); assert.ok(r.entries.every(row => row.path === null && typeof row.path_omitted === 'string'))
  assert.ok(!text.includes(tree.root)); assert.ok(!text.includes('secret')); assert.ok(!text.includes('example.com'))
  assert.ok(!text.includes('outside"')); assert.ok(breakdownPrettyBytes(r) <= 2048)
})

test('valid UTF8 paths are kept whole and pretty nested UTF8 byte cap can omit lowest candidates honestly', () => {
  const tree = fakeOwnedTree(Array.from({ length: 8 }, (_, i) => ({ name: '猫'.repeat(30) + i, size: 100 - i,
    blocks: Number.MAX_VALUE }))), probe = ownedSizeProbe(tree.root, tree.io)
  const total = probe.read(), r = probe.snapshot()
  assert.ok(r.entries.length > 0 && r.entries.length < 8); assert.equal(r.omitted_by_budget, 8 - r.entries.length)
  assert.ok(r.entries.every(row => row.path?.isWellFormed() && row.path.startsWith('猫'.repeat(30))))
  assert.ok(breakdownPrettyBytes(r) <= 2048); assert.equal(r.listed_logical_bytes + r.unlisted_logical_bytes, total)
  assert.equal(r.complete, true); assert.equal(r.selection_complete, true)
  assert.equal(r.unlisted_entries_seen, 8 - r.entries.length)
})

test('raw blocks stay raw or null and special kinds do not become allocated or sparse metrics', () => {
  const kinds = ['file', 'fifo', 'socket', 'character', 'block', 'other']
  const tree = fakeOwnedTree(kinds.map((kind, i) => ({ name: kind, size: 20 - i, kind, blocks: i === 1 ? Infinity : i === 2 ? -1 : i })))
  Object.defineProperty(tree.stats.get(path.join(tree.root, 'other')), 'blocks', { get() { throw new Error('unsupported') } })
  const probe = ownedSizeProbe(tree.root, tree.io); probe.read(); const r = probe.snapshot()
  assert.deepEqual(r.entries.map(row => row.kind), kinds); assert.deepEqual(r.entries.map(row => row.blocks_raw), [0, null, null, 3, 4, null])
  const text = JSON.stringify(r); assert.ok(!text.includes('allocated')); assert.ok(!text.includes('sparse')); assert.equal(r.blocks_unit, null)
})

test('nonfinite or unusual size metadata preserves original numeric values without inventing valid totals', () => {
  for (const size of [NaN, Infinity, -1]) {
    const old = fakeOwnedTree([{ name: 'odd', size }]), tree = fakeOwnedTree([{ name: 'odd', size }]), probe = ownedSizeProbe(tree.root, tree.io)
    assert.equal(probe.read(), originalOwnedReduction(old.root, old.io))
    const r = probe.snapshot(); assert.equal(r.total_logical_bytes, Number.isFinite(size) ? size : null)
    assert.equal(r.selection_complete, false); assert.equal(r.entries.length, 0)
  }
})

test('empty and zero-sized trees distinguish measured zero from an unavailable breakdown', () => {
  for (const spec of [[], [{ name: 'zero', size: 0 }]]) {
    const tree = fakeOwnedTree(spec), probe = ownedSizeProbe(tree.root, tree.io)
    assert.equal(probe.snapshot(), null); assert.equal(probe.read(), 0)
    const r = probe.snapshot(); assert.equal(r.total_logical_bytes, 0); assert.equal(r.listed_logical_bytes, 0)
    assert.equal(r.unlisted_logical_bytes, 0); assert.equal(r.complete, true); assert.equal(r.entries.length, spec.length)
  }
})

test('healthy then free-floor or cleanup poll cannot attach a stale prior owned walk', () => {
  const tree = fakeOwnedTree([{ name: 'healthy', size: 1 }]), h = ownedMonitorHarness(tree)
  h.monitor.poll(); assert.equal(h.monitor.ownedSizeBreakdown, null); assert.deepEqual(h.events, ['free', 'owned'])
  const oldOps = tree.operations.slice(); h.free(0); h.monitor.poll()
  assert.deepEqual(tree.operations, oldOps); assert.equal(h.monitor.ownedSizeBreakdown, null)
  assert.deepEqual(h.events, ['free', 'owned', 'free', ['kill', 'resource-floor-or-cap']])
  const cleanup = ownedMonitorHarness(fakeOwnedTree([])); cleanup.monitor.poll(true)
  assert.deepEqual(cleanup.events, []); assert.equal(cleanup.monitor.ownedSizeBreakdown, null)
})

test('production monitor formats only after original kill from the same failing numeric walk', () => {
  const tree = fakeOwnedTree([{ name: 'large', size: PILOT.ownedBytes + 1, blocks: 8 }]), h = ownedMonitorHarness(tree)
  h.monitor.poll(); const r = h.monitor.ownedSizeBreakdown
  assert.deepEqual(h.events, ['free', 'owned', ['kill', 'resource-floor-or-cap'], 'format'])
  assert.equal(r.total_logical_bytes, h.monitor.firstFailure.owned_bytes)
  assert.equal(r.same_monitor_walk, true); assert.equal(r.complete, true); assert.equal(h.stop, 'resource-floor-or-cap')
  assert.equal(tree.operations.filter(row => row[0] === 'lstat').length, 1)
  assert.ok(breakdownPrettyBytes(r) <= 2048)
  assert.ok(Buffer.byteLength(JSON.stringify({ resource_observation: h.monitor.firstFailure }, null, 2) + '\n') <= 2048)
})

test('a partial monitor-owned exception keeps the original separate classification and first partial walk', () => {
  const error = Object.assign(new Error('original error'), { code: 'EIO' })
  const tree = fakeOwnedTree([{ name: 'before-error', size: 7 }, { name: 'race', error }]), h = ownedMonitorHarness(tree)
  h.monitor.poll(); assert.equal(h.stop, 'resource-observation-failed')
  assert.equal(h.monitor.firstFailure.observation_error_probe, 'owned')
  const r = h.monitor.ownedSizeBreakdown; assert.equal(r.complete, false); assert.equal(r.total_logical_bytes, null)
  assert.equal(r.entries[0].path, 'before-error'); assert.deepEqual(h.events.at(-1), 'format')
})

test('first breakdown stays deeply frozen through later polls and plain post-command numeric walks', () => {
  const tree = fakeOwnedTree([{ name: 'initial', size: PILOT.ownedBytes + 1 }]), h = ownedMonitorHarness(tree)
  h.monitor.poll(); const first = h.monitor.ownedSizeBreakdown, original = JSON.stringify(first)
  tree.stats.set(path.join(tree.root, 'initial'), fakeOwnedStat(PILOT.ownedBytes + 900))
  assert.equal(ownedLogicalBytes(tree.root, null, tree.io), PILOT.ownedBytes + 900)
  // The original monitor may keep running until child close; it must not replace first evidence.
  h.monitor.poll(); assert.equal(h.monitor.ownedSizeBreakdown, first); assert.equal(JSON.stringify(first), original)
  assert.equal(h.events.filter(row => row === 'format').length, 1)
  assert.equal(Object.isFrozen(first), true); assert.equal(Object.isFrozen(first.entries), true); assert.equal(Object.isFrozen(first.entries[0]), true)
  assert.throws(() => first.entries.push({}), TypeError); assert.throws(() => { first.entries[0].logical_bytes = 0 }, TypeError)
})

test('prior cancellation retains stop priority while same-walk breakdown records a resource violation', () => {
  const tree = fakeOwnedTree([{ name: 'large', size: PILOT.ownedBytes + 1 }]), h = ownedMonitorHarness(tree, { previous: 'cancelled-SIGTERM' })
  h.monitor.poll(); assert.equal(h.stop, 'cancelled-SIGTERM'); assert.equal(h.monitor.firstFailure.stop_already_set, 'cancelled-SIGTERM')
  assert.equal(h.monitor.ownedSizeBreakdown.total_logical_bytes, PILOT.ownedBytes + 1)
})

test('optional snapshot failure or oversize cannot mask original stop or be replaced by a later snapshot', () => {
  for (const first of [() => { throw new Error('metadata only') }, () => ({ path: 'x'.repeat(3000) }), () => undefined]) {
    let stops = 0, calls = 0, read = first
    const monitor = resourceThresholdMonitor({ command: 'functional', stage: 'functional', readFree: () => PILOT.freeBytes,
      readOwned: () => PILOT.ownedBytes + 1, kill: () => { stops++ }, stopReason: () => null, elapsedMs: () => 1,
      readOwnedBreakdown: () => { calls++; return read() } })
    monitor.poll(); assert.equal(monitor.ownedSizeBreakdown, null); assert.equal(monitor.firstFailure.violated_check, 'owned-cap')
    read = () => ({ later: true }); monitor.poll(); assert.equal(monitor.ownedSizeBreakdown, null); assert.equal(calls, 1); assert.equal(stops, 2)
  }
})

test('optional sibling respects exact existing put budget or falls back to null then the unchanged receipt', () => {
  const receipt = { stop: 'resource-floor-or-cap', resource_failure: true, resource_observation: { phase: 'monitor' } }
  const breakdown = { entries: [{ path: 'a', logical_bytes: 9 }] }
  const bytes = value => Buffer.byteLength(JSON.stringify(value, null, 2) + '\n')
  const full = { ...receipt, owned_size_breakdown: breakdown }, nil = { ...receipt, owned_size_breakdown: null }
  assert.deepEqual(withOwnedSizeBreakdown(receipt, breakdown, bytes(full)), full)
  assert.deepEqual(withOwnedSizeBreakdown(receipt, breakdown, bytes(full) - 1), nil)
  assert.deepEqual(withOwnedSizeBreakdown(receipt, breakdown, bytes(nil)), nil)
  assert.equal(withOwnedSizeBreakdown(receipt, breakdown, bytes(nil) - 1), receipt)
  assert.equal(withOwnedSizeBreakdown(receipt, breakdown, bytes(receipt) - 1), receipt)
  assert.equal(receipt.owned_size_breakdown, undefined)
  const circular = {}; circular.self = circular
  assert.equal(withOwnedSizeBreakdown(receipt, circular, 2048), receipt)
})

test('small actual filesystem fixture uses original logical semantics and never follows its symlink', { skip: process.platform === 'win32' }, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ailibrary-owned-small-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'nested')); fs.writeFileSync(path.join(root, 'one'), 'abc')
  fs.writeFileSync(path.join(root, 'nested/two'), 'defg'); fs.symlinkSync('nested', path.join(root, 'link'))
  const calls = [], io = { readdirSync: folder => { calls.push(['readdir', folder]); return fs.readdirSync(folder) },
    lstatSync: file => { calls.push(['lstat', file]); return fs.lstatSync(file) } }
  const probe = ownedSizeProbe(root, io); assert.equal(probe.read(), 7)
  const r = probe.snapshot(); assert.equal(r.counted_entries_seen, 2); assert.equal(r.entries.length, 2)
  assert.equal(calls.filter(row => row[0] === 'lstat').length, 4)
  assert.ok(!calls.some(row => row[0] === 'readdir' && row[1] === path.join(root, 'link')))
  assert.equal(r.total_logical_bytes, originalOwnedReduction(root, fs))
})

test('optional observer and stat-metadata failures cannot change numeric walker totals or add FS probes', () => {
  const tree = fakeOwnedTree([{ name: 'known', size: 9 }])
  assert.equal(ownedLogicalBytes(tree.root, () => { throw new Error('observer only') }, tree.io), 9)
  const st = tree.stats.get(path.join(tree.root, 'known'))
  Object.defineProperty(st, 'mode', { get() { throw new Error('mode metadata only') } })
  Object.defineProperty(st, 'blocks', { get() { throw new Error('blocks metadata only') } })
  tree.operations.length = 0
  const probe = ownedSizeProbe(tree.root, tree.io); assert.equal(probe.read(), 9)
  const r = probe.snapshot(); assert.equal(r.entries[0].kind, 'other'); assert.equal(r.entries[0].blocks_raw, null)
  assert.equal(tree.operations.filter(row => row[0] === 'lstat').length, 1)
})

test('known105-byte SDKStatCache path is retained whole for a synthetic largest entry without proving actual attribution', () => {
  const name = 'iphonesimulator18.5-22F76-96ae0914227b19deccb34b33ba7b5dea.sdkstatcache'
  const relative = 'DerivedData/SDKStatCaches.noindex/' + name
  assert.equal(Buffer.byteLength(relative), 105)
  const tree = fakeOwnedTree([{ name: 'runtime-download', children: [{ name: 'runtime.dmg', size: 7559529352 }] },
    { name: 'DerivedData', children: [{ name: 'SDKStatCaches.noindex', children: [{ name, size: 26846424772, blocks: 19 }] }] }])
  const probe = ownedSizeProbe(tree.root, tree.io)
  probe.read()
  const r = probe.snapshot()
  assert.equal(r.entries[0].path, relative); assert.equal(r.entries[0].path_omitted, undefined)
  assert.equal(r.entries[0].logical_bytes, 26846424772); assert.equal(r.entries[0].blocks_raw, 19)
  assert.equal(r.total_logical_bytes, 34405954124); assert.equal(r.listed_logical_bytes + r.unlisted_logical_bytes, r.total_logical_bytes)
  assert.equal(r.same_monitor_walk, true); assert.ok(breakdownPrettyBytes(r) <= 2048)
  assert.equal(tree.operations.filter(row => row[0] === 'lstat' && row[1].endsWith(name)).length, 1)
})

test('next-trial39GiB logical allowance permits the observed8a sample without functional or physical acceptance', () => {
  const free = 31598936064, owned = 34425496060, calls = [], sample = {}
  assert.equal(evaluateResourceThresholds(() => { calls.push('free'); return free },
    () => { calls.push('owned'); return owned }, sample), false)
  assert.deepEqual(calls, ['free', 'owned']); assert.equal(sample.free_bytes, free); assert.equal(sample.owned_bytes, owned)
  assert.equal(sample.violated_check, null); assert.equal(sample.owned_completed, true)
  const monitor = resourceThresholdMonitor({ command: 'functional', stage: 'functional', readFree: () => free, readOwned: () => owned,
    kill: () => assert.fail('observed sample fits next-trial allowance'), stopReason: () => null,
    elapsedMs: () => assert.fail('healthy sample not retained'), readOwnedBreakdown: () => assert.fail('healthy sample not snapshotted') })
  monitor.poll(); assert.equal(monitor.firstFailure, null); assert.equal(monitor.ownedSizeBreakdown, null)
})

test('production evaluator and monitor retain a strict39GiB owned boundary and reject one extra byte', () => {
  const boundary = 41875931136
  for (const owned of [boundary - 1, boundary, boundary + 1]) {
    const sample = {}, expected = owned === boundary + 1, stops = []
    assert.equal(evaluateResourceThresholds(() => PILOT.freeBytes, () => owned, sample), expected)
    const monitor = resourceThresholdMonitor({ command: 'functional', stage: 'functional', readFree: () => PILOT.freeBytes, readOwned: () => owned,
      kill: reason => stops.push(reason), stopReason: () => null, elapsedMs: () => 1 })
    monitor.poll(); assert.deepEqual(stops, expected ? ['resource-floor-or-cap'] : [])
    if (expected) {
      assert.equal(monitor.firstFailure.violated_check, 'owned-cap'); assert.equal(monitor.firstFailure.owned_bytes, boundary + 1)
      assert.equal(monitor.firstFailure.owned_cap_bytes, boundary)
    } else assert.equal(monitor.firstFailure, null)
  }
})

test('independent2GiB free floor still short-circuits owned under the larger logical allowance', () => {
  const floor = 2147483648, sample = {}, calls = []
  assert.equal(evaluateResourceThresholds(() => { calls.push('free'); return floor - 1 },
    () => assert.fail('low free must skip even a39GiB owned probe'), sample), true)
  assert.deepEqual(calls, ['free']); assert.equal(sample.violated_check, 'free-floor'); assert.equal(sample.owned_completed, false)
  const stops = [], monitor = resourceThresholdMonitor({ command: 'functional', stage: 'functional', readFree: () => floor - 1,
    readOwned: () => assert.fail('low free must skip owned'), readOwnedBreakdown: () => assert.fail('no owned walk snapshot'),
    kill: reason => stops.push(reason), stopReason: () => null, elapsedMs: () => 1 })
  monitor.poll(); assert.deepEqual(stops, ['resource-floor-or-cap'])
  assert.equal(monitor.firstFailure.violated_check, 'free-floor'); assert.equal(monitor.firstFailure.free_floor_bytes, floor)
  assert.equal(monitor.firstFailure.owned_bytes, null); assert.equal(monitor.firstFailure.owned_cap_bytes, 41875931136)
  assert.equal(monitor.ownedSizeBreakdown, null)
})

import { initialRuntimeRecoveryPlan, readInitialRuntimeInventory } from '../../ios/tests/ios17-functional-pilot.mjs'
function initialRuntimeFailureReceipt(overrides = {}) {
  const empty = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  return { name: 'runtimes-before', stage: 'inventory', binary: 'xcrun', arguments: ['simctl', 'list', 'runtimes', '--json'],
    timeout_ms: 60000, code: null, signal: 'SIGKILL', error: null, stop: 'command-or-shared-deadline',
    resource_failure: false, resource_observation: null, cancelled_signal: null, captured_output_complete: false, elapsed_ms: 60048.20525,
    output_capture_policy: 'raw-v1', raw_wire_cap_bytes: PILOT.outputBytes, retained_output_cap_bytes: PILOT.outputBytes,
    known_progress_record_cap_bytes: null, raw_wire_cap_exceeded: false, retained_output_cap_exceeded: false, output_limit_reason: null,
    stdout_diagnostic_tail: '', stderr_diagnostic_tail: '', observed_stream_bytes: 0, raw_stdout_bytes: 0, raw_stderr_bytes: 0,
    captured_stdout_bytes: 0, captured_stderr_bytes: 0, retained_stream_bytes: 0, deduplicated_progress_records: 0,
    deduplicated_progress_bytes: 0, uncaptured_stream_bytes: 0, max_pending_stdout_bytes: 0,
    raw_stdout_sha256: empty, raw_stderr_sha256: empty, captured_stdout_sha256: empty, captured_stderr_sha256: empty, ...overrides }
}
function initialRuntimeError(receipt = initialRuntimeFailureReceipt()) {
  const error = new Error('arbitrary message is not recovery authority')
  Object.defineProperty(error, 'pilotCommand', { value: receipt }); return error
}
function initialRuntimeHarness({ error = initialRuntimeError(), first = null, fresh = () => ({ runtimes: [runtime] }),
  remaining = () => 90000, onPlan = () => {} } = {}) {
  const events = new EventEmitter(), cancellation = pilotCancellation(events), calls = [], plans = [], sequence = []
  const options = { cancellation, remainingMs: remaining,
    read: async (name, originalError = null) => {
      calls.push({ name, originalError }); sequence.push(name)
      if (name === 'runtimes-before') { if (first) return await first(); throw error }
      assert.equal(name, 'runtimes-before-recovery'); return await fresh(originalError)
    },
    recordRecovery: async plan => { plans.push(plan); sequence.push('plan'); await onPlan(plan) } }
  return { options, calls, plans, sequence, cancellation, events, error, run: () => readInitialRuntimeInventory(options), close: () => cancellation.close() }
}

test('initial runtime planner binds exact silent full60s metadata and a separate bounded30s before-download plan', () => {
  const receipt = initialRuntimeFailureReceipt(), plan = initialRuntimeRecoveryPlan(receipt, 30000, null)
  assert.equal(plan.failed_read, 'runtimes-before'); assert.equal(plan.fresh_read, 'runtimes-before-recovery')
  assert.equal(plan.required_timeout_ms, 30000); assert.equal(plan.first_timeout_ms, 60000)
  assert.equal(plan.maximum_fresh_reads, 1); assert.equal(plan.shared_work_budget_ms, 19 * 60000)
  assert.equal(plan.shared_remaining_ms, 30000); assert.equal(plan.read_only, true)
  assert.equal(plan.result_snapshot, 'runtimes-before.json'); assert.equal(plan.snapshot_source_read, 'runtimes-before-recovery')
  assert.equal(plan.snapshot_before_download, true); assert.equal(plan.first_failure_preserved, true)
  assert.equal(plan.plan_is_not_execution_proof, true); assert.equal(plan.timeout_cause_unresolved, true)
  assert.equal(Object.isFrozen(plan), true); assert.throws(() => { plan.maximum_fresh_reads = 2 }, TypeError)
})

test('each altered or missing initial command receipt field fails closed and preserves original error without a fresh read', async () => {
  const changed = { name: 'runtimes-before-recovery', stage: 'owned-boot', binary: 'other', arguments: ['simctl', 'list', 'devices', '--json'],
    timeout_ms: 59999, code: 0, signal: 'SIGTERM', error: 'spawn error', stop: 'output-cap', resource_failure: true,
    resource_observation: {}, cancelled_signal: 'SIGTERM', captured_output_complete: true, elapsed_ms: 59999,
    output_capture_policy: 'known-progress', raw_wire_cap_bytes: 1, retained_output_cap_bytes: 1,
    known_progress_record_cap_bytes: 256, raw_wire_cap_exceeded: true, retained_output_cap_exceeded: true, output_limit_reason: 'output-cap',
    stdout_diagnostic_tail: 'authentication required', stderr_diagnostic_tail: 'warning' }
  for (const key of ['observed_stream_bytes', 'raw_stdout_bytes', 'raw_stderr_bytes', 'captured_stdout_bytes', 'captured_stderr_bytes',
    'retained_stream_bytes', 'deduplicated_progress_records', 'deduplicated_progress_bytes', 'uncaptured_stream_bytes', 'max_pending_stdout_bytes']) changed[key] = 1
  for (const key of ['raw_stdout_sha256', 'raw_stderr_sha256', 'captured_stdout_sha256', 'captured_stderr_sha256']) changed[key] = 'bad'
  for (const [key, value] of Object.entries(changed)) {
    for (const replacement of [value, undefined]) {
      const receipt = initialRuntimeFailureReceipt({ [key]: replacement })
      assert.equal(initialRuntimeRecoveryPlan(receipt, 90000, null), null, key)
      const h = initialRuntimeHarness({ error: initialRuntimeError(receipt) })
      try { await assert.rejects(h.run(), error => error === h.error); assert.equal(h.calls.length, 1); assert.equal(h.plans.length, 0) }
      finally { h.close() }
    }
  }
})

test('unknown metadata and exception messages cannot authorize an initial runtime recovery', async () => {
  for (const value of [null, {}, new Error('silent60000 deadline SIGKILL runtimes-before'),
    initialRuntimeError({}), initialRuntimeError(initialRuntimeFailureReceipt({ arguments: ['simctl', 'list', 'runtimes', '--json', 'extra'] }))]) {
    const error = value, h = initialRuntimeHarness({ error })
    try { await assert.rejects(h.run(), thrown => thrown === error); assert.equal(h.calls.length, 1); assert.equal(h.plans.length, 0) }
    finally { h.close() }
  }
  const error = new Error('metadata getter'); Object.defineProperty(error, 'pilotCommand', { get() { throw new Error('not original') } })
  const h = initialRuntimeHarness({ error }); try { await assert.rejects(h.run(), value => value === error) } finally { h.close() }
  const circular = []; circular.push(circular)
  assert.equal(initialRuntimeRecoveryPlan(initialRuntimeFailureReceipt({ arguments: circular }), 90000, null), null)
  for (const elapsed_ms of [NaN, Infinity, '60000']) assert.equal(initialRuntimeRecoveryPlan(initialRuntimeFailureReceipt({ elapsed_ms }), 90000, null), null)
})

test('successful first runtime inventory requires one read and no recovery plan', async () => {
  const value = { runtimes: [runtime] }, h = initialRuntimeHarness({ first: () => value, onPlan: () => assert.fail('no plan') })
  try { assert.equal(await h.run(), value); assert.deepEqual(h.sequence, ['runtimes-before']); assert.equal(h.plans.length, 0) } finally { h.close() }
})

test('eligible initial failure keeps first receipt and error identity then records plan before one fresh result', async () => {
  const first = initialRuntimeError(), before = JSON.stringify(first.pilotCommand), fresh = { runtimes: [runtime] }
  const h = initialRuntimeHarness({ error: first, fresh: original => { assert.equal(original, first); return fresh } })
  try {
    assert.equal(await h.run(), fresh); assert.deepEqual(h.sequence, ['runtimes-before', 'plan', 'runtimes-before-recovery'])
    assert.equal(h.plans.length, 1); assert.equal(h.calls.length, 2); assert.equal(h.calls[1].originalError, first)
    assert.equal(JSON.stringify(first.pilotCommand), before)
  } finally { h.close() }
})

test('first JSON, shape or strict runtime validation failures remain outside initial recovery', async () => {
  let jsonError; try { JSON.parse('{bad') } catch (error) { jsonError = error }
  const brokenJSON = initialRuntimeHarness({ first: () => { throw jsonError } })
  try { await assert.rejects(brokenJSON.run(), error => error === jsonError); assert.equal(brokenJSON.calls.length, 1); assert.equal(brokenJSON.plans.length, 0) }
  finally { brokenJSON.close() }
  for (const value of [{}, { runtimes: null }, { runtimes: [{ ...runtime, buildversion: undefined }] }, { runtimes: [runtime, runtime] }]) {
    const h = initialRuntimeHarness({ first: () => value })
    try {
      const data = await h.run(); assert.throws(() => { runtimeReceipt(data); selectExact17(data) })
      assert.equal(h.calls.length, 1); assert.equal(h.plans.length, 0)
    } finally { h.close() }
  }
})

test('nonempty output and consent/error stops cannot become silent initial-read eligibility', async () => {
  for (const receipt of [initialRuntimeFailureReceipt({ observed_stream_bytes: 1 }),
    initialRuntimeFailureReceipt({ stdout_diagnostic_tail: 'Sign in with Apple Account' }),
    initialRuntimeFailureReceipt({ stop: 'auth-or-new-consent-required' }), initialRuntimeFailureReceipt({ error: 'xcrun failed' })]) {
    const h = initialRuntimeHarness({ error: initialRuntimeError(receipt) })
    try { await assert.rejects(h.run(), error => error === h.error); assert.equal(h.calls.length, 1); assert.equal(h.plans.length, 0) }
    finally { h.close() }
  }
})

test('initial recovery requires full30s both before plan and after plan and retains first error on clipped budget', async () => {
  for (const remaining of [29999, -1, NaN, Infinity, '30000']) {
    const h = initialRuntimeHarness({ remaining: () => remaining })
    try { await assert.rejects(h.run(), error => error === h.error); assert.equal(h.plans.length, 0); assert.equal(h.calls.length, 1) }
    finally { h.close() }
  }
  for (const afterPlan of [29999, NaN, Infinity]) {
    let reads = 0; const h = initialRuntimeHarness({ remaining: () => ++reads === 1 ? 60000 : afterPlan })
    try { await assert.rejects(h.run(), error => error === h.error); assert.equal(h.plans.length, 1); assert.equal(h.calls.length, 1) }
    finally { h.close() }
  }
})

test('known cancellation before first, after failure, during plan or before fresh prevents new initial work', async () => {
  for (const point of ['before-first', 'after-first', 'during-plan', 'before-fresh']) {
    let h, budgetCalls = 0
    h = initialRuntimeHarness({ first: () => { if (point === 'after-first') h.events.emit('SIGTERM'); throw h.error },
      onPlan: async () => { if (point === 'during-plan') { await Promise.resolve(); h.events.emit('SIGTERM') } },
      remaining: () => { budgetCalls++; if (point === 'before-fresh' && budgetCalls === 2) h.events.emit('SIGTERM'); return 90000 } })
    if (point === 'before-first') h.events.emit('SIGTERM')
    try {
      await assert.rejects(h.run(), /Pilot cancelled/); assert.equal(h.cancellation.signal, 'SIGTERM')
      assert.equal(h.calls.length, point === 'before-first' ? 0 : 1)
      assert.equal(h.plans.length, ['during-plan', 'before-fresh'].includes(point) ? 1 : 0)
    } finally { h.close() }
  }
  assert.equal(initialRuntimeRecoveryPlan(initialRuntimeFailureReceipt(), 90000, 'SIGINT'), null)
})

test('recovery-plan write failure starts no fresh query and leaves first command metadata unchanged', async () => {
  const failedWrite = new Error('fixture plan write failure'), first = initialRuntimeError(), text = JSON.stringify(first.pilotCommand)
  const h = initialRuntimeHarness({ error: first, onPlan: () => { throw failedWrite } })
  try {
    await assert.rejects(h.run(), error => error === failedWrite); assert.equal(h.calls.length, 1); assert.equal(h.plans.length, 1)
    assert.equal(JSON.stringify(first.pilotCommand), text)
  } finally { h.close() }
})

test('fresh command failure or malformed JSON receives no third read or mutation operation', async () => {
  let parseError; try { JSON.parse('{fresh-bad') } catch (error) { parseError = error }
  for (const failure of [initialRuntimeError(initialRuntimeFailureReceipt({ name: 'runtimes-before-recovery', timeout_ms: 30000, elapsed_ms: 30001 })), parseError]) {
    const h = initialRuntimeHarness({ fresh: () => { throw failure } })
    try { await assert.rejects(h.run(), error => error === failure); assert.equal(h.calls.length, 2); assert.equal(h.plans.length, 1) }
    finally { h.close() }
  }
})

test('fresh shape and strict identifier/build/duplicate failures stop outside helper without a third read', async () => {
  for (const data of [{}, { runtimes: null }, { runtimes: [runtime, runtime] },
    { runtimes: [{ ...runtime, identifier: 'wrong' }] }, { runtimes: [{ ...runtime, buildversion: undefined }] }]) {
    const h = initialRuntimeHarness({ fresh: () => data })
    try {
      const value = await h.run(); assert.throws(() => { runtimeReceipt(value); selectExact17(value) })
      assert.equal(h.calls.length, 2); assert.equal(h.plans.length, 1)
    } finally { h.close() }
  }
})

test('fresh valid inventory without available17 keeps null selection and the existing conditional acquisition contract', async () => {
  for (const runtimes of [[], [{ ...runtime, isAvailable: false }], [{ ...runtime, name: 'iOS17.5', version: '17.5' }]]) {
    const h = initialRuntimeHarness({ fresh: () => ({ runtimes }) })
    try {
      const before = await h.run(); runtimeReceipt(before); assert.equal(selectExact17(before), null)
      const records = []; let imports = 0
      const selected = await ensureDownloadedRuntime({ query: async () => ({ runtimes: [runtime] }),
        record: (name, value) => records.push({ name, value }), importRuntime: async () => { imports++ } })
      assert.equal(selected, runtime); assert.equal(imports, 0); assert.ok(records.some(row => row.name === 'runtimes-after-download.json'))
      assert.equal(h.calls.length, 2)
    } finally { h.close() }
  }
})

test('original initial failure is forwarded for existing runner full-cap refusal without another attempt', async () => {
  const first = initialRuntimeError(), intents = [], h = initialRuntimeHarness({ error: first,
    fresh: original => { assert.equal(original, first); assert.equal(intents.length, 0); throw original } })
  try { await assert.rejects(h.run(), error => error === first); assert.equal(h.calls.length, 2); assert.equal(h.plans.length, 1); assert.equal(intents.length, 0) }
  finally { h.close() }
})

async function initialOwnedNode(t, script, killAfterMs = null) {
  const child = spawn(process.execPath, ['-e', script], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const stdout = [], stderr = []; let closed = false, timer
  child.stdout.on('data', bytes => stdout.push(bytes)); child.stderr.on('data', bytes => stderr.push(bytes))
  t.after(() => { clearTimeout(timer); if (!closed) { try { process.kill(-child.pid, 'SIGKILL') } catch {} } })
  if (killAfterMs !== null) timer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL') } catch {} }, killAfterMs)
  const result = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => { closed = true; resolve({ code, signal }) }) })
  clearTimeout(timer); return { ...result, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }
}

test('owned Node fixtures use an explicit synthetic full-timeout receipt then one fresh JSON read through production helper',
  { skip: process.platform === 'win32' }, async t => {
    let savedFirst
    const h = initialRuntimeHarness({ first: async () => {
      const result = await initialOwnedNode(t, 'setInterval(()=>{},1000)', 40)
      assert.deepEqual({ code: result.code, signal: result.signal }, { code: null, signal: 'SIGKILL' })
      assert.equal(result.stdout.length, 0); assert.equal(result.stderr.length, 0)
      // This fixture's clock is synthetic60000ms; its actual child is deliberately bounded to40ms.
      savedFirst = initialRuntimeError(initialRuntimeFailureReceipt({ code: result.code, signal: result.signal, elapsed_ms: 60000 }))
      throw savedFirst
    }, fresh: async original => {
      assert.equal(original, savedFirst)
      const result = await initialOwnedNode(t, 'process.stdout.write(JSON.stringify({runtimes:[]}))')
      assert.equal(result.code, 0); assert.equal(result.signal, null); assert.equal(result.stderr.length, 0)
      return JSON.parse(result.stdout.toString('utf8'))
    } })
    try {
      const value = await h.run(); assert.equal(selectExact17(value), null); assert.equal(h.calls.length, 2); assert.equal(h.plans.length, 1)
      assert.equal(savedFirst.pilotCommand.timeout_ms, 60000); assert.deepEqual(h.sequence, ['runtimes-before', 'plan', 'runtimes-before-recovery'])
    } finally { h.close() }
  })

test('initial and existing postboot recovery stay separate command-specific predicates', () => {
  assert.equal(initialRuntimeRecoveryPlan(timeoutReceipt(), 90000, null), null)
  assert.equal(postbootRecoveryAllowed(initialRuntimeFailureReceipt(), 90000, null), false)
  assert.equal(postbootRecoveryAllowed(timeoutReceipt(), 60000, null), true)
})
