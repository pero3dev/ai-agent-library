import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { captureDiagnostics, failedNativeCases, geometrySamples, inspectExport, LIMITS, runBounded,
  verifyOwner } from '../../ios/tests/capture-reader-failure-diagnostics.mjs';

const evidence = '/workspace/.local/ios-runtime27/evidence';
const uuid = '01234567-89AB-CDEF-0123-456789ABCDEF';
const token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const exportToken = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
const runtimeID = 'com.apple.CoreSimulator.SimRuntime.iOS-27-0';
const typeID = 'com.apple.CoreSimulator.SimDeviceType.iPhone-17';
const help = 'USAGE: xcresulttool export attachments [--test-id <test-id>] --path <path> --output-path <output-path> [--filter <filter>] [--only-failures]\nOPTIONS:\n  --test-id <test-id> Test identifier URL or identifier string.\n  --path <path>\n  --output-path <output-path>\n  --filter <filter> Glob pattern to filter attachments by filename (e.g. "*.png", "Screenshot*").\n  --only-failures Export only failure-associated attachments.\n';
const sample = { sample: 1, scrollFrameInWindow: [0, 116, 402, 758], scrollBoundsY: 0,
  viewportHeight: 758, contentHeight: 12000, contentInsetTop: 0, contentInsetBottom: 0,
  adjustedTop: 0, adjustedBottom: 34, safeAreaTop: 0, safeAreaBottom: 34,
  visibleTop: 116, markerContentY: 1020, markerWindowY: 116,
  legacyGoalOffset: 1020, goalOffset: 1020, actualOffset: 1020 };
const logs = JSON.stringify([{ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify(sample) }]);
const healthy = stdout => ({ status: 0, signal: null, error: null, stdout: Buffer.from(stdout), stderr: Buffer.alloc(0), group_kill_error: null, termination_confirmed: true });

// Memory-only I/O; these tests never create a child, invoke Apple tools, or allocate attachments on disk.
function memoryIO() {
  const nodes = new Map(), descriptors = new Map(), writes = [], removals = [];
  let serial = 1, descriptor = 10;
  const add = (file, data = '', type = 'file', size) => {
    const node = { type, data: Buffer.from(data), ino: serial++, dev: 1, size, mtimeMs: 1 };
    nodes.set(file, node); return node;
  };
  for (const file of ['/', '/workspace', '/workspace/.local', '/workspace/.local/ios-runtime27', evidence]) add(file, '', 'directory');
  const get = file => { const node = nodes.get(file); if (!node) throw Object.assign(new Error('Missing fixture file'), { code: 'ENOENT' }); return node; };
  const stat = node => ({ ...node, size: node.size ?? node.data.length,
    isFile: () => node.type === 'file', isDirectory: () => node.type === 'directory', isSymbolicLink: () => node.type === 'symlink' });
  const io = {
    lstatSync: file => stat(get(file)),
    realpathSync: file => get(file).type === 'symlink' ? get(file).data.toString() : file,
    openSync: file => { const node = get(file); assert.equal(node.type, 'file'); const fd = descriptor++; descriptors.set(fd, node); return fd; },
    fstatSync: fd => stat(descriptors.get(fd)),
    readSync: (fd, data, offset, bytes, position) => descriptors.get(fd).data.copy(data, offset, position, position + bytes),
    closeSync: fd => descriptors.delete(fd),
    writeFileSync: (file, data, options) => {
      assert.equal(options.flag, 'wx'); assert.equal(options.mode, 0o600);
      assert.ok(file.startsWith(evidence + '/reader-diagnostic-')); assert.ok(!nodes.has(file));
      assert.equal(get(file.slice(0, file.lastIndexOf('/'))).type, 'directory');
      add(file, data); writes.push(file);
    },
    mkdirSync: (file, options) => {
      assert.equal(options.mode, 0o700); assert.ok(file.startsWith(evidence + '/reader-diagnostic-export-'));
      assert.ok(!nodes.has(file)); add(file, '', 'directory'); writes.push(file);
    },
    opendirSync: directory => {
      assert.equal(get(directory).type, 'directory');
      const children = [...nodes.keys()].filter(file => file.startsWith(directory + '/') && !file.slice(directory.length + 1).includes('/'));
      let index = 0;
      return { readSync: () => index < children.length ? { name: children[index++].slice(directory.length + 1) } : null, closeSync() {} };
    },
    rmSync: (file, options) => {
      assert.ok(file.startsWith(evidence + '/reader-diagnostic-export-'));
      assert.deepEqual(options, { recursive: true, force: false });
      for (const key of nodes.keys()) if (key === file || key.startsWith(file + '/')) nodes.delete(key);
      removals.push(file);
    }
  };
  return { io, nodes, add, writes, removals, json: (name, data) => add(evidence + '/' + name, JSON.stringify(data)) };
}

function fixture() {
  const memory = memoryIO();
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'pero3dev/ai-agent-library', REPOSITORY_IS_PRIVATE: 'false',
    DEVELOPER_DIR: '/Applications/Xcode_27.app/Contents/Developer', EXPECTED_SOURCE_HEAD: 'f'.repeat(40),
    GITHUB_RUN_ID: '40340824321', GITHUB_RUN_ATTEMPT: '1', GITHUB_WORKSPACE: '/workspace', EVIDENCE_DIR: evidence, UI_OUTCOME: 'failure' };
  const intent = { schema_version: 1, repository: env.GITHUB_REPOSITORY, source_head: env.EXPECTED_SOURCE_HEAD,
    run_id: env.GITHUB_RUN_ID, run_attempt: env.GITHUB_RUN_ATTEMPT, token,
    name: `AILibrary-runtime27-${env.GITHUB_RUN_ID}-1-${token}`, runtime_identifier: runtimeID,
    device_type_identifier: typeID, preexisting_UUIDs: [] };
  const selection = { schema_version: 1, status: 'selected-from-actual-inventory', source_head: env.EXPECTED_SOURCE_HEAD,
    source_tree: 'e'.repeat(40), repository: env.GITHUB_REPOSITORY, repository_private: false,
    runner_label: 'xcode-27', standard_runner: true, developer_directory: env.DEVELOPER_DIR,
    sdk: '27.0', macOS: '27.0', architecture: 'arm64', Xcode: 'Xcode 27.0\nBuild version 27A266a',
    runtime: { name: 'iOS 27.0', version: '27.0', identifier: runtimeID, buildversion: '27A100', isAvailable: true, platform: 'iOS' },
    device_type: { name: 'iPhone 17', identifier: typeID } };
  memory.json('selection.json', selection); memory.json('owned-simulator-intent.json', intent);
  memory.json('owned-simulator.json', { ...intent, UUID: uuid, creation_exit_code: 0 });
  memory.json('create-simulator.exit.json', { binary: 'xcrun', arguments: ['simctl', 'create', intent.name, typeID, runtimeID], exit_code: 0, signal: null, error: null });
  memory.add(evidence + '/create-simulator.stdout.log', uuid + '\n');
  memory.add(evidence + '/source-head.stdout.log', env.EXPECTED_SOURCE_HEAD + '\n');
  memory.json('devices-before-create.stdout.log', { devices: {} });
  memory.add(evidence + '/ui.xcresult', '', 'directory');
  memory.json('ui-command.exit.json', { xcodebuild_exit_code: 65, tee_exit_code: 0 });
  memory.json('summary.json', { status: 'not-completed' });
  const primary = new Map([...memory.nodes].filter(([file]) => !file.endsWith('/ui.xcresult')).map(([file, node]) => [file, Buffer.from(node.data)]));
  const calls = [];
  const current = { devices: { [runtimeID]: [{ udid: uuid, name: intent.name, deviceTypeIdentifier: typeID, state: 'Booted', isAvailable: true }] } };
  // Observed SDK27 result hierarchy with generic paths, fake IDs and synthetic failure text.
  const bundle = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
  const makeCase = (name, result) => {
    const row = { duration: '1s', durationInSeconds: 1, name: name + '()', nodeIdentifier: 'NativeReaderUITests/' + name + '()',
      nodeIdentifierURL: bundle + '/NativeReaderUITests/' + name, nodeType: 'Test Case', result };
    if (result === 'Failed') row.children = [{ name: 'Synthetic visibility failure', nodeType: 'Failure Message',
      sourceLocation: { filePath: '/workspace/ios/AILibraryUITests/NativeReaderUITests.swift', lineNumber: 326 } }];
    return row;
  };
  const results = { devices: [{ architecture: 'arm64', deviceId: uuid, deviceName: intent.name, modelName: 'iPhone 17',
    osBuildNumber: selection.runtime.buildversion, osVersion: '27.0', platform: 'iOS Simulator' }],
    testNodes: [{ name: 'AILibrary', nodeType: 'Test Plan', result: 'Failed', children: [
      { name: 'AILibraryUITests', nodeType: 'UI test bundle', nodeIdentifierURL: bundle, result: 'Failed', children: [
        { name: 'NativeReaderUITests', nodeType: 'Test Suite', nodeIdentifierURL: bundle + '/NativeReaderUITests', result: 'Failed',
          children: [makeCase('testContentsBookmarkAndResumeAfterRelaunch', 'Failed'), makeCase('testThreeArticlesHaveNativeBodyText', 'Passed')] }
      ] }
    ] }], testPlanConfigurations: [{ configurationId: '1', configurationName: 'Test Scheme Action' }] };
  const exit = { exit_code: 0, signal: null, error: null };
  memory.json('cleanup.json', { schema_version: 1, status: 'owned-simulator-deleted', UUID: uuid, shutdown_exit_code: 0, delete_exit_code: 0 });
  memory.json('cleanup-devices-before.exit.json', exit); memory.json('cleanup-devices-before.stdout.log', current);
  memory.json('cleanup-shutdown.exit.json', exit); memory.json('cleanup-delete.exit.json', exit);
  memory.json('cleanup-devices-after.exit.json', exit); memory.json('cleanup-devices-after.stdout.log', { devices: {} });
  memory.json('ui-test-results.exit.json', exit);
  const cached = memory.add(evidence + '/ui-test-results.stdout.json');
  Object.defineProperty(cached, 'data', { configurable: true, get: () => Buffer.from(JSON.stringify(results)) });
  const f = { ...memory, env, intent, selection, current, calls, primary, results, makeCase };
  f.run = async (binary, args, options) => {
    assert.equal(binary, 'xcrun'); assert.equal(options.env, env); assert.equal(options.cwd, '/workspace');
    assert.ok(options.timeoutMs <= 45000); calls.push({ binary, args, options });
    assert.equal(args[0], 'xcresulttool');
    assert.ok(['help', 'export'].includes(args[1]), 'No live Simulator or fresh result query is permitted');
    if (args[1] === 'help') return healthy(help);
    const output = args[args.indexOf('--output-path') + 1];
    memory.add(output + '/failure.png', png);
    memory.add(output + '/manifest.json', '{"failuresOnly":true}');
    options.monitor(); return healthy('');
  };
  f.capture = async override => {
    const protectedNames = ['ui-command.exit.json', 'summary.json', 'ui-test-results.exit.json', 'ui-test-results.stdout.json', 'cleanup.json'];
    const before = new Map(protectedNames.filter(name => memory.nodes.has(evidence + '/' + name))
      .map(name => [name, Buffer.from(memory.nodes.get(evidence + '/' + name).data)]));
    const result = await captureDiagnostics(env, { io: memory.io, run: override ?? f.run, nonce: () => exportToken, clock: () => 100 });
    for (const [name, data] of before) assert.deepEqual(memory.nodes.get(evidence + '/' + name).data, data);
    return result;
  };
  return f;
}

function rewrite(f, name, change) {
  const data = JSON.parse(f.nodes.get(evidence + '/' + name).data); change(data); f.json(name, data);
}

test('cached failed parents select one PNG scope after proven owned cleanup without new queries', async () => {
  const f = fixture(), report = await f.capture();
  assert.equal(report.status, 'partial'); assert.equal(report.primary_ui_outcome, 'failure');
  assert.equal(report.primary_acceptance_modified, false); assert.equal(report.geometry, 'not-collected');
  assert.deepEqual(report.unmeasured, ['reader-marker-geometry-after-owned-cleanup']);
  assert.equal(report.geometry_samples, undefined); assert.deepEqual(report.errors, []);
  assert.equal(report.cleanup.absence_proven, true); assert.equal(report.owner.deleted_identity_verified, true);
  assert.equal(report.cached_results.fresh_query_count, 0);
  assert.deepEqual(f.calls.map(call => call.args.slice(0, 3)), [['xcresulttool', 'help', 'export'], ['xcresulttool', 'export', 'attachments']]);
  assert.equal(f.calls[0].options.timeoutMs, 5000); assert.equal(f.calls[0].options.maxBytes, 64 * 1024);
  assert.equal(f.calls[1].options.timeoutMs, 45000);
  assert.deepEqual(f.calls[1].args.slice(-4), ['--test-id', 'NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()', '--filter', '*.png']);
  assert.ok(!f.calls.flatMap(call => call.args).includes('--only-failures')); assert.ok(!f.calls.flatMap(call => call.args).includes('--all'));
  assert.ok(!f.writes.some(file => /reader-diagnostic-(?:test-results|devices|geometry)\./.test(file)));
  assert.equal(report.attachments.length, 2); assert.equal(report.temporary_export_removed, true);
  assert.equal(report.failure_attachments, 'bounded-selected-failed-case-PNGs-captured');
  assert.equal(f.removals.length, 1); assert.ok(f.nodes.has(evidence + '/ui.xcresult'));
  assert.ok(f.nodes.get(evidence + '/reader-diagnostic-summary.json').data.length <= 128 * 1024);
});

test('successful UI does not export PNG or claim marker geometry was measured', async () => {
  const f = fixture(); f.env.UI_OUTCOME = 'success'; f.json('ui-command.exit.json', { xcodebuild_exit_code: 0, tee_exit_code: 0 });
  caseRows(f)[0] = f.makeCase('testContentsBookmarkAndResumeAfterRelaunch', 'Passed');
  for (const parent of parentRows(f)) parent.result = 'Passed';
  const report = await f.capture(); assert.equal(report.status, 'partial');
  assert.equal(f.calls.length, 0); assert.equal(report.failure_attachments, 'not-requested-ui-succeeded');
  assert.equal(report.geometry, 'not-collected'); assert.equal(report.geometry_samples, undefined);
});

for (const name of ['owned-simulator.json', 'owned-simulator-intent.json', 'selection.json', 'create-simulator.exit.json', 'source-head.stdout.log', 'devices-before-create.stdout.log']) {
  test('missing ownership input starts no command: ' + name, async () => {
    const f = fixture(); f.nodes.delete(evidence + '/' + name);
    assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 0);
  });
}
for (const [label, name, change] of [
  ['head', 'selection.json', v => { v.source_head = 'a'.repeat(40); }],
  ['run', 'owned-simulator-intent.json', v => { v.run_id = '1'; }],
  ['attempt', 'owned-simulator.json', v => { v.run_attempt = '2'; }],
  ['runtime', 'selection.json', v => { v.runtime.version = '26.0'; }],
  ['name', 'owned-simulator.json', v => { v.name = 'another-device'; }],
  ['UUID', 'owned-simulator.json', v => { v.UUID = '12345678-89AB-CDEF-0123-456789ABCDEF'; }],
  ['create exit', 'create-simulator.exit.json', v => { v.exit_code = 1; }],
  ['creation arguments', 'create-simulator.exit.json', v => { v.arguments[2] = 'another-name'; }],
  ['preexisting', 'owned-simulator-intent.json', v => { v.preexisting_UUIDs = [uuid]; }]
]) test('drifted ownership starts no command: ' + label, async () => {
  const f = fixture(); rewrite(f, name, change); assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 0);
});

for (const [key, value] of [['GITHUB_ACTIONS', 'false'], ['GITHUB_REPOSITORY', 'another/repo'], ['REPOSITORY_IS_PRIVATE', 'true'],
  ['EVIDENCE_DIR', '/elsewhere'], ['GITHUB_WORKSPACE', '/workspace/../workspace'], ['UI_OUTCOME', 'cancelled'], ['UI_OUTCOME', 'skipped'], ['UI_OUTCOME', 'unknown']]) {
  test('invalid public CI context has no command or write: ' + key, async () => {
    const f = fixture(); f.env[key] = value;
    assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 0); assert.deepEqual(f.writes, []);
  });
}

test('owner file symlink and evidence symlink are rejected before commands', async () => {
  for (const file of [evidence, evidence + '/owned-simulator.json']) {
    const f = fixture(); f.add(file, '/elsewhere', 'symlink');
    assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 0);
  }
});
test('colliding export nonce never deletes a preexisting directory or sentinel', async () => {
  const f = fixture(), directory = evidence + '/reader-diagnostic-export-' + exportToken;
  f.add(directory, '', 'directory'); f.add(directory + '/sentinel.txt', 'preexisting');
  const report = await f.capture();
  assert.equal(report.status, 'partial'); assert.equal(report.attachments.length, 0);
  assert.ok(!f.calls.some(call => call.args[1] === 'export')); assert.equal(f.removals.length, 0);
  assert.equal(f.nodes.get(directory + '/sentinel.txt').data.toString(), 'preexisting');
});
test('exclusive export mkdir failure never establishes cleanup ownership', async () => {
  const f = fixture(); f.io.mkdirSync = () => { throw Object.assign(new Error('EEXIST'), { code: 'EEXIST' }); };
  assert.equal((await f.capture()).status, 'partial'); assert.equal(f.removals.length, 0);
});
test('export directory inode drift is reported and never recursively removed', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture(async (binary, args, options) => {
    const result = await run(binary, args, options);
    if (args[1] === 'export') f.nodes.get(args[args.indexOf('--output-path') + 1]).ino++;
    return result;
  });
  assert.equal(report.status, 'partial'); assert.equal(f.removals.length, 0); assert.equal(report.attachments.length, 0);
  assert.ok(report.errors.some(error => error.includes('ownership drift')));
});
test('a consistent but non27 runtime identifier is rejected before commands', async () => {
  const f = fixture(), other = 'com.apple.CoreSimulator.SimRuntime.iOS-26-0';
  rewrite(f, 'selection.json', v => { v.runtime.identifier = other; });
  for (const name of ['owned-simulator-intent.json', 'owned-simulator.json']) rewrite(f, name, v => { v.runtime_identifier = other; });
  rewrite(f, 'create-simulator.exit.json', v => { v.arguments[4] = other; });
  assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 0);
});
test('existing diagnostic manifest is neither replaced nor extended', async () => {
  const f = fixture(); f.add(evidence + '/reader-diagnostic-summary.json', '{"old":true}');
  const report = await f.capture(); assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 0);
  assert.equal(f.nodes.get(evidence + '/reader-diagnostic-summary.json').data.toString(), '{"old":true}');
});
test('geometry schema rejects nonfinite or extra nonnumeric fields and keeps32 samples', () => {
  assert.throws(() => geometrySamples(JSON.stringify([{ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify({ ...sample, contentHeight: null }) }])));
  assert.throws(() => geometrySamples(JSON.stringify([{ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify({ ...sample, title: 'forbidden' }) }])));
  assert.equal(geometrySamples(JSON.stringify(Array.from({ length: 100 }, () => ({ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify(sample) })))).length, 32);
});

for (const text of ['unknown schema', help.replace(/--test-id/g, '--all'), help.replace(/--filter/g, '--output')]) {
  test('unknown attachments help performs no export', async () => {
    const f = fixture(), run = f.run;
    const report = await f.capture((binary, args, options) => args[1] === 'help' ? healthy(text) : run(binary, args, options));
    assert.equal(report.status, 'partial'); assert.equal(report.attachments.length, 0);
    assert.ok(!f.calls.some(call => call.args[1] === 'export')); assert.equal(f.removals.length, 0);
  });
}
for (const kind of ['timeout', 'output-limit']) test('export failure is partial and removes only fresh temp: ' + kind, async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'export'
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: kind } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(report.temporary_export_removed, true);
  assert.equal(f.removals.length, 1); assert.ok(f.nodes.has(evidence + '/ui.xcresult'));
});
test('unconfirmed export termination leaves its fresh tree untouched and records partial', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'export'
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: 'timeout', group_kill_error: 'unconfirmed' } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(f.removals.length, 0);
  assert.ok(f.nodes.has(evidence + '/reader-diagnostic-export-' + exportToken));
  assert.ok(report.errors.some(error => error.includes('child group may remain alive')));
});
for (const mode of ['symlink', 'escape', 'disk-cap', 'file-count', 'large-png', 'invalid-png']) {
  test('unsafe or oversized export is partial: ' + mode, async () => {
    const f = fixture(), run = f.run;
    const report = await f.capture((binary, args, options) => {
      if (args[1] !== 'export') return run(binary, args, options);
      const output = args[args.indexOf('--output-path') + 1];
      if (mode === 'symlink') f.add(output + '/failure.png', '/private/other', 'symlink');
      if (mode === 'escape') {
        const open = f.io.opendirSync;
        f.io.opendirSync = directory => directory === output ? { readSync: () => ({ name: '../escape.png' }), closeSync() {} } : open(directory);
      }
      if (mode === 'disk-cap') f.add(output + '/failure.png', png, 'file', LIMITS.exportedBytes + 1);
      if (mode === 'file-count') for (let i = 0; i < 65; i++) f.add(output + '/' + i + '.txt', 'x');
      if (mode === 'large-png') f.add(output + '/failure.png', png, 'file', LIMITS.pngBytes + 1);
      if (mode === 'invalid-png') f.add(output + '/failure.png', 'not a png');
      return healthy('');
    });
    assert.equal(report.status, 'partial'); assert.equal(report.failure_attachments, 'partial');
    assert.equal(report.attachments.length, 0); assert.equal(report.temporary_export_removed, true);
  });
}

function caseRows(f) { return f.results.testNodes[0].children[0].children[0].children; }
function parentRows(f) { return [f.results.testNodes[0], f.results.testNodes[0].children[0], f.results.testNodes[0].children[0].children[0]]; }
for (const [label, change] of [
  ['extra root schema', f => { f.results.unknown = true; }],
  ['unknown parent result', f => { parentRows(f)[0].result = 'Skipped'; }],
  ['passed parent over failed leaf', f => { parentRows(f)[1].result = 'Passed'; }],
  ['extra case', f => { caseRows(f).push(f.makeCase('testOther', 'Failed')); }],
  ['duplicate case', f => { caseRows(f)[1] = structuredClone(caseRows(f)[0]); }],
  ['unselected failed case', f => { caseRows(f)[0] = f.makeCase('testOther', 'Failed'); }],
  ['unknown leaf schema', f => { caseRows(f)[0].details = {}; }],
  ['retry children', f => { caseRows(f)[0].children = [f.makeCase('testContentsBookmarkAndResumeAfterRelaunch', 'Failed')]; }],
  ['wrong failure source', f => { caseRows(f)[0].children[0].sourceLocation.filePath = '/workspace/other.swift'; }],
  ['wrong device UUID', f => { f.results.devices[0].deviceId = '12345678-89AB-CDEF-0123-456789ABCDEF'; }],
  ['wrong runtime build', f => { f.results.devices[0].osBuildNumber = 'unknown'; }],
  ['extra device', f => { f.results.devices.push(structuredClone(f.results.devices[0])); }],
  ['unknown configuration', f => { f.results.testPlanConfigurations[0].configurationName = 'other'; }],
  ['all passed', f => { caseRows(f)[0] = f.makeCase('testContentsBookmarkAndResumeAfterRelaunch', 'Passed'); for (const p of parentRows(f)) p.result = 'Passed'; }],
  ['skipped leaf', f => { caseRows(f)[1].result = 'Skipped'; }]
]) test('unknown or invalid failed result scope suppresses PNG export: ' + label, async () => {
  const f = fixture(); change(f);
  const report = await f.capture(); assert.equal(report.status, 'partial');
  assert.equal(f.calls.length, 0);
  assert.ok(!f.calls.some(call => call.args[1] === 'help' || call.args[1] === 'export'));
  assert.equal(report.attachments.length, 0); assert.equal(report.primary_acceptance_modified, false);
});
test('the other existing selected case can be the sole actual failed PNG scope', async () => {
  const f = fixture(); caseRows(f)[0] = f.makeCase('testContentsBookmarkAndResumeAfterRelaunch', 'Passed');
  caseRows(f)[1] = f.makeCase('testThreeArticlesHaveNativeBodyText', 'Failed');
  const report = await f.capture(); assert.equal(report.status, 'partial');
  assert.equal(report.failure_attachments, 'bounded-selected-failed-case-PNGs-captured');
  const exports = f.calls.filter(call => call.args[1] === 'export'); assert.equal(exports.length, 1);
  assert.ok(exports[0].args.includes('NativeReaderUITests/testThreeArticlesHaveNativeBodyText()'));
});
test('two failed cases capture the first only and explicitly omit the second', async () => {
  const f = fixture(); caseRows(f)[1] = f.makeCase('testThreeArticlesHaveNativeBodyText', 'Failed');
  const report = await f.capture(); assert.equal(report.status, 'partial');
  assert.equal(f.calls.filter(call => call.args[1] === 'export').length, 1);
  assert.equal(report.failed_test_scope.capture, 'NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()');
  assert.ok(report.omissions.some(row => row.test_id === 'NativeReaderUITests/testThreeArticlesHaveNativeBodyText()'
    && row.reason === 'additional-failed-case-not-captured'));
  assert.ok(report.attachments.some(row => row.name.endsWith('.png')));
});
test('help must demonstrate a PNG filename filter before export', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'help' ? healthy(help.replace('*.png', '*.mp4')) : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.ok(!f.calls.some(call => call.args[1] === 'export'));
});
test('a video or non-PNG file returned despite the filter is rejected before any copy', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => {
    if (args[1] !== 'export') return run(binary, args, options);
    assert.deepEqual(args.slice(-2), ['--filter', '*.png']);
    const output = args[args.indexOf('--output-path') + 1]; f.add(output + '/recording.mp4', 'video');
    f.add(output + '/failure.png', png); return healthy('');
  });
  assert.equal(report.status, 'partial'); assert.equal(report.attachments.length, 0);
  assert.ok(report.errors.some(row => row.includes('outside the PNG filter')));
});
function noCommands(report, f) {
  assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 0); assert.equal(report.attachments.length, 0);
  assert.equal(report.primary_acceptance_modified, false);
}
for (const name of ['cleanup.json', 'cleanup-devices-before.exit.json', 'cleanup-devices-before.stdout.log',
  'cleanup-shutdown.exit.json', 'cleanup-delete.exit.json', 'cleanup-devices-after.exit.json', 'cleanup-devices-after.stdout.log',
  'ui-command.exit.json', 'ui-test-results.exit.json', 'ui-test-results.stdout.json']) {
  test('missing cached primary or cleanup evidence suppresses every PNG command: ' + name, async () => {
    const f = fixture(); f.nodes.delete(evidence + '/' + name); noCommands(await f.capture(), f);
  });
}
for (const [label, name, change] of [
  ['unknown cleanup', 'cleanup.json', v => { v.status = 'unresolved'; }],
  ['different cleanup UUID', 'cleanup.json', v => { v.UUID = '12345678-89AB-CDEF-0123-456789ABCDEF'; }],
  ['failed deletion', 'cleanup-delete.exit.json', v => { v.exit_code = 1; }],
  ['unconfirmed deletion', 'cleanup-delete.exit.json', v => { v.signal = 'SIGKILL'; }],
  ['failed shutdown', 'cleanup-shutdown.exit.json', v => { v.error = 'timeout'; }],
  ['unknown cleanup exit schema', 'cleanup-devices-after.exit.json', v => { v.extra = true; }],
  ['different precleanup owner', 'cleanup-devices-before.stdout.log', v => { v.devices[runtimeID][0].name = 'unowned'; }],
  ['different precleanup runtime', 'cleanup-devices-before.stdout.log', v => { v.devices.other = v.devices[runtimeID]; delete v.devices[runtimeID]; }],
  ['missing before identity', 'cleanup-devices-before.stdout.log', v => { v.devices = {}; }],
  ['duplicate before identity', 'cleanup-devices-before.stdout.log', v => { v.devices[runtimeID].push(structuredClone(v.devices[runtimeID][0])); }],
  ['owned still present', 'cleanup-devices-after.stdout.log', v => { v.devices = { [runtimeID]: [{ udid: uuid }] }; }],
  ['failed cached query', 'ui-test-results.exit.json', v => { v.exit_code = 1; }],
  ['cached query timeout', 'ui-test-results.exit.json', v => { v.error = 'ETIMEDOUT'; }],
  ['cached query killed', 'ui-test-results.exit.json', v => { v.signal = 'SIGKILL'; }],
  ['unknown cached exit shape', 'ui-test-results.exit.json', v => { v.binary = 'xcrun'; }],
  ['UI failure with exit0', 'ui-command.exit.json', v => { v.xcodebuild_exit_code = 0; }],
  ['unknown UI exit', 'ui-command.exit.json', v => { v.xcodebuild_exit_code = 70; }],
  ['failed tee', 'ui-command.exit.json', v => { v.tee_exit_code = 1; }]
]) test('drifted cached or deletion proof suppresses PNG commands: ' + label, async () => {
  const f = fixture(); rewrite(f, name, change); noCommands(await f.capture(), f);
});
test('known already-absent branch proves absence without invented after/delete files', async () => {
  const f = fixture(); f.json('cleanup.json', { schema_version: 1, status: 'already-absent', UUID: uuid });
  f.json('cleanup-devices-before.stdout.log', { devices: {} });
  for (const name of ['cleanup-shutdown', 'cleanup-delete', 'cleanup-devices-after'])
    for (const ext of ['.exit.json', '.stdout.log', '.stderr.log']) f.nodes.delete(evidence + '/' + name + ext);
  const report = await f.capture(); assert.equal(report.cleanup.status, 'already-absent');
  assert.equal(report.failure_attachments, 'bounded-selected-failed-case-PNGs-captured'); assert.equal(f.calls.length, 2);
});
test('already-absent is rejected if the before inventory contains the owned UUID', async () => {
  const f = fixture(); f.json('cleanup.json', { schema_version: 1, status: 'already-absent', UUID: uuid });
  noCommands(await f.capture(), f);
});
test('already-absent rejects leftover delete/after evidence from an unknown branch', async () => {
  const f = fixture(); f.json('cleanup.json', { schema_version: 1, status: 'already-absent', UUID: uuid });
  f.json('cleanup-devices-before.stdout.log', { devices: {} }); noCommands(await f.capture(), f);
});
test('known already-shutdown branch needs deletion and absence but no shutdown command', async () => {
  const f = fixture(); rewrite(f, 'cleanup-devices-before.stdout.log', v => { v.devices[runtimeID][0].state = 'Shutdown'; });
  f.json('cleanup.json', { schema_version: 1, status: 'owned-simulator-deleted', UUID: uuid, shutdown: 'already-shutdown', delete_exit_code: 0 });
  f.nodes.delete(evidence + '/cleanup-shutdown.exit.json');
  const report = await f.capture(); assert.equal(report.cleanup.absence_proven, true); assert.equal(f.calls.length, 2);
});
for (const name of ['ui-test-results.stdout.json', 'cleanup.json']) test('symlink cached/cleanup evidence starts no PNG command: ' + name, async () => {
  const f = fixture(); f.add(evidence + '/' + name, '/elsewhere', 'symlink'); noCommands(await f.capture(), f);
});
test('malformed cached JSON starts no PNG command and is not rewritten', async () => {
  const f = fixture(); f.add(evidence + '/ui-test-results.stdout.json', '{'); noCommands(await f.capture(), f);
});
test('cached raw output above512KiB is rejected before reading or exporting', async () => {
  const f = fixture(); f.add(evidence + '/ui-test-results.stdout.json', '{}', 'file', 512 * 1024 + 1);
  noCommands(await f.capture(), f); assert.ok(!f.writes.some(file => file.includes('test-results.')));
});
for (const kind of ['inode', 'mtime']) test('changed cached read fails closed: ' + kind, async () => {
  const f = fixture(), open = f.io.openSync, stat = f.io.fstatSync; let cachedFD, reads = 0;
  f.io.openSync = (file, flags) => { const fd = open(file, flags); if (file === evidence + '/ui-test-results.stdout.json') cachedFD = fd; return fd; };
  f.io.fstatSync = fd => { const value = stat(fd); if (fd === cachedFD) { reads++; if (kind === 'inode' && reads === 1) value.ino++; if (kind === 'mtime' && reads === 2) value.mtimeMs++; } return value; };
  noCommands(await f.capture(), f);
});
test('fresh SDK result reads and Simulator commands are absent even when the command adapter would reject them', async () => {
  const f = fixture(); const report = await f.capture();
  assert.equal(report.failure_attachments, 'bounded-selected-failed-case-PNGs-captured');
  assert.ok(f.calls.every(call => call.args[0] === 'xcresulttool' && ['help', 'export'].includes(call.args[1])));
  assert.ok(!f.writes.some(file => /reader-diagnostic-(?:devices|geometry|test-results)\./.test(file)));
});

test('no matching PNG remains partial without broadening the failed-case filter', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => {
    if (args[1] !== 'export') return run(binary, args, options);
    const output = args[args.indexOf('--output-path') + 1]; f.add(output + '/manifest.json', '[]'); return healthy('');
  });
  assert.equal(report.status, 'partial'); assert.ok(!report.attachments.some(row => row.name.endsWith('.png')));
  assert.equal(report.commands.filter(row => row.name === 'attachments-export').length, 1);
  const command = report.commands.find(row => row.name === 'attachments-export');
  assert.deepEqual(command.arguments.slice(-2), ['--filter', '*.png']); assert.ok(!command.arguments.includes('--only-failures'));
});
test('several PNGs in the one failed case share the existing4MiB artifact budget', async () => {
  const f = fixture(), run = f.run;
  const bytes = Buffer.alloc(LIMITS.pngBytes); png.copy(bytes);
  const report = await f.capture((binary, args, options) => {
    if (args[1] !== 'export') return run(binary, args, options);
    const output = args[args.indexOf('--output-path') + 1];
    for (let i = 0; i < 5; i++) f.add(output + '/failure-' + i + '.png', bytes);
    options.monitor(); return healthy('');
  });
  assert.equal(report.status, 'partial'); assert.ok(report.omissions.some(row => row.reason === 'diagnostic-total-cap'));
  const manifest = f.nodes.get(evidence + '/reader-diagnostic-summary.json').data;
  assert.ok(report.retained_payload_bytes_excluding_manifest + manifest.length <= LIMITS.artifactBytes);
  assert.ok(report.attachments.every(row => row.bytes <= LIMITS.pngBytes));
});

test('help and selected PNG export still share the unchanged105second deadline', async () => {
  const f = fixture(), run = f.run; let now = 0;
  const report = await captureDiagnostics(f.env, { io: f.io, nonce: () => exportToken, clock: () => now,
    run: async (binary, args, options) => { const result = await run(binary, args, options); now += options.timeoutMs; return result; } });
  assert.equal(report.failure_attachments, 'bounded-selected-failed-case-PNGs-captured'); assert.ok(now <= 104000);
  assert.equal(f.calls.length, 2); assert.equal(f.calls[1].options.timeoutMs, 45000);
});
test('cached-read time does not reset the deadline or enable a late PNG export', async () => {
  const f = fixture(), run = f.run; let now = 0, clocks = 0;
  const report = await captureDiagnostics(f.env, { io: f.io, nonce: () => exportToken,
    clock: () => { if (++clocks === 2) now = 103000; return now; },
    run: async (binary, args, options) => { const result = await run(binary, args, options); now += options.timeoutMs; return result; } });
  assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].args[1], 'help');
  assert.ok(report.errors.some(row => row.includes('budget exhausted'))); assert.ok(now <= 104000);
});

test('live monitor inspects exported disk before attachment selection', () => {
  const f = fixture(), dir = evidence + '/reader-diagnostic-export-' + exportToken;
  f.add(dir, '', 'directory'); f.add(dir + '/huge.txt', '', 'file', LIMITS.exportedBytes + 1);
  assert.throws(() => inspectExport(dir, f.io), /disk limit/);
});
test('command adapter overflow cannot write or promote a primary failure', async () => {
  const f = fixture(); const report = await f.capture(async () => healthy(Buffer.alloc(LIMITS.helpBytes + 1)));
  assert.equal(report.status, 'partial'); assert.equal(report.commands.length, 0); assert.equal(report.primary_acceptance_modified, false);
});

function fakeChild() {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.pid = 12345;
  return child;
}
test('bounded child stdout and stderr share one cap and overflow kills the owned group', async () => {
  const child = fakeChild(), killed = [];
  const resultPromise = runBounded('fake-only', [], { timeoutMs: 100, maxBytes: 8 }, {
    spawn: () => { queueMicrotask(() => { child.stdout.emit('data', Buffer.from('123456')); child.stderr.emit('data', Buffer.from('abcdef')); }); return child; },
    killGroup: pid => { killed.push(pid); queueMicrotask(() => child.emit('close', null, 'SIGKILL')); }
  });
  const result = await resultPromise;
  assert.equal(result.error, 'output-limit'); assert.equal(result.retained_output_bytes, 8); assert.equal(result.observed_output_bytes, 12);
  assert.deepEqual(killed, [12345]); assert.equal(result.stdout.length + result.stderr.length, 8);
});
test('bounded fake child timeout kills the process group; no real child executes', async () => {
  const child = fakeChild(), killed = [];
  const result = await runBounded('fake-only', [], { timeoutMs: 5, maxBytes: 8 }, {
    spawn: () => child, killGroup: pid => { killed.push(pid); queueMicrotask(() => child.emit('close', null, 'SIGKILL')); }
  });
  assert.equal(result.error, 'timeout'); assert.deepEqual(killed, [12345]);
});
test('a live export monitor violation kills its fake child group', async () => {
  const child = fakeChild(); let observations = 0, killed = 0;
  const result = await runBounded('fake-only', [], { timeoutMs: 500, maxBytes: 8,
    monitor: () => { if (++observations > 1) throw new Error('disk limit'); } }, {
    spawn: () => child, killGroup: () => { killed++; queueMicrotask(() => child.emit('close', null, 'SIGKILL')); }
  });
  assert.equal(killed, 1); assert.ok(observations >= 2); assert.match(result.error, /export-limit: disk limit/);
});
test('successful kill request without close is not confirmed termination', async () => {
  const child = fakeChild(); let killed = 0, detached = 0;
  child.unref = () => { detached++; }; child.stdout.destroy = child.stderr.destroy = () => {};
  const result = await runBounded('fake-only', [], { timeoutMs: 5, maxBytes: 8 }, {
    spawn: () => child, killGroup: () => { killed++; }
  });
  assert.equal(killed, 1); assert.equal(detached, 1); assert.equal(result.error, 'timeout');
  assert.equal(result.group_kill_error, null); assert.equal(result.termination_confirmed, false);
});
for (const phase of ['help', 'export']) test('unobserved close prevents further commands and temp deletion: ' + phase, async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === phase
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: 'timeout', termination_confirmed: false } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(report.primary_acceptance_modified, false);
  if (phase === 'help') assert.ok(!f.calls.some(call => call.args[1] === 'export'));
  else { assert.equal(f.removals.length, 0); assert.ok(f.nodes.has(evidence + '/reader-diagnostic-export-' + exportToken)); }
});
test('missing termination confirmation is partial and prevents PNG export', async () => {
  const f = fixture(); const report = await f.capture(async () => { const value = healthy(JSON.stringify(f.current)); delete value.termination_confirmed; return value; });
  assert.equal(report.status, 'partial'); assert.equal(report.commands.length, 1);
  assert.equal(report.commands[0].termination_confirmed, false);
});
test('unconfirmed group kill remains partial and closes local handles within a finite grace', async () => {
  const child = fakeChild(); let detached = 0, streams = 0;
  child.unref = () => { detached++; }; child.stdout.destroy = child.stderr.destroy = () => { streams++; };
  const result = await runBounded('fake-only', [], { timeoutMs: 5, maxBytes: 8 }, {
    spawn: () => child, killGroup: () => { throw new Error('unconfirmed-kill'); }
  });
  assert.equal(result.error, 'timeout'); assert.equal(result.group_kill_error, 'unconfirmed-kill');
  assert.equal(detached, 1); assert.equal(streams, 2);
});
test('unconfirmed child termination prevents further commands and preserves the live export tree', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'help'
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: 'timeout', group_kill_error: 'unconfirmed' } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 0);
  assert.ok(!f.calls.some(call => call.args[1] === 'export'));
});
test('bounded healthy fake child closes successfully and live export monitor stops unsafe output', async () => {
  const child = fakeChild();
  const result = await runBounded('fake-only', [], { timeoutMs: 100, maxBytes: 8 }, {
    spawn: () => { queueMicrotask(() => { child.stdout.emit('data', 'ok'); child.emit('close', 0, null); }); return child; },
    killGroup: () => assert.fail('Healthy fake must not be killed')
  });
  assert.equal(result.error, null); assert.equal(result.status, 0); assert.equal(result.stdout.toString(), 'ok');
  let spawns = 0;
  const rejected = await runBounded('fake-only', [], { timeoutMs: 100, maxBytes: 8, monitor: () => { throw new Error('disk limit'); } },
    { spawn: () => { spawns++; return fakeChild(); } });
  assert.equal(spawns, 0); assert.match(rejected.error, /disk limit/);
});

test('workflow places cached PNG diagnostics after primary results without gating on Passed audit success', () => {
  const text = readFileSync(new URL('../../.github/workflows/ios-sdk27-compatibility.yml', import.meta.url), 'utf8');
  const runtime = text.slice(text.indexOf('  ios-runtime27-smoke:'));
  assert.match(runtime, /timeout-minutes: 40/);
  assert.match(runtime, /name: Run only the existing two native UI smoke cases\n        timeout-minutes: 12/);
  assert.match(runtime, /name: Create and boot this job's dedicated Simulator\n        timeout-minutes: 6/);
  assert.match(runtime, /\['bootstatus', uuid, '-b'\], 240000/);
  assert.ok(runtime.indexOf('id: ui') < runtime.indexOf('id: cleanup'));
  assert.ok(runtime.indexOf('id: cleanup') < runtime.indexOf('id: app'));
  assert.ok(runtime.indexOf('id: app') < runtime.indexOf('id: results'));
  assert.ok(runtime.indexOf('id: results') < runtime.indexOf('id: reader_diagnostics'));
  assert.ok(runtime.indexOf('id: reader_diagnostics') < runtime.indexOf('      - name: Record completion'));
  const diagnostic = runtime.slice(runtime.indexOf('      - name: Capture bounded failure PNGs'), runtime.indexOf('      - name: Record completion'));
  assert.match(diagnostic, /id: reader_diagnostics\n        timeout-minutes: 2\n        continue-on-error: true/);
  assert.match(diagnostic, /if: always\(\) && !cancelled\(\) && steps\.ui\.outcome != 'skipped' && steps\.evidence\.outcome == 'success'/);
  assert.ok(!diagnostic.includes('steps.results.outcome'));
  assert.match(runtime, /Failed or skipped parents are not acceptance/);
  assert.match(runtime, /assert\.equal\(tests\.length, 2,/);
  assert.match(runtime, /const budget = 16 \* 1024 \* 1024, reserved = 128 \* 1024, rawCap = 256 \* 1024, metadataCap = 1024 \* 1024/);
  assert.match(runtime, /const diagnosticCap = 4 \* 1024 \* 1024/);
  assert.match(runtime, /omitted-binary-result-directory/);
  assert.match(runtime, /assert\.deepEqual\(rejected, \[\]/);
});
