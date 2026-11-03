#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
/** @typedef {import('./native-simulator-types.ts').SimulatorContext} SimulatorContext */
/** @typedef {import('./native-simulator-types.ts').SimulatorStore} SimulatorStore */
/** @typedef {import('./native-simulator-types.ts').SimulatorOptions} SimulatorOptions */
/** @typedef {import('./native-simulator-types.ts').DeviceRow} DeviceRow */
/** @typedef {import('./native-simulator-types.ts').SimulatorIntent} SimulatorIntent */
/** @typedef {import('./native-simulator-types.ts').StreamReceipt} StreamReceipt */

export const nativeSimulatorContract = Object.freeze({
  repository: 'pero3dev/ai-agent-library', runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-18-5',
  version: '18.5', type: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16', model: 'iPhone 16',
  developer: '/Applications/Xcode_16.4.app/Contents/Developer',
  prepareMs: 480000, cleanupMs: 90000, outputBytes: 128 * 1024,
  inventoryOutputBytes: 512 * 1024, receiptBytes: 1024 * 1024, evidenceBytes: 16 * 1024 * 1024
})
const C = nativeSimulatorContract
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
/** @param {import('node:crypto').BinaryLike} bytes */
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
/** @param {unknown} x @returns {x is Record<string, unknown>} */
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x)
/** @param {unknown} value @returns {asserts value is Record<string, unknown>} */
function resultObject(value) { assert.ok(plain(value), 'Native Simulator result must be an object') }
/** @param {unknown} x */
const uuid = x => { assert.ok(typeof x === 'string' && uuidPattern.test(x), 'Invalid Simulator UUID'); return x.toUpperCase() }
/** @param {string} x */
const text = x => new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(x, 'base64'))
/** @param {unknown} a @param {unknown} b */
const same = (a, b) => assert.deepEqual(a, b, 'Ownership/source context mismatch')
/** @param {unknown} x */
const encode = x => Buffer.from(JSON.stringify(x, null, 2) + '\n')
/** @param {unknown} x */
const short = x => String(x ?? '').slice(0, 800)
/** @param {unknown} error */
const errorText = error => error instanceof Error ? error.message : short(error)

// Inventory JSON includes every installed platform and its supported device types.
// Only these exact read-only commands receive the larger bounded output budget.
/** @param {unknown} binary @param {unknown} args */
function commandOutputBytes(binary, args) {
  return binary === '/usr/bin/xcrun' && Array.isArray(args) && args.length === 4 &&
    args[0] === 'simctl' && args[1] === 'list' && ['runtimes', 'devicetypes', 'devices'].includes(args[2]) &&
    args[3] === '--json' ? C.inventoryOutputBytes : C.outputBytes
}

/** @param {unknown} value @returns {SimulatorContext} */
function context(value) {
  assert.ok(plain(value), 'Missing CI context')
  const keys = ['repository', 'run_id', 'run_attempt', 'job', 'source_head', 'checkout_sha', 'source_tree', 'developer_dir']
  /** @type {Record<string, string>} */
  const selected = Object.fromEntries(keys.map(k => { assert.ok(typeof value[k] === 'string', 'Invalid CI context field'); return [k, value[k]] }))
  assert.equal(selected.repository, C.repository)
  assert.ok(['ios-native', 'ios-published-candidate'].includes(selected.job), 'Unknown Simulator ownership profile')
  if (selected.job === 'ios-published-candidate') {
    assert.ok(typeof value.ui_slice === 'string' && ['reading-state', 'content-copy'].includes(value.ui_slice), 'Unknown published UI slice')
    selected.profile = 'published'; selected.ui_slice = value.ui_slice
  }
  for (const k of ['run_id', 'run_attempt']) assert.match(selected[k], /^[1-9][0-9]{0,19}$/)
  for (const k of ['source_head', 'checkout_sha', 'source_tree']) assert.match(selected[k], /^[a-f0-9]{40}$/)
  assert.equal(selected.developer_dir, C.developer)
  return { repository: selected.repository, run_id: selected.run_id, run_attempt: selected.run_attempt, job: selected.job, source_head: selected.source_head, checkout_sha: selected.checkout_sha, source_tree: selected.source_tree, developer_dir: selected.developer_dir,
    ...(selected.profile ? { profile: selected.profile, ui_slice: selected.ui_slice } : {}) }
}

/** @param {Pick<SimulatorContext, 'job'|'ui_slice'>} ctx */
function profile(ctx) {
  return ctx.job === 'ios-native' ? { source: 'AILIBRARY_NATIVE_SOURCE_HEAD', token: 'AILIBRARY_NATIVE_OWNER_TOKEN',
    UUID: 'AILIBRARY_NATIVE_CREATED_UUID', root: '.local/ios-ci/evidence/native-simulator', name: 'AILibrary-native' } :
    { source: 'EXPECTED_SOURCE_HEAD', token: 'AILIBRARY_PUBLISHED_OWNER_TOKEN', UUID: 'AILIBRARY_PUBLISHED_CREATED_UUID',
      root: `.local/ios-published-candidate/evidence/owned-simulator/${ctx.ui_slice}`, name: `AILibrary-published-${ctx.ui_slice}` }
}
/** @param {SimulatorContext} ctx @param {string} token */
const ownedName = (ctx, token) => `${profile(ctx).name}-${ctx.run_id}-${ctx.run_attempt}-${token}`

// A failed or incomplete create never grants authority to delete a guessed device.
/** @param {unknown} receipt @returns {receipt is StreamReceipt} */
function successful(receipt) {
  if (!plain(receipt)) return false
  try {
    if (typeof receipt.stdout_base64 !== 'string' || typeof receipt.stderr_base64 !== 'string') return false
    const out = Buffer.from(receipt.stdout_base64, 'base64'), err = Buffer.from(receipt.stderr_base64, 'base64')
    return receipt.status === 0 && receipt.signal === null && receipt.error_code === null && receipt.error === null &&
      receipt.output_complete === true && receipt.stdout_bytes === out.length && receipt.stderr_bytes === err.length &&
      out.length + err.length <= commandOutputBytes(receipt.binary, receipt.arguments) &&
      sha(out) === receipt.stdout_SHA256 && sha(err) === receipt.stderr_SHA256
  } catch { return false }
}

/** @param {Pick<SimulatorOptions, 'execute'|'store'|'now'|'env'>} options @param {number} milliseconds */
function runner({ execute, store, now = () => performance.now(), env = {} }, milliseconds) {
  assert.equal(typeof execute, 'function'); const deadline = now() + milliseconds
  /** @param {string} label @param {string} binary @param {readonly string[]} args @param {number} [limit] @param {boolean} [required] */
  const run = (label, binary, args, limit = 15000, required = true) => {
    const remaining = Math.floor(deadline - now()); assert.ok(remaining > 0, 'Native Simulator shared deadline expired')
    const timeout = Math.min(remaining, limit)
    const outputBytes = commandOutputBytes(binary, args)
    /** @type {unknown} */
    let result
    try { result = execute(binary, [...args], { timeout, maxBuffer: outputBytes, killSignal: 'SIGKILL', env: childEnvironment(env) }) }
    catch (error) { result = { error, status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) } }
    resultObject(result)
    assert.ok(result.stdout == null || typeof result.stdout === 'string' || Buffer.isBuffer(result.stdout))
    assert.ok(result.stderr == null || typeof result.stderr === 'string' || Buffer.isBuffer(result.stderr))
    const error = plain(result.error) ? result.error : null
    const out = Buffer.from(result.stdout ?? ''), err = Buffer.from(result.stderr ?? '')
    const receipt = { schema_version: 1, binary, arguments: [...args], timeout_ms: timeout,
      status: Number.isInteger(result.status) ? result.status : null, signal: result.signal ?? null,
      error_code: result.error ? short(error?.code ?? error?.name ?? 'executor-error') : null,
      error: result.error ? short(error?.message ?? result.error) : null,
      output_complete: !result.error && out.length + err.length <= outputBytes,
      stdout_bytes: out.length, stderr_bytes: err.length, stdout_base64: out.toString('base64'), stderr_base64: err.toString('base64'),
      stdout_SHA256: sha(out), stderr_SHA256: sha(err), returned_within_deadline: now() <= deadline }
    store.write(label, receipt)
    if (required) {
      assert.ok(successful(receipt), `Native Simulator command failed: ${label}`)
      assert.equal(receipt.returned_within_deadline, true, 'Native Simulator shared deadline expired')
    }
    return receipt
  }
  run.checkDeadline = () => assert.ok(Math.floor(deadline - now()) > 0, 'Native Simulator shared deadline expired')
  return run
}
/** @param {unknown} receipt @returns {Record<string, unknown>} */
function json(receipt) { assert.ok(successful(receipt)); const value = /** @type {unknown} */ (JSON.parse(text(receipt.stdout_base64))); resultObject(value); return value }
/** @param {unknown} value @returns {DeviceRow[]} */
function devices(value) {
  assert.ok(plain(value) && plain(value.devices), 'Invalid Simulator device inventory')
  const rows = []
  for (const [runtime, list] of Object.entries(value.devices)) {
    assert.ok(typeof runtime === 'string' && Array.isArray(list), 'Invalid runtime device list')
    for (const device of list) {
      assert.ok(plain(device) && typeof device.name === 'string' && device.name.length > 0 && device.name.length <= 200)
      rows.push({ runtime, device: /** @type {Record<string, unknown> & {name: string}} */ (device), UUID: uuid(device.udid) })
    }
  }
  assert.equal(new Set(rows.map(x => x.UUID)).size, rows.length, 'Ambiguous Simulator UUID inventory')
  return rows
}
/** @param {DeviceRow[]} rows @param {{name: string}} intent @param {string} UUID @param {boolean} [required] */
function ownedRow(rows, intent, UUID, required = true) {
  const found = rows.filter(x => x.UUID === UUID); assert.ok(found.length <= 1, 'Ambiguous owned UUID')
  if (!found.length) { assert.ok(!required, 'Created Simulator absent from inventory'); return null }
  const row = found[0]
  assert.equal(row.runtime, C.runtime); assert.equal(row.device.name, intent.name)
  // Runtime/type inventory and successful create args prove the requested type.
  // Some simctl device inventories omit this optional field; a contradictory value is never accepted.
  if (row.device.deviceTypeIdentifier !== undefined) assert.equal(row.device.deviceTypeIdentifier, C.type, 'Changed owned device type')
  return row
}
/** @param {unknown} receipt */
function createdUUID(receipt) {
  assert.ok(successful(receipt), 'No successful create receipt')
  const value = text(receipt.stdout_base64)
  assert.ok(new RegExp('^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\\n?$', 'i').test(value), 'Create must return only one UUID')
  return uuid(value.trim())
}
/** @param {unknown} UUID */
export function nativeSimulatorDestination(UUID) { return `platform=iOS Simulator,id=${uuid(UUID)}` }

// Only these prepare-time, read-only argv lists can receive one bounded retry.
const prepareInventoryArguments = Object.freeze({
  runtimes: Object.freeze(['simctl', 'list', 'runtimes', '--json']),
  'device-types': Object.freeze(['simctl', 'list', 'devicetypes', '--json']),
  'devices-before-create': Object.freeze(['simctl', 'list', 'devices', '--json']),
  'devices-after-create': Object.freeze(['simctl', 'list', 'devices', '--json']),
  'devices-after-boot': Object.freeze(['simctl', 'list', 'devices', '--json'])
})
/** @param {unknown} receipt @param {readonly string[]} args @returns {receipt is StreamReceipt} */
function inventoryReceipt(receipt, args) {
  try {
    assert.ok(plain(receipt) && receipt.schema_version === 1)
    assert.equal(receipt.binary, '/usr/bin/xcrun'); same(receipt.arguments, args)
    assert.ok(typeof receipt.timeout_ms === 'number' && Number.isInteger(receipt.timeout_ms) && receipt.timeout_ms > 0 && receipt.timeout_ms <= 60000)
    assert.equal(receipt.returned_within_deadline, true)
    let total = 0
    for (const stream of ['stdout', 'stderr']) {
      /** @type {unknown} */
      const encoded = receipt[stream + '_base64']; assert.ok(typeof encoded === 'string')
      const bytes = Buffer.from(encoded, 'base64'); assert.equal(bytes.toString('base64'), encoded)
      assert.equal(receipt[stream + '_bytes'], bytes.length)
      assert.equal(receipt[stream + '_SHA256'], sha(bytes)); total += bytes.length
    }
    assert.ok(total <= commandOutputBytes(receipt.binary, receipt.arguments))
    return true
  } catch { return false }
}
/** @param {unknown} receipt @param {readonly string[]} args */
function inventoryTimeout(receipt, args) {
  return inventoryReceipt(receipt, args) && receipt.status === null && receipt.signal === 'SIGKILL' &&
    receipt.error_code === 'ETIMEDOUT' && typeof receipt.error === 'string' && receipt.error.length > 0 &&
    receipt.error.length <= 800 && receipt.output_complete === false
}
/** @param {ReturnType<typeof runner>} run @param {keyof typeof prepareInventoryArguments} label */
function prepareInventory(run, label) {
  assert.ok(Object.hasOwn(prepareInventoryArguments, label), 'Unknown prepare inventory role')
  const args = prepareInventoryArguments[label]
  const first = run(label, '/usr/bin/xcrun', args, 60000, false)
  run.checkDeadline()
  if (inventoryReceipt(first, args) && successful(first)) return { label, receipt: first }
  assert.ok(inventoryTimeout(first, args), `Native Simulator command failed: ${label}`)
  const retryLabel = label + '-timeout-retry-1'
  const second = run(retryLabel, '/usr/bin/xcrun', args, 60000, false)
  run.checkDeadline()
  assert.ok(inventoryReceipt(second, args) && successful(second), `Native Simulator command failed: ${retryLabel}`)
  return { label: retryLabel, receipt: second }
}
/** @param {SimulatorStore} store @param {SimulatorIntent} intent */
function acceptedBeforeCreate(store, intent) {
  const baseLabel = 'devices-before-create', retryLabel = baseLabel + '-timeout-retry-1'
  const label = intent.before_devices_attempt_label, args = prepareInventoryArguments[baseLabel]
  assert.ok(typeof label === 'string' && [baseLabel, retryLabel].includes(label), 'Unknown accepted pre-create inventory label')
  assert.match(intent.before_devices_receipt_SHA256, /^[a-f0-9]{64}$/)
  const first = store.read(baseLabel)
  if (label === retryLabel) assert.ok(inventoryTimeout(first, args), 'Retry lacks the original Native timeout proof')
  else assert.equal(store.has(retryLabel), false, 'Unexpected duplicate pre-create attempt')
  const accepted = label === baseLabel ? first : store.read(label)
  assert.ok(inventoryReceipt(accepted, args) && successful(accepted), 'Invalid accepted pre-create inventory')
  // Canonical receipt bytes and raw stdout are independently bound by intent.
  assert.equal(sha(encode(accepted)), intent.before_devices_receipt_SHA256)
  assert.equal(accepted.stdout_SHA256, intent.before_devices_stdout_SHA256)
  return accepted
}

/** @param {SimulatorOptions} options */
export function prepareNativeSimulator(options) {
  const ctx = context(options.context), { store } = options, run = runner(options, C.prepareMs)
  try {
    store.write('context', ctx)
    const xcode = run('xcode', '/usr/bin/xcodebuild', ['-version'])
    assert.match(text(xcode.stdout_base64).trim(), /^Xcode 16\.4\nBuild version [A-Za-z0-9]+$/)
    const sdk = run('sdk', '/usr/bin/xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version'])
    assert.equal(text(sdk.stdout_base64).trim(), C.version, 'Expected Simulator SDK 18.5')
    const runtimeReceipt = prepareInventory(run, 'runtimes').receipt
    const runtimes = json(runtimeReceipt).runtimes
    assert.ok(Array.isArray(runtimes), 'Missing Runtime inventory')
    const runtime = runtimes.filter(x => x.identifier === C.runtime)
    assert.ok(runtime.length === 1 && runtime[0].version === C.version && runtime[0].name === 'iOS 18.5' &&
      runtime[0].isAvailable === true, 'Exactly one available iOS 18.5 Runtime required; creation does not install a Runtime')
    const typeReceipt = prepareInventory(run, 'device-types').receipt
    const types = json(typeReceipt).devicetypes
    assert.ok(Array.isArray(types), 'Missing device-type inventory')
    const type = types.filter(x => x.identifier === C.type)
    assert.ok(type.length === 1 && type[0].name === C.model, 'Exactly one iPhone 16 device type required')
    const beforeAttempt = prepareInventory(run, 'devices-before-create'), beforeReceipt = beforeAttempt.receipt
    const before = devices(json(beforeReceipt)).map(x => x.UUID)
    const token = (options.makeToken ?? randomUUID)(); uuid(token)
    const intent = { schema_version: 1, context: ctx, token, name: ownedName(ctx, token),
      runtime_identifier: C.runtime, device_type_identifier: C.type, preexisting_UUIDs: before,
      before_devices_stdout_SHA256: beforeReceipt.stdout_SHA256,
      before_devices_attempt_label: beforeAttempt.label, before_devices_receipt_SHA256: sha(encode(beforeReceipt)) }
    store.write('intent', intent); options.onToken?.(token)
    const creation = run('create', '/usr/bin/xcrun', ['simctl', 'create', intent.name, C.type, C.runtime], 30000)
    const UUID = createdUUID(creation); assert.ok(!before.includes(UUID), 'Create returned a preexisting UUID')
    options.onCreated?.(UUID)
    const afterCreate = ownedRow(devices(json(prepareInventory(run, 'devices-after-create').receipt)), intent, UUID)
    assert.ok(afterCreate, 'Created Simulator is required')
    assert.equal(afterCreate.device.isAvailable, true, 'Created Simulator is unavailable')
    assert.equal(afterCreate.device.state, 'Shutdown', 'Fresh Simulator must initially be Shutdown')
    store.write('created', { context: ctx, token, UUID, name: intent.name, runtime_identifier: C.runtime, device_type_identifier: C.type })
    run('boot', '/usr/bin/xcrun', ['simctl', 'boot', UUID], 30000)
    run('bootstatus', '/usr/bin/xcrun', ['simctl', 'bootstatus', UUID, '-b'], 300000)
    const booted = ownedRow(devices(json(prepareInventory(run, 'devices-after-boot').receipt)), intent, UUID)
    assert.ok(booted, 'Booted Simulator is required')
    assert.equal(booted.device.isAvailable, true); assert.equal(booted.device.state, 'Booted')
    const destination = nativeSimulatorDestination(UUID)
    const ready = { status: 'ready', context: ctx, token, UUID, destination, name: intent.name,
      runtime_identifier: C.runtime, device_type_identifier: C.type, inventory: booted }
    run.checkDeadline()
    store.write('ready', ready)
    run.checkDeadline() // No public destination handoff after receipt persistence consumes the remainder.
    options.onReady?.(destination)
    return ready
  } catch (error) {
    store.write('prepare-failure', { status: 'failed', context: ctx, error: short(errorText(error)), no_runtime_install_or_named_device_fallback: true })
    throw error
  }
}

// A ready handoff grants no new device authority: every field must agree with
// the successful create, pre-create exclusion and the external step outputs.
/** @param {SimulatorStore} store @returns {SimulatorIntent} */
function readIntent(store) {
  const value = store.read('intent')
  /** @param {string} key */
  const field = key => { const entry = value[key]; assert.ok(typeof entry === 'string', 'Invalid ownership intent field'); return entry }
  const before = value.preexisting_UUIDs
  assert.ok(Array.isArray(before) && before.every(value => typeof value === 'string'))
  assert.ok(typeof value.schema_version === 'number')
  const ctx = context(value.context); same(value.context, ctx)
  return { schema_version: value.schema_version, context: ctx, token: field('token'), name: field('name'), runtime_identifier: field('runtime_identifier'), device_type_identifier: field('device_type_identifier'), preexisting_UUIDs: before,
    before_devices_stdout_SHA256: field('before_devices_stdout_SHA256'), before_devices_attempt_label: field('before_devices_attempt_label'), before_devices_receipt_SHA256: field('before_devices_receipt_SHA256') }
}
/** @param {SimulatorOptions} options */
export function verifyNativeSimulatorReady(options) {
  const ctx = context(options.context), { store } = options
  const intent = readIntent(store); same(intent.context, ctx); assert.equal(intent.schema_version, 1)
  uuid(intent.token); assert.equal(options.token, intent.token, 'Unknown ownership token')
  assert.equal(intent.name, ownedName(ctx, intent.token))
  assert.equal(intent.runtime_identifier, C.runtime); assert.equal(intent.device_type_identifier, C.type)
  const before = devices(json(acceptedBeforeCreate(store, intent))).map(x => x.UUID)
  same(intent.preexisting_UUIDs, before)
  const creation = store.read('create')
  assert.equal(creation.binary, '/usr/bin/xcrun'); same(creation.arguments, ['simctl', 'create', intent.name, C.type, C.runtime])
  assert.equal(creation.returned_within_deadline, true)
  const UUID = createdUUID(creation); assert.equal(uuid(options.createdUUID), UUID, 'Step UUID differs from create receipt')
  assert.ok(!before.includes(UUID), 'Refuse handoff of preexisting UUID')
  const owned = store.read('created'), ready = store.read('ready')
  for (const value of [owned, ready]) {
    same(value.context, ctx); assert.equal(value.token, intent.token); assert.equal(value.UUID, UUID)
    assert.equal(value.name, intent.name); assert.equal(value.runtime_identifier, C.runtime)
    assert.equal(value.device_type_identifier, C.type)
  }
  assert.ok(ready.status === 'ready'); assert.equal(ready.destination, nativeSimulatorDestination(UUID))
  const rowValue = ready.inventory; resultObject(rowValue); resultObject(rowValue.device)
  assert.ok(typeof rowValue.runtime === 'string' && typeof rowValue.UUID === 'string' && typeof rowValue.device.name === 'string')
  const row = ownedRow([{ runtime: rowValue.runtime, UUID: rowValue.UUID, device: { ...rowValue.device, name: rowValue.device.name } }], intent, UUID)
  assert.ok(row, 'Ready Simulator inventory is required')
  assert.equal(row.device.isAvailable, true); assert.equal(row.device.state, 'Booted')
  return { ...ready, status: ready.status, context: ctx, token: intent.token, UUID, destination: nativeSimulatorDestination(UUID), name: intent.name, runtime_identifier: C.runtime, device_type_identifier: C.type, inventory: row }
}

/** @param {SimulatorOptions} options */
export function cleanupNativeSimulator(options) {
  const ctx = context(options.context), { store } = options, run = runner(options, C.cleanupMs)
  /** @type {import('./native-simulator-types.ts').CleanupReport} */
  const report = { status: 'not-completed', context: ctx, UUID: null, ok: false, error: null }
  try {
    if (!store.has('intent')) {
      assert.ok(!options.token && !options.createdUUID && !store.has('create'), 'Missing ownership intent')
      report.status = 'not-created'; report.ok = true; return report
    }
    const intent = readIntent(store); same(intent.context, ctx); assert.equal(intent.schema_version, 1)
    uuid(intent.token); assert.equal(options.token, intent.token, 'Unknown ownership token')
    assert.equal(intent.name, ownedName(ctx, intent.token))
    assert.equal(intent.runtime_identifier, C.runtime); assert.equal(intent.device_type_identifier, C.type)
    const before = acceptedBeforeCreate(store, intent)
    const preexisting = devices(json(before)).map(x => x.UUID); same(intent.preexisting_UUIDs, preexisting)
    if (!store.has('create')) { assert.ok(!options.createdUUID); report.status = 'not-created'; report.ok = true; return report }
    const creation = store.read('create')
    same(creation.arguments, ['simctl', 'create', intent.name, C.type, C.runtime]); assert.equal(creation.binary, '/usr/bin/xcrun')
    if (!successful(creation)) {
      assert.ok(!options.createdUUID, 'UUID output without successful create proof')
      report.status = 'creation-unproven-no-destructive-action'; return report
    }
    const UUID = createdUUID(creation); assert.equal(uuid(options.createdUUID), UUID, 'Step UUID differs from create receipt')
    assert.ok(!preexisting.includes(UUID), 'Refuse cleanup of preexisting UUID')
    if (store.has('created')) {
      const owned = store.read('created'); same(owned.context, ctx); assert.equal(owned.token, intent.token)
      assert.equal(owned.UUID, UUID); assert.equal(owned.name, intent.name)
      assert.equal(owned.runtime_identifier, C.runtime); assert.equal(owned.device_type_identifier, C.type)
    }
    report.UUID = UUID
    let row = ownedRow(devices(json(run('cleanup-before', '/usr/bin/xcrun', ['simctl', 'list', 'devices', '--json']))), intent, UUID, false)
    if (!row) { report.status = 'already-absent'; report.ok = true; return report }
    assert.ok(typeof row.device.state === 'string' && ['Shutdown', 'Booted', 'Booting', 'Creating', 'Shutting Down'].includes(row.device.state), 'Unknown owned Simulator state')
    let shutdownOK = true
    if (row.device.state !== 'Shutdown') shutdownOK = successful(run('cleanup-shutdown', '/usr/bin/xcrun', ['simctl', 'shutdown', UUID], 15000, false))
    // Recheck identity after shutdown; a changed/unknown owner never grants delete authority.
    row = ownedRow(devices(json(run('cleanup-before-delete', '/usr/bin/xcrun', ['simctl', 'list', 'devices', '--json']))), intent, UUID, false)
    const deletionOK = row ? successful(run('cleanup-delete', '/usr/bin/xcrun', ['simctl', 'delete', UUID], 30000, false)) : true
    const remains = devices(json(run('cleanup-after', '/usr/bin/xcrun', ['simctl', 'list', 'devices', '--json']))).some(x => x.UUID === UUID)
    report.shutdown_ok = shutdownOK; report.delete_ok = deletionOK; report.absent_after = !remains
    report.ok = shutdownOK && deletionOK && !remains
    report.status = report.ok ? 'owned-simulator-deleted' : 'cleanup-incomplete'
    return report
  } catch (error) {
    report.error = short(errorText(error)); report.status = 'refused-or-incomplete'
    throw error
  } finally { store.write('cleanup', report) }
}

/** @param {string} file @param {number} cap */
function readFile(file, cap) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)
  try { const st = fs.fstatSync(fd); assert.ok(st.isFile() && st.size <= cap); return fs.readFileSync(fd) }
  finally { fs.closeSync(fd) }
}
/** @param {string} directory @returns {SimulatorStore} */
function diskStore(directory) {
  const root = path.resolve(directory)
  let current = path.parse(root).root
  for (const part of root.slice(current.length).split(path.sep)) {
    current = path.join(current, part)
    if (!fs.existsSync(current)) fs.mkdirSync(current, { mode: 0o700 })
    const st = fs.lstatSync(current); assert.ok(st.isDirectory() && !st.isSymbolicLink(), 'Unsafe evidence parent')
  }
  assert.equal(fs.realpathSync(root), root)
  /** @param {string} name */
  const file = name => { assert.match(name, /^[a-z][a-z0-9-]*$/); return path.join(root, name + '.json') }
  return {
    has: name => fs.existsSync(file(name)),
    read: name => { const value = /** @type {unknown} */ (JSON.parse(readFile(file(name), C.receiptBytes).toString('utf8'))); resultObject(value); return value },
    write: (name, value) => {
      const data = encode(value), entries = fs.readdirSync(root); assert.ok(entries.length < 64)
      let bytes = 0
      for (const entry of entries) { const st = fs.lstatSync(path.join(root, entry)); assert.ok(st.isFile() && !st.isSymbolicLink()); bytes += st.size }
      assert.ok(data.length <= C.receiptBytes && bytes + data.length <= C.evidenceBytes, 'Native Simulator evidence cap')
      const fd = fs.openSync(file(name), fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600)
      try { fs.writeFileSync(fd, data) } finally { fs.closeSync(fd) }
    }
  }
}
/** @param {NodeJS.ProcessEnv} env */
function childEnvironment(env) {
  /** @type {NodeJS.ProcessEnv} */
  const result = { PATH: '/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin', DEVELOPER_DIR: C.developer,
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' }
  for (const key of ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL']) if (env[key]) result[key] = env[key]
  return result
}
// One read-only proof, without printing Git output, error messages or CI secrets.
/** @param {{execute: import('./native-simulator-types.ts').SimulatorExecute, env?: NodeJS.ProcessEnv, expectedCheckout: string, report?: (line: string) => void}} options */
export function readNativeGitIdentity({ execute, env = {}, expectedCheckout, report = line => console.error(line) }) {
  assert.ok(typeof execute === 'function' && typeof expectedCheckout === 'string' &&
    /^[a-f0-9]{40}$/.test(expectedCheckout), 'Invalid Native Git identity inputs')
  let result, threw = false
  try {
    result = execute('/usr/bin/git', ['rev-parse', 'HEAD', 'HEAD^{tree}'],
      { timeout: 30000, maxBuffer: 4096, killSignal: 'SIGKILL', env: childEnvironment(env) })
  } catch (error) { result = { status: null, signal: null, error }; threw = true }
  const value = plain(result) ? result : {}, code = plain(value.error) ? value.error.code : undefined
  /** @param {unknown} x */
  const kind = x => x === null ? 'null' : typeof x
  /** @param {string} reason @returns {never} */
  const fail = reason => {
    report('AILibraryNativeGitIdentity ' + JSON.stringify({ schema_version: 1, stage: 'git-identity', reason,
      timeout_ms: 30000, output_cap_bytes: 4096, executor_threw: threw,
      status: Number.isInteger(value.status) ? value.status : null, status_type: kind(value.status),
      signal: value.signal === null ? null :
        typeof value.signal === 'string' && ['SIGKILL', 'SIGTERM', 'SIGINT', 'SIGABRT', 'SIGSEGV', 'SIGHUP', 'SIGBUS'].includes(value.signal) ? value.signal : 'OTHER',
      signal_type: kind(value.signal), error_code: code == null ? null :
        typeof code === 'string' && ['ETIMEDOUT', 'ENOBUFS', 'ENOENT', 'EACCES', 'EPERM', 'EIO', 'EINVAL'].includes(code) ? code : 'OTHER',
      error_code_type: kind(code), stdout_bytes: Buffer.isBuffer(value.stdout) ? value.stdout.length : null,
      stderr_bytes: Buffer.isBuffer(value.stderr) ? value.stderr.length : null }))
    throw new Error('Native Git identity proof failed')
  }
  if (threw) fail('executor-threw')
  if (!plain(result)) fail('result-shape')
  if (!Buffer.isBuffer(value.stdout) || !Buffer.isBuffer(value.stderr)) fail('stream-type')
  if (value.stdout.length + value.stderr.length > 4096) fail('output-cap')
  if (value.status !== 0 || value.signal !== null || (value.error !== null && value.error !== undefined)) fail('command-result')
  let output
  try { output = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(value.stdout) }
  catch { fail('invalid-utf8') }
  const match = /^([a-f0-9]{40})\n([a-f0-9]{40})\n$/.exec(output)
  if (!match || match[0] !== output) fail('identity-format')
  if (match[1] !== expectedCheckout) fail('checkout-mismatch')
  return { checkout_sha: match[1], source_tree: match[2] }
}
/** @param {NodeJS.ProcessEnv} env @param {import('./native-simulator-types.ts').SimulatorExecute} execute @param {NodeJS.ProcessEnv} childEnv */
function cliContext(env, execute, childEnv) {
  assert.equal(process.platform, 'darwin'); assert.equal(env.GITHUB_ACTIONS, 'true')
  assert.equal(env.GITHUB_REPOSITORY, C.repository); assert.ok(env.GITHUB_EVENT_NAME === 'push' || env.GITHUB_EVENT_NAME === 'pull_request')
  assert.ok(env.GITHUB_EVENT_PATH && env.GITHUB_SHA && env.GITHUB_JOB)
  /** @type {unknown} */
  const event = JSON.parse(readFile(env.GITHUB_EVENT_PATH, 1024 * 1024).toString('utf8'))
  resultObject(event); resultObject(event.repository)
  assert.equal(event.repository.full_name, C.repository)
  assert.match(env.GITHUB_SHA, /^[a-f0-9]{40}$/)
  const request = event.pull_request
  if (env.GITHUB_EVENT_NAME === 'pull_request') { resultObject(request); resultObject(request.head); resultObject(request.base); resultObject(request.base.repo) }
  const source = env.GITHUB_EVENT_NAME === 'pull_request' && plain(request) && plain(request.head) ? request.head.sha : event.after
  assert.ok(['ios-native', 'ios-published-candidate'].includes(env.GITHUB_JOB), 'Unknown Simulator ownership profile')
  if (env.GITHUB_JOB === 'ios-published-candidate') assert.ok(env.UI_SLICE && ['reading-state', 'content-copy'].includes(env.UI_SLICE), 'Unknown published UI slice')
  const ownershipProfile = profile({ job: env.GITHUB_JOB, ui_slice: env.UI_SLICE })
  assert.equal(source, env[ownershipProfile.source])
  if (env.GITHUB_JOB === 'ios-published-candidate') assert.equal(event.repository.private, false)
  if (env.GITHUB_EVENT_NAME === 'push') assert.equal(source, env.GITHUB_SHA)
  else { resultObject(request); resultObject(request.base); resultObject(request.base.repo); assert.equal(request.base.repo.full_name, C.repository) }
  const identity = readNativeGitIdentity({ execute, env: childEnv, expectedCheckout: env.GITHUB_SHA })
  return context({ repository: env.GITHUB_REPOSITORY, job: env.GITHUB_JOB, run_id: env.GITHUB_RUN_ID,
    run_attempt: env.GITHUB_RUN_ATTEMPT, source_head: source, checkout_sha: identity.checkout_sha,
    source_tree: identity.source_tree, developer_dir: env.DEVELOPER_DIR, ui_slice: env.UI_SLICE })
}
/** @param {string|undefined} file @param {string} key @param {string} value */
function output(file, key, value) {
  assert.ok(file, 'GITHUB_OUTPUT is required')
  assert.ok(!/[\r\n]/.test(value)); assert.ok(['owner_token', 'created_uuid', 'destination'].includes(key))
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW)
  try { assert.ok(fs.fstatSync(fd).isFile()); fs.writeSync(fd, `${key}=${value}\n`) } finally { fs.closeSync(fd) }
}
/** @param {NodeJS.ProcessEnv} env */
function cliOptions(env) {
  /** @type {import('./native-simulator-types.ts').SimulatorExecute} */
  const execute = (binary, args, options) => spawnSync(binary, args, options)
  const childEnv = childEnvironment(env), ctx = cliContext(env, execute, childEnv)
  assert.ok(env.GITHUB_WORKSPACE && fs.realpathSync(env.GITHUB_WORKSPACE) === path.resolve(env.GITHUB_WORKSPACE))
  const ownershipProfile = profile(ctx), directory = path.join(env.GITHUB_WORKSPACE, ownershipProfile.root)
  return { directory, ownershipProfile, options: { context: ctx, execute, env: childEnv } }
}
/** @param {NodeJS.ProcessEnv} [env] */
export function readPublishedSimulatorReady(env = process.env) {
  const { directory, ownershipProfile, options } = cliOptions(env)
  assert.equal(options.context.job, 'ios-published-candidate', 'Published ready handoff requires the real published job')
  assert.ok(fs.existsSync(directory), 'Missing published Simulator evidence')
  return verifyNativeSimulatorReady({ ...options, store: diskStore(directory),
    token: env[ownershipProfile.token] || '', createdUUID: env[ownershipProfile.UUID] || '' })
}
/** @param {string[]} [argv] @param {NodeJS.ProcessEnv} [env] */
export function main(argv = process.argv.slice(2), env = process.env) {
  assert.ok(argv.length === 1 && ['prepare', 'ready', 'cleanup'].includes(argv[0]), 'Usage: native-simulator-prepare.mjs prepare|ready|cleanup')
  const { directory, ownershipProfile, options } = cliOptions(env)
  if (argv[0] === 'prepare') assert.ok(!fs.existsSync(directory), 'Native Simulator preparation must be fresh')
  else if (argv[0] === 'ready') assert.ok(fs.existsSync(directory), 'Missing Simulator ownership evidence')
  const store = diskStore(directory), ownedOptions = { ...options, store,
    token: env[ownershipProfile.token] || '', createdUUID: env[ownershipProfile.UUID] || '' }
  const result = argv[0] === 'prepare' ? prepareNativeSimulator({ ...options, store,
    onToken: token => output(env.GITHUB_OUTPUT, 'owner_token', token),
    onCreated: UUID => output(env.GITHUB_OUTPUT, 'created_uuid', UUID),
    onReady: destination => output(env.GITHUB_OUTPUT, 'destination', destination) }) :
    argv[0] === 'ready' ? verifyNativeSimulatorReady(ownedOptions) : cleanupNativeSimulator(ownedOptions)
  console.log(JSON.stringify(result))
  if (argv[0] === 'cleanup' && 'ok' in result && !result.ok) process.exitCode = 1
  return result
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main() } catch (error) { console.error(`Native Simulator preparation/cleanup failed: ${short(errorText(error))}`); process.exitCode = 1 }
}
