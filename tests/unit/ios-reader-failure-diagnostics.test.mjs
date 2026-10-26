import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { captureDiagnostics, geometrySamples, inspectExport, LIMITS, LOG_PREDICATE, runBounded,
  verifyOwner } from '../../ios/tests/capture-reader-failure-diagnostics.mjs';

const evidence = '/workspace/.local/ios-runtime27/evidence';
const uuid = '01234567-89AB-CDEF-0123-456789ABCDEF';
const token = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const exportToken = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
const runtimeID = 'com.apple.CoreSimulator.SimRuntime.iOS-27-0';
const typeID = 'com.apple.CoreSimulator.SimDeviceType.iPhone-17';
const help = 'USAGE: xcresulttool export attachments [--path <path>] [--output-path <output-path>] [--only-failures]\nOPTIONS:\n  --path <path>\n  --output-path <output-path>\n  --only-failures\n';
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
  const f = { ...memory, env, intent, selection, current, calls, primary };
  f.run = async (binary, args, options) => {
    assert.equal(binary, 'xcrun'); assert.equal(options.env, env); assert.equal(options.cwd, '/workspace');
    assert.ok(options.timeoutMs <= 45000); calls.push({ binary, args, options });
    if (args[0] === 'simctl' && args[1] === 'list') return healthy(JSON.stringify(current));
    if (args[0] === 'simctl' && args[1] === 'spawn') return healthy(logs);
    if (args[1] === 'help') return healthy(help);
    const output = args[args.indexOf('--output-path') + 1];
    memory.add(output + '/failure.png', png);
    memory.add(output + '/manifest.json', '{"failuresOnly":true}');
    options.monitor(); return healthy('');
  };
  f.capture = async override => {
    const result = await captureDiagnostics(env, { io: memory.io, run: override ?? f.run, nonce: () => exportToken, clock: () => 100 });
    // The fixture may deliberately drift an owner before capture; only immutable primary results are compared here.
    for (const name of ['ui-command.exit.json', 'summary.json']) assert.deepEqual(memory.nodes.get(evidence + '/' + name).data, primary.get(evidence + '/' + name));
    return result;
  };
  return f;
}

function rewrite(f, name, change) {
  const data = JSON.parse(f.nodes.get(evidence + '/' + name).data); change(data); f.json(name, data);
}

test('known owned failure captures numeric marker geometry and only bounded failure exports', async () => {
  const f = fixture(), report = await f.capture();
  assert.equal(report.status, 'diagnostic-only-complete'); assert.equal(report.primary_ui_outcome, 'failure');
  assert.equal(report.primary_acceptance_modified, false); assert.deepEqual(report.geometry_samples, [sample]);
  assert.equal(report.geometry_samples[0].markerWindowY, 116);
  assert.deepEqual(f.calls.map(call => call.args.slice(0, 3)), [['simctl', 'list', 'devices'], ['simctl', 'spawn', uuid],
    ['xcresulttool', 'help', 'export'], ['xcresulttool', 'export', 'attachments']]);
  assert.deepEqual(f.calls[1].args, ['simctl', 'spawn', uuid, 'log', 'show', '--last', '20m', '--style', 'json', '--predicate', LOG_PREDICATE]);
  assert.equal(f.calls[1].options.timeoutMs, 45000); assert.equal(f.calls[1].options.maxBytes, 512 * 1024);
  assert.equal(f.calls[2].options.timeoutMs, 5000); assert.equal(f.calls[2].options.maxBytes, 64 * 1024);
  assert.ok(f.calls[3].args.includes('--only-failures')); assert.ok(!f.calls.flatMap(call => call.args).includes('--all'));
  assert.equal(report.attachments.length, 2); assert.equal(report.temporary_export_removed, true);
  assert.equal(f.removals.length, 1); assert.ok(f.nodes.has(evidence + '/ui.xcresult'));
  assert.ok(f.nodes.get(evidence + '/reader-diagnostic-summary.json').data.length <= 128 * 1024);
  assert.ok(report.retained_payload_bytes_excluding_manifest < 4 * 1024 * 1024);
});

test('UI success captures geometry without help or attachment export', async () => {
  const f = fixture(); f.env.UI_OUTCOME = 'success';
  const report = await f.capture(); assert.equal(report.status, 'diagnostic-only-complete');
  assert.equal(f.calls.length, 2); assert.equal(report.failure_attachments, 'not-requested-ui-succeeded');
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
  ['EVIDENCE_DIR', '/elsewhere'], ['GITHUB_WORKSPACE', '/workspace/../workspace'], ['UI_OUTCOME', 'cancelled']]) {
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
test('current UUID/name/runtime drift prevents simctl spawn', async () => {
  const f = fixture(); f.current.devices[runtimeID][0].name = 'unowned';
  assert.equal((await f.capture()).status, 'partial'); assert.equal(f.calls.length, 1);
});
test('existing diagnostic manifest is neither replaced nor extended', async () => {
  const f = fixture(); f.add(evidence + '/reader-diagnostic-summary.json', '{"old":true}');
  const report = await f.capture(); assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 0);
  assert.equal(f.nodes.get(evidence + '/reader-diagnostic-summary.json').data.toString(), '{"old":true}');
});
test('unknown numeric log schema is partial while failure attachments remain collectable', async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'spawn' ? healthy('[{"eventMessage":"other"}]') : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(report.geometry, 'partial'); assert.equal(report.attachments.length, 2);
});
test('geometry schema rejects nonfinite or extra nonnumeric fields and keeps32 samples', () => {
  assert.throws(() => geometrySamples(JSON.stringify([{ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify({ ...sample, contentHeight: null }) }])));
  assert.throws(() => geometrySamples(JSON.stringify([{ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify({ ...sample, title: 'forbidden' }) }])));
  assert.equal(geometrySamples(JSON.stringify(Array.from({ length: 100 }, () => ({ eventMessage: 'AILibraryReaderGeometry ' + JSON.stringify(sample) })))).length, 32);
});

for (const kind of ['timeout', 'output-limit']) test('bounded geometry capture failure remains partial: ' + kind, async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === 'spawn'
    ? { ...healthy('[]'), status: null, signal: 'SIGKILL', error: kind } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(report.attachments.length, 2);
  assert.equal(report.primary_ui_outcome, 'failure');
});
for (const text of ['unknown schema', help.replace(/--only-failures/g, '--all'), help.replace(/--output-path/g, '--output')]) {
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
for (const phase of ['spawn', 'export']) test('unobserved close prevents further commands and temp deletion: ' + phase, async () => {
  const f = fixture(), run = f.run;
  const report = await f.capture((binary, args, options) => args[1] === phase
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: 'timeout', termination_confirmed: false } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(report.primary_acceptance_modified, false);
  if (phase === 'spawn') assert.ok(!f.calls.some(call => call.args[1] === 'help'));
  else { assert.equal(f.removals.length, 0); assert.ok(f.nodes.has(evidence + '/reader-diagnostic-export-' + exportToken)); }
});
test('missing termination confirmation is partial and prevents Simulator spawn', async () => {
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
  const report = await f.capture((binary, args, options) => args[1] === 'spawn'
    ? { ...healthy(''), status: null, signal: 'SIGKILL', error: 'timeout', group_kill_error: 'unconfirmed' } : run(binary, args, options));
  assert.equal(report.status, 'partial'); assert.equal(f.calls.length, 1);
  assert.ok(!f.calls.some(call => call.args[1] === 'help'));
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

test('workflow keeps primary budgets and audits, then narrowly stages diagnostics under the old16MiB ceiling', () => {
  const text = readFileSync(new URL('../../.github/workflows/ios-sdk27-compatibility.yml', import.meta.url), 'utf8');
  const runtime = text.slice(text.indexOf('  ios-runtime27-smoke:'));
  assert.match(runtime, /timeout-minutes: 40/);
  assert.match(runtime, /name: Run only the existing two native UI smoke cases\n        timeout-minutes: 12/);
  assert.match(runtime, /name: Create and boot this job's dedicated Simulator\n        timeout-minutes: 6/);
  assert.match(runtime, /\['bootstatus', uuid, '-b'\], 240000/);
  assert.ok(runtime.indexOf('id: ui') < runtime.indexOf('id: reader_diagnostics'));
  assert.ok(runtime.indexOf('id: reader_diagnostics') < runtime.indexOf('id: cleanup'));
  assert.match(runtime, /id: reader_diagnostics\n        timeout-minutes: 2\n        continue-on-error: true/);
  assert.match(runtime, /Failed or skipped parents are not acceptance/);
  assert.match(runtime, /assert\.equal\(tests\.length, 2,/);
  assert.match(runtime, /const budget = 16 \* 1024 \* 1024, reserved = 128 \* 1024, rawCap = 256 \* 1024, metadataCap = 1024 \* 1024/);
  assert.match(runtime, /const diagnosticCap = 4 \* 1024 \* 1024/);
  assert.match(runtime, /Only the named diagnostic outputs may be staged/);
  assert.match(runtime, /omitted-binary-result-directory/);
  assert.match(runtime, /assert\.deepEqual\(rejected, \[\]/);
});
