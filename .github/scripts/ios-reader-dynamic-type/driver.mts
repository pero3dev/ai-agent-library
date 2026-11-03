import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { selectUITestTarget } from '../../../ios/tests/xctestrun-metadata.mjs';
import { readSimctlInventory } from '../../../ios/tests/simctl-inventory-read.mjs';

const stage = process.argv[2] as keyof typeof caps;
const caps = { inventory: 180000, tools: 180000, content: 180000, simulator: 300000,
  build: 360000, ui: 720000, cleanup: 150000, audit: 45000, summary: 10000, storage: 15000 };
assert.ok(Object.hasOwn(caps, stage));
const deadline = performance.now() + caps[stage];
const workspace = fs.realpathSync(process.env.GITHUB_WORKSPACE!);
const root = path.join(workspace, '.local/ios-reader-dynamic-type');
const evidence = path.join(root, 'evidence');
assert.equal(fs.realpathSync(root), root); assert.equal(fs.realpathSync(evidence), evidence);
const derived = path.join(root, 'DerivedData');
const products = path.join(derived, 'Build/Products');
const app = path.join(products, 'Debug-iphonesimulator/AILibrary.app');
const expected = process.env.EXPECTED_SOURCE_HEAD!;
const selector = 'AILibraryUITests/ReaderReflowUITests/testFixtureMeasuredRowAndBookmarkSurviveDynamicTypeRelaunches';
const bundleID = 'dev.pero3.aiagentlibrary.prototype';
const uuidPattern = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;
const hash = (value: import('node:crypto').BinaryLike) => createHash('sha256').update(value).digest('hex');
const put = (name: string, value: string | Uint8Array) => {
  assert.match(name, /^[a-z0-9.-]+$/);
  assert.ok(Buffer.byteLength(value) <= 16 * 1024 * 1024);
  fs.writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 });
};
const json = (name: string, value: unknown) => {
  const encoded = JSON.stringify(value, null, 2) + '\n';
  assert.ok(Buffer.byteLength(encoded) <= 131072, 'Compact JSON receipt cap');
  put(name, encoded);
};
const read = (name: string) => record(JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8')) as unknown);

function run(name: string, binary: string, args: string[], limit = 30000, cwd = workspace, strict = true) {
  const remaining = Math.floor(deadline - performance.now());
  const timeout = Math.min(limit, Math.max(0, remaining));
  json(name + '.intent.json', { stage, binary, arguments: args, timeout_ms: timeout,
    stage_deadline_monotonic_ms: deadline, remaining_ms: remaining,
    max_buffer_bytes: 8 * 1024 * 1024, spawn_planned: timeout > 0 });
  let result: { status: number | null; signal: NodeJS.Signals | null; error?: Error; stdout?: string; stderr?: string };
  if (timeout <= 0) result = { status: null, signal: null, error: Error('Stage budget exhausted') };
  else result = spawnSync(binary, args, { cwd, env: process.env, timeout,
    killSignal: 'SIGKILL', maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' });
  put(name + '.stdout.log', result.stdout ?? ''); put(name + '.stderr.log', result.stderr ?? '');
  const receipt = { exit_code: result.status, signal: result.signal, error: result.error?.message ?? null };
  json(name + '.exit.json', receipt);
  if (strict) { assert.equal(receipt.error, null, name); assert.equal(result.signal, null, name); assert.equal(result.status, 0, name); }
  return { ...receipt, stdout: result.stdout ?? '' };
}

function listInventory(name: string, args: string[]) {
  const accepted = readSimctlInventory(name, args,
    attempt => run(attempt, 'xcrun', args, 60000, workspace, false));
  json(name + '.accepted.json', { source_head: expected, name, attempt: accepted.attempt,
    arguments: args, stdout_sha256: hash(accepted.stdout) });
  return accepted.stdout;
}

function acceptedBeforeCreate() {
  const name = 'devices-before-create', args = ['simctl', 'list', 'devices', '--json'];
  const accepted = read(name + '.accepted.json');
  assert.equal(accepted.source_head, expected); assert.equal(accepted.name, name);
  assert.ok([name, name + '-timeout-retry-1'].includes(accepted.attempt as string));
  assert.deepEqual(accepted.arguments, args);
  const validateIntent = (attempt: string) => {
    const issued = read(attempt + '.intent.json');
    assert.equal(issued.stage, 'simulator'); assert.equal(issued.binary, 'xcrun');
    assert.deepEqual(issued.arguments, args);
    assert.ok(Number.isInteger((issued.timeout_ms as number)) && (issued.timeout_ms as number) > 0 && (issued.timeout_ms as number) <= 60000);
    assert.ok(Number.isInteger((issued.remaining_ms as number)) && (issued.remaining_ms as number) >= (issued.timeout_ms as number));
    assert.ok(Number.isFinite((issued.stage_deadline_monotonic_ms as number)) && (issued.stage_deadline_monotonic_ms as number) > 0);
  };
  validateIntent(string(accepted.attempt));
  const successful = read(accepted.attempt + '.exit.json');
  assert.equal(successful.error, null); assert.equal(successful.signal, null); assert.equal(successful.exit_code, 0);
  if (accepted.attempt !== name) {
    validateIntent(name); const first = read(name + '.exit.json');
    assert.equal(first.exit_code, null); assert.equal(first.signal, 'SIGKILL');
    assert.equal(first.error, 'spawnSync xcrun ETIMEDOUT');
  }
  const full = path.join(evidence, accepted.attempt + '.stdout.log'), stat = fs.lstatSync(full);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 8 * 1024 * 1024);
  const raw = fs.readFileSync(full); assert.match(accepted.stdout_sha256 as string, /^[a-f0-9]{64}$/);
  assert.equal(hash(raw), accepted.stdout_sha256); return raw.toString('utf8');
}

function sourceHashes() {
  const files = ["ios/AILibrary/Sources/AILibraryApp.swift","ios/AILibrary/Sources/NativeReaderView.swift","ios/AILibraryUITests/ReaderReflowUITests.swift","ios/AILibraryUITests/NativeReaderUITests.swift","ios/AILibraryUITests/PublishedReaderUITests.swift","ios/AILibrary.xcodeproj/project.pbxproj","ios/fixtures/native-reader.md","ios/tests/xctestrun-metadata.mjs","ios/tests/simctl-inventory-read.mjs",".github/workflows/ios-reader-dynamic-type.yml","package-lock.json","ios/tools/package-lock.json","ios/tests/xctestrun-metadata.mts","ios/tests/simctl-inventory-read.mts",".github/scripts/ios-reader-dynamic-type/driver.mts"];
  return Object.fromEntries(files.map(file => {
    const full = path.join(workspace, file), stat = fs.lstatSync(full);
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1024 * 1024);
    return [file, hash(fs.readFileSync(full))];
  }));
}

function sameSource() {
  const selection = read('selection.json');
  assert.equal(selection.source_head, expected);
  assert.deepEqual(sourceHashes(), selection.source_sha256);
  return selection;
}

function allDevices(value: Record<string, unknown>) {
  assert.ok(value.devices && typeof value.devices === 'object' && !Array.isArray(value.devices));
  return Object.entries(value.devices).flatMap(([runtime, rows]) => {
    assert.ok(Array.isArray(rows));
    return records(rows).map(device => { assert.match(string(device.udid).toUpperCase(), uuidPattern); return { runtime, device }; });
  });
}

function owned() {
  const intent = read('owned-simulator-intent.json');
  assert.equal(intent.repository, 'pero3dev/ai-agent-library'); assert.equal(intent.source_head, expected);
  assert.equal(intent.run_id, process.env.GITHUB_RUN_ID); assert.equal(intent.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
  assert.match(intent.token as string, /^[a-f0-9-]{36}$/);
  assert.equal(intent.name, `AILibrary-reader-dynamic-type-${intent.run_id}-${intent.run_attempt}-${intent.token}`);
  const creation = read('create-simulator.exit.json'), args = read('create-simulator.intent.json').arguments;
  assert.equal(creation.exit_code, 0); assert.equal(creation.error, null); assert.equal(creation.signal, null);
  assert.deepEqual(args, ['simctl', 'create', intent.name, intent.device_type_identifier, intent.runtime_identifier]);
  const UUID = fs.readFileSync(path.join(evidence, 'create-simulator.stdout.log'), 'utf8').trim().toUpperCase();
  assert.match(UUID, uuidPattern); assert.ok(!strings(intent.preexisting_UUIDs).includes(UUID));
  const before = allDevices(record(JSON.parse(acceptedBeforeCreate()) as unknown));
  assert.ok(before.every(row => string(row.device.udid).toUpperCase() !== UUID));
  const selection = read('selection.json');
  assert.equal(intent.runtime_identifier, string(record(selection.runtime).identifier));
  assert.equal(intent.device_type_identifier, string(record(selection.device_type).identifier));
  assertOwner(intent);
  return { ...intent, UUID };
}

function boundedTree(directory: string, maxBytes = 256 * 1024 * 1024) {
  assert.equal(fs.realpathSync(directory), directory);
  let bytes = 0, entries = 0;
  function walk(current: string): void {
    for (const name of fs.readdirSync(current)) {
      assert.ok(++entries <= 8192, 'Evidence entry cap');
      const full = path.join(current, name), stat = fs.lstatSync(full);
      assert.ok(!stat.isSymbolicLink(), 'Evidence must not follow symbolic links');
      if (stat.isDirectory()) walk(full);
      else { assert.ok(stat.isFile()); bytes += stat.size; assert.ok(bytes <= maxBytes, 'Evidence byte cap'); }
    }
  }
  walk(directory); return { bytes, entries, max_bytes: maxBytes, max_entries: 8192 };
}

function inventory() {
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.ok(['workflow_dispatch', 'pull_request'].includes(process.env.GITHUB_EVENT_NAME!));
  assert.equal(process.env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library');
  const event = record(JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as unknown);
  assert.equal(record(event.repository).full_name, 'pero3dev/ai-agent-library'); assert.equal(record(event.repository).private, false);
  assert.match(expected, /^[a-f0-9]{40}$/); assert.match(process.env.GITHUB_SHA!, /^[a-f0-9]{40}$/);
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    assert.equal(record(record(record(event.pull_request)?.head)?.repo)?.full_name, 'pero3dev/ai-agent-library');
    assert.equal(record(record(record(event.pull_request)?.base)?.repo)?.full_name, 'pero3dev/ai-agent-library');
    assert.match(record(record(event.pull_request).head).sha as string, /^[a-f0-9]{40}$/);
    assert.equal(expected, record(record(event.pull_request).head).sha);
  } else {
    assert.equal(expected, process.env.GITHUB_SHA);
  }
  assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_16.4.app/Contents/Developer');
  assert.ok(fs.existsSync(process.env.DEVELOPER_DIR!));
  const output = (name: string, binary: string, args: string[]) => run(name, binary, args).stdout.trim();
  const head = output('source-head', 'git', ['rev-parse', 'HEAD']); assert.equal(head, expected);
  const tree = output('source-tree', 'git', ['rev-parse', 'HEAD^{tree}']); assert.match(tree, /^[a-f0-9]{40}$/);
  const macOS = output('macos', 'sw_vers', ['-productVersion']); assert.equal(macOS.split('.')[0], '15');
  const architecture = output('architecture', 'uname', ['-m']); assert.ok(['arm64', 'x86_64'].includes(architecture));
  const Xcode = output('xcode', 'xcodebuild', ['-version']); assert.match(Xcode, /^Xcode 16\.4\nBuild version [A-Za-z0-9]+$/);
  const SDK = output('sdk', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']); assert.equal(SDK, '18.5');
  const runtimes = record(JSON.parse(listInventory('runtimes', ['simctl', 'list', 'runtimes', '--json']).trim()) as unknown).runtimes;
  const types = record(JSON.parse(listInventory('device-types', ['simctl', 'list', 'devicetypes', '--json']).trim()) as unknown).devicetypes;
  assert.ok(Array.isArray(runtimes)); assert.ok(Array.isArray(types));
  const runtime = records(runtimes).filter(row => row.version === '18.5' && row.name === 'iOS 18.5' && row.isAvailable === true);
  const phone = records(types).filter(row => row.name === 'iPhone 16'); assert.equal(runtime.length, 1); assert.equal(phone.length, 1);
  assert.equal(runtime[0].identifier, 'com.apple.CoreSimulator.SimRuntime.iOS-18-5');
  assert.equal(phone[0].identifier, 'com.apple.CoreSimulator.SimDeviceType.iPhone-16');
  const source = fs.readFileSync(path.join(workspace, 'ios/AILibraryUITests/ReaderReflowUITests.swift'), 'utf8');
  assert.deepEqual([...source.matchAll(/\bfunc\s+(test\w+)\s*\(/g)].map(match => match[1]),
    ['testFixtureMeasuredRowAndBookmarkSurviveRotatedRelaunchAndLiveReturn', 'testFixtureMeasuredRowAndBookmarkSurviveDynamicTypeRelaunches', 'testValidPackageRevisionAndParagraphReflowPreserveReadingAndBookmark']);
  json('selection.json', { source_head: head, source_tree: tree, source_sha256: sourceHashes(), selector,
    event_name: process.env.GITHUB_EVENT_NAME, event_commit: process.env.GITHUB_SHA!,
    repository: process.env.GITHUB_REPOSITORY, runner: 'macos-15', macOS, architecture, Xcode, SDK,
    runtime: runtime[0], device_type: phone[0], font_scope: 'DEBUG UUID-suite app override, large to accessibility5 to large across relaunch; system Settings unchanged' });
}

function tools() {
  sameSource();
  run('root-audit', 'npm', ['audit', '--package-lock-only', '--audit-level=high'], 60000);
  run('root-install', 'npm', ['ci', '--ignore-scripts'], 60000);
  const assets = path.join(workspace, 'ios/tools');
  run('assets-audit', 'npm', ['audit', '--package-lock-only', '--audit-level=high'], 60000, assets);
  run('assets-install', 'npm', ['ci', '--ignore-scripts'], 60000, assets);
  run('browser-install', './node_modules/.bin/playwright', ['install', 'chromium'], 120000, assets);
  sameSource();
}

function content() {
  sameSource();
  for (const [name, args] of [['representative-generation', ['scripts/build-ios-native-content.mjs']],
    ['fixture-generation', ['scripts/build-ios-native-content.mjs', '--fixtures']],
    ['representative-audit', ['ios/tests/native-content-audit.mjs']],
    ['fixture-audit', ['ios/tests/native-content-audit.mjs', '--fixtures']]] as [string, string[]][]) run(name, 'node', args, 120000);
  run('representative-package', 'bash', ['ios/tests/check-package.sh', 'ios/AILibrary/Content', '3'], 120000);
  run('fixture-package', 'bash', ['ios/tests/check-package.sh', 'ios/AILibrary/TestContent', '4'], 120000);
  sameSource();
}

function simulator() {
  const selection = sameSource();
  const before = allDevices(record(JSON.parse(listInventory('devices-before-create', ['simctl', 'list', 'devices', '--json'])) as unknown));
  const preexisting = before.map(row => string(row.device.udid).toUpperCase()); assert.equal(new Set(preexisting).size, preexisting.length);
  const token = randomUUID(), name = `AILibrary-reader-dynamic-type-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}-${token}`;
  json('owned-simulator-intent.json', { repository: process.env.GITHUB_REPOSITORY, source_head: expected,
    run_id: process.env.GITHUB_RUN_ID!, run_attempt: process.env.GITHUB_RUN_ATTEMPT!, token, name,
    runtime_identifier: string(record(selection.runtime).identifier), device_type_identifier: string(record(selection.device_type).identifier), preexisting_UUIDs: preexisting });
  run('create-simulator', 'xcrun', ['simctl', 'create', name, string(record(selection.device_type).identifier), string(record(selection.runtime).identifier)], 30000);
  const owner = owned(); json('owned-simulator.json', owner);
  run('boot-simulator', 'xcrun', ['simctl', 'boot', owner.UUID], 30000);
  run('bootstatus-simulator', 'xcrun', ['simctl', 'bootstatus', owner.UUID, '-b'], 120000);
  const current = allDevices(record(JSON.parse(listInventory('devices-after-boot', ['simctl', 'list', 'devices', '--json'])) as unknown))
    .filter(row => string(row.device.udid).toUpperCase() === owner.UUID);
  assert.equal(current.length, 1); assert.equal(current[0].device.name, owner.name);
  assert.equal(current[0].runtime, owner.runtime_identifier); assert.equal(current[0].device.state, 'Booted');
  assert.equal(current[0].device.isAvailable, true);
}

function build() {
  sameSource(); const owner = owned(); assert.ok(!fs.existsSync(derived));
  run('build-for-testing', 'xcodebuild', ['-project', 'ios/AILibrary.xcodeproj', '-scheme', 'AILibrary',
    '-configuration', 'Debug', '-destination', `platform=iOS Simulator,id=${owner.UUID}`, '-destination-timeout', '60',
    '-derivedDataPath', derived, '-parallel-testing-enabled', 'NO', '-jobs', '2',
    '-only-testing:' + selector, 'CODE_SIGNING_ALLOWED=NO', 'build-for-testing'], 300000);
  const candidates = fs.readdirSync(products).filter(file => file.endsWith('.xctestrun')); assert.equal(candidates.length, 1);
  const xctestrun = path.join(products, candidates[0]); assert.equal(fs.realpathSync(xctestrun), xctestrun);
  assert.ok(fs.lstatSync(xctestrun).isFile() && fs.statSync(xctestrun).size <= 4 * 1024 * 1024);
  const metadata = record(JSON.parse(run('xctestrun-metadata', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', xctestrun]).stdout) as unknown);
  const info = record(JSON.parse(run('built-app-info', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', path.join(app, 'Info.plist')]).stdout) as unknown);
  const { formatVersion, target } = selectUITestTarget(metadata, { expectedBlueprintName: 'AILibraryUITests',
    expectedBundleIdentifier: bundleID, actualAppBundleIdentifier: info.CFBundleIdentifier });
  assert.equal(fs.realpathSync(string(target.UITargetAppPath).replace('__TESTROOT__', products)), app);
  for (const [folder, count] of [['Content', '3'], ['TestContent', '4']]) {
    const expectedManifest = fs.readFileSync(path.join(workspace, 'ios/AILibrary', folder, 'manifest.json'));
    assert.ok(fs.readFileSync(path.join(app, folder, 'manifest.json')).equals(expectedManifest));
    run('built-' + folder.toLowerCase() + '-audit', 'bash', ['ios/tests/check-package.sh', path.join(app, folder), count], 120000);
  }
  sameSource();
  json('build.json', { source_head: expected, UUID: owner.UUID, app, xctestrun,
    xctestrun_sha256: hash(fs.readFileSync(xctestrun)), xctestrun_format_version: formatVersion, selector, bundle_id: bundleID });
}

function ui() {
  sameSource(); const owner = owned(), built = read('build.json');
  assert.equal(built.source_head, expected); assert.equal(built.UUID, owner.UUID); assert.equal(built.selector, selector);
  assert.equal(fs.realpathSync(string(built.xctestrun)), string(built.xctestrun)); assert.equal(path.dirname(string(built.xctestrun)), products);
  assert.equal(hash(fs.readFileSync(string(built.xctestrun))), built.xctestrun_sha256);
  const result = run('dynamic-type-ui', 'xcodebuild', ['-xctestrun', string(built.xctestrun),
    '-destination', `platform=iOS Simulator,id=${owner.UUID}`, '-destination-timeout', '60',
    '-resultBundlePath', path.join(evidence, 'ui.xcresult'), '-parallel-testing-enabled', 'NO', '-jobs', '2',
    '-only-testing:' + selector, 'CODE_SIGNING_ALLOWED=NO', 'test-without-building'], 720000, workspace, false);
  json('execution.json', { source_head: expected, UUID: owner.UUID, OS: '18.5', selector, ...result, stdout: undefined });
  assert.equal(result.exit_code, 0); assert.equal(result.signal, null); assert.equal(result.error, null);
  sameSource(); json('evidence-size-after-ui.json', boundedTree(evidence));
}

// BEGIN PURE STRICT RESULT GATE
function auditTree(tree: Record<string, unknown>, selector: string, UUID: string) {
  const [bundle, suite, method, extra] = selector.split('/');
  assert.equal(bundle, 'AILibraryUITests'); assert.equal(suite, 'ReaderReflowUITests');
  assert.equal(method, 'testFixtureMeasuredRowAndBookmarkSurviveDynamicTypeRelaunches'); assert.equal(extra, undefined);
  function container(node: Record<string, unknown>, type: string, name: string) {
    assert.ok(node && typeof node === 'object' && !Array.isArray(node));
    assert.equal(node.nodeType, type); assert.equal(node.name, name); assert.equal(node.result, 'Passed');
    assert.ok(Array.isArray(node.children)); assert.equal(node.children.length, 1);
    return records(node.children);
  }
  assert.ok(Array.isArray(tree.testNodes)); assert.equal(tree.testNodes.length, 1);
  const bundles = container(record(tree.testNodes[0]), 'Test Plan', 'AILibrary');
  const suites = container(bundles[0], 'UI test bundle', bundle);
  const bundleURL = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
  assert.equal(bundles[0].nodeIdentifierURL, bundleURL);
  const leaves = container(suites[0], 'Test Suite', suite); assert.equal(suites[0].nodeIdentifierURL, bundleURL + '/' + suite);
  const leaf = leaves[0]; assert.ok(leaf && typeof leaf === 'object' && !Array.isArray(leaf));
  assert.equal(leaf.nodeType, 'Test Case'); assert.equal(leaf.result, 'Passed'); assert.equal(leaf.children, undefined);
  assert.equal(leaf.name, method + '()'); assert.equal(leaf.nodeIdentifier, suite + '/' + method + '()');
  assert.equal(leaf.nodeIdentifierURL, bundleURL + '/' + suite + '/' + method);
  assert.ok(Array.isArray(tree.devices)); assert.equal(tree.devices.length, 1);
  const device = record(tree.devices[0]); assert.equal(string(device.deviceId).toUpperCase(), UUID); assert.equal(device.osVersion, '18.5');
  assert.equal(device.platform, 'iOS Simulator'); if (device.modelName !== undefined) assert.equal(device.modelName, 'iPhone 16');
  return { id: leaf.nodeIdentifier, result: leaf.result, device };
}
// END PURE STRICT RESULT GATE

function cleanup() {
  const report: {source_head: string; status: string; UUID: string | null; error: string | null} = { source_head: expected, status: 'not-completed', UUID: null, error: null };
  try {
    if (!fs.existsSync(path.join(evidence, 'owned-simulator-intent.json'))) { report.status = 'not-created'; return; }
    const owner = owned(); report.UUID = owner.UUID;
    const current = allDevices(record(JSON.parse(run('cleanup-before', 'xcrun', ['simctl', 'list', 'devices', '--json']).stdout) as unknown))
      .filter(row => string(row.device.udid).toUpperCase() === owner.UUID);
    assert.ok(current.length <= 1);
    if (!current.length) { report.status = 'already-absent'; return; }
    assert.equal(current[0].runtime, owner.runtime_identifier); assert.equal(current[0].device.name, owner.name);
    if (current[0].device.deviceTypeIdentifier !== undefined) assert.equal(current[0].device.deviceTypeIdentifier, owner.device_type_identifier);
    if (current[0].device.state !== 'Shutdown') run('cleanup-shutdown', 'xcrun', ['simctl', 'shutdown', owner.UUID], 30000);
    run('cleanup-delete', 'xcrun', ['simctl', 'delete', owner.UUID], 60000);
    const after = allDevices(record(JSON.parse(run('cleanup-after', 'xcrun', ['simctl', 'list', 'devices', '--json']).stdout) as unknown));
    assert.ok(after.every(row => string(row.device.udid).toUpperCase() !== owner.UUID)); report.status = 'owned-simulator-deleted';
  } catch (error) { report.error = String(error); throw error; }
  finally { json('cleanup.json', report); }
}

function audit() {
  sameSource(); const owner = owned(), execution = read('execution.json');
  assert.equal(execution.source_head, expected); assert.equal(execution.UUID, owner.UUID); assert.equal(execution.OS, '18.5');
  assert.equal(execution.selector, selector); assert.equal(execution.exit_code, 0); assert.equal(execution.error, null); assert.equal(execution.signal, null);
  const tree = record(JSON.parse(run('raw-ui-tests', 'xcrun', ['xcresulttool', 'get', 'test-results', 'tests',
    '--path', path.join(evidence, 'ui.xcresult')]).stdout) as unknown);
  const test = auditTree(tree, selector, owner.UUID);
  json('acceptance.json', { source_head: expected, status: 'exact-one-dynamic-type-relaunch-case-passed',
    selector, test, source_sha256: sourceHashes(), exclusions: ['live in-process font change', 'system text-size setting transition', 'real package revision transition',
      'glyph accuracy', 'VoiceOver', 'physical device', 'other article or runtime acceptance'] });
  json('evidence-size-audited.json', boundedTree(evidence));
}

function summary() {
  const outcomes = Object.fromEntries(['INVENTORY', 'TOOLS', 'CONTENT', 'SIMULATOR', 'BUILD', 'UI', 'CLEANUP', 'AUDIT']
    .map(name => [name.toLowerCase(), process.env[name + '_OUTCOME']]));
  let error: string | null = null;
  try {
    assert.ok(Object.values(outcomes).every(value => value === 'success'));
    assert.equal(read('acceptance.json').status, 'exact-one-dynamic-type-relaunch-case-passed');
    assert.ok(['owned-simulator-deleted', 'already-absent'].includes(read('cleanup.json').status as string));
    boundedTree(evidence);
  } catch (failure) { error = String(failure); }
  json('summary.json', { source_head: expected, status: error === null ? 'isolated-dynamic-type-ui-passed' : 'not-completed',
    selector, outcomes, error, acceptance_scope: 'One fixture R25/bookmark through DEBUG app-local large to accessibility5 to large relaunches only' });
  assert.equal(error, null);
}

function storage() { json('evidence-size-final.json', boundedTree(evidence)); }

({ inventory, tools, content, simulator, build, ui, cleanup, audit, summary, storage })[stage]();

// JSON receipts and process output remain untrusted until their consumed fields are checked.
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON object');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  assert.equal(typeof value, 'string', 'Expected string field');
  return value as string;
}
function records(value: unknown): Record<string, unknown>[] {
  assert.ok(Array.isArray(value), 'Expected JSON array');
  return (value as unknown[]).map(record);
}

type Owner = { repository: string; source_head: string; run_id: string; run_attempt: string;
  token: string; name: string; runtime_identifier: string; device_type_identifier: string;
  preexisting_UUIDs: string[] };
function assertOwner(value: Record<string, unknown>): asserts value is Record<string, unknown> & Owner {
  for (const key of ['repository','source_head','run_id','run_attempt','token','name','runtime_identifier','device_type_identifier']) string(value[key]);
  strings(value.preexisting_UUIDs);
}
function strings(value: unknown): string[] {
  assert.ok(Array.isArray(value) && (value as unknown[]).every(item => typeof item === 'string'), 'Expected string array');
  return value as string[];
}
