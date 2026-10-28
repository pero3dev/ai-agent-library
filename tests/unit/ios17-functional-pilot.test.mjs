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
