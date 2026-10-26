// Diagnostic evidence only. This helper never changes primary UI results or acceptance.
// Exact CLI support and actual failed-case scope are checked; no export-all fallback is allowed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = Object.freeze({ stepMs: 105000, logMs: 45000, exportMs: 45000,
  smallMs: 5000, resultsBytes: 512 * 1024, logBytes: 512 * 1024, helpBytes: 64 * 1024, exportOutputBytes: 128 * 1024,
  exportedFiles: 64, exportedBytes: 8 * 1024 * 1024, artifactBytes: 4 * 1024 * 1024,
  pngBytes: 1024 * 1024, metadataBytes: 128 * 1024 });
const PREFIX = 'reader-diagnostic-';
const GEOMETRY = 'AILibraryReaderGeometry ';
export const LOG_PREDICATE = 'process == "AILibrary" AND eventMessage BEGINSWITH "AILibraryReaderGeometry "';
const UUID = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;
const TOKEN = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const geometryKeys = ['sample', 'scrollFrameInWindow', 'scrollBoundsY', 'viewportHeight',
  'contentHeight', 'contentInsetTop', 'contentInsetBottom', 'adjustedTop', 'adjustedBottom',
  'safeAreaTop', 'safeAreaBottom', 'visibleTop', 'markerContentY', 'markerWindowY',
  'legacyGoalOffset', 'goalOffset', 'actualOffset'].sort();
const message = error => String(error?.message ?? error).slice(0, 400);
const missing = (io, file) => { try { io.lstatSync(file); return false; } catch (error) {
  if (error.code === 'ENOENT') return true; throw error;
} };

function noLinks(io, file, directory = false) {
  assert.ok(path.isAbsolute(file) && path.normalize(file) === file, 'Noncanonical path');
  let current = path.parse(file).root;
  for (const part of file.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = io.lstatSync(current);
    assert.ok(!stat.isSymbolicLink(), 'Symlink path rejected');
    if (current !== file || directory) assert.ok(stat.isDirectory(), 'Directory required');
  }
  assert.equal(io.realpathSync(file), file, 'Resolved path drift');
}

function readBounded(io, file, cap) {
  noLinks(io, file);
  const before = io.lstatSync(file);
  assert.ok(before.isFile() && before.size <= cap, 'Regular bounded file required');
  const fd = io.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = io.fstatSync(fd);
    assert.ok(stat.isFile() && stat.size === before.size && stat.dev === before.dev && stat.ino === before.ino,
      'File changed before read');
    const data = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < data.length) {
      const count = io.readSync(fd, data, offset, data.length - offset, offset);
      assert.ok(count > 0, 'Short diagnostic read'); offset += count;
    }
    const after = io.fstatSync(fd);
    assert.ok(after.size === stat.size && after.mtimeMs === stat.mtimeMs, 'File changed during read');
    return data;
  } finally { io.closeSync(fd); }
}

export function verifyContext(env, io = fs) {
  assert.equal(env.GITHUB_ACTIONS, 'true');
  assert.equal(env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library');
  assert.equal(env.REPOSITORY_IS_PRIVATE, 'false');
  assert.equal(env.DEVELOPER_DIR, '/Applications/Xcode_27.app/Contents/Developer');
  assert.match(env.EXPECTED_SOURCE_HEAD, /^[a-f0-9]{40}$/);
  assert.match(env.GITHUB_RUN_ID, /^[1-9][0-9]{0,19}$/);
  assert.match(env.GITHUB_RUN_ATTEMPT, /^[1-9][0-9]{0,5}$/);
  assert.ok(['success', 'failure'].includes(env.UI_OUTCOME), 'Only an attempted, noncancelled UI stage is diagnostic');
  noLinks(io, env.GITHUB_WORKSPACE, true);
  const evidence = path.join(env.GITHUB_WORKSPACE, '.local/ios-runtime27/evidence');
  assert.equal(env.EVIDENCE_DIR, evidence);
  noLinks(io, evidence, true);
  return evidence;
}

export function verifyOwner(env, io = fs) {
  const evidence = verifyContext(env, io);
  const read = name => JSON.parse(readBounded(io, path.join(evidence, name), LIMITS.metadataBytes));
  const text = name => readBounded(io, path.join(evidence, name), LIMITS.metadataBytes).toString('utf8').trim();
  const owned = read('owned-simulator.json'), intent = read('owned-simulator-intent.json');
  const selection = read('selection.json'), creation = read('create-simulator.exit.json');
  assert.equal(selection.schema_version, 1); assert.equal(intent.schema_version, 1);
  assert.equal(selection.status, 'selected-from-actual-inventory');
  assert.equal(selection.source_head, env.EXPECTED_SOURCE_HEAD);
  assert.equal(text('source-head.stdout.log'), env.EXPECTED_SOURCE_HEAD);
  assert.match(selection.source_tree, /^[a-f0-9]{40}$/);
  assert.equal(selection.repository, env.GITHUB_REPOSITORY); assert.equal(selection.repository_private, false);
  assert.equal(selection.runner_label, 'xcode-27'); assert.equal(selection.standard_runner, true);
  assert.equal(selection.developer_directory, env.DEVELOPER_DIR);
  assert.equal(selection.sdk, '27.0'); assert.equal(selection.macOS.split('.')[0], '27');
  assert.equal(selection.architecture, 'arm64'); assert.equal(selection.Xcode, 'Xcode 27.0\nBuild version 27A266a');
  const runtime = selection.runtime, type = selection.device_type;
  assert.equal(runtime.name, 'iOS 27.0'); assert.equal(runtime.version, '27.0'); assert.equal(runtime.isAvailable, true);
  assert.match(runtime.identifier, /^com\.apple\.CoreSimulator\.SimRuntime\.iOS-27-0(?:-[A-Za-z0-9.-]+)?$/);
  if (runtime.platform !== undefined) assert.equal(runtime.platform, 'iOS');
  assert.match(runtime.buildversion, /^[A-Za-z0-9.]{1,80}$/);
  assert.equal(type.name, 'iPhone 17');
  assert.match(type.identifier, /^com\.apple\.CoreSimulator\.SimDeviceType\.[A-Za-z0-9.-]+$/);
  assert.equal(intent.repository, env.GITHUB_REPOSITORY); assert.equal(intent.source_head, env.EXPECTED_SOURCE_HEAD);
  assert.equal(intent.run_id, env.GITHUB_RUN_ID); assert.equal(intent.run_attempt, env.GITHUB_RUN_ATTEMPT);
  assert.match(intent.token, TOKEN); assert.match(owned.UUID, UUID);
  assert.equal(intent.name, `AILibrary-runtime27-${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT}-${intent.token}`);
  assert.equal(intent.runtime_identifier, runtime.identifier); assert.equal(intent.device_type_identifier, type.identifier);
  assert.deepEqual(owned, { ...intent, UUID: owned.UUID, creation_exit_code: 0 });
  assert.ok(Array.isArray(intent.preexisting_UUIDs));
  for (const uuid of intent.preexisting_UUIDs) assert.match(uuid, UUID);
  assert.equal(new Set(intent.preexisting_UUIDs).size, intent.preexisting_UUIDs.length);
  assert.ok(!intent.preexisting_UUIDs.includes(owned.UUID));
  assert.equal(creation.binary, 'xcrun'); assert.equal(creation.exit_code, 0);
  assert.equal(creation.signal, null); assert.equal(creation.error, null);
  assert.deepEqual(creation.arguments, ['simctl', 'create', intent.name, type.identifier, runtime.identifier]);
  assert.equal(text('create-simulator.stdout.log').toUpperCase(), owned.UUID);
  const before = read('devices-before-create.stdout.log');
  const beforeDevices = deviceRows(before);
  assert.ok(beforeDevices.every(({ device }) => device.udid.toUpperCase() !== owned.UUID));
  assert.deepEqual(beforeDevices.map(({ device }) => device.udid.toUpperCase()).sort(), [...intent.preexisting_UUIDs].sort());
  return { evidence, owned, runtime };
}

function deviceRows(value) {
  assert.ok(value?.devices && typeof value.devices === 'object' && !Array.isArray(value.devices));
  const rows = Object.entries(value.devices).flatMap(([runtime, devices]) => {
    assert.ok(Array.isArray(devices));
    return devices.map(device => { assert.match(device.udid?.toUpperCase(), UUID); return { runtime, device }; });
  });
  assert.equal(new Set(rows.map(({ device }) => device.udid.toUpperCase())).size, rows.length);
  return rows;
}

// Bind the known SDK27 Native2 raw hierarchy before selecting any PNG export.
// Failed parents are evidence of a failed run, never primary acceptance.
export function failedNativeCases(value, { owned, runtime, workspace }) {
  const keys = (item, expected) => {
    assert.ok(item && typeof item === 'object' && !Array.isArray(item));
    assert.deepEqual(Object.keys(item).sort(), [...expected].sort(), 'Unknown test-result schema');
  };
  keys(value, ['devices', 'testNodes', 'testPlanConfigurations']);
  assert.ok(Array.isArray(value.devices) && value.devices.length === 1);
  const device = value.devices[0];
  keys(device, ['architecture', 'deviceId', 'deviceName', 'modelName', 'osBuildNumber', 'osVersion', 'platform']);
  assert.equal(device.deviceId.toUpperCase(), owned.UUID); assert.equal(device.deviceName, owned.name);
  assert.equal(device.osVersion, '27.0'); assert.equal(device.osBuildNumber, runtime.buildversion);
  assert.equal(device.platform, 'iOS Simulator'); assert.equal(device.architecture, 'arm64'); assert.equal(device.modelName, 'iPhone 17');
  assert.ok(Array.isArray(value.testPlanConfigurations) && value.testPlanConfigurations.length === 1);
  const configuration = value.testPlanConfigurations[0]; keys(configuration, ['configurationId', 'configurationName']);
  assert.equal(configuration.configurationId, '1'); assert.equal(configuration.configurationName, 'Test Scheme Action');
  const bundle = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
  const container = (node, type, name, count, identifier) => {
    keys(node, identifier ? ['children', 'name', 'nodeIdentifierURL', 'nodeType', 'result'] : ['children', 'name', 'nodeType', 'result']);
    assert.equal(node.nodeType, type); assert.equal(node.name, name);
    assert.ok(['Passed', 'Failed'].includes(node.result), 'Skipped/unknown parent cannot select a failed scope');
    if (identifier) assert.equal(node.nodeIdentifierURL, identifier);
    assert.ok(Array.isArray(node.children) && node.children.length === count);
    return node.children;
  };
  assert.ok(Array.isArray(value.testNodes) && value.testNodes.length === 1);
  const plan = value.testNodes[0], bundles = container(plan, 'Test Plan', 'AILibrary', 1);
  const suites = container(bundles[0], 'UI test bundle', 'AILibraryUITests', 1, bundle);
  const cases = container(suites[0], 'Test Suite', 'NativeReaderUITests', 2, bundle + '/NativeReaderUITests');
  const allowed = ['NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()',
    'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()'];
  const selected = cases.map(node => {
    const failed = node?.result === 'Failed';
    const fields = ['duration', 'durationInSeconds', 'name', 'nodeIdentifier', 'nodeIdentifierURL', 'nodeType', 'result'];
    keys(node, failed ? [...fields, 'children'] : fields);
    assert.equal(node.nodeType, 'Test Case'); assert.ok(['Passed', 'Failed'].includes(node.result));
    assert.ok(allowed.includes(node.nodeIdentifier), 'Failed scope must be an existing Native2 case');
    assert.equal(node.nodeIdentifier, 'NativeReaderUITests/' + node.name);
    assert.equal(node.nodeIdentifierURL, bundle + '/' + node.nodeIdentifier.slice(0, -2));
    assert.equal(typeof node.duration, 'string'); assert.ok(node.duration.length <= 40);
    assert.ok(Number.isFinite(node.durationInSeconds) && node.durationInSeconds >= 0 && node.durationInSeconds <= 720);
    if (failed) {
      assert.ok(Array.isArray(node.children) && node.children.length >= 1 && node.children.length <= 8);
      for (const failure of node.children) {
        keys(failure, ['name', 'nodeType', 'sourceLocation']); assert.equal(failure.nodeType, 'Failure Message');
        assert.equal(typeof failure.name, 'string'); assert.ok(failure.name.length > 0 && failure.name.length <= 4096);
        keys(failure.sourceLocation, ['filePath', 'lineNumber']);
        assert.equal(failure.sourceLocation.filePath, path.join(workspace, 'ios/AILibraryUITests/NativeReaderUITests.swift'));
        assert.ok(Number.isInteger(failure.sourceLocation.lineNumber) && failure.sourceLocation.lineNumber > 0);
      }
    }
    return { id: node.nodeIdentifier, result: node.result };
  });
  assert.deepEqual(selected.map(row => row.id).sort(), [...allowed].sort(), 'No extra, duplicate or missing selected case');
  const failed = selected.filter(row => row.result === 'Failed').map(row => row.id);
  assert.ok(failed.length >= 1 && failed.length <= 2, 'UI failure must have an actual failed Native2 case');
  for (const parent of [plan, bundles[0], suites[0]]) assert.equal(parent.result, 'Failed', 'Parent/result inconsistency');
  return { schema: 'observed-SDK27-Native2-v1', cases: selected, failed,
    capture: failed[0], not_captured: failed.slice(1), selection: 'first failed case in the known raw result order' };
}

export function geometrySamples(text) {
  const rows = JSON.parse(text);
  assert.ok(Array.isArray(rows), 'Unknown unified-log JSON schema');
  const samples = [];
  for (const row of rows) {
    assert.ok(row && typeof row === 'object' && !Array.isArray(row));
    assert.equal(typeof row.eventMessage, 'string');
    assert.ok(row.eventMessage.startsWith(GEOMETRY), 'Unexpected log message');
    const sample = JSON.parse(row.eventMessage.slice(GEOMETRY.length));
    assert.deepEqual(Object.keys(sample).sort(), geometryKeys, 'Unknown numeric geometry shape');
    assert.ok(Number.isInteger(sample.sample) && sample.sample >= 1 && sample.sample <= 32);
    for (const [key, value] of Object.entries(sample)) {
      if (key === 'scrollFrameInWindow') assert.ok(Array.isArray(value) && value.length === 4 && value.every(Number.isFinite));
      else assert.ok(Number.isFinite(value), 'Nonfinite geometry');
    }
    samples.push(sample);
    // Multiple isolated app launches can each produce32; retain a bounded diagnostic tail.
    if (samples.length > 32) samples.shift();
  }
  assert.ok(samples.length > 0, 'No numeric geometry log samples captured');
  return samples;
}

// Limit the live export tree as well as final selected files. Never follow a link.
export function inspectExport(directory, io = fs) {
  noLinks(io, directory, true);
  const files = [];
  let bytes = 0, entries = 0;
  const walk = (parent, depth) => {
    assert.ok(depth <= 4, 'Export nesting limit exceeded');
    const dir = io.opendirSync(parent);
    try {
      let entry;
      while ((entry = dir.readSync()) !== null) {
        assert.ok(++entries <= 128, 'Export entry limit exceeded');
        assert.ok(/^[A-Za-z0-9][A-Za-z0-9._ -]{0,199}$/.test(entry.name) && !entry.name.includes('..'), 'Unsafe exported name');
        const file = path.join(parent, entry.name);
        assert.ok(file.startsWith(directory + path.sep), 'Export escape rejected');
        const stat = io.lstatSync(file);
        assert.ok(!stat.isSymbolicLink() && io.realpathSync(file) === file, 'Export symlink rejected');
        if (stat.isDirectory()) walk(file, depth + 1);
        else {
          assert.ok(stat.isFile(), 'Export special file rejected');
          files.push({ file, relative: path.relative(directory, file), bytes: stat.size }); bytes += stat.size;
          assert.ok(files.length <= LIMITS.exportedFiles && bytes <= LIMITS.exportedBytes, 'Live export disk limit exceeded');
        }
      }
    } finally { dir.closeSync(); }
  };
  walk(directory, 0);
  return { files: files.sort((a, b) => a.relative.localeCompare(b.relative)), bytes };
}

// No shell; detached children share an owned process group that is killed on any bound.
export function runBounded(binary, args, options, dependencies = {}) {
  const spawnChild = dependencies.spawn ?? spawn;
  const killGroup = dependencies.killGroup ?? (pid => process.kill(-pid, 'SIGKILL'));
  return new Promise(resolve => {
    let child, timer, poll, hardStop, settled = false, closeObserved = false, reason = null, retained = 0, seen = 0, killError = null;
    const stdout = [], stderr = [];
    const finish = (status = null, signal = null, error = null) => {
      if (settled) return; settled = true;
      clearTimeout(timer); clearInterval(poll); clearTimeout(hardStop);
      resolve({ status, signal, error: reason ?? (error ? message(error) : null),
        stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), observed_output_bytes: seen,
        retained_output_bytes: retained, group_kill_error: killError,
        termination_confirmed: child?.pid === undefined || closeObserved });
    };
    const stop = why => {
      if (reason || settled) return; reason = why;
      try { assert.ok(Number.isInteger(child?.pid) && child.pid > 1); killGroup(child.pid); }
      catch (error) { killError = message(error); }
      // A failed/unresponsive close is diagnostic partial; never hold cleanup indefinitely.
      hardStop = setTimeout(() => {
        // A lost close event must not keep the diagnostic step ahead of cleanup alive.
        child.stdout?.destroy?.(); child.stderr?.destroy?.(); child.unref?.();
        finish(null, 'SIGKILL');
      }, 1000);
    };
    try {
      options.monitor?.();
      child = spawnChild(binary, args, { cwd: options.cwd, env: options.env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
      const collect = chunks => chunk => {
        const data = Buffer.from(chunk); seen += data.length;
        const keep = Math.max(0, Math.min(data.length, options.maxBytes - retained));
        if (keep) { chunks.push(Buffer.from(data.subarray(0, keep))); retained += keep; }
        if (seen > options.maxBytes) stop('output-limit');
      };
      child.stdout.on('data', collect(stdout)); child.stderr.on('data', collect(stderr));
      child.once('error', error => finish(null, null, error));
      child.once('close', (status, signal) => { closeObserved = true; finish(status, signal); });
      timer = setTimeout(() => stop('timeout'), options.timeoutMs);
      if (options.monitor) poll = setInterval(() => { try { options.monitor(); } catch (error) { stop('export-limit: ' + message(error)); } }, 50);
    } catch (error) { finish(null, null, error); }
  });
}

function requireHealthy(result) {
  assert.equal(result.error, null, 'Diagnostic command did not complete within bounds');
  assert.equal(result.group_kill_error, null); assert.equal(result.termination_confirmed, true, 'Child termination was not observed');
  assert.equal(result.status, 0); assert.equal(result.signal, null);
}

export async function captureDiagnostics(env, dependencies = {}) {
  const io = dependencies.io ?? fs, run = dependencies.run ?? runBounded;
  const clock = dependencies.clock ?? (() => performance.now());
  const nonce = dependencies.nonce ?? randomUUID;
  const started = clock(), deadline = started + LIMITS.stepMs;
  const report = { schema_version: 1, status: 'partial', diagnostic_only: true, primary_ui_outcome: env.UI_OUTCOME ?? null,
    primary_acceptance_modified: false, source_head: env.EXPECTED_SOURCE_HEAD ?? null,
    run_id: env.GITHUB_RUN_ID ?? null, run_attempt: env.GITHUB_RUN_ATTEMPT ?? null,
    limits: LIMITS, commands: [], attachments: [], omissions: [], errors: [] };
  let evidence, temp = null, tempIdentity = null, retained = 0, unsafeChild = false;
  const put = (name, data) => {
    assert.ok(name.startsWith(PREFIX) && /^[A-Za-z0-9._-]+$/.test(name));
    const bytes = Buffer.from(data);
    assert.ok(retained + bytes.length <= LIMITS.artifactBytes - LIMITS.metadataBytes, 'Diagnostic payload budget exhausted');
    noLinks(io, evidence, true);
    io.writeFileSync(path.join(evidence, name), bytes, { flag: 'wx', mode: 0o600 }); retained += bytes.length;
    return name;
  };
  const verifyTempIdentity = () => {
    assert.ok(temp !== null && tempIdentity, 'No exclusively created export directory');
    noLinks(io, temp, true);
    const current = io.lstatSync(temp);
    assert.ok(current.dev === tempIdentity.dev && current.ino === tempIdentity.ino, 'Export directory ownership drift');
  };
  const command = async (name, args, timeoutMs, maxBytes, monitor, retainOutput = true) => {
    assert.equal(unsafeChild, false, 'Previous child group termination could not be confirmed');
    const remaining = Math.floor(deadline - clock()); assert.ok(remaining > 1000, 'Diagnostic step budget exhausted');
    const actualMs = Math.min(timeoutMs, remaining - 1000);
    const result = await run('xcrun', args, { cwd: env.GITHUB_WORKSPACE, env,
      timeoutMs: actualMs, maxBytes, monitor });
    // Defend the evidence budget even if a command adapter returns an invalid result.
    unsafeChild ||= result.group_kill_error != null || result.termination_confirmed !== true;
    const out = Buffer.from(result.stdout ?? ''), err = Buffer.from(result.stderr ?? '');
    assert.ok(out.length + err.length <= maxBytes, 'Unbounded command adapter output');
    const record = { name, binary: 'xcrun', arguments: args, timeout_ms: actualMs, output_cap_bytes: maxBytes,
      exit_code: result.status, signal: result.signal, error: result.error ?? null,
      observed_output_bytes: result.observed_output_bytes ?? out.length + err.length,
      retained_output_bytes: out.length + err.length, group_kill_error: result.group_kill_error ?? null,
      termination_confirmed: result.termination_confirmed === true, raw_output_retained: retainOutput };
    if (retainOutput) {
      put(PREFIX + name + '.stdout.log', out); put(PREFIX + name + '.stderr.log', err);
      put(PREFIX + name + '.exit.json', JSON.stringify(record) + '\n');
    }
    report.commands.push(record);
    return { ...result, error: result.error ?? null, group_kill_error: result.group_kill_error ?? null,
      termination_confirmed: result.termination_confirmed === true, stdout: out, stderr: err };
  };
  try {
    evidence = verifyContext(env, io);
    assert.ok(missing(io, path.join(evidence, PREFIX + 'summary.json')), 'Diagnostic output already exists');
    const { owned, runtime } = verifyOwner(env, io);
    report.owner = { UUID: owned.UUID, token: owned.token, name: owned.name, runtime_identifier: runtime.identifier,
      runtime_version: runtime.version, runtime_build: runtime.buildversion };
    const current = await command('devices', ['simctl', 'list', 'devices', '--json'], LIMITS.smallMs, LIMITS.helpBytes);
    requireHealthy(current);
    const matches = deviceRows(JSON.parse(current.stdout)).filter(({ device }) => device.udid.toUpperCase() === owned.UUID);
    assert.equal(matches.length, 1); const live = matches[0];
    assert.equal(live.runtime, runtime.identifier); assert.equal(live.device.name, owned.name);
    assert.equal(live.device.deviceTypeIdentifier, owned.device_type_identifier);
    assert.equal(live.device.state, 'Booted'); assert.equal(live.device.isAvailable, true);
    report.owner.current_inventory_verified = true;
    try {
      const logs = await command('geometry', ['simctl', 'spawn', owned.UUID, 'log', 'show', '--last', '20m',
        '--style', 'json', '--predicate', LOG_PREDICATE], LIMITS.logMs, LIMITS.logBytes);
      requireHealthy(logs); report.geometry_samples = geometrySamples(logs.stdout.toString('utf8'));
      report.geometry = 'numeric-samples-captured';
    } catch (error) { report.geometry = 'partial'; report.errors.push('Geometry: ' + message(error)); }
    if (env.UI_OUTCOME === 'failure') {
      try {
        const result = path.join(evidence, 'ui.xcresult'); noLinks(io, result, true);
        // The later primary result audit remains independent. This bounded read only selects
        // an actual failed Native2 case; discard its raw output instead of adding a new stager prefix.
        const results = await command('test-results', ['xcresulttool', 'get', 'test-results', 'tests', '--path', result],
          LIMITS.smallMs, LIMITS.resultsBytes, undefined, false);
        requireHealthy(results);
        const scope = failedNativeCases(JSON.parse(results.stdout), { owned, runtime, workspace: env.GITHUB_WORKSPACE });
        report.failed_test_scope = scope;
        for (const id of scope.not_captured) report.omissions.push({ test_id: id, reason: 'additional-failed-case-not-captured' });
        const help = await command('attachments-help', ['xcresulttool', 'help', 'export', 'attachments'], LIMITS.smallMs, LIMITS.helpBytes);
        requireHealthy(help);
        const helpText = help.stdout.toString('utf8') + '\n' + help.stderr.toString('utf8');
        assert.ok(/\b(?:USAGE|Usage):[^\n]*\bxcresulttool export attachments\b/.test(helpText), 'Unknown attachments help usage');
        for (const flag of ['--path', '--output-path', '--test-id', '--filter'])
          assert.ok(new RegExp('(?:^|\\s)' + flag + '(?=[\\s=,]|$)', 'm').test(helpText), 'Required attachments flag missing: ' + flag);
        assert.ok(helpText.includes('*.png') && /Glob pattern to filter attachments by filename/.test(helpText), 'Unknown PNG filename filter semantics');
        const token = nonce(); assert.match(token, TOKEN);
        const freshDirectory = path.join(evidence, PREFIX + 'export-' + token);
        assert.ok(missing(io, freshDirectory)); io.mkdirSync(freshDirectory, { mode: 0o700 });
        // Only a successful exclusive mkdir establishes cleanup ownership.
        temp = freshDirectory; tempIdentity = io.lstatSync(temp); noLinks(io, temp, true);
        const exported = await command('attachments-export', ['xcresulttool', 'export', 'attachments', '--path', result,
          '--output-path', temp, '--test-id', scope.capture, '--filter', '*.png'], LIMITS.exportMs, LIMITS.exportOutputBytes, () => { verifyTempIdentity(); inspectExport(temp, io); });
        requireHealthy(exported);
        verifyTempIdentity();
        const inventory = inspectExport(temp, io); report.exported = { files: inventory.files.length, bytes: inventory.bytes,
          scope: 'one-actual-failed-Native2-case-PNG-only', test_id: scope.capture, filter: '*.png', failure_association_filter: false };
        assert.ok(inventory.files.every(entry => path.extname(entry.file).toLowerCase() === '.png' || entry.relative === 'manifest.json'),
          'Exporter returned a file outside the PNG filter and its manifest');
        for (const entry of inventory.files) {
          const extension = path.extname(entry.file).toLowerCase(), cap = extension === '.png' ? LIMITS.pngBytes : LIMITS.metadataBytes;
          let omission = null;
          if (!['.png', '.json', '.txt'].includes(extension)) omission = 'unsupported-format';
          else if (entry.bytes > cap) omission = 'attachment-file-cap';
          else if (retained + entry.bytes > LIMITS.artifactBytes - LIMITS.metadataBytes) omission = 'diagnostic-total-cap';
          if (omission) { report.omissions.push({ path: entry.relative, bytes: entry.bytes, reason: omission }); continue; }
          verifyTempIdentity();
          const bytes = readBounded(io, entry.file, cap);
          if (extension === '.png') assert.ok(bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG), 'Invalid PNG attachment');
          else { const text = bytes.toString('utf8'); assert.ok(Buffer.from(text).equals(bytes), 'Non-UTF8 diagnostic metadata');
            if (extension === '.json') JSON.parse(text); }
          const name = PREFIX + 'attachment-' + String(report.attachments.length + 1).padStart(3, '0') + extension;
          put(name, bytes); report.attachments.push({ name, exported_path: entry.relative, bytes: bytes.length,
            SHA256: createHash('sha256').update(bytes).digest('hex') });
        }
        assert.ok(report.attachments.some(entry => entry.name.endsWith('.png')), 'No bounded failure PNG captured');
        assert.equal(report.omissions.length, 0, 'Some failure attachments were omitted');
        report.failure_attachments = 'bounded-selected-failed-case-PNGs-captured';
      } catch (error) { report.failure_attachments = 'partial'; report.errors.push('Attachments: ' + message(error)); }
    } else report.failure_attachments = 'not-requested-ui-succeeded';
    report.status = report.errors.length ? 'partial' : 'diagnostic-only-complete';
  } catch (error) { report.errors.push('Ownership/context: ' + message(error)); }
  finally {
    if (temp !== null) {
      try {
        // Remove only the fresh directory created by this invocation, never ui.xcresult.
        assert.ok(temp.startsWith(evidence + path.sep + PREFIX + 'export-'));
        assert.equal(unsafeChild, false, 'Do not remove an export tree while its child group may remain alive');
        verifyTempIdentity(); io.rmSync(temp, { recursive: true, force: false });
        report.temporary_export_removed = true;
      } catch (error) { report.status = 'partial'; report.errors.push('Temporary export cleanup: ' + message(error)); }
    }
    report.elapsed_ms = Math.max(0, Math.round(clock() - started));
    report.retained_payload_bytes_excluding_manifest = retained;
    if (evidence !== undefined) {
      try {
        noLinks(io, evidence, true);
        const bytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
        assert.ok(bytes.length <= LIMITS.metadataBytes && retained + bytes.length <= LIMITS.artifactBytes, 'Diagnostic manifest budget exceeded');
        io.writeFileSync(path.join(evidence, PREFIX + 'summary.json'), bytes, { flag: 'wx', mode: 0o600 });
      } catch (error) { report.status = 'partial'; report.errors.push('Manifest: ' + message(error)); }
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await captureDiagnostics(process.env);
  // Diagnostic failure is never UI success; primary strict audit remains authoritative.
  console.log(JSON.stringify({ status: report.status, diagnostic_only: true,
    primary_ui_outcome: report.primary_ui_outcome, primary_acceptance_modified: false,
    commands: report.commands.length, errors: report.errors }));
}
