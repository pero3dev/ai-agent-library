import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const PILOT = Object.freeze({ version: '17.0', runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-17-0',
  device: 'com.apple.CoreSimulator.SimDeviceType.iPhone-15', model: 'iPhone 15',
  workMs: 19 * 60000, cleanupMs: 2 * 60000, downloadMs: 10 * 60000, importMs: 5 * 60000,
  bootMs: 240000, freeBytes: 2 * 1024 ** 3, ownedBytes: 39 * 1024 ** 3,
  outputBytes: 4 * 1024 ** 2, evidenceBytes: 2 * 1024 ** 2, evidenceReserve: 65536 })

// A proposed wire budget for this progress channel, not a measured download requirement.
export const DOWNLOAD_OUTPUT_LIMITS = Object.freeze({ wireBytes: 64 * 1024 ** 2, recordBytes: 256 })
const downloadProgress = frame => {
  let end = frame.length
  if (frame[end - 1] === 10) end--
  if (frame[end - 1] === 13) end--
  for (let i = 0; i < end; i++) if (frame[i] < 32 || frame[i] > 126) return false
  // Only bounded complete ASCII records reach this expression; no warnings or arbitrary text.
  return /^ {0,8}Downloading iOS 17\.0 Simulator \([A-Za-z0-9]{1,32}\): (?:(?:100(?:\.0{1,2})?|(?:0|[1-9][0-9]?)(?:\.[0-9]{1,2})?)% \([0-9]{1,6}(?:\.[0-9]{1,3})? (?:KB|MB|GB) of [0-9]{1,6}(?:\.[0-9]{1,3})? (?:KB|MB|GB)\)|Installing \((?:registering download|Mounting)\)\.\.\.|Done\.) {0,64}$/.test(frame.toString('latin1', 0, end))
}
export function commandOutputCapture(name, onLimit) {
  const download = name === 'runtime-download', wireCap = download ? DOWNLOAD_OUTPUT_LIMITS.wireBytes : PILOT.outputBytes
  // stdout grows from the front, stderr grows backwards from the back: one shared 4MiB arena.
  const arena = Buffer.allocUnsafe(PILOT.outputBytes), pending = Buffer.allocUnsafe(DOWNLOAD_OUTPUT_LIMITS.recordBytes)
  const rawOutHash = createHash('sha256'), rawErrHash = createHash('sha256')
  let outBytes = 0, errBytes = 0, rawOutBytes = 0, rawErrBytes = 0, pendingBytes = 0, pendingCR = false,
    passthrough = false, lastSafe = null, keptInRun = 0, droppedRecords = 0, droppedBytes = 0,
    maxPending = 0, retainedCapExceeded = false, limitReason = null, finished = null
  const resetMatch = () => { lastSafe = null; keptInRun = 0 }
  const limit = reason => { if (limitReason === null) { limitReason = reason; onLimit(reason) } }
  const retain = (bytes, stderr = false) => {
    if (limitReason !== null) return false
    const size = Math.min(bytes.length, PILOT.outputBytes - outBytes - errBytes)
    if (stderr) {
      for (let i = 0; i < size; i++) arena[PILOT.outputBytes - 1 - errBytes - i] = bytes[i]
      errBytes += size
    } else { bytes.copy(arena, outBytes, 0, size); outBytes += size }
    if (size !== bytes.length) { retainedCapExceeded = true; limit('output-cap') }
    return size === bytes.length
  }
  const complete = () => {
    const frame = pending.subarray(0, pendingBytes)
    if (downloadProgress(frame)) {
      if (lastSafe?.equals(frame) && keptInRun >= 2) { droppedRecords++; droppedBytes += frame.length }
      else {
        const same = lastSafe?.equals(frame), start = outBytes
        if (retain(frame)) { lastSafe = arena.subarray(start, outBytes); keptInRun = same ? keptInRun + 1 : 1 }
      }
    } else { resetMatch(); retain(frame) }
    pendingBytes = 0; pendingCR = false
  }
  const flushTail = () => {
    // An unterminated record never qualifies for deduplication, even if its text looks known.
    if (pendingBytes) { resetMatch(); retain(pending.subarray(0, pendingBytes)) }
    pendingBytes = 0; pendingCR = false
  }
  const progress = bytes => {
    let i = 0
    while (i < bytes.length && limitReason === null) {
      if (pendingCR) {
        if (bytes[i] === 10) {
          if (pendingBytes < pending.length) { pending[pendingBytes++] = bytes[i++]; maxPending = Math.max(maxPending, pendingBytes); complete() }
          else { flushTail(); retain(bytes.subarray(i, i + 1)); i++ }
        } else complete()
        continue
      }
      if (passthrough) {
        const cr = bytes.indexOf(13, i), lf = bytes.indexOf(10, i)
        const end = cr < 0 ? lf : lf < 0 ? cr : Math.min(cr, lf)
        const next = end < 0 ? bytes.length : end + 1
        retain(bytes.subarray(i, next)); i = next
        if (end >= 0) passthrough = false
        continue
      }
      if (pendingBytes === pending.length) { flushTail(); passthrough = true; continue }
      const byte = bytes[i++]; pending[pendingBytes++] = byte; maxPending = Math.max(maxPending, pendingBytes)
      if (byte === 13) pendingCR = true
      else if (byte === 10) complete()
    }
  }
  const take = (bytes, stderr) => {
    assert.equal(finished, null, 'Output capture already finished'); assert.ok(Buffer.isBuffer(bytes))
    const before = rawOutBytes + rawErrBytes
    if (stderr) { rawErrBytes += bytes.length; rawErrHash.update(bytes); if (bytes.length) resetMatch() }
    else { rawOutBytes += bytes.length; rawOutHash.update(bytes) }
    if (limitReason !== null) return
    const allowed = bytes.subarray(0, Math.max(0, wireCap - before))
    if (stderr || !download) retain(allowed, stderr)
    else progress(allowed)
    if (rawOutBytes + rawErrBytes > wireCap) {
      flushTail()
      limit(download ? 'download-wire-cap' : 'output-cap')
    }
  }
  return {
    stdout: bytes => take(bytes, false), stderr: bytes => take(bytes, true),
    finish() {
      if (finished) return finished
      if (pendingCR && limitReason === null) complete()
      else flushTail()
      const stdout = arena.subarray(0, outBytes), stderr = arena.subarray(PILOT.outputBytes - errBytes).reverse()
      const receipt = { output_capture_policy: download ? 'known-progress-consecutive-third-plus-v1' : 'raw-v1',
        raw_wire_cap_bytes: wireCap, retained_output_cap_bytes: PILOT.outputBytes,
        known_progress_record_cap_bytes: download ? DOWNLOAD_OUTPUT_LIMITS.recordBytes : null,
        observed_stream_bytes: rawOutBytes + rawErrBytes, raw_stdout_bytes: rawOutBytes, raw_stderr_bytes: rawErrBytes,
        raw_stdout_sha256: rawOutHash.digest('hex'), raw_stderr_sha256: rawErrHash.digest('hex'),
        captured_stdout_bytes: outBytes, captured_stdout_sha256: sha(stdout),
        captured_stderr_bytes: errBytes, captured_stderr_sha256: sha(stderr),
        retained_stream_bytes: outBytes + errBytes, deduplicated_progress_records: droppedRecords,
        deduplicated_progress_bytes: droppedBytes, uncaptured_stream_bytes: rawOutBytes + rawErrBytes - outBytes - errBytes - droppedBytes,
        raw_wire_cap_exceeded: rawOutBytes + rawErrBytes > wireCap, retained_output_cap_exceeded: retainedCapExceeded,
        max_pending_stdout_bytes: maxPending, output_limit_reason: limitReason,
        captured_output_complete: limitReason === null && droppedBytes === 0 }
      finished = { stdout, stderr, receipt }; return finished
    }
  }
}
const UUID = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
export const runtimeReceipt = value => ({ runtimes: value.runtimes.map(row => Object.fromEntries(
  ['identifier', 'name', 'version', 'buildversion', 'isAvailable', 'platform', 'platformIdentifier',
    'bundlePath', 'runtimeRoot', 'architectures', 'supportedArchitectures'].map(key => [key, row[key]]))) })
const deviceReceipt = value => ({ devices: Object.fromEntries(Object.entries(value.devices).map(([runtime, rows]) =>
  [runtime, rows.map(row => Object.fromEntries(['udid', 'name', 'state', 'deviceTypeIdentifier', 'isAvailable'].map(key => [key, row[key]])))])) })
const diagnostic = value => String(value).replace(/https?:\/\/[^\s"'<>]+/g, '<url>')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<email>')
  .replace(/((?:token|signature|credential|authorization|password|x-amz-[a-z-]+)=)[^\s&]+/gi, '$1<redacted>').slice(-4096)

export const requiresConsent = text => /(?:sign[ -]+in|log[ -]+in|authentication required|license agreement|terms and conditions|Apple (?:Account|ID)|accept.{0,80}(?:licen[sc]e|agreement)|(?:licen[sc]e|agreement).{0,80}(?:required|accept))/is.test(text)

// Keep the original recursive reduction, including its order and treatment of non-files.
export function ownedLogicalBytes(folder, observe = null, io = fs) {
  return io.readdirSync(folder).reduce((sum, name) => {
    const file = path.join(folder, name), st = io.lstatSync(file)
    if (st.isSymbolicLink()) return sum + 0
    if (st.isDirectory()) return sum + ownedLogicalBytes(file, observe, io)
    const size = st.size
    try { observe?.(file, st, size) } catch { /* Optional metadata cannot change the numeric probe. */ }
    return sum + size
  }, 0)
}
const ownedBreakdownBytes = value => Buffer.byteLength(JSON.stringify({ owned_size_breakdown: value }, null, 2) + '\n')
const ownedPath = (root, file) => {
  const relative = path.relative(root, file)
  if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep)) return { path: null, path_omitted: 'outside-root' }
  // Omit the whole name instead of displaying a truncated or invalid destination.
  if (relative.length > 160 || Buffer.byteLength(relative) > 160) return { path: null, path_omitted: 'long' }
  if (!relative.isWellFormed() || /[\u0000-\u001f\u007f-\u009f\\]/u.test(relative)) return { path: null, path_omitted: 'unsafe' }
  if (diagnostic(relative) !== relative) return { path: null, path_omitted: 'redacted' }
  return { path: relative.split(path.sep).join('/') }
}
const ownedKind = st => {
  try { return ({ 32768: 'file', 4096: 'fifo', 49152: 'socket', 8192: 'character', 24576: 'block' })[st.mode & 61440] ?? 'other' }
  catch { return 'other' }
}
const rawBlocks = st => {
  try { const blocks = st.blocks; return Number.isFinite(blocks) && blocks >= 0 ? blocks : null } catch { return null }
}
export function ownedSizeProbe(root, io = fs) {
  let current = null
  const collector = () => {
    const top = []; let seen = 0, complete = false, selectionComplete = true, total = null
    return {
      observe(file, st, size) {
        try {
          seen++
          if (!Number.isFinite(size) || size < 0) { selectionComplete = false; return }
          const index = top.findIndex(row => size > row.logical_bytes)
          if (index < 0 && top.length === 8) return
          const row = { ...ownedPath(root, file), kind: ownedKind(st), logical_bytes: size, blocks_raw: rawBlocks(st) }
          if (index < 0) top.push(row)
          else { if (top.length === 8) top.pop(); top.splice(index, 0, row) }
        } catch { selectionComplete = false }
      },
      finish(value) { complete = true; total = Number.isFinite(value) ? value : null },
      snapshot() {
        try {
          const entries = top.map(row => ({ ...row }))
          const result = { same_monitor_walk: true, complete, selection_complete: complete && selectionComplete,
            atomic: false, blocks_unit: null, total_logical_bytes: total, counted_entries_seen: seen,
            top_limit: 8, omitted_by_budget: 0, unlisted_entries_seen: 0,
            listed_logical_bytes: null, unlisted_logical_bytes: null, entries }
          for (;;) {
            const listed = entries.reduce((sum, row) => sum + row.logical_bytes, 0)
            result.listed_logical_bytes = Number.isFinite(listed) ? listed : null
            result.unlisted_logical_bytes = total !== null && result.listed_logical_bytes !== null ? total - listed : null
            result.omitted_by_budget = top.length - entries.length; result.unlisted_entries_seen = seen - entries.length
            // The wrapper includes the same nested pretty indentation as the real command exit put.
            if (ownedBreakdownBytes(result) <= 2048) {
              entries.forEach(Object.freeze); Object.freeze(entries); return Object.freeze(result)
            }
            if (!entries.length) return null
            entries.pop()
          }
        } catch { return null }
      }
    }
  }
  return {
    read() {
      current = null
      try { current = collector() } catch {}
      const total = ownedLogicalBytes(root, current?.observe, io)
      try { current?.finish(total) } catch {}
      return total
    },
    snapshot() { return current?.snapshot() ?? null }
  }
}
export function withOwnedSizeBreakdown(receipt, breakdown, budget) {
  // If optional evidence does not fit, preserve the pre-existing receipt and its original put guard.
  try {
    const candidate = { ...receipt, owned_size_breakdown: breakdown }
    const fits = () => Buffer.byteLength(JSON.stringify(candidate, null, 2) + '\n') <= budget
    if (fits()) return candidate
    candidate.owned_size_breakdown = null
    if (fits()) return candidate
  } catch {}
  return receipt
}

export function evaluateResourceThresholds(readFree, readOwned, sample) {
  Object.assign(sample, { free_bytes: null, owned_bytes: null, free_completed: false, owned_completed: false,
    active_probe: 'free', violated_check: null })
  sample.free_bytes = readFree(); sample.free_completed = true
  if (sample.free_bytes < PILOT.freeBytes) { sample.violated_check = 'free-floor'; sample.active_probe = null; return true }
  sample.active_probe = 'owned'
  sample.owned_bytes = readOwned(); sample.owned_completed = true
  const violated = sample.owned_bytes > PILOT.ownedBytes
  if (violated) sample.violated_check = 'owned-cap'
  sample.active_probe = null; return violated
}

export function resourceThresholdMonitor({ command, stage, readFree, readOwned, kill, stopReason, elapsedMs, readOwnedBreakdown = () => null }) {
  let first = null, observedFailure = false
  let firstOwnedBreakdown = null
  const label = (value, max) => typeof value === 'string' ? value.slice(0, max) : null
  const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null
  const priorStop = () => { try { return stopReason() } catch { return null } }
  const retainFirst = (sample, observationError, error, previousStop) => {
    if (observedFailure) return
    observedFailure = true
    // This runs after the original kill request. No FS work or serialization is added to the stop path.
    try {
      let elapsed = null, code = null
      try { elapsed = number(elapsedMs()) } catch {}
      try { const candidate = error?.code
        if (typeof candidate === 'string' && candidate.length <= 32 && /^[A-Z0-9_]+$/.test(candidate)) code = candidate
      } catch {}
      const status = (completed, value) => !completed ? 'not-completed' : number(value) === null ? 'not-finite-number' : 'observed'
      first = Object.freeze({ command: label(command, 64), stage: label(stage, 48), phase: 'monitor', elapsed_ms: elapsed,
        free_bytes: number(sample.free_bytes), free_floor_bytes: PILOT.freeBytes,
        free_value_status: status(sample.free_completed, sample.free_bytes),
        owned_bytes: number(sample.owned_bytes), owned_cap_bytes: PILOT.ownedBytes,
        owned_value_status: status(sample.owned_completed, sample.owned_bytes),
        violated_check: sample.violated_check, observation_error: observationError,
        observation_error_probe: observationError ? sample.active_probe : null, observation_error_code: observationError ? code : null,
        stop_already_set: label(previousStop, 64), measurement: 'non-atomic logical bytes; symlinks contribute zero' })
    } catch { /* Telemetry must not replace the already-requested original stop. */ }
    try {
      if (sample.owned_completed || sample.active_probe === 'owned') {
        const value = readOwnedBreakdown()
        if (value !== null && typeof value === 'object' && ownedBreakdownBytes(value) <= 2048) firstOwnedBreakdown = value
      }
    } catch { /* Optional same-walk evidence must not replace the original stop. */ }
  }
  return {
    get firstFailure() { return first },
    get ownedSizeBreakdown() { return firstOwnedBreakdown },
    poll(cleanup = false) {
      if (cleanup) return
      const sample = {}
      try {
        if (evaluateResourceThresholds(readFree, readOwned, sample)) {
          const previousStop = priorStop(); kill('resource-floor-or-cap')
          retainFirst(sample, false, null, previousStop)
        }
      } catch (error) {
        const previousStop = priorStop(); kill('resource-observation-failed')
        retainFirst(sample, true, error, previousStop)
      }
    }
  }
}

export function cleanupDeadline(started, now) {
  assert.ok(Number.isFinite(started) && Number.isFinite(now) && now >= started)
  return Math.min(started + PILOT.workMs + PILOT.cleanupMs, now + PILOT.cleanupMs)
}
export function pilotCancellation(events = process) {
  let signal = null, cleanup = false, activeStop = null
  const received = []
  const record = value => {
    signal ??= value
    if (!received.includes(value)) received.push(value)
    if (!cleanup) activeStop?.('cancelled-' + value)
  }
  const interrupt = () => record('SIGINT'), terminate = () => record('SIGTERM')
  events.on('SIGINT', interrupt); events.on('SIGTERM', terminate)
  return {
    get signal() { return signal },
    get received() { return [...received] },
    assertWorkAllowed() { assert.equal(signal, null, 'Pilot cancelled; no new work command') },
    bindOwnedStop(stop) { activeStop = stop; if (signal && !cleanup) stop('cancelled-' + signal) },
    releaseOwnedStop(stop) { if (activeStop === stop) activeStop = null },
    beginCleanup() { cleanup = true },
    close() { activeStop = null; events.removeListener('SIGINT', interrupt); events.removeListener('SIGTERM', terminate) }
  }
}

// This permits one new metadata read, never a boot, test, or whole-job retry.
export function postbootRecoveryAllowed(receipt, remainingMs, cancelledSignal) {
  return receipt?.name === 'devices-after-boot' && receipt.stage === 'owned-boot'
    && receipt.binary === 'xcrun' && Array.isArray(receipt.arguments)
    && JSON.stringify(receipt.arguments) === JSON.stringify(['simctl', 'list', 'devices', '--json'])
    && receipt.timeout_ms === 60000 && receipt.code === null && receipt.signal === 'SIGKILL'
    && receipt.error === null && receipt.stop === 'command-or-shared-deadline'
    && receipt.cancelled_signal === null && cancelledSignal === null && receipt.resource_failure === false
    && receipt.captured_output_complete === false && Number.isFinite(receipt.elapsed_ms) && receipt.elapsed_ms >= 60000
    && receipt.observed_stream_bytes === 0 && receipt.captured_stdout_bytes === 0 && receipt.captured_stderr_bytes === 0
    && Number.isFinite(remainingMs) && remainingMs >= 60000
}
export async function readPostbootInventory({ read, validate, remainingMs, cancellation, recordRecovery }) {
  cancellation.assertWorkAllowed()
  let inventory
  try { inventory = await read('devices-after-boot') }
  catch (error) {
    cancellation.assertWorkAllowed()
    const remaining = remainingMs()
    if (!postbootRecoveryAllowed(error?.pilotCommand, remaining, cancellation.signal)) throw error
    recordRecovery({ failed_read: 'devices-after-boot', fresh_read: 'devices-after-boot-recovery',
      read_only: true, maximum_fresh_reads: 1, required_timeout_ms: 60000, shared_remaining_ms: remaining,
      shared_work_budget_ms: PILOT.workMs, plan_is_not_execution_proof: true, timeout_cause_unresolved: true })
    cancellation.assertWorkAllowed()
    const beforeRead = remainingMs()
    if (!Number.isFinite(beforeRead) || beforeRead < 60000) throw error
    // The runner also requires the full cap immediately before its intent/spawn path.
    inventory = await read('devices-after-boot-recovery', error)
  }
  // Parse failures and owner/Booted failures never trigger another inventory read.
  validate(inventory)
  return inventory
}

export function selectExact17(inventory) {
  assert.ok(Array.isArray(inventory.runtimes), 'Unknown runtime inventory')
  const exact = inventory.runtimes.filter(row => row?.version === PILOT.version)
  for (const row of exact) {
    assert.equal(row.identifier, PILOT.runtime); assert.equal(row.name, 'iOS 17.0')
    assert.equal(typeof row.isAvailable, 'boolean')
    assert.equal(typeof row.buildversion, 'string'); assert.ok(row.buildversion.length)
  }
  const available = exact.filter(row => row.isAvailable)
  assert.ok(available.length <= 1, 'Ambiguous exact17.0 runtime')
  return available[0] ?? null
}
export async function readRuntimeSnapshot(label, query, record) {
  const inventory = await query(label)
  // Persist the projected identities before strict selection can reject ambiguity.
  record(label + '.json', runtimeReceipt(inventory))
  return inventory
}
export async function ensureDownloadedRuntime({ query, record, importRuntime }) {
  const afterDownload = await readRuntimeSnapshot('runtimes-after-download', query, record)
  const alreadyAvailable = selectExact17(afterDownload)
  record('runtime-import-plan.json', { exact17_available_after_download: alreadyAvailable !== null,
    explicit_import_planned: alreadyAvailable === null, maximum_explicit_imports: 1,
    plan_is_not_execution_proof: true })
  if (alreadyAvailable) return alreadyAvailable
  await importRuntime()
  const afterImport = await readRuntimeSnapshot('runtimes-after-import', query, record)
  const selected = selectExact17(afterImport)
  assert.ok(selected, 'Exact17.0 unavailable after import, no17.5 fallback')
  return selected
}
export function deviceRows(inventory) {
  assert.ok(inventory.devices && typeof inventory.devices === 'object')
  const rows = Object.entries(inventory.devices).flatMap(([runtime, devices]) => {
    assert.ok(Array.isArray(devices)); return devices.map(device => ({ runtime, ...device }))
  })
  assert.ok(rows.length <= 512)
  for (const row of rows) assert.match(String(row.udid).toUpperCase(), UUID)
  assert.equal(new Set(rows.map(row => row.udid.toUpperCase())).size, rows.length)
  return rows
}
export function proveOwner(owner, context, inventory) {
  for (const key of ['repository', 'event', 'source_head', 'run_id', 'run_attempt']) assert.equal(owner[key], context[key])
  assert.match(owner.token, /^[a-f0-9-]{36}$/)
  assert.equal(owner.name, `AILibrary-ios17-${owner.run_id}-${owner.run_attempt}-${owner.token}`)
  assert.match(owner.UUID, UUID); assert.equal(owner.runtime, PILOT.runtime); assert.equal(owner.type, PILOT.device)
  assert.equal(owner.creation_exit, 0); assert.ok(!owner.preexisting_UUIDs.includes(owner.UUID))
  const matches = deviceRows(inventory).filter(row => row.udid.toUpperCase() === owner.UUID)
  assert.ok(matches.length <= 1)
  if (matches.length) {
    assert.equal(matches[0].runtime, PILOT.runtime); assert.equal(matches[0].name, owner.name)
    assert.equal(matches[0].isAvailable, true)
    if (matches[0].deviceTypeIdentifier !== undefined) assert.equal(matches[0].deviceTypeIdentifier, PILOT.device)
  }
  return matches[0] ?? null
}
export function expectedCases(source) {
  assert.ok(source.includes('final class NativeInlineTests'))
  const names = [...source.matchAll(/^\s+func (test[A-Za-z0-9_]+)\(/gm)].map(match => match[1])
  assert.ok([37, 46].includes(names.length), 'Review changed class cardinality before extending pilot')
  assert.equal(new Set(names).size, names.length)
  return [...names.map(name => `NativeInlineTests/${name}()`),
    'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()'].sort()
}
export function verifyFunctional(tree, expected, owner) {
  assert.ok(Array.isArray(tree.testNodes) && tree.testNodes.length)
  const cases = []
  const visit = nodes => { for (const node of nodes) {
    assert.equal(node.result, 'Passed', 'Skipped/failed/unknown results are not functional acceptance')
    assert.ok(['Test Plan', 'Unit test bundle', 'UI test bundle', 'Test Suite', 'Test Case'].includes(node.nodeType))
    if (node.nodeType === 'Test Case') cases.push(node.nodeIdentifier)
    if (node.children !== undefined) { assert.ok(Array.isArray(node.children)); visit(node.children) }
  } }
  visit(tree.testNodes); assert.deepEqual(cases.sort(), expected)
  assert.equal(tree.devices?.length, 1)
  const device = tree.devices[0]; assert.equal(device.deviceId.toUpperCase(), owner.UUID)
  assert.equal(device.osVersion, PILOT.version); assert.equal(device.platform, 'iOS Simulator')
  if (device.modelName !== undefined) assert.equal(device.modelName, PILOT.model)
  return cases.length
}
export function ownedDMG(directory) {
  assert.ok(!fs.lstatSync(directory).isSymbolicLink())
  const root = fs.realpathSync(directory), found = []; let entries = 0
  assert.equal(root, path.resolve(directory))
  const visit = (folder, depth) => {
    assert.ok(depth <= 4)
    for (const name of fs.readdirSync(folder)) {
      assert.ok(++entries <= 128); const file = path.join(folder, name), st = fs.lstatSync(file)
      assert.ok(!st.isSymbolicLink(), 'Runtime export symlink rejected')
      if (st.isDirectory()) visit(file, depth + 1)
      else { assert.ok(st.isFile()); if (name.endsWith('.dmg')) {
        assert.match(name, /^[A-Za-z0-9_. -]+\.dmg$/)
        assert.ok(st.size > 0 && st.size <= 12 * 1024 ** 3); found.push(file)
      } }
    }
  }
  visit(root, 0); assert.equal(found.length, 1, 'Exactly one owned exported DMG required')
  return found[0]
}

export async function runPilot(env = process.env) {
  assert.equal(env.GITHUB_ACTIONS, 'true'); assert.equal(env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library')
  assert.equal(env.REPOSITORY_IS_PRIVATE, 'false'); assert.match(env.EXPECTED_SOURCE_HEAD, /^[a-f0-9]{40}$/)
  assert.match(env.GITHUB_RUN_ID, /^[1-9][0-9]*$/); assert.match(env.GITHUB_RUN_ATTEMPT, /^[1-9][0-9]*$/)
  assert.ok(['pull_request', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME))
  assert.equal(env.DEVELOPER_DIR, '/Applications/Xcode_16.4.app/Contents/Developer')
  const repo = fs.realpathSync(env.GITHUB_WORKSPACE), local = path.join(repo, '.local')
  if (fs.existsSync(local)) assert.ok(!fs.lstatSync(local).isSymbolicLink())
  fs.mkdirSync(local, { recursive: true }); const root = path.join(local, 'ios17-functional')
  assert.ok(!fs.existsSync(root)); fs.mkdirSync(root, { mode: 0o700 })
  const evidence = path.join(root, 'evidence'), download = path.join(root, 'runtime-download')
  fs.mkdirSync(evidence, { mode: 0o700 }); fs.mkdirSync(download, { mode: 0o700 })
  const rootIdentity = fs.statSync(root), downloadIdentity = fs.statSync(download), started = performance.now(), context = {
    repository: env.GITHUB_REPOSITORY, event: env.GITHUB_EVENT_NAME,
    source_head: env.EXPECTED_SOURCE_HEAD, run_id: env.GITHUB_RUN_ID, run_attempt: env.GITHUB_RUN_ATTEMPT }
  let deadline = started + PILOT.workMs, evidenceBytes = 0, stage = 'inventory', owner = null,
    creationAttempted = false, functional = null, failure = null, cleanupStatus = 'not-created'
  const cancellation = pilotCancellation()
  const put = (name, value, final = false) => {
    assert.match(name, /^[a-z0-9.-]+$/); const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    assert.ok(bytes.length <= 512 * 1024 && evidenceBytes + bytes.length <= PILOT.evidenceBytes - (final ? 0 : PILOT.evidenceReserve))
    fs.writeFileSync(path.join(evidence, name), bytes, { flag: 'wx', mode: 0o600 }); evidenceBytes += bytes.length
  }
  const ownedBytes = folder => ownedLogicalBytes(folder)
  const free = () => { const st = fs.statfsSync(root); return st.bavail * st.bsize }
  const run = async (name, binary, args, cap, cleanup = false, fullCapFailure = null) => {
    if (!cleanup) cancellation.assertWorkAllowed()
    const remaining = deadline - performance.now(), timeout = Math.min(cap, remaining)
    if (fullCapFailure && timeout !== cap) throw fullCapFailure
    assert.ok(timeout > 0, 'Shared deadline exhausted before spawn')
    if (!cleanup) assert.ok(free() >= PILOT.freeBytes && ownedBytes(root) <= PILOT.ownedBytes, 'Resource floor/cap')
    if (fullCapFailure && deadline - performance.now() < cap) throw fullCapFailure
    put(name + '.intent.json', { ...context, stage, binary, arguments: args.map(value => diagnostic(value)), timeout_ms: timeout })
    const begin = performance.now(); let stop = null, spawnError = null, resourceFailure = false
    const childEnv = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'DEVELOPER_DIR', 'CI', 'GITHUB_ACTIONS']
      .filter(key => typeof env[key] === 'string').map(key => [key, env[key]]))
    const child = spawn(binary, args, { cwd: repo, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
    const kill = reason => {
      if (reason.startsWith('resource-')) resourceFailure = true
      stop ??= reason; try { process.kill(-child.pid, 'SIGKILL') } catch {}
    }
    const ownedProbe = ownedSizeProbe(root)
    const resourceMonitor = resourceThresholdMonitor({ command: name, stage, readFree: free, readOwned: () => ownedProbe.read(),
      kill, stopReason: () => stop, elapsedMs: () => performance.now() - begin, readOwnedBreakdown: () => ownedProbe.snapshot() })
    const output = commandOutputCapture(name, kill)
    cancellation.bindOwnedStop(kill)
    child.stdout.on('data', output.stdout); child.stderr.on('data', output.stderr); child.on('error', error => { spawnError = diagnostic(error.message) })
    const timer = setTimeout(() => kill('command-or-shared-deadline'), timeout)
    const monitor = setInterval(() => resourceMonitor.poll(cleanup), 2000)
    const result = await new Promise(resolve => child.on('close', (code, signal) => {
      cancellation.releaseOwnedStop(kill); resolve({ code, signal })
    }))
    clearTimeout(timer); clearInterval(monitor)
    const { stdout, stderr, receipt: outputReceipt } = output.finish()
    if (!cleanup && (free() < PILOT.freeBytes || ownedBytes(root) > PILOT.ownedBytes)) {
      resourceFailure = true; stop ??= 'post-command-resource-floor-or-cap'
    }
    if (['runtime-download', 'runtime-import', 'first-launch-status'].includes(name) && requiresConsent(stdout + '\n' + stderr)) stop ??= 'auth-or-new-consent-required'
    const receipt = { ...context, stage, ...result, error: spawnError, stop, resource_failure: resourceFailure,
      resource_observation: resourceMonitor.firstFailure,
      cancelled_signal: cancellation.signal, elapsed_ms: performance.now() - begin, ...outputReceipt,
      captured_output_complete: stop === null && spawnError === null && outputReceipt.captured_output_complete,
      stdout_diagnostic_tail: diagnostic(stdout.toString('utf8')), stderr_diagnostic_tail: diagnostic(stderr.toString('utf8')) }
    const exitReceipt = withOwnedSizeBreakdown(receipt, resourceMonitor.ownedSizeBreakdown,
      Math.min(512 * 1024, PILOT.evidenceBytes - PILOT.evidenceReserve - evidenceBytes))
    put(name + '.exit.json', exitReceipt)
    try {
      if (!cleanup) cancellation.assertWorkAllowed()
      assert.equal(spawnError, null); assert.equal(stop, null); assert.equal(result.signal, null); assert.equal(result.code, 0, name)
    } catch (error) {
      if (name === 'devices-after-boot') Object.defineProperty(error, 'pilotCommand', { value: { ...receipt,
        name, binary, arguments: [...args], timeout_ms: timeout } })
      throw error
    }
    return stdout.toString('utf8').trim()
  }
  const inventory = async label => JSON.parse(await run(label, 'xcrun', ['simctl', 'list', 'runtimes', '--json'], 60000))
  const devices = async (label, fullCapFailure = null) => JSON.parse(await run(label, 'xcrun', ['simctl', 'list', 'devices', '--json'], 60000, stage === 'cleanup', fullCapFailure))
  const sameHead = async label => assert.equal(await run(label, 'git', ['rev-parse', 'HEAD'], 15000), context.source_head)
  try {
    await sameHead('initial-head')
    await run('initial-clean-source', 'git', ['diff', '--exit-code'], 15000)
    const sourceTree = await run('source-tree', 'git', ['rev-parse', 'HEAD^{tree}'], 15000)
    assert.match(sourceTree, /^[a-f0-9]{40}$/)
    const macOS = await run('host-os', 'sw_vers', ['-productVersion'], 15000)
    assert.equal(macOS.split('.')[0], '15'); assert.ok(Number(macOS.split('.')[1]) >= 3)
    assert.equal(process.arch, 'arm64')
    const xcode = await run('xcode', 'xcodebuild', ['-version'], 30000)
    assert.equal(xcode, 'Xcode 16.4\nBuild version 16F6')
    await run('first-launch-status', 'xcodebuild', ['-checkFirstLaunchStatus'], 30000)
    const sdk = await run('sdk-version', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version'], 15000)
    assert.equal(sdk, '18.5')
    put('environment.json', { ...context, source_tree: sourceTree, xcode, macOS, sdk, architecture: process.arch, image: env.ImageVersion ?? null,
      limits: PILOT, actual_free_bytes: free(), time_storage_caps_are_unobserved_proposals: true, minimum_runtime: PILOT.version,
      no_new_license_account_or_first_launch_acceptance: true })
    const before = await inventory('runtimes-before'); put('runtimes-before.json', runtimeReceipt(before))
    let selected = selectExact17(before)
    put('acquisition-plan.json', { runtime_preexisting_available: selected !== null, requested_version: '17.0',
      no_auth_or_new_contract_inputs: true, download_if_missing_only: true })
    if (!selected) {
      stage = 'runtime-download'
      await run('runtime-download', 'xcodebuild', ['-quiet', '-downloadPlatform', 'iOS', '-exportPath', download, '-buildVersion', '17.0'], PILOT.downloadMs)
      const dmg = ownedDMG(download), beforeFile = fs.statSync(dmg)
      put('runtime-export.json', { relative_path: diagnostic(path.relative(root, dmg)), bytes: beforeFile.size, dev: beforeFile.dev, ino: beforeFile.ino,
        catalog_or_signature_independently_verified: false, export_command_exit0: true })
      selected = await ensureDownloadedRuntime({ query: inventory,
        record: (name, value) => put(name, { ...context, stage, ...value }),
        importRuntime: async () => {
          stage = 'runtime-import'; await run('runtime-import', 'xcodebuild', ['-importPlatform', dmg], PILOT.importMs)
          assert.ok(!fs.lstatSync(dmg).isSymbolicLink()); assert.equal(fs.realpathSync(dmg), dmg)
          const afterFile = fs.statSync(dmg); assert.equal(afterFile.ino, beforeFile.ino); assert.equal(afterFile.dev, beforeFile.dev)
          assert.equal(afterFile.size, beforeFile.size); assert.equal(afterFile.mtimeMs, beforeFile.mtimeMs)
        } })
    }
    const typeInventory = JSON.parse(await run('device-types', 'xcrun', ['simctl', 'list', 'devicetypes', '--json'], 60000))
    const types = typeInventory.devicetypes?.filter(row => row.identifier === PILOT.device && row.name === PILOT.model)
    assert.equal(types?.length, 1); put('selection.json', { ...context, runtime: selected, device_type: types[0], exact17_0: true })
    stage = 'owned-boot'; const beforeDevices = await devices('devices-before-create'), preexisting = deviceRows(beforeDevices).map(row => row.udid.toUpperCase())
    put('devices-before-create.json', deviceReceipt(beforeDevices))
    const token = randomUUID(), intent = { ...context, token, name: `AILibrary-ios17-${context.run_id}-${context.run_attempt}-${token}`,
      runtime: PILOT.runtime, type: PILOT.device, preexisting_UUIDs: preexisting }
    put('device-intent.json', intent); creationAttempted = true
    const created = (await run('create-device', 'xcrun', ['simctl', 'create', intent.name, intent.type, intent.runtime], 60000)).toUpperCase()
    owner = { ...intent, UUID: created, creation_exit: 0 }; assert.match(created, UUID); assert.ok(!preexisting.includes(created))
    put('owned-device.json', owner); await run('boot-device', 'xcrun', ['simctl', 'boot', created], 60000)
    await run('bootstatus', 'xcrun', ['simctl', 'bootstatus', created, '-b'], PILOT.bootMs)
    await readPostbootInventory({ read: devices, remainingMs: () => deadline - performance.now(), cancellation,
      recordRecovery: plan => put('devices-after-boot-recovery-plan.json', { ...context, stage, ...plan }),
      validate: value => assert.equal(proveOwner(owner, context, value)?.state, 'Booted') })
    stage = 'content'
    for (const [name, cwd, args] of [['root-audit', null, ['audit', '--package-lock-only', '--audit-level=high']],
      ['root-ci', null, ['ci', '--ignore-scripts']], ['tools-audit', 'ios/tools', ['audit', '--prefix', 'ios/tools', '--package-lock-only', '--audit-level=high']],
      ['tools-ci', 'ios/tools', ['ci', '--prefix', 'ios/tools', '--ignore-scripts']]]) await run(name, 'npm', args, 120000)
    await run('browser', path.join(repo, 'ios/tools/node_modules/.bin/playwright'), ['install', 'chromium'], 120000)
    await run('representative', process.execPath, ['scripts/build-ios-native-content.mjs'], 180000)
    await run('fixtures', process.execPath, ['scripts/build-ios-native-content.mjs', '--fixtures'], 120000)
    await run('source-audit', process.execPath, ['ios/tests/native-content-audit.mjs'], 60000)
    await run('fixture-audit', process.execPath, ['ios/tests/native-content-audit.mjs', '--fixtures'], 60000)
    await run('package-audit', 'bash', ['ios/tests/check-package.sh', 'ios/AILibrary/Content', '3'], 90000)
    await run('fixture-package-audit', 'bash', ['ios/tests/check-package.sh', 'ios/AILibrary/TestContent', '4'], 90000)
    stage = 'functional'
    await sameHead('pretest-head'); await run('pretest-clean-source', 'git', ['diff', '--exit-code'], 15000)
    const beforeTest = await readRuntimeSnapshot('runtimes-before-test', inventory,
      (name, value) => put(name, { ...context, stage, ...value }))
    assert.ok(selectExact17(beforeTest))
    assert.equal(proveOwner(owner, context, await devices('devices-before-test'))?.state, 'Booted')
    const source = fs.readFileSync(path.join(repo, 'ios/AILibraryTests/NativeInlineTests.swift'), 'utf8'), expected = expectedCases(source)
    put('case-contract.json', { ...context, source_sha256: sha(source), expected, NativeInline_methods: expected.length - 1,
      image9_included_by_source: expected.length === 47, all_unit245_or_full_suite_acceptance: false })
    const result = path.join(root, 'functional.xcresult')
    await run('functional', 'xcodebuild', ['-project', 'ios/AILibrary.xcodeproj', '-scheme', 'AILibrary', '-configuration', 'Debug',
      '-destination', 'platform=iOS Simulator,id=' + owner.UUID, '-destination-timeout', '60', '-derivedDataPath', path.join(root, 'DerivedData'),
      '-resultBundlePath', result, '-parallel-testing-enabled', 'NO', '-jobs', '2', '-only-testing:AILibraryTests/NativeInlineTests',
      '-only-testing:AILibraryUITests/NativeReaderUITests/testThreeArticlesHaveNativeBodyText', 'CODE_SIGNING_ALLOWED=NO', 'test'], 8 * 60000)
    const actualInfo = JSON.parse(await run('actual-app-info', 'plutil', ['-convert', 'json', '-o', '-',
      path.join(root, 'DerivedData/Build/Products/Debug-iphonesimulator/AILibrary.app/Info.plist')], 15000))
    assert.equal(actualInfo.MinimumOSVersion, '17.0'); assert.equal(actualInfo.CFBundleIdentifier, 'dev.pero3.aiagentlibrary.prototype')
    put('actual-app-info.json', { version: actualInfo.CFBundleShortVersionString, build: actualInfo.CFBundleVersion,
      minimumOS: actualInfo.MinimumOSVersion, sdk: actualInfo.DTSDKName, platforms: actualInfo.CFBundleSupportedPlatforms })
    const tree = JSON.parse(await run('functional-results', 'xcrun', ['xcresulttool', 'get', 'test-results', 'tests', '--path', result, '--compact'], 60000))
    put('functional-results.json', tree); const count = verifyFunctional(tree, expected, owner)
    functional = { cases: count, NativeInline_methods: count - 1, exact17_0: true, image9_included: count === 47 }
  } catch (error) { failure = { stage, message: diagnostic(error?.message ?? error) } }
  finally {
    stage = 'cleanup'; cancellation.beginCleanup()
    deadline = cleanupDeadline(started, performance.now())
    try {
      if (owner) {
        const current = proveOwner(owner, context, await devices('cleanup-before'))
        if (current) {
          let shutdownFailure = null
          if (current.state !== 'Shutdown') { try { await run('cleanup-shutdown', 'xcrun', ['simctl', 'shutdown', owner.UUID], 45000, true) } catch (error) { shutdownFailure = error } }
          await run('cleanup-delete', 'xcrun', ['simctl', 'delete', owner.UUID], 45000, true)
          assert.equal(proveOwner(owner, context, await devices('cleanup-after')), null)
          cleanupStatus = 'owned-device-deleted'
          if (shutdownFailure) throw shutdownFailure
        } else cleanupStatus = 'already-absent'
      } else if (creationAttempted) cleanupStatus = 'creation-unproven-no-delete'
      const current = fs.statSync(root); assert.equal(current.dev, rootIdentity.dev); assert.equal(current.ino, rootIdentity.ino)
      const downloadNow = fs.lstatSync(download); assert.ok(downloadNow.isDirectory() && !downloadNow.isSymbolicLink())
      assert.equal(downloadNow.dev, downloadIdentity.dev); assert.equal(downloadNow.ino, downloadIdentity.ino)
      fs.rmSync(download, { recursive: true })
    } catch (error) { cleanupStatus = 'cleanup-incomplete'; failure ??= { stage, message: diagnostic(error.message) } }
    if (cancellation.signal) failure ??= { stage: 'cancelled', signal: cancellation.signal, message: 'Normal termination requested; cleanup was best-effort' }
    const accepted = cancellation.signal === null && functional !== null && failure === null && ['owned-device-deleted', 'already-absent'].includes(cleanupStatus)
    try {
    put('summary.json', { ...context, status: accepted ? 'functional-subset-passed' : 'not-completed', failure,
      cancelled_signal: cancellation.signal, received_normal_signals: cancellation.received,
      signal_cleanup_is_best_effort_no_SIGKILL_guarantee: true, cleanup_status: cleanupStatus, functional, elapsed_ms: performance.now() - started, functional_acceptance: accepted,
      runtime_deletion_performed: false, scope: 'Exact17.0 NativeInline37or46 + native3article UIone only',
      full_minimumOS_physical_VoiceOver_Release_performance_acceptance: false, memory_Clock_contract_adopted: false,
      no_new_account_license_or_runFirstLaunch: true, caps_are_proposals_not_observed_requirements: true }, true)
    if (!accepted) process.exitCode = 1
    } finally { cancellation.close() }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runPilot()
