import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { nativeSimulatorContract as C, prepareNativeSimulator, cleanupNativeSimulator } from '../../ios/tests/native-simulator-prepare.mjs'

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
test('retry read timeout is clipped to the shared210s remainder without resetting the clock', () => {
  let h, attempts = 0
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(120000) },
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
  h = fixture({ storeHook: label => { if (label === 'sdk') h.advance(180000) },
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
  assert.equal(cap('create'), 30000); assert.equal(cap('boot'), 30000); assert.equal(cap('bootstatus'), 120000); assert.equal(cap('cleanup-delete'), 30000)
  const w = fs.readFileSync(fileURLToPath(new URL('../../.github/workflows/ios-native.yml', import.meta.url)), 'utf8')
  assert.match(w, /id: native_simulator\n\s+timeout-minutes: 4/)
  assert.match(w, /name: Clean up only the proven owned Native Simulator\n\s+if: always\(\)\n\s+timeout-minutes: 2/)
  assert.equal(C.prepareMs, 210000); assert.equal(C.cleanupMs, 90000)
})
test('exact128KiB inventory output is accepted; one byte above cannot authorize a timeout retry', () => {
  const valid = JSON.stringify({ runtimes: [{ identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] })
  const exact = Buffer.from(valid + ' '.repeat(C.outputBytes - Buffer.byteLength(valid)))
  const h = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? {
    status: 0, signal: null, error: null, stdout: exact, stderr: Buffer.alloc(0) } : null })
  h.prepare(); assert.equal(h.store.read('runtimes').stdout_bytes, C.outputBytes)
  const over = fixture({ intercept: (binary, args) => args[2] === 'runtimes' ? nativeTimeout({ stdout: Buffer.alloc(C.outputBytes + 1) }) : null })
  assert.throws(over.prepare); assert.equal(over.calls.filter(x => x.args[2] === 'runtimes').length, 1)
  assert.equal(over.files.has('runtimes-timeout-retry-1'), false)
})
test('injected evidence-store2MiB boundary refusal stops before any Simulator command', () => {
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
