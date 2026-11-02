import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { nativeSimulatorContract as C, prepareNativeSimulator, cleanupNativeSimulator, main, readNativeGitIdentity } from '../../ios/tests/native-simulator-prepare.mjs'

const NEW = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'
const OLD = 'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB'
const OTHER = 'CCCCCCCC-CCCC-4CCC-8CCC-CCCCCCCCCCCC'
const TOKEN = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const ctx = { repository: C.repository, job: 'ios-native', run_id: '12345', run_attempt: '2',
  source_head: 'a'.repeat(40), checkout_sha: 'b'.repeat(40), source_tree: 'c'.repeat(40), developer_dir: C.developer }
const clone = x => JSON.parse(JSON.stringify(x))
function fixture(options = {}) {
  const files = new Map(), calls = [], outputs = {}, existing = clone(options.existing ?? [])
  let made = null, listCount = 0, clock = 0
  const store = { has: k => files.has(k), read: k => { assert.ok(files.has(k), 'Missing ' + k); return clone(files.get(k)) },
    write: (k, v) => { assert.ok(!files.has(k), 'Duplicate ' + k); options.storeHook?.(k, clone(v), files); files.set(k, clone(v)) } }
  const response = (value = '', status = 0) => ({ status, signal: null, error: null,
    stdout: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)), stderr: Buffer.alloc(0) })
  const device = (udid, name = 'iPhone 16', state = 'Shutdown') => ({ udid, name, state, isAvailable: true, deviceTypeIdentifier: C.type })
  const execute = (binary, args, settings) => {
    calls.push({ binary, args: [...args], settings })
    if (options.intercept) {
      const replacement = options.intercept(binary, args, settings)
      if (replacement) return replacement
    }
    if (binary === '/usr/bin/xcodebuild') return response(options.xcode ?? 'Xcode 16.4\nBuild version 16F6\n')
    if (args[0] === '--sdk') return response(options.sdk ?? '18.5\n')
    assert.equal(binary, '/usr/bin/xcrun'); assert.equal(args[0], 'simctl')
    if (args[1] === 'list' && args[2] === 'runtimes') return response({ runtimes: options.runtimes ?? [
      { identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] })
    if (args[1] === 'list' && args[2] === 'devicetypes') return response({ devicetypes: options.types ?? [{ identifier: C.type, name: C.model }] })
    if (args[1] === 'list' && args[2] === 'devices') {
      listCount++
      if (options.listHook) options.listHook({ made, listCount })
      return response({ devices: { [C.runtime]: [...existing, ...(made ? [made] : [])] } })
    }
    if (args[1] === 'create') {
      if (options.createFailure) return response(NEW + '\n', 19)
      if (options.createOutput !== undefined) return response(options.createOutput)
      made = device(NEW, args[2]); return response(NEW + '\n')
    }
    if (args[1] === 'boot') {
      if (options.bootFailure) return response('boot failed', 23)
      made.state = 'Booted'; return response()
    }
    if (args[1] === 'bootstatus') return response('', options.bootstatusFailure ? 24 : 0)
    if (args[1] === 'shutdown') {
      if (options.shutdownFailure) return response('shutdown failed', 25)
      made.state = 'Shutdown'; return response()
    }
    if (args[1] === 'delete') {
      if (options.deleteFailure) return response('delete failed', 26)
      made = null; return response()
    }
    throw new Error('Unexpected command ' + args.join(' '))
  }
  const common = { context: ctx, store, execute, now: () => (clock += options.clockIncrement ?? 1),
    env: { HOME: '/fixture-home', GITHUB_TOKEN: 'must-not-pass', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'must-not-pass' } }
  return { files, calls, outputs, store, device, advance: ms => { clock += ms }, get made() { return made }, set made(x) { made = x },
    prepare: () => prepareNativeSimulator({ ...common, makeToken: () => TOKEN,
      onToken: x => { outputs.token = x }, onCreated: x => { outputs.UUID = x }, onReady: x => { outputs.destination = x } }),
    cleanup: extra => cleanupNativeSimulator({ ...common, token: outputs.token || '', createdUUID: outputs.UUID || '', ...extra }),
    destructive: () => calls.filter(x => ['shutdown', 'delete'].includes(x.args[1])) }
}

test('no existing named device still creates, boots and binds one fresh UUID to the destination', () => {
  const h = fixture(), ready = h.prepare()
  assert.equal(ready.UUID, NEW); assert.equal(ready.destination, `platform=iOS Simulator,id=${NEW}`)
  assert.equal(h.outputs.destination, ready.destination); assert.equal(h.outputs.UUID, NEW)
  assert.deepEqual(h.calls.filter(x => ['create', 'boot', 'bootstatus'].includes(x.args[1])).map(x => x.args.slice(0, 2)),
    [['simctl', 'create'], ['simctl', 'boot'], ['simctl', 'bootstatus']])
  assert.equal(h.store.read('ready').inventory.device.state, 'Booted')
  for (const c of h.calls) { assert.equal(c.settings.env.GITHUB_TOKEN, undefined); assert.equal(c.settings.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, undefined) }
})

test('duplicate existing iPhone16 names are preserved and never reused', () => {
  const h = fixture({ existing: [{ udid: OLD, name: 'iPhone 16' }, { udid: OTHER, name: 'iPhone 16' }] })
  assert.equal(h.prepare().UUID, NEW); assert.deepEqual(h.store.read('intent').preexisting_UUIDs, [OLD, OTHER])
  const r = h.cleanup(); assert.equal(r.ok, true)
  assert.ok(h.destructive().every(x => x.args[2] === NEW)); assert.equal(h.destructive().some(x => x.args[2] === OLD), false)
})

for (const runtimes of [[], [{ identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: false }]]) {
  test('missing/unavailable18.5 Runtime fails before create and cleanup has no device authority: ' + runtimes.length, () => {
    const h = fixture({ runtimes }); assert.throws(h.prepare, /available iOS 18.5 Runtime/)
    assert.equal(h.calls.some(x => x.args[1] === 'create'), false); assert.equal(h.cleanup().status, 'not-created')
    assert.equal(h.calls.some(x => x.args[2] === 'devicetypes'), false)
    assert.equal(h.destructive().length, 0)
  })
}
for (const types of [[], [{ identifier: C.type, name: C.model }, { identifier: C.type, name: C.model }]]) {
  test('absent or ambiguous iPhone16 type fails before create: ' + types.length, () => {
    const h = fixture({ types }); assert.throws(h.prepare, /iPhone 16 device type/)
    assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
  })
}

test('create failure never supplies UUID/ready and cannot authorize destructive cleanup', () => {
  const h = fixture({ createFailure: true }); assert.throws(h.prepare, /command failed: create/)
  assert.equal(h.outputs.UUID, undefined); assert.equal(h.outputs.destination, undefined)
  assert.equal(h.cleanup().status, 'creation-unproven-no-destructive-action'); assert.equal(h.destructive().length, 0)
})
test('create returning a preexisting UUID cannot authorize boot or cleanup', () => {
  const h = fixture({ existing: [{ udid: OLD, name: 'iPhone 16' }], createOutput: OLD + '\n' })
  assert.throws(h.prepare, /preexisting UUID/); assert.equal(h.calls.some(x => x.args[1] === 'boot'), false)
  assert.throws(() => h.cleanup({ createdUUID: OLD }), /preexisting UUID/); assert.equal(h.destructive().length, 0)
})
test('malformed create stdout cannot select or delete a guessed UUID', () => {
  const h = fixture({ createOutput: NEW + '\nextra\n' }); assert.throws(h.prepare, /only one UUID/)
  assert.throws(() => h.cleanup({ createdUUID: NEW }), /only one UUID/); assert.equal(h.destructive().length, 0)
})
for (const flag of ['bootFailure', 'bootstatusFailure']) {
  test(flag + ' preserves successful create proof so partial preparation can be cleaned safely', () => {
    const h = fixture({ [flag]: true }); assert.throws(h.prepare, /command failed/)
    assert.equal(h.outputs.UUID, NEW); assert.equal(h.outputs.destination, undefined)
    assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW)); assert.equal(h.made, null)
  })
}
test('post-boot ownership change fails readiness and refuses cleanup', () => {
  const h = fixture({ listHook: ({ made, listCount }) => { if (made && listCount >= 3) made.name = 'unknown owner' } })
  assert.throws(h.prepare); assert.throws(h.cleanup); assert.equal(h.destructive().length, 0)
})
for (const extra of [{ token: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' }, { createdUUID: OTHER },
  { context: { ...ctx, run_id: '999' } }, { context: { ...ctx, source_head: 'd'.repeat(40) } }]) {
  test('wrong token/UUID/run/source refuses cleanup: ' + JSON.stringify(extra), () => {
    const h = fixture(); h.prepare(); assert.throws(() => h.cleanup(extra)); assert.equal(h.destructive().length, 0)
  })
}
test('fake owner record is not authority without agreement with create stdout and external step output', () => {
  const h = fixture(); h.prepare(); h.files.get('created').UUID = OTHER
  assert.throws(h.cleanup); assert.equal(h.destructive().length, 0)
})
test('forged preexisting exclusion disagrees with the independently captured pre-create inventory', () => {
  const h = fixture({ existing: [{ udid: OLD, name: 'iPhone 16' }] }); h.prepare(); h.files.get('intent').preexisting_UUIDs = []
  assert.throws(h.cleanup); assert.equal(h.destructive().length, 0)
})
test('fake successful create flag cannot override a failed command status', () => {
  const h = fixture(); h.prepare(); h.files.get('create').status = 19
  assert.throws(h.cleanup); assert.equal(h.destructive().length, 0)
})
test('preexisting UUID cannot become cleanup authority by editing owner and step output', () => {
  const h = fixture({ existing: [{ udid: OLD, name: 'iPhone 16' }] }); h.prepare()
  h.outputs.UUID = OLD; h.files.get('created').UUID = OLD
  assert.throws(h.cleanup); assert.equal(h.destructive().length, 0)
})
test('already absent owned device is accepted without shutdown/delete', () => {
  const h = fixture(); h.prepare(); h.made = null
  assert.equal(h.cleanup().status, 'already-absent'); assert.equal(h.destructive().length, 0)
})
test('shutdown failure still attempts only the proved delete, but reports partial cleanup', () => {
  const h = fixture({ shutdownFailure: true }); h.prepare(); const r = h.cleanup()
  assert.equal(r.ok, false); assert.equal(r.shutdown_ok, false); assert.equal(r.absent_after, true)
  assert.deepEqual(h.destructive().map(x => x.args[1]), ['shutdown', 'delete']); assert.equal(h.made, null)
})
test('delete failure remains visible rather than claiming cleanup success', () => {
  const h = fixture({ deleteFailure: true }); h.prepare(); const r = h.cleanup()
  assert.equal(r.ok, false); assert.equal(r.delete_ok, false); assert.equal(r.absent_after, false)
})
test('changed owner after shutdown refuses delete even after a legitimate shutdown', () => {
  const h = fixture({ listHook: ({ made, listCount }) => { if (made && listCount === 5) made.name = 'different owner' } })
  h.prepare(); assert.throws(h.cleanup); assert.deepEqual(h.destructive().map(x => x.args[1]), ['shutdown'])
})
test('no intent and no outputs performs no simulator commands', () => {
  const h = fixture(); assert.equal(h.cleanup().status, 'not-created'); assert.equal(h.calls.length, 0)
})
test('expired shared preparation deadline prevents a later create', () => {
  const h = fixture({ clockIncrement: 100000 }); assert.throws(h.prepare, /deadline/)
  assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
})
test('workflow uses the same prepared UUID for both tests, then cleans after failure collector', () => {
  const w = fs.readFileSync(fileURLToPath(new URL('../../.github/workflows/ios-native.yml', import.meta.url)), 'utf8')
  assert.equal((w.match(/AILIBRARY_NATIVE_DESTINATION: \$\{\{ steps\.native_simulator\.outputs\.destination \}\}/g) ?? []).length, 2)
  assert.equal((w.match(/-destination "\$AILIBRARY_NATIVE_DESTINATION"/g) ?? []).length, 2)
  assert.equal(w.includes("-destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5'"), false)
  assert.ok(w.indexOf('id: native_simulator') < w.indexOf('name: Run native XCTest'))
  assert.ok(w.indexOf('node ios/tests/native-simulator-prepare.mjs cleanup') > w.indexOf('name: Retain optional selected Native failure attachments'))
  assert.match(w, /name: Clean up only the proven owned Native Simulator\n\s+if: always\(\)/)
  assert.match(w, /timeout-minutes: 40/); assert.match(w, /persist-credentials: false/)
})

for (const input of [{ xcode: 'Xcode 26.0\nBuild version 17A1\n' }, { sdk: '26.0\n' }]) {
  test('different toolchain fails before any Runtime or Simulator operation: ' + JSON.stringify(input), () => {
    const h = fixture(input); assert.throws(h.prepare)
    assert.equal(h.calls.some(x => x.args[0] === 'simctl'), false)
    assert.equal(h.outputs.destination, undefined)
  })
}
test('duplicate exact Runtime identifiers fail before device-type inquiry or creation', () => {
  const runtime = { identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }
  const h = fixture({ runtimes: [runtime, { ...runtime, isAvailable: false }] })
  assert.throws(h.prepare, /available iOS 18.5 Runtime/)
  assert.equal(h.calls.some(x => x.args[2] === 'devicetypes'), false)
  assert.equal(h.outputs.UUID, undefined)
})
test('timed-out create with UUID stdout remains unproven and is not retried or deleted', () => {
  const h = fixture({ intercept: (binary, args) => args[1] === 'create' ? {
    status: null, signal: 'SIGKILL', error: Object.assign(new Error('spawnSync xcrun ETIMEDOUT'), { code: 'ETIMEDOUT' }),
    stdout: Buffer.from(NEW + '\n'), stderr: Buffer.alloc(0) } : null })
  assert.throws(h.prepare, /command failed: create/)
  assert.equal(h.store.read('create').error_code, 'ETIMEDOUT')
  assert.equal(h.calls.filter(x => x.args[1] === 'create').length, 1)
  assert.equal(h.cleanup().status, 'creation-unproven-no-destructive-action')
  assert.equal(h.destructive().length, 0)
})
test('successful create without external step UUID cannot authorize cleanup', () => {
  const h = fixture(); h.prepare()
  assert.throws(() => h.cleanup({ createdUUID: '' })); assert.equal(h.destructive().length, 0)
})
test('different device type on the same UUID refuses cleanup before shutdown', () => {
  const h = fixture(); h.prepare(); h.made.deviceTypeIdentifier = 'com.apple.CoreSimulator.SimDeviceType.iPhone-15'
  assert.throws(h.cleanup, /device type/); assert.equal(h.destructive().length, 0)
})

test('omitted optional device-type field uses exact inventory/create proof while keeping UUID/name/runtime checks', () => {
  const h = fixture({ listHook: ({ made }) => { if (made) delete made.deviceTypeIdentifier } })
  assert.equal(h.prepare().UUID, NEW)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})

// New controls use only the injected Native executor, in-memory store and clock.
const nativeTimeout = (extra = {}) => ({ status: null, signal: 'SIGKILL',
  error: Object.assign(new Error('spawnSync /usr/bin/xcrun ETIMEDOUT'), { code: 'ETIMEDOUT' }),
  stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), ...extra })
const receiptSHA = value => createHash('sha256').update(JSON.stringify(value, null, 2) + '\n').digest('hex')
function isInventoryRole(role, h, args) {
  if (args[0] !== 'simctl' || args[1] !== 'list') return false
  if (role === 'runtimes') return args[2] === 'runtimes'
  if (role === 'device-types') return args[2] === 'devicetypes'
  if (args[2] !== 'devices') return false
  if (role === 'devices-before-create') return h.made === null
  return h.made?.state === (role === 'devices-after-create' ? 'Shutdown' : 'Booted')
}
for (const role of ['runtimes', 'device-types', 'devices-before-create', 'devices-after-create', 'devices-after-boot']) {
  test(role + ': one exact Native timeout gets one distinct successful read under the same deadline', () => {
    let h, attempts = 0
    h = fixture({ intercept: (binary, args, settings) => {
      if (isInventoryRole(role, h, args) && ++attempts === 1) { h.advance(settings.timeout); return nativeTimeout() }
      return null
    } })
    const ready = h.prepare(), first = h.store.read(role), second = h.store.read(role + '-timeout-retry-1')
    assert.equal(attempts, 2); assert.equal(first.timeout_ms, 60000)
    assert.equal(first.status, null); assert.equal(first.signal, 'SIGKILL'); assert.equal(first.error_code, 'ETIMEDOUT')
    assert.equal(first.error, 'spawnSync /usr/bin/xcrun ETIMEDOUT'); assert.equal(first.output_complete, false)
    assert.equal(second.status, 0); assert.equal(second.returned_within_deadline, true)
    assert.equal(h.files.has(role + '-timeout-retry-2'), false)
    assert.equal(ready.UUID, NEW); assert.equal(h.outputs.destination, `platform=iOS Simulator,id=${NEW}`)
    const intent = h.store.read('intent')
    assert.equal(intent.before_devices_attempt_label, role === 'devices-before-create' ? role + '-timeout-retry-1' : 'devices-before-create')
    assert.equal(intent.before_devices_receipt_SHA256, receiptSHA(h.store.read(intent.before_devices_attempt_label)))
    const originalFirst = clone(first), originalSecond = clone(second)
    assert.equal(h.cleanup().ok, true)
    assert.deepEqual(h.store.read(role), originalFirst); assert.deepEqual(h.store.read(role + '-timeout-retry-1'), originalSecond)
    assert.ok(h.destructive().every(x => x.args[2] === NEW))
  })
  test(role + ': a second timeout stops without a third prepare attempt or ready handoff', () => {
    let h, attempts = 0
    h = fixture({ intercept: (binary, args, settings) => {
      if (isInventoryRole(role, h, args)) { attempts++; h.advance(settings.timeout); return nativeTimeout() }
      return null
    } })
    assert.throws(h.prepare, /command failed|deadline/)
    assert.equal(attempts, 2); assert.equal(h.files.has(role + '-timeout-retry-2'), false)
    assert.equal(h.outputs.destination, undefined)
    if (role === 'runtimes' || role === 'device-types' || role === 'devices-before-create') {
      assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
    }
  })
}
for (const [name, replacement] of [
  ['nonzero', { status: 23, signal: null, error: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }],
  ['wrong-signal', nativeTimeout({ signal: 'SIGTERM' })],
  ['no-signal', nativeTimeout({ signal: null })],
  ['wrong-status', nativeTimeout({ status: 0 })],
  ['ENOENT', nativeTimeout({ error: Object.assign(new Error('missing'), { code: 'ENOENT' }) })],
  ['ENOBUFS', nativeTimeout({ error: Object.assign(new Error('output cap'), { code: 'ENOBUFS' }) })],
  ['missing-code', nativeTimeout({ error: new Error('ETIMEDOUT text alone is not authority') })]
]) {
  test('unknown Native receipt family never retries: ' + name, () => {
    const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? replacement : null })
    assert.throws(h.prepare); assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
    assert.equal(h.files.has('runtimes-timeout-retry-1'), false)
    assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
  })
}
test('malformed successful inventory JSON is not a timeout retry', () => {
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? {
    status: 0, signal: null, error: null, stdout: Buffer.from('{'), stderr: Buffer.alloc(0) } : null })
  assert.throws(h.prepare); assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(h.files.has('runtimes-timeout-retry-1'), false)
})
test('retry read timeout is clipped to the shared480s remainder without resetting the clock', () => {
  let h, attempts = 0
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(C.prepareMs - 90000) },
    intercept: (binary, args, settings) => {
      if (args[2] === 'runtimes' && ++attempts === 1) { h.advance(settings.timeout); return nativeTimeout() }
      return null
    } })
  h.prepare()
  assert.equal(h.store.read('runtimes').timeout_ms, 60000)
  const second = h.store.read('runtimes-timeout-retry-1')
  assert.ok(second.timeout_ms > 29000 && second.timeout_ms < 30000)
  assert.equal(attempts, 2)
})
test('first read clips below60s; exhaustion after timeout prevents even a retry spawn', () => {
  let h
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(C.prepareMs - 30000) },
    intercept: (binary, args, settings) => {
      if (args[2] === 'runtimes') { h.advance(settings.timeout); return nativeTimeout() }
      return null
    } })
  assert.throws(h.prepare, /deadline/)
  assert.ok(h.store.read('runtimes').timeout_ms > 29000 && h.store.read('runtimes').timeout_ms < 30000)
  assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(h.files.has('runtimes-timeout-retry-1'), false)
})
test('successful inventory returned after the shared deadline is rejected, not retried', () => {
  let h
  h = fixture({ intercept: (binary, args) => { if (args[2] === 'runtimes') h.advance(C.prepareMs); return null } })
  assert.throws(h.prepare, /deadline/)
  assert.equal(h.store.read('runtimes').status, 0); assert.equal(h.store.read('runtimes').returned_within_deadline, false)
  assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(h.outputs.destination, undefined)
})
for (const label of ['devices-after-boot', 'ready']) {
  test('deadline consumed by ' + label + ' persistence cannot hand off a ready destination', () => {
    let h
    h = fixture({ storeHook: key => { if (key === label) h.advance(C.prepareMs) } })
    assert.throws(h.prepare, /deadline/); assert.equal(h.outputs.destination, undefined)
    assert.ok(h.files.has('prepare-failure'))
    assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
  })
}
for (const [name, tamper] of [
  ['missing-label', h => { delete h.files.get('intent').before_devices_attempt_label }],
  ['unknown-label', h => { h.files.get('intent').before_devices_attempt_label = 'devices-before-create-timeout-retry-2' }],
  ['wrong-role', h => { h.files.get('intent').before_devices_attempt_label = 'runtimes' }],
  ['nonstring-label', h => { h.files.get('intent').before_devices_attempt_label = ['devices-before-create'] }],
  ['wrong-canonical-receipt-SHA', h => { h.files.get('intent').before_devices_receipt_SHA256 = '0'.repeat(64) }],
  ['wrong-stdout-SHA', h => { h.files.get('intent').before_devices_stdout_SHA256 = '0'.repeat(64) }],
  ['missing-accepted-receipt', h => { h.files.delete('devices-before-create') }],
  ['wrong-argv', h => { h.files.get('devices-before-create').arguments[2] = 'runtimes' }],
  ['wrong-binary', h => { h.files.get('devices-before-create').binary = '/usr/bin/false' }],
  ['noncanonical-base64', h => { h.files.get('devices-before-create').stdout_base64 += '!' }],
  ['late-receipt', h => { h.files.get('devices-before-create').returned_within_deadline = false }],
  ['unknown-timeout-cap', h => { h.files.get('devices-before-create').timeout_ms = 60001 }],
  ['duplicate-attempt', h => { h.files.set('devices-before-create-timeout-retry-1', h.store.read('devices-before-create')) }]
]) {
  test('cleanup refuses changed pre-create accepted proof before any simctl command: ' + name, () => {
    const h = fixture(); h.prepare(); const count = h.calls.length; tamper(h)
    assert.throws(h.cleanup); assert.equal(h.calls.length, count); assert.equal(h.destructive().length, 0)
  })
}
test('accepted retry requires its original timeout proof and matching accepted raw stdout', () => {
  let h, count = 0
  h = fixture({ intercept: (binary, args) => {
    if (args[2] === 'devices' && h.made === null && ++count === 1) return nativeTimeout()
    return null
  } })
  h.prepare(); assert.equal(h.store.read('intent').before_devices_attempt_label, 'devices-before-create-timeout-retry-1')
  h.files.get('devices-before-create').error_code = 'ENOENT'
  const prior = h.calls.length; assert.throws(h.cleanup); assert.equal(h.calls.length, prior)
})
test('late post-create inventory cannot hand off ready, but successful creation remains cleanable', () => {
  let h, late = false
  h = fixture({ intercept: (binary, args) => {
    if (!late && args[2] === 'devices' && h.made?.state === 'Shutdown') { late = true; h.advance(C.prepareMs) }
    return null
  } })
  assert.throws(h.prepare, /deadline/); assert.equal(h.outputs.UUID, NEW); assert.equal(h.outputs.destination, undefined)
  assert.equal(h.calls.filter(x => x.args[1] === 'create').length, 1)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})
test('boot timeout is unrepeatable and cleanup acts only on the proved fresh UUID', () => {
  const h = fixture({ intercept: (binary, args) => args[1] === 'boot' ? nativeTimeout() : null })
  assert.throws(h.prepare, /command failed: boot/); assert.equal(h.calls.filter(x => x.args[1] === 'boot').length, 1)
  assert.equal(h.calls.find(x => x.args[1] === 'boot').settings.timeout, 30000)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})
test('cleanup read retains15s and retry0 even for the exact Native timeout family', () => {
  let cleaning = false
  const h = fixture({ intercept: (binary, args) => cleaning && args[1] === 'list' ? nativeTimeout() : null })
  h.prepare(); cleaning = true; const prior = h.calls.length
  assert.throws(h.cleanup, /command failed: cleanup-before/)
  assert.equal(h.calls.length - prior, 1); assert.equal(h.calls.at(-1).settings.timeout, 15000)
  assert.equal(h.files.has('cleanup-before-timeout-retry-1'), false); assert.equal(h.destructive().length, 0)
})
test('unchanged command caps apply to all mutations, toolchain checks and cleanup inventories', () => {
  const h = fixture(); h.prepare(); h.cleanup()
  const cap = label => h.store.read(label).timeout_ms
  for (const label of ['xcode', 'sdk', 'cleanup-before', 'cleanup-before-delete', 'cleanup-after', 'cleanup-shutdown']) assert.equal(cap(label), 15000)
  assert.equal(cap('create'), 30000); assert.equal(cap('boot'), 30000); assert.equal(cap('bootstatus'), 300000); assert.equal(cap('cleanup-delete'), 30000)
  const w = fs.readFileSync(fileURLToPath(new URL('../../.github/workflows/ios-native.yml', import.meta.url)), 'utf8')
  assert.match(w, /id: native_simulator\n\s+timeout-minutes: 9/)
  assert.match(w, /name: Clean up only the proven owned Native Simulator\n\s+if: always\(\)\n\s+timeout-minutes: 3/)
  assert.equal(C.prepareMs, 480000); assert.equal(C.cleanupMs, 90000)
})
test('exact512KiB inventory output is accepted; one byte above cannot authorize a timeout retry', () => {
  const valid = JSON.stringify({ runtimes: [{ identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] })
  const exact = Buffer.from(valid + ' '.repeat(C.inventoryOutputBytes - Buffer.byteLength(valid)))
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? {
    status: 0, signal: null, error: null, stdout: exact, stderr: Buffer.alloc(0) } : null })
  h.prepare(); assert.equal(h.store.read('runtimes').stdout_bytes, C.inventoryOutputBytes)
  const over = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? nativeTimeout({ stdout: Buffer.alloc(C.inventoryOutputBytes + 1) }) : null })
  assert.throws(over.prepare); assert.equal(over.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(over.files.has('runtimes-timeout-retry-1'), false)
})
test('injected evidence-store16MiB boundary refusal stops before any Simulator command', () => {
  const bytes = x => Buffer.byteLength(JSON.stringify(x, null, 2) + '\n')
  const h = fixture({ storeHook: (label, value, files) => {
    const total = [...files.values()].reduce((sum, item) => sum + bytes(item), 0)
    assert.ok(total + bytes(value) <= C.evidenceBytes, 'injected evidence cap')
  } })
  const contextBytes = bytes(ctx), padding = { value: '' }
  padding.value = 'x'.repeat(C.evidenceBytes - contextBytes - bytes(padding))
  h.files.set('padding', padding)
  assert.throws(h.prepare, /evidence cap/)
  assert.equal(h.files.has('context'), true); assert.equal(h.calls.some(x => x.args[0] === 'simctl'), false)
  assert.equal(h.outputs.destination, undefined)
})
test('injected64-entry evidence-store boundary refusal cannot continue or overwrite existing receipt', () => {
  const h = fixture({ storeHook: (label, value, files) => assert.ok(files.size < 64, 'injected entry cap') })
  for (let i = 0; i < 63; i++) h.files.set('padding-' + i, {})
  assert.throws(h.prepare, /entry cap/); assert.equal(h.files.size, 64)
  assert.equal(h.calls.some(x => x.args[0] === 'simctl'), false); assert.equal(h.outputs.destination, undefined)
  assert.throws(() => h.store.write('context', {}), /Duplicate context/)
})
test('duplicate pre-create UUID inventory fails closed without retry or creation', () => {
  const h = fixture({ existing: [{ udid: OLD, name: 'first' }, { udid: OLD, name: 'second' }] })
  assert.throws(h.prepare, /Ambiguous Simulator UUID inventory/)
  assert.equal(h.calls.filter(x => x.args[2] === 'devices').length, 1)
  assert.equal(h.files.has('devices-before-create-timeout-retry-1'), false)
  assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
  assert.equal(h.cleanup().status, 'not-created'); assert.equal(h.destructive().length, 0)
})
test('forged accepted retry pointer and matching hash cannot substitute a successful base for timeout proof', () => {
  const h = fixture(); h.prepare()
  const accepted = h.store.read('devices-before-create'), retry = 'devices-before-create-timeout-retry-1'
  h.files.set(retry, accepted); h.files.get('intent').before_devices_attempt_label = retry
  h.files.get('intent').before_devices_receipt_SHA256 = receiptSHA(accepted)
  const count = h.calls.length
  assert.throws(h.cleanup, /original Native timeout proof/)
  assert.equal(h.calls.length, count); assert.equal(h.destructive().length, 0)
})

// Synthetic valid JSON at the observed byte count; the failed real ENOBUFS
// receipt remains incomplete and is never recast as a successful command.
function paddedJSON(value, bytes) {
  const prefix = JSON.stringify(value)
  assert.ok(Buffer.byteLength(prefix) <= bytes)
  return Buffer.from(prefix + ' '.repeat(bytes - Buffer.byteLength(prefix)))
}
const completeOutput = (stdout, stderr = Buffer.alloc(0)) => ({
  status: 0, signal: null, error: null, stdout, stderr
})
function largeInventoryFixture(bytes = 133117) {
  let h
  h = fixture({ intercept: (binary, args) => {
    if (binary !== '/usr/bin/xcrun' || args[0] !== 'simctl' || args[1] !== 'list') return null
    const value = args[2] === 'runtimes' ? { runtimes: [
      { identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] } :
      args[2] === 'devicetypes' ? { devicetypes: [{ identifier: C.type, name: C.model }] } :
      { devices: { [C.runtime]: h.made ? [clone(h.made)] : [] } }
    return completeOutput(paddedJSON(value, bytes))
  } })
  return h
}
test('all exact inventory commands accept synthetic133117B through prepare and owned cleanup', () => {
  const h = largeInventoryFixture()
  assert.equal(h.prepare().UUID, NEW); assert.equal(h.cleanup().ok, true)
  for (const label of ['runtimes', 'device-types', 'devices-before-create', 'devices-after-create',
    'devices-after-boot', 'cleanup-before', 'cleanup-before-delete', 'cleanup-after']) {
    const receipt = h.store.read(label)
    assert.equal(receipt.stdout_bytes, 133117); assert.equal(receipt.output_complete, true)
    assert.equal(receipt.status, 0)
  }
  for (const c of h.calls) {
    assert.equal(c.settings.maxBuffer, c.args[1] === 'list' ? C.inventoryOutputBytes : C.outputBytes)
  }
  assert.equal(C.outputBytes, 131072); assert.equal(C.inventoryOutputBytes, 524288)
  assert.ok(h.destructive().every(x => x.args[2] === NEW))
})
test('combined inventory stdout and stderr one byte above512KiB fail without retry or create', () => {
  const out = paddedJSON({ runtimes: [] }, 133117)
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ?
    completeOutput(out, Buffer.alloc(C.inventoryOutputBytes - out.length + 1)) : null })
  assert.throws(h.prepare, /command failed: runtimes/)
  assert.equal(h.store.read('runtimes').output_complete, false)
  assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
})
test('complete-looking stdout above512KiB cannot become successful inventory or a timeout retry', () => {
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ?
    completeOutput(paddedJSON({ runtimes: [] }, C.inventoryOutputBytes + 1)) : null })
  assert.throws(h.prepare, /command failed: runtimes/)
  assert.equal(h.store.read('runtimes').error_code, null)
  assert.equal(h.store.read('runtimes').output_complete, false)
  assert.equal(h.files.has('runtimes-timeout-retry-1'), false)
  assert.equal(h.outputs.UUID, undefined)
})
test('observed ENOBUFS family at133117B stays incomplete and never receives a retry', () => {
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? nativeTimeout({
    error: Object.assign(new Error('spawnSync /usr/bin/xcrun ENOBUFS'), { code: 'ENOBUFS' }),
    stdout: paddedJSON({ runtimes: [] }, 133117) }) : null })
  assert.throws(h.prepare, /command failed: runtimes/)
  const r = h.store.read('runtimes')
  assert.equal(r.error_code, 'ENOBUFS'); assert.equal(r.stdout_bytes, 133117); assert.equal(r.output_complete, false)
  assert.equal(r.timeout_ms, 60000); assert.equal(h.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(h.files.has('runtimes-timeout-retry-1'), false); assert.equal(h.outputs.UUID, undefined)
})
for (const command of ['create', 'boot', 'bootstatus']) {
  test(command + ': output above128KiB fails once despite the larger inventory budget', () => {
    const h = fixture({ intercept: (binary, args) => args[1] === command ?
      completeOutput(Buffer.alloc(C.outputBytes + 1)) : null })
    assert.throws(h.prepare, new RegExp('command failed: ' + command))
    assert.equal(h.calls.filter(x => x.args[1] === command).length, 1)
    assert.equal(h.calls.find(x => x.args[1] === command).settings.maxBuffer, 131072)
    assert.equal(h.store.read(command).output_complete, false); assert.equal(h.outputs.destination, undefined)
  })
}
for (const command of ['shutdown', 'delete']) {
  test(command + ': cleanup preserves128KiB output cap and never retries the mutation', () => {
    const h = fixture({ intercept: (binary, args) => args[1] === command ?
      completeOutput(Buffer.alloc(C.outputBytes + 1)) : null })
    h.prepare(); const report = h.cleanup()
    assert.equal(report.ok, false)
    assert.equal(h.calls.filter(x => x.args[1] === command).length, 1)
    assert.equal(h.calls.find(x => x.args[1] === command).settings.maxBuffer, 131072)
    assert.equal(h.store.read('cleanup-' + command).output_complete, false)
    assert.ok(h.destructive().every(x => x.args[2] === NEW))
  })
}
for (const [name, tamper] of [
  ['different-binary', r => { r.binary = '/usr/local/bin/xcrun' }],
  ['different-role', r => { r.arguments[2] = 'runtimes' }],
  ['extra-argument', r => { r.arguments.push('--other') }],
  ['noncanonical-base64', r => { r.stdout_base64 += '!' }],
  ['wrong-length', r => { r.stdout_bytes-- }],
  ['wrong-raw-SHA', r => { r.stdout_SHA256 = '0'.repeat(64) }]
]) {
  test('large accepted pre-create receipt cannot bypass exact identity/integrity: ' + name, () => {
    const h = largeInventoryFixture(); h.prepare()
    tamper(h.files.get('devices-before-create'))
    // Even recomputing this unkeyed hash does not replace command/stream checks.
    h.files.get('intent').before_devices_receipt_SHA256 = receiptSHA(h.store.read('devices-before-create'))
    const before = h.calls.length
    assert.throws(h.cleanup); assert.equal(h.calls.length, before); assert.equal(h.destructive().length, 0)
  })
}

// Exercise main -> real diskStore using only a stubbed builtin executor. This
// invokes no Git, SDK, Simulator or child process; each filesystem is ours.
function withDiskFixture(runtimeOutput, body) {
  const base = fileURLToPath(new URL('../../', import.meta.url))
  const root = fs.realpathSync(fs.mkdtempSync(path.join(base, '.native-disk-fixture-')))
  const original = childProcess.spawnSync, log = console.log, calls = []
  let made = null
  const event = path.join(root, 'event.json'), output = path.join(root, 'output.txt')
  fs.writeFileSync(event, JSON.stringify({ repository: { full_name: C.repository }, pull_request: {
    head: { sha: ctx.source_head }, base: { repo: { full_name: C.repository } } } }))
  fs.writeFileSync(output, '')
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: C.repository, GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: event, GITHUB_SHA: ctx.checkout_sha, AILIBRARY_NATIVE_SOURCE_HEAD: ctx.source_head,
    GITHUB_JOB: 'ios-native', GITHUB_RUN_ID: ctx.run_id, GITHUB_RUN_ATTEMPT: ctx.run_attempt,
    DEVELOPER_DIR: C.developer, GITHUB_WORKSPACE: root, GITHUB_OUTPUT: output }
  childProcess.spawnSync = (binary, args, options) => {
    calls.push({ binary, args: [...args], options })
    if (binary === '/usr/bin/git') {
      assert.deepEqual(args, ['rev-parse', 'HEAD', 'HEAD^{tree}'])
      return completeOutput(Buffer.from(ctx.checkout_sha + '\n' + ctx.source_tree + '\n'))
    }
    if (binary === '/usr/bin/xcodebuild') return completeOutput(Buffer.from('Xcode 16.4\nBuild version 16F6\n'))
    assert.equal(binary, '/usr/bin/xcrun')
    if (args[0] === '--sdk') return completeOutput(Buffer.from('18.5\n'))
    if (args[1] === 'list') {
      if (args[2] === 'runtimes') return runtimeOutput()
      const value = args[2] === 'devicetypes' ? { devicetypes: [{ identifier: C.type, name: C.model }] } :
        { devices: { [C.runtime]: made ? [made] : [] } }
      return completeOutput(Buffer.from(JSON.stringify(value)))
    }
    if (args[1] === 'create') {
      made = { udid: NEW, name: args[2], state: 'Shutdown', isAvailable: true, deviceTypeIdentifier: C.type }
      return completeOutput(Buffer.from(NEW + '\n'))
    }
    if (args[1] === 'boot') { made.state = 'Booted'; return completeOutput(Buffer.alloc(0)) }
    if (args[1] === 'bootstatus') return completeOutput(Buffer.alloc(0))
    if (args[1] === 'shutdown') { made.state = 'Shutdown'; return completeOutput(Buffer.alloc(0)) }
    if (args[1] === 'delete') { made = null; return completeOutput(Buffer.alloc(0)) }
    throw new Error('Unexpected stub command')
  }
  syncBuiltinESMExports(); console.log = () => {}
  try { body({ root, env, calls, receipts: path.join(root, '.local/ios-ci/evidence/native-simulator') }) }
  finally {
    childProcess.spawnSync = original; syncBuiltinESMExports(); console.log = log
    fs.rmSync(root, { recursive: true })
  }
}
test('real diskStore persists and rereads512KiB inventory as a bounded Base64 receipt', { skip: process.platform !== 'darwin' }, () => {
  withDiskFixture(() => completeOutput(paddedJSON({ runtimes: [
    { identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] }, C.inventoryOutputBytes)), h => {
    assert.equal(main(['prepare'], h.env).UUID, NEW)
    const raw = fs.readFileSync(path.join(h.receipts, 'runtimes.json')), r = JSON.parse(raw)
    assert.ok(raw.length > 512 * 1024 && raw.length < C.receiptBytes)
    assert.equal(r.stdout_bytes, C.inventoryOutputBytes); assert.equal(r.output_complete, true)
    const command = h.calls.find(x => x.args[2] === 'runtimes')
    assert.equal(command.options.maxBuffer, 524288); assert.equal(command.options.timeout, 60000)
    assert.equal(C.receiptBytes, 1048576); assert.equal(C.evidenceBytes, 16777216)
    const outputs = Object.fromEntries(fs.readFileSync(path.join(h.root, 'output.txt'), 'utf8').trim().split('\n').map(row => row.split('=')))
    assert.equal(main(['cleanup'], { ...h.env, AILIBRARY_NATIVE_OWNER_TOKEN: outputs.owner_token,
      AILIBRARY_NATIVE_CREATED_UUID: outputs.created_uuid }).ok, true)
  })
})
test('real diskStore still refuses an executor receipt above1MiB before any create', { skip: process.platform !== 'darwin' }, () => {
  withDiskFixture(() => nativeTimeout({ error: Object.assign(new Error('output cap'), { code: 'ENOBUFS' }),
    stdout: Buffer.alloc(800000) }), h => {
    assert.throws(() => main(['prepare'], h.env), /evidence cap/)
    assert.equal(fs.existsSync(path.join(h.receipts, 'runtimes.json')), false)
    assert.equal(h.calls.some(x => x.args[1] === 'create'), false)
    assert.equal(fs.existsSync(path.join(h.receipts, 'ready.json')), false)
  })
})

test('a60s inventory timeout and122s prefix leave the full300s bootstatus budget under shared480s', () => {
  let h, runtimeAttempts = 0, prefixMilliseconds = 62000
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(62000) },
    intercept: (binary, args, settings) => {
      if (args[2] === 'runtimes' && ++runtimeAttempts === 1) {
        assert.equal(settings.timeout, 60000)
        prefixMilliseconds += settings.timeout; h.advance(settings.timeout)
        return nativeTimeout()
      }
      if (args[1] === 'bootstatus') {
        assert.equal(prefixMilliseconds, 122000)
        assert.equal(settings.timeout, 300000); assert.equal(settings.maxBuffer, 131072)
        h.advance(settings.timeout)
      }
      return null
    } })
  assert.equal(h.prepare().UUID, NEW)
  assert.equal(runtimeAttempts, 2)
  assert.equal(h.store.read('runtimes').output_complete, false)
  assert.equal(h.store.read('runtimes-timeout-retry-1').status, 0)
  const bootstatus = h.store.read('bootstatus')
  assert.equal(bootstatus.timeout_ms, 300000); assert.equal(bootstatus.status, 0)
  assert.equal(bootstatus.returned_within_deadline, true)
  assert.ok(prefixMilliseconds + bootstatus.timeout_ms < C.prepareMs)
  assert.equal(h.calls.filter(x => x.args[1] === 'create').length, 1)
  assert.equal(h.calls.filter(x => x.args[1] === 'boot').length, 1)
  assert.equal(h.calls.filter(x => x.args[1] === 'bootstatus').length, 1)
  assert.equal(h.outputs.destination, `platform=iOS Simulator,id=${NEW}`)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})
test('bootstatus still clips to the shared remainder and refuses readiness when that remainder expires', () => {
  let h, assignedTimeout = 0
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(C.prepareMs - 60000) },
    intercept: (binary, args, settings) => {
      if (args[1] !== 'bootstatus') return null
      assignedTimeout = settings.timeout
      assert.ok(assignedTimeout > 59000 && assignedTimeout < 60000)
      h.advance(assignedTimeout)
      return nativeTimeout()
    } })
  assert.throws(h.prepare, /command failed: bootstatus/)
  const receipt = h.store.read('bootstatus')
  assert.equal(receipt.timeout_ms, assignedTimeout); assert.equal(receipt.error_code, 'ETIMEDOUT')
  assert.equal(receipt.returned_within_deadline, false)
  assert.equal(h.calls.filter(x => x.args[1] === 'bootstatus').length, 1)
  assert.equal(h.files.has('bootstatus-timeout-retry-1'), false)
  assert.equal(h.outputs.UUID, NEW); assert.equal(h.outputs.destination, undefined)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})
test('a full300s bootstatus timeout still fails once even with ample shared preparation time', () => {
  let h
  h = fixture({ intercept: (binary, args, settings) => {
    if (args[1] !== 'bootstatus') return null
    assert.equal(settings.timeout, 300000)
    h.advance(settings.timeout)
    return nativeTimeout()
  } })
  assert.throws(h.prepare, /command failed: bootstatus/)
  const receipt = h.store.read('bootstatus')
  assert.equal(receipt.timeout_ms, 300000); assert.equal(receipt.error_code, 'ETIMEDOUT')
  assert.equal(receipt.returned_within_deadline, true)
  assert.equal(h.calls.filter(x => x.args[1] === 'bootstatus').length, 1)
  assert.equal(h.files.has('bootstatus-timeout-retry-1'), false)
  assert.equal(h.outputs.destination, undefined)
  assert.equal(h.cleanup().ok, true); assert.ok(h.destructive().every(x => x.args[2] === NEW))
})

// The CLI Git prelude uses only this injected read-only executor on every platform.
function gitIdentityFixture(response = completeOutput(Buffer.from(ctx.checkout_sha + '\n' + ctx.source_tree + '\n'))) {
  const calls = [], diagnostics = []
  return { calls, diagnostics, read: () => readNativeGitIdentity({ expectedCheckout: ctx.checkout_sha,
    env: { HOME: '/fixture-home', GITHUB_TOKEN: 'private-env-token', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'private-env-token' },
    execute: (binary, args, options) => { calls.push({ binary, args, options }); return typeof response === 'function' ? response() : response },
    report: line => diagnostics.push(line) }) }
}
test('Git identity reads both exact40hex lines once with30s/4096B and a filtered environment', () => {
  const h = gitIdentityFixture()
  assert.deepEqual(h.read(), { checkout_sha: ctx.checkout_sha, source_tree: ctx.source_tree })
  assert.equal(h.calls.length, 1); assert.equal(h.diagnostics.length, 0)
  const c = h.calls[0]
  assert.equal(c.binary, '/usr/bin/git'); assert.deepEqual(c.args, ['rev-parse', 'HEAD', 'HEAD^{tree}'])
  assert.equal(c.options.timeout, 30000); assert.equal(c.options.maxBuffer, 4096); assert.equal(c.options.killSignal, 'SIGKILL')
  assert.equal(c.options.env.HOME, '/fixture-home'); assert.equal(c.options.env.DEVELOPER_DIR, C.developer)
  assert.equal(c.options.env.GITHUB_TOKEN, undefined); assert.equal(c.options.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, undefined)
  assert.equal(c.options.env.GIT_OPTIONAL_LOCKS, '0'); assert.equal(c.options.env.GIT_ALLOW_PROTOCOL, '')
})
test('Git identity accepts exactly4096 combined bytes without logging stderr content', () => {
  const r = completeOutput(Buffer.from(ctx.checkout_sha + '\n' + ctx.source_tree + '\n'))
  r.stderr = Buffer.alloc(4096 - r.stdout.length, 120)
  const h = gitIdentityFixture(r); assert.equal(h.read().source_tree, ctx.source_tree)
  assert.equal(h.calls.length, 1); assert.equal(h.diagnostics.length, 0)
})
for (const [name, changes] of [
  ['nonzero', { status: 19 }], ['null-status', { status: null }],
  ['boolean-status', { status: false }], ['string-status', { status: '0' }],
  ['signal', { signal: 'SIGTERM' }], ['undefined-signal', { signal: undefined }],
  ['unknown-signal', { signal: 'private-signal-token' }],
  ['unknown-code', { error: Object.assign(new Error('private-error-message'), { code: 'private-code-token' }) }],
  ['typed-timeout', { status: null, signal: 'SIGKILL', error: Object.assign(new Error('private-error-message'), { code: 'ETIMEDOUT' }) }],
  ['output-error', { error: Object.assign(new Error('private-error-message'), { code: 'ENOBUFS' }) }]
]) {
  test('Git identity fails closed once with bounded typed diagnostics: ' + name, () => {
    const h = gitIdentityFixture({ ...completeOutput(Buffer.from(ctx.checkout_sha + '\n' + ctx.source_tree + '\n')), ...changes })
    assert.throws(h.read, /^Error: Native Git identity proof failed$/); assert.equal(h.calls.length, 1)
    assert.equal(h.diagnostics.length, 1)
    const line = h.diagnostics[0], d = JSON.parse(line.slice('AILibraryNativeGitIdentity '.length))
    assert.equal(d.schema_version, 1); assert.equal(d.stage, 'git-identity'); assert.equal(d.reason, 'command-result')
    assert.equal(d.timeout_ms, 30000); assert.equal(d.output_cap_bytes, 4096)
    assert.equal(d.status_type, changes.status === null ? 'null' : typeof (changes.status ?? 0))
    assert.equal(d.status, Number.isInteger(changes.status ?? 0) && changes.status !== null ? changes.status ?? 0 : null)
    if (changes.error) assert.equal(d.error_code, changes.error.code === 'private-code-token' ? 'OTHER' : changes.error.code)
    if (changes.signal === 'private-signal-token') assert.equal(d.signal, 'OTHER')
    for (const secret of ['private-error-message', 'private-env-token', 'private-signal-token', 'private-code-token', ctx.checkout_sha, ctx.source_tree]) assert.equal(line.includes(secret), false)
    assert.ok(Buffer.byteLength(line) < 1024)
  })
}
test('Git identity executor throw emits fixed fields without leaking message/code/signal bodies or retrying', () => {
  const h = gitIdentityFixture(() => { throw Object.assign(new Error('private-error-message'), { code: 'private-code-token' }) })
  assert.throws(h.read, /^Error: Native Git identity proof failed$/); assert.equal(h.calls.length, 1)
  const d = JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length))
  assert.equal(d.reason, 'executor-threw'); assert.equal(d.executor_threw, true)
  assert.equal(d.status, null); assert.equal(d.signal, null); assert.equal(d.error_code, 'OTHER'); assert.equal(d.error_code_type, 'string')
  assert.equal(h.diagnostics[0].includes('private-'), false)
})
for (const [name, stdout] of [
  ['missing-tree', ctx.checkout_sha + '\n'], ['short-head', 'b'.repeat(39) + '\n' + ctx.source_tree + '\n'],
  ['uppercase', 'B'.repeat(40) + '\n' + ctx.source_tree + '\n'], ['nonhex-tree', ctx.checkout_sha + '\n' + 'g'.repeat(40) + '\n'],
  ['extra-line', ctx.checkout_sha + '\n' + ctx.source_tree + '\n' + 'a'.repeat(40) + '\n'],
  ['extra-empty-line', ctx.checkout_sha + '\n' + ctx.source_tree + '\n\n'],
  ['missing-final-LF', ctx.checkout_sha + '\n' + ctx.source_tree],
  ['CRLF', ctx.checkout_sha + '\r\n' + ctx.source_tree + '\r\n'],
  ['leading-whitespace', ' ' + ctx.checkout_sha + '\n' + ctx.source_tree + '\n'],
  ['trailing-whitespace', ctx.checkout_sha + '\n' + ctx.source_tree + ' \n'],
  ['BOM', '\uFEFF' + ctx.checkout_sha + '\n' + ctx.source_tree + '\n']
]) {
  test('Git identity rejects malformed two-line stdout with no body logging: ' + name, () => {
    const h = gitIdentityFixture(completeOutput(Buffer.from(stdout)))
    assert.throws(h.read, /Native Git identity proof failed/); assert.equal(h.calls.length, 1)
    const d = JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length))
    assert.equal(d.reason, 'identity-format'); assert.equal(d.stdout_bytes, Buffer.byteLength(stdout))
    assert.equal(h.diagnostics[0].includes(stdout), false)
  })
}
test('Git identity rejects invalid UTF8 before using a replacement character or a partial identity', () => {
  const h = gitIdentityFixture(completeOutput(Buffer.concat([Buffer.from(ctx.checkout_sha + '\n'), Buffer.from([0xc3, 0x28]), Buffer.from('\n')])))
  assert.throws(h.read, /Native Git identity proof failed/); assert.equal(h.calls.length, 1)
  assert.equal(JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length)).reason, 'invalid-utf8')
})
test('Git identity binds the returned checkout to the expected environment SHA', () => {
  const h = gitIdentityFixture(completeOutput(Buffer.from(ctx.source_tree + '\n' + ctx.checkout_sha + '\n')))
  assert.throws(h.read, /Native Git identity proof failed/); assert.equal(h.calls.length, 1)
  assert.equal(JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length)).reason, 'checkout-mismatch')
})
for (const [name, stdout, stderr] of [
  ['combined-one-over', Buffer.from(ctx.checkout_sha + '\n' + ctx.source_tree + '\n'), Buffer.alloc(4015)],
  ['stdout-one-over', Buffer.alloc(4097), Buffer.alloc(0)], ['both-at4096', Buffer.alloc(4096), Buffer.alloc(4096)]
]) {
  test('Git identity enforces the combined4096B cap without retry: ' + name, () => {
    const h = gitIdentityFixture({ ...completeOutput(stdout), stderr })
    assert.throws(h.read, /Native Git identity proof failed/); assert.equal(h.calls.length, 1)
    const d = JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length))
    assert.equal(d.reason, 'output-cap'); assert.equal(d.stdout_bytes + d.stderr_bytes, stdout.length + stderr.length)
  })
}
for (const [name, response] of [
  ['null-result', null], ['array-result', []], ['string-stdout', { ...completeOutput(Buffer.alloc(0)), stdout: 'private-stdout-body' }],
  ['null-stderr', { ...completeOutput(Buffer.alloc(0)), stderr: null }]
]) {
  test('Git identity rejects invalid executor/stream types: ' + name, () => {
    const h = gitIdentityFixture(response)
    assert.throws(h.read, /Native Git identity proof failed/); assert.equal(h.calls.length, 1)
    const d = JSON.parse(h.diagnostics[0].slice('AILibraryNativeGitIdentity '.length))
    assert.equal(d.reason, name.endsWith('result') ? 'result-shape' : 'stream-type')
    assert.equal(h.diagnostics[0].includes('private-stdout-body'), false)
  })
}
