import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const FAILURE_INVENTORY = Object.freeze({ commandMs: 30000, sharedMs: 75000,
  outputBytes: 1024 * 1024, tailBytes: 2048,
  relativeDirectory: '.local/ios-published-candidate/evidence/unit-failure-inventory' })
const probes = Object.freeze([
  { name: 'runtimes', arguments: ['simctl', 'list', 'runtimes', '--json'] },
  { name: 'devices', arguments: ['simctl', 'list', 'devices', '--json'] }
])
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const diagnostic = text => String(text).slice(-FAILURE_INVENTORY.tailBytes)
  .replace(/https?:\/\/[^\s"'<>]+/g, '<url>')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<email>')
  .replace(/((?:token|signature|credential|authorization|password)=)[^\s&]+/gi, '$1<redacted>')
export const shouldCaptureUnitFailure = (outcome, jobStatus) => outcome === 'failure' && jobStatus === 'failure'

export function createInventoryDirectory(workspace, output = path.join(workspace, FAILURE_INVENTORY.relativeDirectory)) {
  assert.ok(path.isAbsolute(workspace)); assert.equal(workspace, path.resolve(workspace), 'Canonical workspace required')
  assert.equal(fs.realpathSync(workspace), workspace, 'Workspace aliases rejected')
  assert.equal(output, path.resolve(output), 'Canonical output required')
  assert.equal(path.resolve(output), path.join(workspace, FAILURE_INVENTORY.relativeDirectory), 'Fixed owned output only')
  const identities = []
  const remember = directory => {
    const st = fs.lstatSync(directory)
    assert.ok(st.isDirectory() && !st.isSymbolicLink(), 'Directory symlink/special file rejected')
    assert.equal(fs.realpathSync(directory), directory)
    identities.push({ directory, dev: st.dev, ino: st.ino })
  }
  remember(workspace)
  let current = workspace
  for (const part of FAILURE_INVENTORY.relativeDirectory.split('/').slice(0, -1)) { current = path.join(current, part); remember(current) }
  // lstat distinguishes a missing path from a dangling symlink, which existsSync omits.
  try { fs.lstatSync(output); assert.fail('Evidence directory already exists') } catch (error) { if (error.code !== 'ENOENT') throw error }
  fs.mkdirSync(output, { mode: 0o700 }); remember(output)
  const check = () => { for (const entry of identities) {
    const st = fs.lstatSync(entry.directory)
    assert.ok(st.isDirectory() && !st.isSymbolicLink()); assert.equal(fs.realpathSync(entry.directory), entry.directory)
    assert.equal(st.dev, entry.dev); assert.equal(st.ino, entry.ino)
  } }
  return { directory: output, check,
    put(name, value) {
      assert.match(name, /^[a-z][a-z0-9.-]*$/); check()
      const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value, null, 2) + '\n')
      assert.ok(bytes.length <= FAILURE_INVENTORY.outputBytes)
      const fd = fs.openSync(path.join(output, name), fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | (fs.constants.O_NOFOLLOW ?? 0), 0o600)
      try { fs.writeFileSync(fd, bytes) } finally { fs.closeSync(fd) }
      check()
    }
  }
}

function toolchainReference(workspace) {
  const file = path.join(workspace, '.local/ios-published-candidate/evidence/environment.log')
  try {
    const st = fs.lstatSync(file); assert.ok(st.isFile() && !st.isSymbolicLink() && st.size <= 65536)
    const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0))
    try {
      const opened = fs.fstatSync(fd); assert.equal(opened.dev, st.dev); assert.equal(opened.ino, st.ino)
      const buffer = Buffer.allocUnsafe(65537); let size = 0, count
      while (size < buffer.length && (count = fs.readSync(fd, buffer, size, buffer.length - size, null))) size += count
      assert.ok(size <= 65536); const bytes = buffer.subarray(0, size)
      return { existing_environment_log: '../environment.log', bytes: bytes.length, SHA256: sha(bytes) }
    } finally { fs.closeSync(fd) }
  } catch (error) { return { existing_environment_log: '../environment.log', error: diagnostic(error.message) } }
}

async function captureProbe(spec, { workspace, output, context, limits, deadline, now, spawnProcess, state, environment }) {
  const begin = now(), remaining = deadline - begin, timeout = Math.min(limits.commandMs, remaining)
  if (timeout <= 0) return { name: spec.name, status: 'not-started-shared-deadline', spawn_attempted: false }
  const scope = remaining <= limits.commandMs ? 'shared' : 'command', probeDeadline = begin + timeout
  const startedAt = new Date().toISOString()
  output.put(spec.name + '.intent.json', { ...context, post_unit_failure: true, name: spec.name,
    binary: 'xcrun', arguments: spec.arguments, started_at: startedAt,
    timeout_ms: timeout, timeout_scope: scope, max_combined_output_bytes: limits.outputBytes })
  const beforeSpawn = now()
  if (state.signal || beforeSpawn >= probeDeadline) return { name: spec.name, spawn_attempted: false,
    status: state.signal ? 'not-started-cancelled' : beforeSpawn >= deadline ? 'not-started-shared-deadline' : 'not-started-command-deadline' }
  output.check()
  const arena = Buffer.allocUnsafe(limits.outputBytes), outHash = createHash('sha256'), errHash = createHash('sha256')
  let outBytes = 0, errBytes = 0, rawOut = 0, rawErr = 0, stop = null, spawnError = null, child = null, timer = null
  const kill = reason => {
    stop ??= reason
    if (!child?.pid) return
    try { if (process.platform === 'win32') child.kill('SIGKILL'); else process.kill(-child.pid, 'SIGKILL') } catch { try { child.kill('SIGKILL') } catch {} }
  }
  const take = stderr => bytes => {
    if (stderr) { rawErr += bytes.length; errHash.update(bytes) } else { rawOut += bytes.length; outHash.update(bytes) }
    const size = Math.min(bytes.length, limits.outputBytes - outBytes - errBytes)
    if (stderr) { for (let i = 0; i < size; i++) arena[limits.outputBytes - 1 - errBytes - i] = bytes[i]; errBytes += size }
    else { bytes.copy(arena, outBytes, 0, size); outBytes += size }
    if (rawOut + rawErr > limits.outputBytes) kill('output-cap')
  }
  let result
  try {
    const childEnv = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'DEVELOPER_DIR']
      .filter(key => typeof environment[key] === 'string').map(key => [key, environment[key]]))
    child = spawnProcess('xcrun', spec.arguments, { cwd: workspace, env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true })
    state.activeKill = kill
    child.stdout.on('data', take(false)); child.stderr.on('data', take(true))
    child.on('error', error => { spawnError = { code: error.code ?? null, message: diagnostic(error.message) } })
    timer = setTimeout(() => kill(scope === 'shared' ? 'shared-deadline' : 'command-timeout'), Math.max(0, probeDeadline - now()))
    if (state.signal) kill('cancelled-' + state.signal)
    result = await new Promise(resolve => child.on('close', (code, signal) => resolve({ code, signal })))
  } catch (error) { spawnError = { code: error.code ?? null, message: diagnostic(error.message) }; result = { code: null, signal: null } }
  finally { clearTimeout(timer); if (state.activeKill === kill) state.activeKill = null }
  const stdout = arena.subarray(0, outBytes), stderr = arena.subarray(limits.outputBytes - errBytes).reverse()
  const complete = stop === null && spawnError === null && rawOut + rawErr === outBytes + errBytes
  let json = { status: 'not-attempted-incomplete-command', expected_top_level_shape: null }
  if (complete && result.code === 0 && result.signal === null) {
    try { const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(stdout)); json = { status: 'parsed',
      expected_top_level_shape: spec.name === 'runtimes' ? Array.isArray(value?.runtimes)
        : value?.devices !== null && typeof value?.devices === 'object' && !Array.isArray(value.devices) }
    } catch (error) { json = { status: 'invalid', expected_top_level_shape: false, error: diagnostic(error.message) } }
  }
  const receipt = { name: spec.name, binary: 'xcrun', arguments: spec.arguments, post_unit_failure: true,
    spawn_attempted: true, process_created: Boolean(child?.pid),
    started_at: startedAt, completed_at: new Date().toISOString(), elapsed_ms: now() - begin,
    timeout_ms: timeout, timeout_scope: scope, ...result, error: spawnError, stop,
    cancelled_signal: state.signal, observed_stream_bytes: rawOut + rawErr,
    raw_stdout_bytes: rawOut, raw_stderr_bytes: rawErr, raw_stdout_SHA256: outHash.digest('hex'), raw_stderr_SHA256: errHash.digest('hex'),
    captured_stdout_bytes: outBytes, captured_stderr_bytes: errBytes, captured_stdout_SHA256: sha(stdout), captured_stderr_SHA256: sha(stderr),
    uncaptured_stream_bytes: rawOut + rawErr - outBytes - errBytes, captured_output_complete: complete,
    stdout_tail: diagnostic(stdout.subarray(-FAILURE_INVENTORY.tailBytes).toString('utf8')),
    stderr_tail: diagnostic(stderr.subarray(-FAILURE_INVENTORY.tailBytes).toString('utf8')), json }
  output.put(spec.name + '.stdout.bin', stdout); output.put(spec.name + '.stderr.bin', stderr); output.put(spec.name + '.exit.json', receipt)
  return receipt
}

export async function collectUnitFailureInventory({ workspace, unitOutcome, jobStatus, context = {},
  environment = process.env, spawnProcess = spawn, signals = process, now = () => performance.now(), limits = FAILURE_INVENTORY,
  outputDirectory }) {
  if (!shouldCaptureUnitFailure(unitOutcome, jobStatus)) return { status: 'skipped', unit_outcome: unitOutcome, job_status: jobStatus, probes: [] }
  for (const key of ['commandMs', 'sharedMs', 'outputBytes']) assert.ok(Number.isInteger(limits[key]) && limits[key] > 0 && limits[key] <= FAILURE_INVENTORY[key])
  const begin = now(), deadline = begin + limits.sharedMs, output = createInventoryDirectory(workspace,
    outputDirectory ?? path.join(workspace, FAILURE_INVENTORY.relativeDirectory))
  const state = { signal: null, activeKill: null }, receive = signal => { state.signal ??= signal; state.activeKill?.('cancelled-' + signal) }
  const interrupt = () => receive('SIGINT'), terminate = () => receive('SIGTERM')
  signals.on('SIGINT', interrupt); signals.on('SIGTERM', terminate)
  const binding = { ...context, unit_step_outcome: unitOutcome, job_status_at_entry: jobStatus }
  const receipts = []
  try {
    output.put('context.json', { ...context, unit_step_outcome: unitOutcome, job_status_at_entry: jobStatus,
      observation: 'post-failure only; does not prove the earlier unit destination state or root cause',
      toolchain: toolchainReference(workspace), configured_limits: { command_ms: limits.commandMs, shared_ms: limits.sharedMs, per_probe_combined_bytes: limits.outputBytes } })
    for (const spec of probes) {
      if (state.signal || now() >= deadline) break
      receipts.push(await captureProbe(spec, { workspace: path.resolve(workspace), output, context: binding, limits, deadline, now, spawnProcess, state, environment }))
    }
    const success = receipts.length === probes.length && receipts.every(row => row.code === 0 && row.signal === null && row.stop === null && row.error === null && row.json?.expected_top_level_shape === true)
    const summary = { schema_version: 1, status: state.signal ? 'cancelled' : success ? 'captured' : 'diagnostic-incomplete',
      unit_outcome: unitOutcome, job_status_at_entry: jobStatus, diagnostic_only_no_unit_result_rewrite: true,
      cancelled_signal: state.signal, elapsed_ms: now() - begin, shared_deadline_reached: now() >= deadline,
      probes: receipts, not_started: probes.map(row => row.name).filter(name => !receipts.some(row => row.name === name && row.spawn_attempted)),
      limits_are_best_effort_under_event_loop_or_filesystem_stall: true }
    output.put('summary.json', summary); return summary
  } finally { state.activeKill = null; signals.removeListener('SIGINT', interrupt); signals.removeListener('SIGTERM', terminate) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.equal(process.argv.length, 2, 'No arbitrary command or output arguments')
    assert.equal(process.env.GITHUB_ACTIONS, 'true'); assert.equal(process.env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library')
    for (const key of ['GITHUB_SHA', 'EXPECTED_SOURCE_HEAD']) assert.match(process.env[key], /^[a-f0-9]{40}$/)
    for (const key of ['GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT']) assert.match(process.env[key], /^[1-9][0-9]*$/)
    const result = await collectUnitFailureInventory({ workspace: process.env.GITHUB_WORKSPACE,
      unitOutcome: process.env.UNIT_STEP_OUTCOME, jobStatus: process.env.DIAGNOSTIC_JOB_STATUS,
      context: { repository: process.env.GITHUB_REPOSITORY, run: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT,
        event_commit: process.env.GITHUB_SHA, expected_source_head: process.env.EXPECTED_SOURCE_HEAD,
        declared_developer_dir: process.env.DEVELOPER_DIR, actual_toolchain_in_existing_environment_log: true } })
    console.log(JSON.stringify({ status: result.status, unit_outcome: result.unit_outcome, probes: result.probes.length }))
    process.exitCode = result.status === 'captured' || result.status === 'skipped' ? 0 : result.cancelled_signal === 'SIGINT' ? 130 : result.cancelled_signal === 'SIGTERM' ? 143 : 1
  } catch (error) { console.error('Failure-only inventory diagnostic failed: ' + diagnostic(error.message)); process.exitCode = 1 }
}
