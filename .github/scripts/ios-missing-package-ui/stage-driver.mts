import type { InventoryFile } from '../../../ios/tests/xctestrun-metadata.mjs';
type DiagnosticClipInput = { value: unknown; utf8Bytes: unknown; truncated: unknown };
type DiagnosticListInput = { total: unknown; omitted: unknown; items: DiagnosticClipInput[] };
type DiagnosticInput = Record<string, unknown> & { counts: Record<string, unknown>; locations: Record<string, DiagnosticClipInput>; missingPaths: DiagnosticListInput; unexpectedPaths: DiagnosticListInput };
type ContentRecord = { name: string; bytes: number; sha256: string; regular_file: boolean; filename_suite_matches: boolean; source: unknown; source_scope: string; source_omitted_reason?: string };
type ContentReport = Record<string, unknown> & { status: string; scanned_entries: number; omitted_files: number; rejected: { name: string; reason: string; code: string }[]; records: ContentRecord[]; scan_complete?: boolean; scan_truncated?: boolean };
type TreeInput = { testNodes: Record<string, unknown>[]; devices: Record<string, unknown>[] };
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { selectUITestTarget, phaseUITestRun, copyPhaseApp } from '../../../ios/tests/xctestrun-metadata.mjs';
import { compareInstalledInventory } from '../../../ios/tests/installed-inventory.mjs';

const stage = process.argv[2] as keyof typeof caps;
const caps = { inventory: 150000, simulator: 270000, build: 420000, failure: 300000, restore: 360000, audit: 90000, cleanup: 210000, summary: 15000 };
assert.ok(Object.hasOwn(caps, stage));
const deadline = performance.now() + caps[stage];
const workspace = fs.realpathSync(process.env.GITHUB_WORKSPACE as string);
const root = path.join(workspace, '.local/ios-missing-package');
const evidence = path.join(root, 'evidence');
assert.equal(fs.realpathSync(root), root); assert.equal(fs.realpathSync(evidence), evidence);
const derived = path.join(root, 'DerivedData');
const app = path.join(derived, 'Build/Products/Debug-iphonesimulator/AILibrary.app');
const bundleID = 'dev.pero3.aiagentlibrary.prototype';
const uuidPattern = /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/;
const failureSelector = 'AILibraryUITests/FailureReaderUITests/testMissingBundledArticleShowsErrorAndRetryRemainsUsable';
const restoredSelector = 'AILibraryUITests/NativeReaderUITests/testThreeArticlesHaveNativeBodyText';
const put = (name: string, value: string | NodeJS.ArrayBufferView) => { assert.match(name, /^[a-z0-9.-]+$/); fs.writeFileSync(path.join(evidence, name), value, { flag: 'wx', mode: 0o600 }); };
const json = (name: string, value: unknown) => put(name, JSON.stringify(value, null, 2) + '\n');
const read = (name: string): unknown => JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8'));
const hash = (bytes: import('node:crypto').BinaryLike) => createHash('sha256').update(bytes).digest('hex');

async function run(name: string, binary: string, args: string[], timeoutMs: number, strict = true) {
  const remaining = Math.floor(deadline - performance.now());
  const cap = Math.min(timeoutMs, Math.max(0, remaining));
  json(name + '.intent.json', { binary, arguments: args, timeout_ms: cap, stage, stage_deadline_monotonic_ms: deadline, remaining_ms: remaining, spawn_planned: cap > 0 });
  if (cap <= 0) { json(name + '.exit.json', { exit_code: null, signal: null, error: 'Stage budget exhausted', timed_out: true }); throw Error('Stage budget exhausted'); }
  const out = fs.openSync(path.join(evidence, name + '.stdout.log'), 'wx', 0o600);
  const err = fs.openSync(path.join(evidence, name + '.stderr.log'), 'wx', 0o600);
  let child: ReturnType<typeof spawn>, timer: ReturnType<typeof setTimeout> | undefined, status: number | null = null, signal: NodeJS.Signals | null = null, error: string | null = null, timedOut = false;
  try {
    await new Promise<void>(resolve => {
      try { child = spawn(binary, args, { cwd: workspace, env: process.env, stdio: ['ignore', out, err], detached: true }); }
      catch (failure) { error = String(failure); resolve(); return; }
      child.once('error', failure => { error = String(failure); resolve(); });
      child.once('close', (code, receivedSignal) => { status = code; signal = receivedSignal; resolve(); });
      timer = setTimeout(() => {
        timedOut = true;
        if (child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch (failure) { error = String(failure); } }
      }, cap);
    });
  } finally { clearTimeout(timer); fs.closeSync(out); fs.closeSync(err); }
  const result = { binary, arguments: args, timeout_ms: cap, exit_code: status, signal, error, timed_out: timedOut };
  json(name + '.exit.json', result);
  const stdout = fs.readFileSync(path.join(evidence, name + '.stdout.log'), 'utf8');
  const stderr = fs.readFileSync(path.join(evidence, name + '.stderr.log'), 'utf8');
  if (strict) { assert.equal(error, null, name); assert.equal(timedOut, false, name); assert.equal(status, 0, name); }
  return { ...result, stdout, stderr };
}

function allDevices(value: unknown) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  assert.ok((value as Record<string, unknown>).devices && typeof (value as Record<string, unknown>).devices === 'object' && !Array.isArray((value as Record<string, unknown>).devices));
  return Object.entries((value as Record<string, unknown>).devices as Record<string, unknown>).flatMap(([runtime, rows]) => {
    assert.ok(Array.isArray(rows)); return (rows as unknown[]).map(device => {
      assert.ok(device && typeof device === 'object' && !Array.isArray(device));
      assert.equal(typeof (device as Record<string, unknown>).udid, 'string');
      assert.match(((device as Record<string, unknown>).udid as string).toUpperCase(), uuidPattern);
      return { runtime, device } as { runtime: string; device: Record<string, unknown> & { udid: string } };
    });
  });
}

function owner() {
  const owned = (read('owned-simulator.json') as Record<string, unknown>), intent = (read('owned-simulator-intent.json') as Record<string, unknown>), selection = (read('selection.json') as Record<string, unknown>);
  assert.equal(intent.repository, 'pero3dev/ai-agent-library'); assert.equal(intent.source_head, process.env.EXPECTED_SOURCE_HEAD);
  assert.equal(intent.run_id, process.env.GITHUB_RUN_ID); assert.equal(intent.run_attempt, process.env.GITHUB_RUN_ATTEMPT);
  assert.match(intent.token as string, /^[a-f0-9-]{36}$/);
  assert.equal((intent.name as string), `AILibrary-load-failure-${intent.run_id}-${intent.run_attempt}-${intent.token}`);
  assert.deepEqual(owned, { ...intent, UUID: owned.UUID, creation_exit_code: 0 }); assert.match(owned.UUID as string, uuidPattern);
  assert.ok(!(intent.preexisting_UUIDs as unknown[]).includes(owned.UUID));
  assert.equal(intent.runtime_identifier, (selection.runtime as Record<string, unknown>).identifier); assert.equal(intent.device_type_identifier, (selection.device_type as Record<string, unknown>).identifier);
  return owned as Record<string, unknown> & { UUID: string };
}

function files(directory: string) {
  assert.equal(fs.realpathSync(directory), directory); const entries: InventoryFile[] = []; let total = 0;
  function walk(current: string) {
    for (const name of fs.readdirSync(current).sort()) {
      const full = path.join(current, name), stat = fs.lstatSync(full); assert.equal(stat.isSymbolicLink(), false, full);
      if (stat.isDirectory()) walk(full);
      else { assert.ok(stat.isFile(), full); total += stat.size; assert.ok(total <= 512 * 1024 * 1024); assert.ok(entries.length < 8192); entries.push({ path: path.relative(directory, full), bytes: stat.size, mode: stat.mode & 0o777, sha256: hash(fs.readFileSync(full)) }); }
    }
  }
  walk(directory); return entries;
}

function hostPackage(expected?: unknown) {
  assert.equal(fs.realpathSync(app), app); assert.ok(!fs.existsSync(path.join(app, 'TestContent')), 'Normal package only');
  const actual = files(app); if (expected) assert.deepEqual(actual, expected, 'Unexpected host app mutation'); return actual;
}

async function installed(label: string, expected: InventoryFile[]) {
  const owned = owner();
  const result = await run(label + '-app-container', 'xcrun', ['simctl', 'get_app_container', owned.UUID, bundleID, 'app'], 20000);
  const location = result.stdout.trim(); assert.ok(path.isAbsolute(location)); assert.equal(fs.realpathSync(location), location);
  const parts = location.split(path.sep); const deviceIndex = parts.indexOf('Devices');
  assert.ok(deviceIndex >= 0); assert.equal(parts[deviceIndex + 1].toUpperCase(), owned.UUID);
  assert.equal(path.basename(location), 'AILibrary.app');
  const applicationIndex = parts.lastIndexOf('Application'); assert.ok(applicationIndex > deviceIndex);
  const installationUUID = parts[applicationIndex + 1].toUpperCase(); assert.match(installationUUID, uuidPattern);
  const actual = files(location);
  const comparison = compareInstalledInventory(expected, actual);
  const snapshot = { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, label, expected, actual, comparison };
  const snapshotBytes = JSON.stringify(snapshot, null, 2) + '\n';
  if (Buffer.byteLength(snapshotBytes) > 131072) {
    json(label + '-inventory.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, status: 'not-completed', reason: 'Inventory snapshot exceeds 128 KiB limit', expected_files: expected.length, actual_files: actual.length, expected_inventory_sha256: hash(Buffer.from(JSON.stringify(expected))), actual_inventory_sha256: hash(Buffer.from(JSON.stringify(actual))), comparison_status: comparison.status, comparison_error_count: comparison.error_count });
    throw Error('Installed inventory snapshot exceeds bounded evidence limit');
  }
  put(label + '-inventory.json', snapshotBytes);
  assert.equal(comparison.status, 'matched', 'Actual installed app differs outside the observed mode transitions');
  const dataResult = await run(label + '-data-container', 'xcrun', ['simctl', 'get_app_container', owned.UUID, bundleID, 'data'], 20000);
  const data = dataResult.stdout.trim(); assert.ok(path.isAbsolute(data)); assert.equal(fs.realpathSync(data), data);
  assert.ok(data.split(path.sep).some((part, i, parts) => part === 'Devices' && parts[i + 1]?.toUpperCase() === owned.UUID));
  const pointer = path.join(data, 'Library/Application Support/LibraryContent/current.json');
  assert.equal(fs.existsSync(pointer), false, 'A saved version could mask the missing bundle');
  return { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, OS: '18.5', bundle_id: bundleID, installed_app: location, installation_UUID: installationUUID, data_container: data, current_pointer_absent: true, files: expected, files_scope: 'Expected build inventory; actual installed modes and deltas are recorded in installed_inventory_evidence', installed_inventory_evidence: label + '-inventory.json', installed_mode_deltas: comparison.mode_deltas };
}

function captureContentDiagnostics(label: string, post: Awaited<ReturnType<typeof installed>>, owned: ReturnType<typeof owner>) {
  const report: ContentReport = { schema_version: 1, source_head: process.env.EXPECTED_SOURCE_HEAD,
    UUID: owned.UUID, OS: post.OS, label, installed_app: post.installed_app,
    data_container: post.data_container, status: 'not-captured', scanned_entries: 0,
    omitted_files: 0, rejected: [], records: [], suite_binding: 'Filename and JSON testSuite; correlate launchSuite from UI stdout separately' };
  const same = (a: fs.Stats, b: fs.Stats) => a.dev === b.dev && a.ino === b.ino;
  const regular = (s: fs.Stats) => s.isFile() && !s.isSymbolicLink() && s.nlink === 1 && s.uid === process.getuid!();
  const limited = (v: unknown) => typeof v === 'string' && Buffer.byteLength(v) <= 4096;
  try {
    assert.ok(['failure', 'restored'].includes(label));
    assert.equal(post.source_head, process.env.EXPECTED_SOURCE_HEAD); assert.equal(post.UUID, owned.UUID); assert.equal(post.OS, '18.5');
    assert.ok(limited(post.data_container) && limited(post.installed_app));
    assert.equal(fs.realpathSync(post.data_container), post.data_container);
    const documents = path.join(post.data_container, 'Documents');
    report.installed_content = path.join(post.installed_app, 'Content');
    const parent = fs.lstatSync(documents);
    assert.ok(parent.isDirectory() && !parent.isSymbolicLink() && parent.uid === process.getuid!());
    assert.equal(fs.realpathSync(documents), documents); assert.equal(path.dirname(documents), post.data_container);
    const parentStillSame = () => { const now = fs.lstatSync(documents); assert.ok(now.isDirectory() && !now.isSymbolicLink() && same(parent, now)); assert.equal(fs.realpathSync(documents), documents); };
    const directory = fs.opendirSync(documents); const names = [];
    try {
      while (report.scanned_entries < 128 && performance.now() < deadline) {
        const entry = directory.readSync(); if (entry === null) { report.scan_complete = true; break; }
        report.scanned_entries++;
        if (!entry.name.startsWith('ailibrary-ui-content-') || !entry.name.endsWith('.json')) continue;
        if (names.length < 4) names.push(entry.name); else report.omitted_files++;
      }
      if (!report.scan_complete) report.scan_truncated = true;
    } finally { directory.closeSync(); }
    parentStillSame();
    for (const name of names.sort()) {
      if (performance.now() >= deadline) { report.scan_truncated = true; report.omitted_files++; continue; }
      let fd;
      try {
        const match = /^ailibrary-ui-content-(ailibrary-uitest-[A-Za-z0-9-]+)\.json$/.exec(name);
        assert.ok(match && match[1].length <= 100);
        const location = path.join(documents, name); const before = fs.lstatSync(location);
        assert.ok(regular(before) && before.size > 0 && before.size <= 8192); parentStillSame();
        fd = fs.openSync(location, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
        const opened = fs.fstatSync(fd); assert.ok(regular(opened) && same(before, opened));
        const buffer = Buffer.alloc(8193); let length = 0, count;
        while (length < buffer.length && (count = fs.readSync(fd, buffer, length, buffer.length - length, length)) > 0) length += count;
        assert.ok(length > 0 && length <= 8192 && length === opened.size);
        const after = fs.fstatSync(fd), listed = fs.lstatSync(location);
        assert.ok(regular(after) && regular(listed) && same(opened, after) && same(opened, listed));
        assert.equal(after.size, opened.size); assert.equal(after.mtimeMs, opened.mtimeMs); assert.equal(after.ctimeMs, opened.ctimeMs); parentStillSame();
        const bytes = buffer.subarray(0, length), text = bytes.toString('utf8');
        assert.ok(Buffer.from(text, 'utf8').equals(bytes));
        const value = JSON.parse(text) as DiagnosticInput; assert.ok(value && typeof value === 'object' && !Array.isArray(value));
        assert.equal(value.schemaVersion, 1); assert.equal(value.testSuite, match[1]);
        assert.ok(Number.isSafeInteger(value.pid) && (value.pid as number) > 0);
        assert.ok(Number.isFinite(value.capturedAtUnixSeconds) && (value.capturedAtUnixSeconds as number) > 0);
        assert.match(value.manifestSHA256 as string, /^[a-f0-9]{64}$/); assert.equal(typeof value.manifestSelfEntry, 'boolean');
        assert.equal(typeof value.pathListsOmittedForByteCap, 'boolean');
        assert.deepEqual(Object.keys(value.counts).sort(), ['expected', 'found', 'manifestFiles']);
        assert.ok(Object.values(value.counts).every(v => Number.isSafeInteger(v) && (v as number) >= 0));
        const clipped = (v: DiagnosticClipInput) => { assert.ok(v && typeof v === 'object' && !Array.isArray(v)); assert.deepEqual(Object.keys(v).sort(), ['truncated', 'utf8Bytes', 'value']); assert.equal(typeof v.value, 'string'); assert.ok(Buffer.byteLength(v.value as string) <= 258); assert.ok(Number.isSafeInteger(v.utf8Bytes) && (v.utf8Bytes as number) >= 0); assert.equal(typeof v.truncated, 'boolean'); };
        assert.deepEqual(Object.keys(value.locations).sort(), ['bundleContentURL', 'bundleResourceContentURL', 'bundleURL', 'documentsURL', 'homeDirectory', 'validatedRootURL']);
        Object.values(value.locations).forEach(clipped);
        for (const list of [value.missingPaths, value.unexpectedPaths]) {
          assert.deepEqual(Object.keys(list).sort(), ['items', 'omitted', 'total']);
          assert.ok(Number.isSafeInteger(list.total) && (list.total as number) >= 0 && Number.isSafeInteger(list.omitted) && (list.omitted as number) >= 0);
          assert.ok(Array.isArray(list.items) && list.items.length <= 8); assert.equal((list.omitted as number) + list.items.length, list.total); list.items.forEach(clipped);
        }
        assert.deepEqual(Object.keys(value).sort(), ['capturedAtUnixSeconds', 'counts', 'locations', 'manifestSHA256', 'manifestSelfEntry', 'missingPaths', 'pathListsOmittedForByteCap', 'pid', 'schemaVersion', 'testSuite', 'unexpectedPaths']);
        report.records.push({ name, bytes: length, sha256: hash(bytes), regular_file: true,
          filename_suite_matches: true, source: value, source_scope: 'App-reported data only; reported locations were not opened' });
      } catch (error) { report.rejected.push({ name: name.slice(0, 128), reason: 'invalid-or-inaccessible-diagnostic', code: String((error as NodeJS.ErrnoException).code ?? 'shape-or-file-guard').slice(0, 40) }); }
      finally { if (fd !== undefined) fs.closeSync(fd); }
    }
    report.status = report.rejected.length || report.omitted_files || report.scan_truncated ? 'partial' : (report.records.length ? 'captured' : 'absent');
  } catch (error) { report.status = (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'absent' : 'capture-failed'; report.reason = String((error as NodeJS.ErrnoException).code ?? 'parent-or-binding-guard').slice(0, 40); }
  let encoded = JSON.stringify(report, null, 2) + '\n';
  if (Buffer.byteLength(encoded) > 65536) {
    report.status = 'source-omitted-over-64KiB';
    report.records = report.records.map(({ source, ...record }) => ({ ...record, source: null, source_omitted_reason: 'aggregate-byte-cap' }));
    encoded = JSON.stringify(report, null, 2) + '\n';
  }
  if (Buffer.byteLength(encoded) > 65536) encoded = JSON.stringify({ schema_version: 1,
    source_head: String(process.env.EXPECTED_SOURCE_HEAD).slice(0, 40), UUID: String(owned.UUID).slice(0, 36),
    OS: String(post.OS).slice(0, 8), label: String(label).slice(0, 16),
    data_container: String(post.data_container).slice(0, 256), installed_app: String(post.installed_app).slice(0, 256),
    outer_strings_truncated: true, status: 'report-omitted-over-64KiB' }) + '\n';
  try { put(label + '-content-diagnostics.json', encoded); }
  catch { console.log('AILibraryContentDiagnostics ' + JSON.stringify({ label, status: 'record-write-failed' })); }
}

function boundedInventory(name: string, value: unknown) {
  const encoded = JSON.stringify(value, null, 2) + '\n'; assert.ok(Buffer.byteLength(encoded) <= 131072, 'Source inventory evidence bound'); put(name, encoded);
}

function baselineAfter(label: string) {
  const build = (read('build.json') as Record<string, unknown>), baseline = (read('baseline-app.json') as InventoryFile[]), actual = files(app);
  const stockSHA = hash(fs.readFileSync((build.xctestrun as string)));
  boundedInventory('baseline-after-' + label + '-inventory.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owner().UUID, label,
    baseline_app: app, stock_xctestrun: (build.xctestrun as string), stock_xctestrun_sha256: stockSHA, expected: baseline, actual });
  assert.deepEqual(actual, baseline, 'Built baseline must remain immutable after each phase'); assert.equal(stockSHA, build.xctestrun_sha256);
}

async function preparePhase(label: string, baseline: InventoryFile[], omitted: string | null = null) {
  const build = (read('build.json') as Record<string, unknown>), owned = owner(), products = path.join(derived, 'Build/Products');
  assert.equal(build.source_head, process.env.EXPECTED_SOURCE_HEAD); assert.equal(build.UUID, owned.UUID); hostPackage(baseline);
  assert.equal(fs.realpathSync((build.xctestrun as string)), (build.xctestrun as string)); assert.equal(path.dirname((build.xctestrun as string)), products);
  assert.equal(hash(fs.readFileSync((build.xctestrun as string))), build.xctestrun_sha256);
  const metadataBytes = fs.readFileSync(path.join(evidence, 'xctestrun-metadata.stdout.log')); assert.equal(hash(metadataBytes), build.metadata_json_sha256);
  const metadata = (JSON.parse as (input: string | Buffer) => unknown)(metadataBytes); const copy = copyPhaseApp(products, label, baseline, omitted);
  const phase = phaseUITestRun(metadata, { expectedBlueprintName: 'AILibraryUITests', expectedBundleIdentifier: bundleID,
    actualAppBundleIdentifier: (build.actual_app_bundle_id as string), testRoot: products, appPath: app, phase: label });
  assert.equal(copy.destination, phase.phaseApp);
  const runfile = path.join(products, 'owned-' + label + '.xctestrun'); assert.notEqual(runfile, (build.xctestrun as string));
  fs.writeFileSync(runfile, JSON.stringify(phase.metadata), { flag: 'wx', mode: 0o600 });
  await run(label + '-runfile-plist', '/usr/bin/plutil', ['-convert', 'xml1', runfile], 10000);
  assert.equal(fs.realpathSync(runfile), runfile);
  const readback = (JSON.parse((await run(label + '-runfile-readback', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', runfile], 10000)).stdout) as unknown);
  assert.deepEqual(readback, phase.metadata);
  boundedInventory(label + '-phase-source-inventory.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, label,
    phase_app: copy.destination, expected: baseline.filter(row => row.path !== omitted), actual: copy.inventory });
  const receipt = { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, label, baseline_app: app, phase_app: copy.destination,
    stock_xctestrun: (build.xctestrun as string), stock_xctestrun_sha256: build.xctestrun_sha256,
    xctestrun: runfile, xctestrun_sha256: hash(fs.readFileSync(runfile)), target_path: phase.phaseTargetPath, bundle_id: bundleID,
    xctestrun_format_version: phase.formatVersion, selected_ui_targets: 1, dependency_replacements: phase.dependencyReplacements,
    omitted_path: omitted, copy_checks: { exclusive: copy.exclusiveCopies, baseline_unchanged: copy.baselineUnchanged,
      file_and_directory_modes_match: copy.fileAndDirectoryModesMatch, all_inodes_distinct: copy.inodesDistinct,
      regular_files: copy.regularFiles, directories: copy.directories },
    claim_scope: 'Copy filesystem checks and XML SHA are producer claims; full source file arrays are separate evidence.' };
  json(label + '-phase.json', receipt); return receipt;
}

async function ui(label: string, selector: string, expected: InventoryFile[], phase: Awaited<ReturnType<typeof preparePhase>>) {
  const owned = owner(), build = (read('build.json') as Record<string, unknown>);
  assert.equal(phase.source_head, process.env.EXPECTED_SOURCE_HEAD); assert.equal(phase.UUID, owned.UUID); assert.equal(phase.label, label);
  assert.equal(phase.phase_app, path.join(derived, 'Build/Products/owned-phase-apps', label, 'AILibrary.app'));
  assert.equal(fs.realpathSync(phase.phase_app), phase.phase_app); assert.deepEqual(files(phase.phase_app), expected);
  assert.equal(fs.realpathSync(phase.xctestrun), phase.xctestrun); assert.equal(path.dirname(phase.xctestrun), path.join(derived, 'Build/Products'));
  assert.equal(hash(fs.readFileSync(phase.xctestrun)), phase.xctestrun_sha256); assert.equal(hash(fs.readFileSync((build.xctestrun as string))), build.xctestrun_sha256);
  const pre = await installed(label + '-before-ui', expected);
  const args = ['-xctestrun', phase.xctestrun, '-destination', `platform=iOS Simulator,id=${owned.UUID}`, '-destination-timeout', '60', '-resultBundlePath', path.join(evidence, label + '.xcresult'), '-parallel-testing-enabled', 'NO', '-jobs', '2', '-only-testing:' + selector, 'CODE_SIGNING_ALLOWED=NO', 'test-without-building'];
  const result = await run(label + '-ui', 'xcodebuild', args, label === 'failure' ? 180000 : 240000, false);
  const post = await installed(label + '-after-ui', expected);
  json(label + '-execution.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, OS: '18.5', selector, xctestrun: phase.xctestrun, test_exit_code: result.exit_code, test_signal: result.signal, test_error: result.error, timed_out: result.timed_out, pre, post, installation_scope: 'Explicit phase source App install; xcodebuild source artifacts reference the same phase copy' });
  captureContentDiagnostics(label, post, owned);
  hostPackage((read('baseline-app.json') as InventoryFile[])); assert.deepEqual(files(phase.phase_app), expected);
  assert.equal(result.exit_code, 0, label); assert.equal(result.error, null, label); assert.equal(result.timed_out, false, label);
  return post;
}

function preservedSentinel(dataContainer: string) {
  const sentinel = (read('reinstall-sentinel.json') as Record<string, unknown>);
  assert.equal(sentinel.source_head, process.env.EXPECTED_SOURCE_HEAD);
  assert.match((sentinel.relative_path as string), /^Documents\/ailibrary-reinstall-[a-f0-9-]{36}\.txt$/);
  const location = path.join(dataContainer, (sentinel.relative_path as string));
  assert.equal(fs.realpathSync(location), location); assert.ok(fs.lstatSync(location).isFile());
  const bytes = fs.readFileSync(location); assert.equal(bytes.length, sentinel.bytes); assert.equal(hash(bytes), sentinel.sha256);
  return { relative_path: (sentinel.relative_path as string), sha256: hash(bytes), bytes: bytes.length, data_container: dataContainer, preserved: true };
}

async function inventory() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'pero3dev/ai-agent-library'); assert.equal(process.env.REPOSITORY_IS_PRIVATE, 'false');
  assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_16.4.app/Contents/Developer'); assert.ok(fs.existsSync(process.env.DEVELOPER_DIR));
  const output = async (name: string, binary: string, args: string[], timeoutMs = 30000) => (await run(name, binary, args, timeoutMs)).stdout.trim();
  const macOS = await output('macos', 'sw_vers', ['-productVersion']); assert.equal(macOS.split('.')[0], '15');
  const architecture = await output('architecture', 'uname', ['-m']); assert.ok(['arm64', 'x86_64'].includes(architecture));
  const Xcode = await output('xcode', 'xcodebuild', ['-version']); assert.match(Xcode, /^Xcode 16\.4\nBuild version [A-Za-z0-9]+$/);
  assert.equal(await output('sdk', 'xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']), '18.5');
  const head = await output('source-head', 'git', ['rev-parse', 'HEAD']); assert.equal(head, process.env.EXPECTED_SOURCE_HEAD); assert.match(head, /^[a-f0-9]{40}$/);
  const runtimes = (JSON.parse(await output('runtimes', 'xcrun', ['simctl', 'list', 'runtimes', '--json'], 90000)) as { runtimes: Record<string, unknown>[] }).runtimes;
  const types = (JSON.parse(await output('device-types', 'xcrun', ['simctl', 'list', 'devicetypes', '--json'])) as { devicetypes: Record<string, unknown>[] }).devicetypes; assert.ok(Array.isArray(runtimes)); assert.ok(Array.isArray(types));
  const matches = runtimes.filter(row => row.version === '18.5' && row.name === 'iOS 18.5' && row.isAvailable === true);
  assert.equal(matches.length, 1); assert.match(matches[0].identifier as string, /^com\.apple\.CoreSimulator\.SimRuntime\.iOS-[A-Za-z0-9.-]+$/);
  const phones = types.filter(row => row.name === 'iPhone 16'); assert.equal(phones.length, 1); assert.match(phones[0].identifier as string, /^com\.apple\.CoreSimulator\.SimDeviceType\.[A-Za-z0-9.-]+$/);
  json('selection.json', { source_head: head, repository: process.env.GITHUB_REPOSITORY, runner_label: 'macos-15', standard_runner: true, macOS, architecture, Xcode, SDK: '18.5', runtime: matches[0], device_type: phones[0] });
}

async function simulator() {
  const selection = (read('selection.json') as Record<string, unknown>); assert.equal(selection.source_head, process.env.EXPECTED_SOURCE_HEAD);
  const before = allDevices((JSON.parse((await run('devices-before-create', 'xcrun', ['simctl', 'list', 'devices', '--json'], 30000)).stdout) as Parameters<typeof allDevices>[0]));
  const preexisting = before.map(row => row.device.udid.toUpperCase()); assert.equal(new Set(preexisting).size, preexisting.length);
  const token = randomUUID(), name = `AILibrary-load-failure-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}-${token}`;
  const intent = { repository: process.env.GITHUB_REPOSITORY, source_head: process.env.EXPECTED_SOURCE_HEAD, run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT, token, name, runtime_identifier: (selection.runtime as Record<string, unknown>).identifier, device_type_identifier: (selection.device_type as Record<string, unknown>).identifier, preexisting_UUIDs: preexisting };
  json('owned-simulator-intent.json', intent);
  const UUID = (await run('create-simulator', 'xcrun', ['simctl', 'create', name, intent.device_type_identifier as string, intent.runtime_identifier as string], 60000)).stdout.trim().toUpperCase(); assert.match(UUID, uuidPattern); assert.ok(!preexisting.includes(UUID));
  json('owned-simulator.json', { ...intent, UUID, creation_exit_code: 0 });
  await run('boot-simulator', 'xcrun', ['simctl', 'boot', UUID], 30000); await run('bootstatus-simulator', 'xcrun', ['simctl', 'bootstatus', UUID, '-b'], 150000);
  const current = allDevices((JSON.parse((await run('devices-after-boot', 'xcrun', ['simctl', 'list', 'devices', '--json'], 90000)).stdout) as Parameters<typeof allDevices>[0])).filter(row => row.device.udid.toUpperCase() === UUID);
  assert.equal(current.length, 1); assert.equal(current[0].runtime, intent.runtime_identifier); assert.equal(current[0].device.name, name); assert.equal(current[0].device.state, 'Booted'); assert.equal(current[0].device.isAvailable, true);
}

async function build() {
  const owned = owner(); assert.ok(!fs.existsSync(derived));
  await run('build-for-testing', 'xcodebuild', ['-project', 'ios/AILibrary.xcodeproj', '-scheme', 'AILibrary', '-configuration', 'Debug', '-destination', `platform=iOS Simulator,id=${owned.UUID}`, '-destination-timeout', '60', '-derivedDataPath', derived, '-parallel-testing-enabled', 'NO', '-jobs', '2', 'CODE_SIGNING_ALLOWED=NO', 'build-for-testing'], 420000);
  const products = path.join(derived, 'Build/Products'); const candidates = fs.readdirSync(products).filter(name => name.endsWith('.xctestrun')); assert.equal(candidates.length, 1);
  const xctestrun = path.join(products, candidates[0]); assert.equal(fs.realpathSync(xctestrun), xctestrun);
  const metadata = (JSON.parse((await run('xctestrun-metadata', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', xctestrun], 10000)).stdout) as unknown);
  const ownedAppInfo = (JSON.parse((await run('owned-app-info', '/usr/bin/plutil', ['-convert', 'json', '-o', '-', path.join(app, 'Info.plist')], 10000)).stdout) as Record<string, unknown>);
  const { formatVersion, target } = selectUITestTarget(metadata, { expectedBlueprintName: 'AILibraryUITests', expectedBundleIdentifier: bundleID, actualAppBundleIdentifier: ownedAppInfo.CFBundleIdentifier });
  const targetPath = target.UITargetAppPath; assert.equal(typeof targetPath, 'string'); assert.ok(!(targetPath as string).replace('__TESTROOT__', products).includes('__'));
  assert.equal(fs.realpathSync((targetPath as string).replace('__TESTROOT__', products)), app, 'Do not run a cached app outside this owned build');
  const baseline = hostPackage(); const manifest = (JSON.parse(fs.readFileSync(path.join(app, 'Content/manifest.json'), 'utf8')) as { schema_version: unknown; articles: { id: string; document_path: string; is_test_fixture?: unknown }[]; files: Record<string, unknown> });
  assert.equal(manifest.schema_version, 2); assert.equal(manifest.articles.length, 3); assert.equal(manifest.articles.some(row => row.is_test_fixture === true || row.id.startsWith('test-fixtures/')), false);
  json('baseline-app.json', baseline); json('build.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owned.UUID, app, xctestrun,
    xctestrun_sha256: hash(fs.readFileSync(xctestrun)), target_path: targetPath, bundle_id: bundleID, xctestrun_format_version: formatVersion,
    metadata_declares_bundle_id: Object.hasOwn(target, 'UITargetAppBundleIdentifier'), actual_app_bundle_id: ownedAppInfo.CFBundleIdentifier,
    metadata_json_sha256: hash(fs.readFileSync(path.join(evidence, 'xctestrun-metadata.stdout.log'))), article_count: 3 });
}

async function failure() {
  const baseline = (read('baseline-app.json') as InventoryFile[]); hostPackage(baseline); const manifest = (JSON.parse(fs.readFileSync(path.join(app, 'Content/manifest.json'), 'utf8')) as { schema_version: unknown; articles: { id: string; document_path: string; is_test_fixture?: unknown }[]; files: Record<string, unknown> });
  const relative = manifest.articles[0].document_path; assert.match(relative, /^articles\/[A-Za-z0-9/_-]+\.json$/); assert.ok(relative.split('/').every(p => p !== '..' && p !== '.'));
  const target = path.join(app, 'Content', relative); assert.equal(fs.realpathSync(target), target); const bytes = fs.readFileSync(target); assert.equal(hash(bytes), manifest.files[relative]);
  put('withheld-article.json', bytes); json('withheld.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, host_app: app, relative_path: 'Content/' + relative, bytes: bytes.length, mode: fs.statSync(target).mode & 0o777, sha256: hash(bytes), saved_as: 'withheld-article.json', baseline_retained: true });
  const expected = baseline.filter(row => row.path !== 'Content/' + relative); assert.equal(expected.length, baseline.length - 1);
  const phase = await preparePhase('failure', baseline, 'Content/' + relative);
  const owned = owner(); const absent = await run('failure-before-install-absence', 'xcrun', ['simctl', 'get_app_container', owned.UUID, bundleID, 'app'], 10000, false); assert.notEqual(absent.exit_code, 0, 'Fresh owned Simulator must not already contain this app'); assert.equal(absent.timed_out, false); assert.equal(absent.error, null);
  await run('failure-explicit-install', 'xcrun', ['simctl', 'install', owned.UUID, phase.phase_app], 60000);
  const proof = await installed('failure-explicit-install', expected); json('failure-installation.json', { ...proof, install_exit_code: 0, prior_app_absent: true, expected_missing_file: 'Content/' + relative, proven_by: 'Successful explicit install plus exact installed file inventory; no automatic reinstall assumption' });
  try { await ui('failure', failureSelector, expected, phase); }
  finally {
    const post = await installed('failure-before-sentinel', expected);
    const relative = 'Documents/ailibrary-reinstall-' + randomUUID() + '.txt';
    const documents = path.join(post.data_container, 'Documents'); fs.mkdirSync(documents, { recursive: true }); assert.equal(fs.realpathSync(documents), documents);
    const sentinel = Buffer.from('AI Agent Library reinstall preservation sentinel v1\n', 'utf8');
    fs.writeFileSync(path.join(post.data_container, relative), sentinel, { flag: 'wx', mode: 0o600 });
    json('reinstall-sentinel.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, UUID: owner().UUID, relative_path: relative, bytes: sentinel.length, sha256: hash(sentinel), data_container_before_upgrade: post.data_container, app_reads_sentinel: false });
    baselineAfter('failure');
  }
}

async function restore() {
  const prerequisites = ['failure-installation.json', 'reinstall-sentinel.json'];
  const missing = prerequisites.filter(name => !fs.existsSync(path.join(evidence, name)));
  json('restored-prerequisites.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, prerequisite_stage: 'failure', status: missing.length ? 'blocked-by-prior-stage' : 'present', missing_files: missing, scope: 'Presence only; existing restore validations still apply. No restored install or UI success is implied.' });
  assert.equal(missing.length, 0, 'Stage R blocked: prior Stage F prerequisites were not completed');
  const withheld = (read('withheld.json') as Record<string, unknown>); assert.equal(withheld.source_head, process.env.EXPECTED_SOURCE_HEAD); assert.equal(withheld.host_app, app); assert.match((withheld.relative_path as string), /^Content\/articles\/[A-Za-z0-9/_-]+\.json$/);
  const target = path.join(app, (withheld.relative_path as string)); assert.equal(fs.realpathSync(target), target); const bytes = fs.readFileSync(path.join(evidence, 'withheld-article.json')); assert.equal(bytes.length, withheld.bytes); assert.equal(hash(bytes), withheld.sha256);
  assert.ok(Number.isInteger(withheld.mode) && (withheld.mode as number) >= 0 && (withheld.mode as number) <= 0o777);
  assert.equal(hash(fs.readFileSync(target)), withheld.sha256); assert.equal(fs.statSync(target).mode & 0o777, withheld.mode);
  const baseline = (read('baseline-app.json') as InventoryFile[]); hostPackage(baseline); const phase = await preparePhase('restored', baseline);
  assert.equal(hash(fs.readFileSync(path.join(phase.phase_app, (withheld.relative_path as string)))), withheld.sha256);
  json('restoration.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, relative_path: (withheld.relative_path as string), restored_sha256: hash(bytes), full_host_bundle_matches_baseline: true, scope: 'Complete restored phase copy and upgrade install preserving sentinel; not same-process retry recovery or reading migration' });
  const owned = owner(); const initial = (read('failure-installation.json') as Record<string, unknown>); preservedSentinel((read('reinstall-sentinel.json') as Record<string, unknown>).data_container_before_upgrade as string);
  await run('restored-explicit-install', 'xcrun', ['simctl', 'install', owned.UUID, phase.phase_app], 60000);
  const proof = await installed('restored-explicit-install', baseline); const sentinel = preservedSentinel(proof.data_container);
  json('restored-installation.json', { ...proof, prior_installation_UUID: initial.installation_UUID, install_exit_code: 0, uninstall_performed: false, installation_UUID_changed: proof.installation_UUID !== initial.installation_UUID, sentinel, proven_by: 'Explicit upgrade install, missing-to-full actual bundle inventory transition, preserved fixed sentinel bytes; no uninstall fallback or automatic reinstall assumption' });
  try {
    const post = await ui('restored', restoredSelector, baseline, phase);
    json('sentinel-after-restored-ui.json', preservedSentinel(post.data_container));
  } finally { baselineAfter('restored'); }
}

async function audit() {
  const owned = owner(), accepted = [], errors = [];
  for (const [label, selector] of [['failure', failureSelector], ['restored', restoredSelector]]) {
    try {
    const tree = (JSON.parse((await run(label + '-raw-tests', 'xcrun', ['xcresulttool', 'get', 'test-results', 'tests', '--path', path.join(evidence, label + '.xcresult')], 30000)).stdout) as TreeInput), cases = [];
    const execution = read(label + '-execution.json') as Record<string, unknown>; assert.equal(execution.UUID, owned.UUID); assert.equal(execution.OS, '18.5'); assert.equal(execution.selector, selector); assert.equal(execution.test_exit_code, 0); assert.equal(execution.test_error, null); assert.equal(execution.timed_out, false);
    assert.ok(Array.isArray(tree.testNodes));
    // Match the observed Xcode16.4 hierarchy, not an arbitrary matching leaf.
    const [bundleName, suiteName, methodName, extra] = selector.split('/');
    assert.equal(bundleName, 'AILibraryUITests'); assert.equal(extra, undefined);
    assert.match(suiteName, /^\w+UITests$/); assert.match(methodName, /^test\w+$/);
    const bundleURL = 'test://com.apple.xcode/AILibrary/AILibraryUITests';
    function container(node: Record<string, unknown>, type: string, name: string) {
      assert.ok(node && typeof node === 'object' && !Array.isArray(node));
      assert.equal(node.nodeType, type); assert.equal(node.name, name); assert.equal(node.result, 'Passed');
      assert.ok(Array.isArray(node.children)); assert.equal(node.children.length, 1, 'Missing, extra or duplicate hierarchy nodes are not acceptance');
      return node.children as Record<string, unknown>[];
    }
    assert.equal(tree.testNodes.length, 1);
    const bundles = container(tree.testNodes[0], 'Test Plan', 'AILibrary');
    const suites = container(bundles[0], 'UI test bundle', bundleName);
    assert.equal(bundles[0].nodeIdentifierURL, bundleURL);
    const leaves = container(suites[0], 'Test Suite', suiteName);
    assert.equal(suites[0].nodeIdentifierURL, bundleURL + '/' + suiteName);
    const leaf = leaves[0]; assert.ok(leaf && typeof leaf === 'object' && !Array.isArray(leaf));
    assert.equal(leaf.nodeType, 'Test Case'); assert.equal(leaf.result, 'Passed');
    assert.equal(leaf.children, undefined, 'The observed schema requires a leaf without children');
    assert.equal(leaf.name, methodName + '()');
    assert.equal(leaf.nodeIdentifier, suiteName + '/' + leaf.name);
    assert.equal(leaf.nodeIdentifierURL, bundleURL + '/' + suiteName + '/' + methodName);
    cases.push(leaf);
    assert.equal(cases.length, 1); assert.equal(cases[0].nodeIdentifier, selector.replace('AILibraryUITests/', '') + '()');
    assert.ok(Array.isArray(tree.devices)); assert.equal(tree.devices.length, 1); assert.equal((tree.devices[0].deviceId as string).toUpperCase(), owned.UUID); assert.equal(tree.devices[0].osVersion, '18.5'); assert.equal(tree.devices[0].platform, 'iOS Simulator'); if (tree.devices[0].modelName !== undefined) assert.equal(tree.devices[0].modelName, 'iPhone 16');
    const acceptance = { source_head: process.env.EXPECTED_SOURCE_HEAD, status: 'exact-one-case-passed', selector, cases: cases.map(row => ({ id: row.nodeIdentifier, result: row.result })), devices: tree.devices };
    json(label + '-acceptance.json', acceptance); accepted.push(acceptance);
    } catch (error) {
      const failure = { source_head: process.env.EXPECTED_SOURCE_HEAD, status: 'not-completed', selector, error: String(error) };
      json(label + '-acceptance.json', failure); errors.push(failure);
    }
  }
  try { assert.equal((read('restored-installation.json') as Record<string, unknown>).uninstall_performed, false); assert.equal(((read('restored-installation.json') as Record<string, unknown>).sentinel as Record<string, unknown>).preserved, true); assert.equal((read('sentinel-after-restored-ui.json') as Record<string, unknown>).preserved, true); assert.equal((read('restoration.json') as Record<string, unknown>).full_host_bundle_matches_baseline, true); }
  catch (error) { errors.push({ status: 'not-completed', error: String(error), scope: 'Restored install/sentinel receipts' }); }
  json('stages-acceptance.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, status: errors.length === 0 ? 'two-separate-stages-passed' : 'not-completed', stages: accepted, errors, exclusions: ['same-process repaired retry','offline','folder import','legacy migration','missing article route','physical device','VoiceOver'] });
  assert.equal(errors.length, 0, 'Both independent raw audits and preserved sentinel receipts must pass');
}

async function cleanup() {
  const report: { status: string; UUID: string | null; error: string | null } = { status: 'not-completed', UUID: null, error: null };
  try {
    if (!fs.existsSync(path.join(evidence, 'owned-simulator-intent.json'))) { report.status = 'not-created'; return; }
    const intent = (read('owned-simulator-intent.json') as Record<string, unknown>); assert.equal(intent.repository, 'pero3dev/ai-agent-library'); assert.equal(intent.source_head, process.env.EXPECTED_SOURCE_HEAD); assert.equal(intent.run_id, process.env.GITHUB_RUN_ID); assert.equal(intent.run_attempt, process.env.GITHUB_RUN_ATTEMPT); assert.match(intent.token as string, /^[a-f0-9-]{36}$/); assert.equal((intent.name as string), `AILibrary-load-failure-${intent.run_id}-${intent.run_attempt}-${intent.token}`);
    const creation = (read('create-simulator.exit.json') as Record<string, unknown>); assert.equal(creation.exit_code, 0); assert.equal(creation.error, null); assert.equal(creation.timed_out, false); assert.deepEqual(creation.arguments, ['simctl', 'create', intent.name as string, intent.device_type_identifier as string, intent.runtime_identifier as string]);
    const UUID = fs.readFileSync(path.join(evidence, 'create-simulator.stdout.log'), 'utf8').trim().toUpperCase(); assert.match(UUID, uuidPattern); assert.ok(!(intent.preexisting_UUIDs as unknown[]).includes(UUID));
    const before = allDevices((JSON.parse(fs.readFileSync(path.join(evidence, 'devices-before-create.stdout.log'), 'utf8')) as Parameters<typeof allDevices>[0])); assert.ok(before.every(row => row.device.udid.toUpperCase() !== UUID));
    if (fs.existsSync(path.join(evidence, 'owned-simulator.json'))) { const owned = owner(); assert.equal(owned.UUID, UUID); }
    report.UUID = UUID; const current = allDevices((JSON.parse((await run('cleanup-before', 'xcrun', ['simctl', 'list', 'devices', '--json'], 30000)).stdout) as Parameters<typeof allDevices>[0])).filter(row => row.device.udid.toUpperCase() === UUID); assert.ok(current.length <= 1);
    if (!current.length) { report.status = 'already-absent'; return; }
    assert.equal(current[0].runtime, intent.runtime_identifier); assert.equal(current[0].device.name, (intent.name as string)); if (current[0].device.deviceTypeIdentifier !== undefined) assert.equal(current[0].device.deviceTypeIdentifier, intent.device_type_identifier);
    let shutdown; if (current[0].device.state !== 'Shutdown') shutdown = await run('cleanup-shutdown', 'xcrun', ['simctl', 'shutdown', UUID], 30000, false);
    const deletion = await run('cleanup-delete', 'xcrun', ['simctl', 'delete', UUID], 60000, false);
    const after = allDevices((JSON.parse((await run('cleanup-after', 'xcrun', ['simctl', 'list', 'devices', '--json'], 30000)).stdout) as Parameters<typeof allDevices>[0])); assert.ok(after.every(row => row.device.udid.toUpperCase() !== UUID)); assert.equal(deletion.exit_code, 0); assert.equal(deletion.error, null); assert.equal(deletion.timed_out, false); if (shutdown) { assert.equal(shutdown.exit_code, 0); assert.equal(shutdown.error, null); assert.equal(shutdown.timed_out, false); }
    report.status = 'owned-simulator-deleted';
  } catch (error) { report.error = String(error); throw error; }
  finally { json('cleanup.json', report); }
}

async function summary() {
  const outcomes = Object.fromEntries(['INVENTORY','ROOT_AUDIT','ROOT_TOOLS','ASSET_AUDIT','ASSET_TOOLS','BROWSER','CONTENT','SIMULATOR','BUILD','FAILURE','RESTORED','CLEANUP','AUDIT'].map(key => [key.toLowerCase(), process.env[key + '_OUTCOME']]));
  let error: string | null = null; try { assert.ok(Object.values(outcomes).every(value => value === 'success')); assert.equal((read('stages-acceptance.json') as Record<string, unknown>).status, 'two-separate-stages-passed'); assert.ok(['owned-simulator-deleted','already-absent'].includes((read('cleanup.json') as Record<string, unknown>).status as string)); } catch (failure) { error = String(failure); }
  json('summary.json', { source_head: process.env.EXPECTED_SOURCE_HEAD, status: error === null ? 'two-stage-recovery-ui-passed' : 'not-completed', outcomes, error, coverage: 'Initial missing bundle error/retry failure and separate restored upgrade with sentinel preservation only', offline_import_legacy_sameProcessRetry_missingRoute_device_VoiceOver: 'not-verified' }); assert.equal(error, null);
}

await ({ inventory, simulator, build, failure, restore, audit, cleanup, summary })[stage]();
