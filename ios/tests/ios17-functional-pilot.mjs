import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const PILOT = Object.freeze({ version: '17.0', runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-17-0',
  device: 'com.apple.CoreSimulator.SimDeviceType.iPhone-15', model: 'iPhone 15',
  workMs: 19 * 60000, cleanupMs: 2 * 60000, downloadMs: 10 * 60000, importMs: 5 * 60000,
  bootMs: 240000, freeBytes: 2 * 1024 ** 3, ownedBytes: 14 * 1024 ** 3,
  outputBytes: 4 * 1024 ** 2, evidenceBytes: 2 * 1024 ** 2, evidenceReserve: 65536 })
const UUID = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const runtimeReceipt = value => ({ runtimes: value.runtimes.map(row => Object.fromEntries(
  ['identifier', 'name', 'version', 'buildversion', 'isAvailable'].map(key => [key, row[key]]))) })
const deviceReceipt = value => ({ devices: Object.fromEntries(Object.entries(value.devices).map(([runtime, rows]) =>
  [runtime, rows.map(row => Object.fromEntries(['udid', 'name', 'state', 'deviceTypeIdentifier', 'isAvailable'].map(key => [key, row[key]])))])) })
const diagnostic = value => String(value).replace(/https?:\/\/[^\s"'<>]+/g, '<url>')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<email>')
  .replace(/((?:token|signature|credential|authorization|password|x-amz-[a-z-]+)=)[^\s&]+/gi, '$1<redacted>').slice(-4096)

export const requiresConsent = text => /(?:sign[ -]+in|log[ -]+in|authentication required|license agreement|terms and conditions|Apple (?:Account|ID)|accept.{0,80}(?:licen[sc]e|agreement)|(?:licen[sc]e|agreement).{0,80}(?:required|accept))/is.test(text)

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
  const ownedBytes = folder => fs.readdirSync(folder).reduce((sum, name) => {
    const file = path.join(folder, name), st = fs.lstatSync(file)
    return sum + (st.isSymbolicLink() ? 0 : st.isDirectory() ? ownedBytes(file) : st.size)
  }, 0)
  const free = () => { const st = fs.statfsSync(root); return st.bavail * st.bsize }
  const run = async (name, binary, args, cap, cleanup = false) => {
    if (!cleanup) cancellation.assertWorkAllowed()
    const remaining = deadline - performance.now(), timeout = Math.min(cap, remaining)
    assert.ok(timeout > 0, 'Shared deadline exhausted before spawn')
    if (!cleanup) assert.ok(free() >= PILOT.freeBytes && ownedBytes(root) <= PILOT.ownedBytes, 'Resource floor/cap')
    put(name + '.intent.json', { ...context, stage, binary, arguments: args.map(value => diagnostic(value)), timeout_ms: timeout })
    const begin = performance.now(), out = [], err = []; let bytes = 0, stop = null, spawnError = null
    const childEnv = Object.fromEntries(['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'DEVELOPER_DIR', 'CI', 'GITHUB_ACTIONS']
      .filter(key => typeof env[key] === 'string').map(key => [key, env[key]]))
    const child = spawn(binary, args, { cwd: repo, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
    const kill = reason => { stop ??= reason; try { process.kill(-child.pid, 'SIGKILL') } catch {} }
    cancellation.bindOwnedStop(kill)
    const take = list => chunk => { bytes += chunk.length; if (bytes > PILOT.outputBytes) kill('output-cap'); else list.push(chunk) }
    child.stdout.on('data', take(out)); child.stderr.on('data', take(err)); child.on('error', error => { spawnError = diagnostic(error.message) })
    const timer = setTimeout(() => kill('command-or-shared-deadline'), timeout)
    const monitor = setInterval(() => { try {
      if (!cleanup && (free() < PILOT.freeBytes || ownedBytes(root) > PILOT.ownedBytes)) kill('resource-floor-or-cap')
    } catch { kill('resource-observation-failed') } }, 2000)
    const result = await new Promise(resolve => child.on('close', (code, signal) => {
      cancellation.releaseOwnedStop(kill); resolve({ code, signal })
    }))
    clearTimeout(timer); clearInterval(monitor)
    const stdout = Buffer.concat(out), stderr = Buffer.concat(err)
    if (!cleanup && (free() < PILOT.freeBytes || ownedBytes(root) > PILOT.ownedBytes)) stop ??= 'post-command-resource-floor-or-cap'
    if (['runtime-download', 'runtime-import', 'first-launch-status'].includes(name) && requiresConsent(stdout + '\n' + stderr)) stop ??= 'auth-or-new-consent-required'
    put(name + '.exit.json', { ...context, stage, ...result, error: spawnError, stop,
      cancelled_signal: cancellation.signal, elapsed_ms: performance.now() - begin, captured_output_complete: stop === null && spawnError === null, observed_stream_bytes: bytes, captured_stdout_bytes: stdout.length,
      captured_stdout_sha256: sha(stdout), captured_stderr_bytes: stderr.length, captured_stderr_sha256: sha(stderr),
      stdout_diagnostic_tail: diagnostic(stdout.toString('utf8')), stderr_diagnostic_tail: diagnostic(stderr.toString('utf8')) })
    if (!cleanup) cancellation.assertWorkAllowed()
    assert.equal(spawnError, null); assert.equal(stop, null); assert.equal(result.signal, null); assert.equal(result.code, 0, name)
    return stdout.toString('utf8').trim()
  }
  const inventory = async label => JSON.parse(await run(label, 'xcrun', ['simctl', 'list', 'runtimes', '--json'], 60000))
  const devices = async label => JSON.parse(await run(label, 'xcrun', ['simctl', 'list', 'devices', '--json'], 60000, stage === 'cleanup'))
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
      await run('runtime-download', 'xcodebuild', ['-downloadPlatform', 'iOS', '-exportPath', download, '-buildVersion', '17.0'], PILOT.downloadMs)
      const dmg = ownedDMG(download), beforeFile = fs.statSync(dmg)
      put('runtime-export.json', { relative_path: diagnostic(path.relative(root, dmg)), bytes: beforeFile.size, dev: beforeFile.dev, ino: beforeFile.ino,
        catalog_or_signature_independently_verified: false, export_command_exit0: true })
      stage = 'runtime-import'; await run('runtime-import', 'xcodebuild', ['-importPlatform', dmg], PILOT.importMs)
      assert.ok(!fs.lstatSync(dmg).isSymbolicLink()); assert.equal(fs.realpathSync(dmg), dmg)
      const afterFile = fs.statSync(dmg); assert.equal(afterFile.ino, beforeFile.ino); assert.equal(afterFile.dev, beforeFile.dev)
      assert.equal(afterFile.size, beforeFile.size); assert.equal(afterFile.mtimeMs, beforeFile.mtimeMs)
      const after = await inventory('runtimes-after-import'); put('runtimes-after-import.json', runtimeReceipt(after)); selected = selectExact17(after)
      assert.ok(selected, 'Exact17.0 unavailable after import, no17.5 fallback')
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
    assert.equal(proveOwner(owner, context, await devices('devices-after-boot'))?.state, 'Booted')
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
    await sameHead('pretest-head'); await run('pretest-clean-source', 'git', ['diff', '--exit-code'], 15000); assert.ok(selectExact17(await inventory('runtimes-before-test')))
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
