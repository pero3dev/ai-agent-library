#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

export const nativeSimulatorContract = Object.freeze({
  repository: 'pero3dev/ai-agent-library', runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-18-5',
  version: '18.5', type: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16', model: 'iPhone 16',
  developer: '/Applications/Xcode_16.4.app/Contents/Developer',
  prepareMs: 360000, cleanupMs: 90000, outputBytes: 128 * 1024,
  inventoryOutputBytes: 512 * 1024, receiptBytes: 1024 * 1024, evidenceBytes: 16 * 1024 * 1024
})
const C = nativeSimulatorContract
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x)
const uuid = x => { assert.ok(typeof x === 'string' && uuidPattern.test(x), 'Invalid Simulator UUID'); return x.toUpperCase() }
const text = x => new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(x, 'base64'))
const same = (a, b) => assert.deepEqual(a, b, 'Ownership/source context mismatch')
const encode = x => Buffer.from(JSON.stringify(x, null, 2) + '\n')
const short = x => String(x ?? '').slice(0, 800)

// Inventory JSON includes every installed platform and its supported device types.
// Only these exact read-only commands receive the larger bounded output budget.
function commandOutputBytes(binary, args) {
  return binary === '/usr/bin/xcrun' && Array.isArray(args) && args.length === 4 &&
    args[0] === 'simctl' && args[1] === 'list' && ['runtimes', 'devicetypes', 'devices'].includes(args[2]) &&
    args[3] === '--json' ? C.inventoryOutputBytes : C.outputBytes
}

function context(value) {
  assert.ok(plain(value), 'Missing CI context')
  const keys = ['repository', 'run_id', 'run_attempt', 'job', 'source_head', 'checkout_sha', 'source_tree', 'developer_dir']
  const selected = Object.fromEntries(keys.map(k => [k, value[k]]))
  assert.equal(selected.repository, C.repository); assert.equal(selected.job, 'ios-native')
  for (const k of ['run_id', 'run_attempt']) assert.match(selected[k], /^[1-9][0-9]{0,19}$/)
  for (const k of ['source_head', 'checkout_sha', 'source_tree']) assert.match(selected[k], /^[a-f0-9]{40}$/)
  assert.equal(selected.developer_dir, C.developer)
  return selected
}

// A failed or incomplete create never grants authority to delete a guessed device.
function successful(receipt) {
  if (!plain(receipt)) return false
  try {
    const out = Buffer.from(receipt.stdout_base64, 'base64'), err = Buffer.from(receipt.stderr_base64, 'base64')
    return receipt.status === 0 && receipt.signal === null && receipt.error_code === null && receipt.error === null &&
      receipt.output_complete === true && receipt.stdout_bytes === out.length && receipt.stderr_bytes === err.length &&
      out.length + err.length <= commandOutputBytes(receipt.binary, receipt.arguments) &&
      sha(out) === receipt.stdout_SHA256 && sha(err) === receipt.stderr_SHA256
  } catch { return false }
}

function runner({ execute, store, now = () => performance.now(), env = {} }, milliseconds) {
  assert.equal(typeof execute, 'function'); const deadline = now() + milliseconds
  const run = (label, binary, args, limit = 15000, required = true) => {
    const remaining = Math.floor(deadline - now()); assert.ok(remaining > 0, 'Native Simulator shared deadline expired')
    const timeout = Math.min(remaining, limit)
    const outputBytes = commandOutputBytes(binary, args)
    let result
    try { result = execute(binary, [...args], { timeout, maxBuffer: outputBytes, killSignal: 'SIGKILL', env: childEnvironment(env) }) }
    catch (error) { result = { error, status: null, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) } }
    const out = Buffer.from(result.stdout ?? ''), err = Buffer.from(result.stderr ?? '')
    const receipt = { schema_version: 1, binary, arguments: [...args], timeout_ms: timeout,
      status: Number.isInteger(result.status) ? result.status : null, signal: result.signal ?? null,
      error_code: result.error ? short(result.error.code ?? result.error.name ?? 'executor-error') : null,
      error: result.error ? short(result.error.message ?? result.error) : null,
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
function json(receipt) { assert.ok(successful(receipt)); return JSON.parse(text(receipt.stdout_base64)) }
function devices(value) {
  assert.ok(plain(value) && plain(value.devices), 'Invalid Simulator device inventory')
  const rows = []
  for (const [runtime, list] of Object.entries(value.devices)) {
    assert.ok(typeof runtime === 'string' && Array.isArray(list), 'Invalid runtime device list')
    for (const device of list) {
      assert.ok(plain(device) && typeof device.name === 'string' && device.name.length > 0 && device.name.length <= 200)
      rows.push({ runtime, device, UUID: uuid(device.udid) })
    }
  }
  assert.equal(new Set(rows.map(x => x.UUID)).size, rows.length, 'Ambiguous Simulator UUID inventory')
  return rows
}
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
function createdUUID(receipt) {
  assert.ok(successful(receipt), 'No successful create receipt')
  const value = text(receipt.stdout_base64)
  assert.ok(new RegExp('^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\\n?$', 'i').test(value), 'Create must return only one UUID')
  return uuid(value.trim())
}
export function nativeSimulatorDestination(UUID) { return `platform=iOS Simulator,id=${uuid(UUID)}` }

// Only these prepare-time, read-only argv lists can receive one bounded retry.
const prepareInventoryArguments = Object.freeze({
  runtimes: Object.freeze(['simctl', 'list', 'runtimes', '--json']),
  'device-types': Object.freeze(['simctl', 'list', 'devicetypes', '--json']),
  'devices-before-create': Object.freeze(['simctl', 'list', 'devices', '--json']),
  'devices-after-create': Object.freeze(['simctl', 'list', 'devices', '--json']),
  'devices-after-boot': Object.freeze(['simctl', 'list', 'devices', '--json'])
})
function inventoryReceipt(receipt, args) {
  try {
    assert.ok(plain(receipt) && receipt.schema_version === 1)
    assert.equal(receipt.binary, '/usr/bin/xcrun'); same(receipt.arguments, args)
    assert.ok(Number.isInteger(receipt.timeout_ms) && receipt.timeout_ms > 0 && receipt.timeout_ms <= 60000)
    assert.equal(receipt.returned_within_deadline, true)
    let total = 0
    for (const stream of ['stdout', 'stderr']) {
      const encoded = receipt[stream + '_base64']; assert.equal(typeof encoded, 'string')
      const bytes = Buffer.from(encoded, 'base64'); assert.equal(bytes.toString('base64'), encoded)
      assert.equal(receipt[stream + '_bytes'], bytes.length)
      assert.equal(receipt[stream + '_SHA256'], sha(bytes)); total += bytes.length
    }
    assert.ok(total <= commandOutputBytes(receipt.binary, receipt.arguments))
    return true
  } catch { return false }
}
function inventoryTimeout(receipt, args) {
  return inventoryReceipt(receipt, args) && receipt.status === null && receipt.signal === 'SIGKILL' &&
    receipt.error_code === 'ETIMEDOUT' && typeof receipt.error === 'string' && receipt.error.length > 0 &&
    receipt.error.length <= 800 && receipt.output_complete === false
}
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
    const intent = { schema_version: 1, context: ctx, token, name: `AILibrary-native-${ctx.run_id}-${ctx.run_attempt}-${token}`,
      runtime_identifier: C.runtime, device_type_identifier: C.type, preexisting_UUIDs: before,
      before_devices_stdout_SHA256: beforeReceipt.stdout_SHA256,
      before_devices_attempt_label: beforeAttempt.label, before_devices_receipt_SHA256: sha(encode(beforeReceipt)) }
    store.write('intent', intent); options.onToken?.(token)
    const creation = run('create', '/usr/bin/xcrun', ['simctl', 'create', intent.name, C.type, C.runtime], 30000)
    const UUID = createdUUID(creation); assert.ok(!before.includes(UUID), 'Create returned a preexisting UUID')
    options.onCreated?.(UUID)
    const afterCreate = ownedRow(devices(json(prepareInventory(run, 'devices-after-create').receipt)), intent, UUID)
    assert.equal(afterCreate.device.isAvailable, true, 'Created Simulator is unavailable')
    assert.equal(afterCreate.device.state, 'Shutdown', 'Fresh Simulator must initially be Shutdown')
    store.write('created', { context: ctx, token, UUID, name: intent.name, runtime_identifier: C.runtime, device_type_identifier: C.type })
    run('boot', '/usr/bin/xcrun', ['simctl', 'boot', UUID], 30000)
    run('bootstatus', '/usr/bin/xcrun', ['simctl', 'bootstatus', UUID, '-b'], 120000)
    const booted = ownedRow(devices(json(prepareInventory(run, 'devices-after-boot').receipt)), intent, UUID)
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
    store.write('prepare-failure', { status: 'failed', context: ctx, error: short(error.message), no_runtime_install_or_named_device_fallback: true })
    throw error
  }
}

export function cleanupNativeSimulator(options) {
  const ctx = context(options.context), { store } = options, run = runner(options, C.cleanupMs)
  const report = { status: 'not-completed', context: ctx, UUID: null, ok: false, error: null }
  try {
    if (!store.has('intent')) {
      assert.ok(!options.token && !options.createdUUID && !store.has('create'), 'Missing ownership intent')
      report.status = 'not-created'; report.ok = true; return report
    }
    const intent = store.read('intent'); same(intent.context, ctx); assert.equal(intent.schema_version, 1)
    uuid(intent.token); assert.equal(options.token, intent.token, 'Unknown ownership token')
    assert.equal(intent.name, `AILibrary-native-${ctx.run_id}-${ctx.run_attempt}-${intent.token}`)
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
    assert.ok(['Shutdown', 'Booted', 'Booting', 'Creating', 'Shutting Down'].includes(row.device.state), 'Unknown owned Simulator state')
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
    report.error = short(error.message); report.status = 'refused-or-incomplete'
    throw error
  } finally { store.write('cleanup', report) }
}

function readFile(file, cap) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)
  try { const st = fs.fstatSync(fd); assert.ok(st.isFile() && st.size <= cap); return fs.readFileSync(fd) }
  finally { fs.closeSync(fd) }
}
function diskStore(directory) {
  const root = path.resolve(directory)
  let current = path.parse(root).root
  for (const part of root.slice(current.length).split(path.sep)) {
    current = path.join(current, part)
    if (!fs.existsSync(current)) fs.mkdirSync(current, { mode: 0o700 })
    const st = fs.lstatSync(current); assert.ok(st.isDirectory() && !st.isSymbolicLink(), 'Unsafe evidence parent')
  }
  assert.equal(fs.realpathSync(root), root)
  const file = name => { assert.match(name, /^[a-z][a-z0-9-]*$/); return path.join(root, name + '.json') }
  return {
    has: name => fs.existsSync(file(name)),
    read: name => JSON.parse(readFile(file(name), C.receiptBytes).toString('utf8')),
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
function childEnvironment(env) {
  const result = { PATH: '/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin', DEVELOPER_DIR: C.developer,
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' }
  for (const key of ['HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL']) if (env[key]) result[key] = env[key]
  return result
}
function cliContext(env, execute, childEnv) {
  assert.equal(process.platform, 'darwin'); assert.equal(env.GITHUB_ACTIONS, 'true')
  assert.equal(env.GITHUB_REPOSITORY, C.repository); assert.ok(['push', 'pull_request'].includes(env.GITHUB_EVENT_NAME))
  const event = JSON.parse(readFile(env.GITHUB_EVENT_PATH, 1024 * 1024).toString('utf8'))
  assert.equal(event.repository.full_name, C.repository)
  assert.match(env.GITHUB_SHA, /^[a-f0-9]{40}$/)
  const source = env.GITHUB_EVENT_NAME === 'pull_request' ? event.pull_request?.head?.sha : event.after
  assert.equal(source, env.AILIBRARY_NATIVE_SOURCE_HEAD)
  if (env.GITHUB_EVENT_NAME === 'push') assert.equal(source, env.GITHUB_SHA)
  else assert.equal(event.pull_request?.base?.repo?.full_name, C.repository)
  const git = args => {
    const r = execute('/usr/bin/git', args, { timeout: 10000, maxBuffer: 4096, killSignal: 'SIGKILL', env: childEnv })
    assert.equal(r.status, 0); assert.ok(!r.error && !r.signal); return Buffer.from(r.stdout).toString('utf8').trim()
  }
  assert.equal(git(['rev-parse', 'HEAD']), env.GITHUB_SHA)
  return context({ repository: env.GITHUB_REPOSITORY, job: env.GITHUB_JOB, run_id: env.GITHUB_RUN_ID,
    run_attempt: env.GITHUB_RUN_ATTEMPT, source_head: source, checkout_sha: env.GITHUB_SHA,
    source_tree: git(['rev-parse', 'HEAD^{tree}']), developer_dir: env.DEVELOPER_DIR })
}
function output(file, key, value) {
  assert.ok(!/[\r\n]/.test(value)); assert.ok(['owner_token', 'created_uuid', 'destination'].includes(key))
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW)
  try { assert.ok(fs.fstatSync(fd).isFile()); fs.writeSync(fd, `${key}=${value}\n`) } finally { fs.closeSync(fd) }
}
export function main(argv = process.argv.slice(2), env = process.env) {
  assert.ok(argv.length === 1 && ['prepare', 'cleanup'].includes(argv[0]), 'Usage: native-simulator-prepare.mjs prepare|cleanup')
  const execute = (binary, args, options) => spawnSync(binary, args, options)
  const childEnv = childEnvironment(env), ctx = cliContext(env, execute, childEnv)
  assert.ok(env.GITHUB_WORKSPACE && fs.realpathSync(env.GITHUB_WORKSPACE) === path.resolve(env.GITHUB_WORKSPACE))
  const directory = path.join(env.GITHUB_WORKSPACE, '.local/ios-ci/evidence/native-simulator')
  if (argv[0] === 'prepare') assert.ok(!fs.existsSync(directory), 'Native Simulator preparation must be fresh')
  const store = diskStore(directory), options = { context: ctx, execute, store, env: childEnv }
  const result = argv[0] === 'prepare' ? prepareNativeSimulator({ ...options,
    onToken: token => output(env.GITHUB_OUTPUT, 'owner_token', token),
    onCreated: UUID => output(env.GITHUB_OUTPUT, 'created_uuid', UUID),
    onReady: destination => output(env.GITHUB_OUTPUT, 'destination', destination) }) :
    cleanupNativeSimulator({ ...options, token: env.AILIBRARY_NATIVE_OWNER_TOKEN || '', createdUUID: env.AILIBRARY_NATIVE_CREATED_UUID || '' })
  console.log(JSON.stringify(result))
  if (argv[0] === 'cleanup' && !result.ok) process.exitCode = 1
  return result
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main() } catch (error) { console.error(`Native Simulator preparation/cleanup failed: ${short(error.message)}`); process.exitCode = 1 }
}
