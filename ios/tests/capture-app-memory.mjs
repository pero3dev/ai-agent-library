#!/usr/bin/env node
// First-observation raw capture only. Never normalize/adopt memory samples here.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beginReaderSession, inventoryDifference } from './app-memory-reader-session.mjs';
import { fileURLToPath } from 'node:url';

const protocol = JSON.parse(readFileSync(new URL('./app-memory-observation-protocol.json', import.meta.url), 'utf8'));
const MAX = 16 * 1024 * 1024;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const text = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
function regular(file, limit = MAX) {
  const s = lstatSync(file);
  assert.ok(s.isFile() && !s.isSymbolicLink() && s.size > 0 && s.size <= limit, 'Invalid evidence input: ' + file);
  const b = readFileSync(file); assert.ok(b.length > 0 && b.length <= limit); return b;
}
function noSymlinks(file) {
  for (let p = file; ; p = path.dirname(p)) {
    if (existsSync(p)) assert.ok(!lstatSync(p).isSymbolicLink(), 'Symlink in evidence/input path');
    if (path.dirname(p) === p) break;
  }
}
function inside(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}
function walk(value, visit, depth = 0, budget = { count: 0 }) {
  assert.ok(depth < 128 && ++budget.count < 200000, 'Excessive raw JSON structure');
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit, depth + 1, budget);
}
function exactCase(report) {
  const cases = []; walk(report.testNodes, node => { if (node.nodeType === 'Test Case') cases.push(node); });
  assert.equal(cases.length, 1, 'Expected one dedicated app-memory case');
  const value = cases[0], id = value.nodeIdentifier;
  const allowed = [protocol.class_name + '/' + protocol.method + '()', protocol.selector + '()'];
  assert.ok(allowed.includes(id) && ['Passed', 'Failed'].includes(value.result), 'Missing, skipped or mismatched app-memory case');
  return value;
}
function validateContext(context) {
  assert.match(context.source_head ?? '', /^[a-f0-9]{40}$/);
  assert.match(context.source_tree ?? '', /^[a-f0-9]{40}$/);
  assert.equal(context.configuration, 'Debug');
  assert.ok(Number.isInteger(context.expected_articles) && context.expected_articles >= 4 && context.expected_articles <= 2000);
  assert.equal(context.actual_app_package?.status, 'passed');
  assert.equal(context.actual_app_package.articles, context.expected_articles, 'Actual Debug package/full-source count mismatch');
  assert.match(context.actual_app_package.revision ?? '', /^[a-f0-9]{64}$/);
  assert.equal(context.scenario, protocol.scenario);
  assert.equal(context.query, protocol.query);
  assert.equal(context.target_id, protocol.target_id);
  assert.equal(context.selector, protocol.selector);
  assert.equal(context.declared_iteration_count, 5);
  assert.equal(context.diagnostics_enabled, false);
}

class UnboundEvidenceError extends Error {}

// Filesystem identity only: no xcresult schema or source-head claim is inferred.
export function fingerprintResult(directory) {
  const root = path.resolve(directory); noSymlinks(root);
  assert.ok(lstatSync(root).isDirectory(), 'Expected xcresult directory');
  const files = []; let total = 0;
  const visit = (folder, depth = 0) => {
    assert.ok(depth <= 32, 'Excessive xcresult depth');
    for (const name of readdirSync(folder).sort()) {
      const file = path.join(folder, name), stat = lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), 'Symlink in xcresult');
      if (stat.isDirectory()) visit(file, depth + 1);
      else {
        assert.ok(stat.isFile() && ++total > 0 && total <= 8192, 'Invalid/excessive xcresult files');
        const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
        let size = 0; const digest = createHash('sha256'), buffer = Buffer.alloc(65536);
        try {
          assert.ok(fstatSync(fd).isFile()); let count;
          while ((count = readSync(fd, buffer, 0, buffer.length, null)) > 0) {
            size += count; assert.ok(size <= 256 * 1024 * 1024, 'Oversized xcresult file'); digest.update(buffer.subarray(0, count));
          }
          assert.equal(fstatSync(fd).size, size, 'xcresult changed while hashing');
        } finally { closeSync(fd); }
        files.push({ path: path.relative(root, file).split(path.sep).join('/'), bytes: size, sha256: digest.digest('hex') });
      }
    }
  };
  visit(root); assert.ok(files.length > 0, 'Empty xcresult directory');
  assert.ok(files.reduce((sum, file) => sum + file.bytes, 0) <= 512 * 1024 * 1024, 'Oversized xcresult inventory');
  return { algorithm: 'sha256-canonical-path-size-content-array-v1', sha256: hash(Buffer.from(JSON.stringify(files))), files };
}

// Generic fields below were observed in the retained Xcode16.4 Clock raw JSON.
// Their values are cross-checked; they are not a memory metric wire contract.
export function crossCheckRawIdentity({ report, executed, details, invocation, plan, metadata, rawSummary, context, fingerprint, planRef, summaryRef }) {
  const unknown = [], checked = [];
  const absent = label => { unknown.push(label); return null; };
  const scalar = (value, label) => value === undefined || value === null ? absent(label)
    : (assert.equal(typeof value, 'string', 'Invalid identity field: ' + label), assert.ok(value.length > 0 && value.length < 1000), value);
  const typed = (value, label, type = 'String') => {
    if (!value || value._type?._name !== type) return absent(label + ':unobserved-schema');
    return scalar(value._value, label);
  };
  const one = (values, label) => {
    if (!Array.isArray(values)) return absent(label + ':unobserved-schema');
    assert.equal(values.length, 1, 'Ambiguous or missing ' + label); return values[0];
  };
  const equal = (a, b, label) => { if (a !== null && b !== null) { assert.equal(a, b, 'Identity mismatch: ' + label); checked.push(label); } };
  const knownType = (value, expected, label) => { if (value !== expected) absent(label + ':unobserved-schema'); else checked.push(label); };
  const uuid = (value, label) => { const v = scalar(value, label); if (v !== null) assert.match(v, /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i, 'Invalid UUID: ' + label); return v?.toUpperCase() ?? null; };
  const modernDevice = one(report.devices, 'test-list device'), detailDevice = one(details.devices, 'test-detail device');
  const deviceID = uuid(modernDevice?.deviceId, 'test-list deviceId'), detailID = uuid(detailDevice?.deviceId, 'details deviceId');
  equal(deviceID, detailID, 'list/details device UUID');
  for (const field of ['architecture', 'deviceName', 'modelName', 'osBuildNumber', 'osVersion', 'platform']) {
    equal(scalar(modernDevice?.[field], 'list device.' + field), scalar(detailDevice?.[field], 'details device.' + field), 'device ' + field);
  }
  equal(scalar(detailDevice?.modelName, 'device model'), 'iPhone 16', 'requested model');
  equal(scalar(detailDevice?.platform, 'device platform'), 'iOS Simulator', 'requested platform');
  equal(scalar(detailDevice?.osVersion, 'device OS'), '18.5', 'requested OS');
  const listConfig = one(report.testPlanConfigurations, 'test-list configuration');
  const config = one(details.testPlanConfigurations, 'test-detail configuration');
  const configID = scalar(config?.configurationId, 'details configurationId');
  equal(scalar(listConfig?.configurationId, 'list configurationId'), configID, 'list/details configuration ID');
  const configName = scalar(config?.configurationName, 'details configuration name');
  equal(scalar(listConfig?.configurationName, 'list configuration name'), configName, 'list/details configuration name');
  equal(configName, 'Test Scheme Action', 'requested test-plan name');
  const deviceRun = one(details.testRuns, 'actual device run');
  equal(scalar(deviceRun?.nodeType, 'device run type'), 'Device', 'device run type');
  equal(uuid(deviceRun?.nodeIdentifier, 'test-run device UUID'), deviceID, 'device run UUID');
  equal(scalar(deviceRun?.result, 'device run result'), details.testResult, 'device run status');
  const configRun = one(deviceRun?.children, 'actual configuration run');
  equal(scalar(configRun?.nodeType, 'configuration run type'), 'Test Plan Configuration', 'configuration run type');
  equal(scalar(configRun?.nodeIdentifier, 'configuration run ID'), configID, 'configuration run ID');
  equal(scalar(configRun?.name, 'configuration run name'), configName, 'configuration run name');
  equal(scalar(configRun?.result, 'configuration run result'), details.testResult, 'configuration run status');
  const action = one(invocation.actions?._values, 'legacy action');
  knownType(invocation._type?._name, 'ActionsInvocationRecord', 'invocation type');
  knownType(action?._type?._name, 'ActionRecord', 'action type');
  knownType(action?.actionResult?._type?._name, 'ActionResult', 'action result type');
  knownType(action?.runDestination?._type?._name, 'ActionRunDestinationRecord', 'run destination type');
  equal(typed(action?.actionResult?.status, 'action status'), 'succeeded', 'action status');
  equal(typed(action?.schemeCommandName, 'scheme command'), 'Test', 'scheme command');
  equal(typed(action?.schemeTaskName, 'scheme task'), 'Action', 'scheme task');
  equal(typed(action?.testPlanName, 'test-plan name'), 'AILibrary', 'test-plan name');
  const testsRef = action?.actionResult?.testsRef;
  knownType(testsRef?._type?._name, 'Reference', 'testsRef type');
  equal(typed(testsRef?.id, 'testsRef ID'), scalar(planRef, 'requested plan reference'), 'testsRef request');
  equal(typed(testsRef?.targetType?.name, 'testsRef target type'), 'ActionTestPlanRunSummaries', 'testsRef target');
  const target = action?.runDestination?.targetDeviceRecord;
  knownType(target?._type?._name, 'ActionDeviceRecord', 'legacy target device type');
  equal(uuid(typed(target?.identifier, 'legacy destination UUID'), 'legacy destination UUID value'), deviceID, 'legacy/modern device UUID');
  equal(typed(target?.name, 'legacy device name'), scalar(detailDevice?.deviceName, 'modern device name'), 'legacy device name');
  equal(typed(target?.operatingSystemVersion, 'legacy device OS'), scalar(detailDevice?.osVersion, 'modern device OS'), 'legacy OS');
  equal(typed(target?.nativeArchitecture, 'legacy device architecture'), scalar(detailDevice?.architecture, 'modern architecture'), 'legacy architecture');
  equal(typed(target?.platformRecord?.identifier, 'legacy platform ID'), 'com.apple.platform.iphonesimulator', 'legacy platform');
  equal(typed(action?.runDestination?.targetArchitecture, 'action target architecture'), scalar(detailDevice?.architecture, 'modern target architecture'), 'action target architecture');
  const actionStart = typed(action?.startedTime, 'action start', 'Date'), actionEnd = typed(action?.endedTime, 'action end', 'Date');
  let start = null, end = null;
  if (actionStart !== null && actionEnd !== null) {
    start = Date.parse(actionStart); end = Date.parse(actionEnd); assert.ok(Number.isFinite(start) && Number.isFinite(end) && start <= end, 'Invalid action interval');
    if (details.startTime === undefined) absent('test details startTime');
    else { assert.ok(Number.isFinite(details.startTime)); assert.ok(details.startTime * 1000 >= start && details.startTime * 1000 <= end, 'Test start outside action interval'); checked.push('test start within action'); }
  }
  knownType(plan._type?._name, 'ActionTestPlanRunSummaries', 'plan type');
  const planRun = one(plan.summaries?._values, 'legacy plan configuration');
  equal(typed(planRun?.name, 'legacy configuration name'), configName, 'legacy/modern configuration name');
  const testable = one(planRun?.testableSummaries?._values, 'legacy UI test target');
  equal(typed(testable?.targetName, 'legacy target'), 'AILibraryUITests', 'legacy target');
  equal(typed(testable?.testKind, 'legacy test kind'), 'UI', 'legacy test kind');
  equal(typed(metadata?.identifier, 'metadata test ID'), details.testIdentifier, 'metadata/details case');
  equal(typed(metadata?.testStatus, 'metadata status'), 'Success', 'metadata status');
  knownType(metadata?.summaryRef?._type?._name, 'Reference', 'summaryRef type');
  equal(typed(metadata?.summaryRef?.id, 'summaryRef ID'), scalar(summaryRef, 'requested summary reference'), 'summaryRef request');
  equal(typed(metadata?.summaryRef?.targetType?.name, 'summaryRef target type'), 'ActionTestSummary', 'summaryRef target');
  const url = scalar(details.testIdentifierURL, 'details test URL');
  equal(scalar(executed.nodeIdentifierURL, 'test-list test URL'), url, 'list/details test URL');
  equal(typed(metadata?.identifierURL, 'metadata test URL'), url, 'metadata test URL');
  equal(typed(rawSummary.identifierURL, 'summary test URL'), url, 'summary test URL');
  const external = context.result_binding;
  if (!external) absent('trusted external result binding');
  else {
    if (external.inventory_sha256 === null || external.inventory_sha256 === undefined) absent('external result inventory seal');
    else { assert.match(external.inventory_sha256, /^[a-f0-9]{64}$/); assert.equal(external.inventory_sha256, fingerprint.sha256, 'Stale or wrong context result inventory'); checked.push('external context/result inventory'); }
    equal(uuid(external.expected_device_id, 'external device UUID'), deviceID, 'external context device UUID');
    equal(scalar(external.expected_configuration_id, 'external configuration ID'), configID, 'external context configuration ID');
    equal(scalar(external.expected_configuration_name, 'external configuration name'), configName, 'external context configuration name');
    if (!external.action_window || start === null || end === null) absent('external action interval');
    else {
      const { not_before_ms: lower, not_after_ms: upper } = external.action_window;
      assert.ok(Number.isFinite(lower) && Number.isFinite(upper) && lower <= upper, 'Invalid external action window');
      assert.ok(start >= lower && end <= upper, 'Stale context: action outside external invocation window'); checked.push('external context/action interval');
    }
  }
  return { stage: unknown.length ? 'raw-unbound' : 'result-context-associated-source-unverified', association_scope: 'result bytes, common action/device/config metadata only',
    complete_source_binding: false, source_identity: { status: 'trusted-external-workflow-context-only', xcresult_verified: false,
      asserted_source_head: context.source_head, asserted_source_tree: context.source_tree, note: 'The checked xcresult schema does not verify source head/tree, Debug product build configuration or app package revision.' },
    unknown_or_unbound: [...new Set(unknown)], checked, result_inventory_sha256: fingerprint.sha256,
    observed_common_identity: { device_id: deviceID, test_plan_configuration_id: configID, test_plan_configuration_name: configName, action_status: action?.actionResult?.status?._value ?? null, tests_ref: planRef, summary_ref: summaryRef },
    schema_reference: 'Retained actual Xcode16.4 Clock common metadata; memory metric identity/units/cardinality are unadopted.' };
}

export function defaultRun(args, options) {
  const { monotonic_now: now, session_deadline_ms: sessionDeadline, command_deadline_ms: commandDeadline, ...spawnOptions } = options;
  assert.equal(typeof now, 'function'); assert.ok(Number.isFinite(sessionDeadline) && Number.isFinite(commandDeadline));
  const beforeSpawn = now(), remaining = Math.floor(Math.min(sessionDeadline, commandDeadline) - beforeSpawn);
  if (remaining < 1) return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), status: null,
    error: new Error('Monotonic reader deadline expired immediately before actual spawn'),
    process_receipt: { pid_group: null, cleanup: 'not-spawned-deadline-exceeded', actual_timeout_ms: 0, before_spawn_monotonic_ms: beforeSpawn, actual_process_absence_guaranteed: false } };
  const actualTimeout = Math.min(spawnOptions.timeout, remaining);
  const answer = spawnSync('xcrun', ['xcresulttool', ...args], { ...spawnOptions, timeout: actualTimeout, detached: true, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'pipe'] });
  const afterReturn = now();
  if (afterReturn >= Math.min(sessionDeadline, commandDeadline)) answer.error ??= new Error('Monotonic reader deadline exceeded after actual process return');
  let cleanup = 'no-child-pid';
  if (answer.pid) {
    try { process.kill(-answer.pid, 'SIGKILL'); cleanup = 'known-child-group-signalled'; }
    catch (error) { if (error.code !== 'ESRCH') answer.error ??= error; cleanup = error.code === 'ESRCH' ? 'known-child-group-absent' : 'known-child-group-cleanup-failed'; }
  }
  return { ...answer, process_receipt: { pid_group: answer.pid ?? null, cleanup, actual_timeout_ms: actualTimeout, before_spawn_monotonic_ms: beforeSpawn, after_return_monotonic_ms: afterReturn, session_deadline_ms: sessionDeadline, command_deadline_ms: commandDeadline, actual_process_absence_guaranteed: false } };
}

// Seal before any official reader/export. Keep the full original relative filelist.
export function sealAppMemoryContext(input) {
  const options = Object.fromEntries(['result', 'output', 'context'].map(key => [key, path.resolve(input[key])]));
  for (const file of Object.values(options)) noSymlinks(file);
  for (const file of [options.result, options.context]) assert.ok(!inside(file, options.output) && !inside(options.output, file), 'Seal output/input overlap');
  const context = JSON.parse(text(regular(options.context))); validateContext(context);
  assert.ok(context.result_binding?.inventory_sha256 == null && context.result_binding?.preseal_inventory == null, 'Refuse to reseal an already sealed context');
  const inventory = fingerprintResult(options.result);
  mkdirSync(options.output, { mode: 0o700 });
  writeFileSync(path.join(options.output, 'result-inventory.preseal.json'), JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  context.result_binding = { ...context.result_binding, inventory_sha256: inventory.sha256, preseal_inventory: inventory };
  writeFileSync(path.join(options.output, 'context-sealed.json'), JSON.stringify(context, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  const after = fingerprintResult(options.result);
  writeFileSync(path.join(options.output, 'seal-source.after.json'), JSON.stringify({ ...inventoryDifference(inventory, after), after_sha256: after.sha256 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  assert.equal(after.sha256, inventory.sha256, 'Original changed while sealing');
  return { context: path.join(options.output, 'context-sealed.json'), inventory: path.join(options.output, 'result-inventory.preseal.json'), sha256: inventory.sha256 };
}

export function captureExitCode(summary) {
  return ['raw-unbound-awaiting-binding-review', 'raw-associated-awaiting-source-and-metric-review'].includes(summary.status) ? 2 : 1;
}

export function captureAppMemory(input, { run = defaultRun } = {}) {
  const options = Object.fromEntries(['result', 'output', 'context'].map(key => {
    assert.equal(typeof input[key], 'string'); return [key, path.resolve(input[key])];
  }));
  for (const file of Object.values(options)) noSymlinks(file);
  for (const file of [options.result, options.context]) {
    assert.ok(!inside(file, options.output) && !inside(options.output, file), 'Evidence output/input overlap');
  }
  mkdirSync(path.dirname(options.output), { recursive: true });
  mkdirSync(options.output, { mode: 0o700 }); // Exclusive: never reuse any prior evidence.
  const rootStat = lstatSync(options.output), commands = [];
  const owned = () => {
    noSymlinks(options.output); const s = lstatSync(options.output);
    assert.ok(s.isDirectory() && s.dev === rootStat.dev && s.ino === rootStat.ino, 'Owned output root changed');
  };
  const write = (name, bytes) => {
    owned(); assert.ok(/^[a-z0-9.-]+$/.test(name));
    writeFileSync(path.join(options.output, name), bytes, { flag: 'wx', mode: 0o600 });
  };
  const jsonCommand = (args, name) => {
    let bytes;
    try {
      bytes = Buffer.from(readerSession.command(args)); assert.ok(bytes.length > 0 && bytes.length <= MAX, 'Missing/oversized raw JSON');
      commands.push({ arguments: ['xcresulttool', ...args], exit_code: 0 });
    } catch (error) {
      commands.push({ arguments: ['xcresulttool', ...args], exit_code: error.status ?? null }); throw error;
    }
    write(name, bytes); return JSON.parse(text(bytes));
  };
  let context = null, id = null, testResult = null, summary, binding = null, fingerprint = null, resultSeal = null, readerSession = null;
  try {
    const contextBytes = regular(options.context); write('context.raw.json', contextBytes);
    context = JSON.parse(text(contextBytes)); validateContext(context);
    const bundle = lstatSync(options.result); assert.ok(bundle.isDirectory() && !bundle.isSymbolicLink(), 'Missing real xcresult directory');
    fingerprint = fingerprintResult(options.result);
    write('result-inventory.raw.json', JSON.stringify(fingerprint, null, 2) + '\n');
    const preseal = context.result_binding?.preseal_inventory;
    if (Array.isArray(preseal?.files)) write('preseal-file-comparison.json', JSON.stringify(inventoryDifference(preseal, fingerprint), null, 2) + '\n');
    if (context.result_binding?.inventory_sha256 != null) assert.equal(context.result_binding.inventory_sha256, fingerprint.sha256, 'Stale or wrong context result inventory');
    if (!preseal || preseal.algorithm !== fingerprint.algorithm || !Array.isArray(preseal.files)) throw new UnboundEvidenceError('Missing or unobserved original preseal file inventory');
    assert.equal(preseal.sha256, context.result_binding.inventory_sha256, 'Preseal inventory/context mismatch');
    readerSession = beginReaderSession({ source: options.result, output: options.output, expected: preseal, fingerprint: fingerprintResult, write, owned, run });
    const report = jsonCommand(['get', 'test-results', 'tests', '--path', readerSession.result, '--compact'], 'tests.raw.json');
    const executed = exactCase(report); id = executed.nodeIdentifier; testResult = executed.result;
    const details = jsonCommand(['get', 'test-results', 'test-details', '--test-id', id, '--path', readerSession.result, '--compact'], 'test-details.raw.json');
    assert.equal(details.testIdentifier, id); assert.equal(details.testResult, testResult);
    assert.equal(details.hasPerformanceMetrics, true, 'Missing performance metrics');
    const csvRoot = path.join(options.output, 'metrics-csv'); owned(); mkdirSync(csvRoot, { mode: 0o700 });
    const csvArgs = ['export', 'metrics', '--test-id', id, '--path', readerSession.result, '--output-path', csvRoot];
    try { readerSession.command(csvArgs); commands.push({ arguments: ['xcresulttool', ...csvArgs], exit_code: 0 }); }
    catch (error) { commands.push({ arguments: ['xcresulttool', ...csvArgs], exit_code: error.status ?? null }); throw error; }
    const csv = []; let bytesTotal = 0, filesTotal = 0;
    const inventoryCSV = (directory, depth = 0) => {
      assert.ok(depth <= 4); owned();
      for (const name of readdirSync(directory).sort()) {
        const file = path.join(directory, name), s = lstatSync(file);
        assert.ok(!s.isSymbolicLink(), 'Symlink in raw CSV export');
        if (s.isDirectory()) inventoryCSV(file, depth + 1);
        else {
          assert.ok(++filesTotal <= 32 && s.isFile());
          const bytes = regular(file, 8 * 1024 * 1024); bytesTotal += bytes.length;
          assert.ok(bytesTotal <= 64 * 1024 * 1024);
          if (name.endsWith('.csv')) { text(bytes); csv.push({ file: path.relative(options.output, file), bytes: bytes.length, sha256: hash(bytes) }); }
        }
      }
    };
    inventoryCSV(csvRoot); assert.ok(csv.length > 0, 'No nonempty test-scoped raw CSV');
    const invocation = jsonCommand(['get', 'object', '--legacy', '--path', readerSession.result, '--format', 'json'], 'invocation.legacy.raw.json');
    const actions = invocation.actions?._values;
    if (!Array.isArray(actions)) throw new UnboundEvidenceError('Unobserved legacy action schema');
    assert.equal(actions.length, 1, 'Expected one dedicated test action');
    const ref = actions[0].actionResult?.testsRef?.id?._value;
    if (ref === undefined) throw new UnboundEvidenceError('Unknown testsRef schema; cannot resolve plan');
    assert.equal(typeof ref, 'string'); assert.ok(ref.length > 0 && ref.length < 500);
    const plan = jsonCommand(['get', 'object', '--legacy', '--path', readerSession.result, '--id', ref, '--format', 'json'], 'test-plan.legacy.raw.json');
    const metadataEntries = []; walk(plan, node => {
      if (node._type?._name === 'ActionTestMetadata' && node.identifier?._value === id) metadataEntries.push(node);
    });
    if (metadataEntries.length === 0) throw new UnboundEvidenceError('Unobserved summary-reference schema');
    assert.equal(metadataEntries.length, 1, 'Ambiguous test summary reference');
    const metadata = metadataEntries[0], refs = [metadata.summaryRef?.id?._value];
    if (refs[0] === undefined) throw new UnboundEvidenceError('Unknown summaryRef schema');
    assert.ok(typeof refs[0] === 'string' && refs[0].length > 0, 'Invalid test summary reference');
    const rawSummary = jsonCommand(['get', 'object', '--legacy', '--path', readerSession.result, '--id', refs[0], '--format', 'json'], 'test-summary.legacy.raw.json');
    if (rawSummary._type?._name !== 'ActionTestSummary') throw new UnboundEvidenceError('Unobserved test summary schema');
    assert.equal(rawSummary.identifier?._value, id);
    const rows = rawSummary.performanceMetrics?._values;
    assert.ok(Array.isArray(rows) && rows.length > 0, 'Missing typed metric rows');
    // Preserve every raw field/value, including unknown units or signed growth.
    // No cardinality, sample count, sign, identifiers, units or CSV schema adopted.
    write('typed-metrics.raw.json', JSON.stringify({ source: 'test-summary.legacy.raw.json#/performanceMetrics/_values', raw_metrics: rows }, null, 2) + '\n');
    if (!rows.every(row => row._type?._name === 'ActionTestPerformanceMetricSummary')) throw new UnboundEvidenceError('Unobserved typed metric row schema');
    assert.ok(rows.every(row => Array.isArray(row.measurements?._values) && row.measurements._values.length > 0), 'Missing typed measurements');
    assert.equal(testResult, 'Passed', 'Executed test failed; no accepted measurement');
    assert.equal(rawSummary.testStatus?._value, 'Success', 'Unverified legacy test result mapping');
    binding = crossCheckRawIdentity({ report, executed, details, invocation, plan, metadata, rawSummary, context, fingerprint, planRef: ref, summaryRef: refs[0] });
    summary = { schema_version: 1, status: binding.stage === 'raw-unbound' ? 'raw-unbound-awaiting-binding-review' : 'raw-associated-awaiting-source-and-metric-review', test_id: id, test_result: testResult, binding,
      context, csv, measurements: null, observed: { ...protocol.observed }, metric_contract_status: 'unobserved',
      acceptance_status: 'unadopted', product_budget: null,
      note: 'Source head/tree and package revision remain external assertions, not verified from xcresult. Review binding plus memory rows/units/samples/warm-up/CSV and protocol attachment before adoption.' };
  } catch (error) {
    if (error instanceof UnboundEvidenceError) binding = { stage: 'raw-unbound', complete_source_binding: false, unknown_or_unbound: [error.message], source_identity: { status: 'trusted-external-workflow-context-only', xcresult_verified: false } };
    summary = { schema_version: 1, status: error instanceof UnboundEvidenceError ? 'raw-unbound-awaiting-binding-review' : 'failed-or-unavailable', error: error.message, test_id: id, test_result: testResult, binding,
      context, measurements: null, observed: { ...protocol.observed }, metric_contract_status: 'unobserved', acceptance_status: 'unadopted', product_budget: null };
  } finally {
    if (readerSession !== null) {
      try { readerSession.finish(); }
      catch (error) { summary = { ...summary, status: 'failed-or-unavailable', error: 'Reader isolation recheck failed: ' + error.message,
        binding: { stage: 'invalidated-reader-copy-or-original', complete_source_binding: false }, measurements: null,
        observed: { ...protocol.observed }, metric_contract_status: 'unobserved', acceptance_status: 'unadopted', product_budget: null }; }
    }
    // Every handled exit after an initial seal must recheck it, including an
    // early UnboundEvidenceError. Seal failure overrides any pending status.
    if (fingerprint !== null) {
      try {
        const after = fingerprintResult(options.result);
        assert.equal(after.sha256, fingerprint.sha256, 'xcresult bytes changed during capture');
        resultSeal = { status: 'matched-before-and-after', before_sha256: fingerprint.sha256, after_sha256: after.sha256 };
      } catch (error) {
        resultSeal = { status: 'changed-or-unavailable', before_sha256: fingerprint.sha256, after_sha256: null, error: error.message };
        summary = { ...summary, status: 'failed-or-unavailable', error: 'Result seal recheck failed: ' + error.message,
          binding: { stage: 'invalidated-result-seal', complete_source_binding: false }, measurements: null,
          observed: { ...protocol.observed }, metric_contract_status: 'unobserved', acceptance_status: 'unadopted', product_budget: null };
      }
    }
  }
  summary.reader_isolation_receipt = readerSession === null ? null : 'reader-isolation.final.json';
  summary.result_seal = resultSeal ?? { status: 'not-established', before_sha256: null, after_sha256: null };
  summary.source_identity = { status: 'trusted-external-workflow-context-only', xcresult_verified: false,
    asserted_source_head: context?.source_head ?? null, asserted_source_tree: context?.source_tree ?? null,
    note: 'No actual source head/tree, Debug product build configuration or package revision is verified from xcresult by this collector.' };
  write('capture-commands.json', JSON.stringify(commands, null, 2) + '\n');
  write('memory-observation-summary.json', JSON.stringify(summary, null, 2) + '\n');
  const files = []; let inventoryTruncated = false;
  const inventory = (directory, depth = 0) => {
    if (depth > 8 || files.length >= 128) { inventoryTruncated = true; return; }
    for (const name of readdirSync(directory).sort()) {
      const file = path.join(directory, name), s = lstatSync(file);
      if (s.isSymbolicLink()) continue; // Failure evidence keeps the rejected leaf; never follow it.
      if (s.isDirectory()) inventory(file, depth + 1);
      else if (s.isFile()) {
        const bounded = s.size <= MAX, bytes = bounded ? readFileSync(file) : null;
        files.push({ file: path.relative(options.output, file), bytes: s.size, sha256: bytes ? hash(bytes) : null, hash_status: bounded ? 'hashed' : 'unavailable-over-bound' });
      }
    }
  };
  owned(); inventory(options.output);
  write('capture-manifest.json', JSON.stringify({ schema_version: 1, status: summary.status, result_path: options.result, files, inventory_truncated: inventoryTruncated,
    raw_xcresult_retention: 'Caller retains the original result bundle alongside this capture, including the protocol attachment.' }, null, 2) + '\n');
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), input = {}, seal = args[0] === '--seal';
    if (seal) args.shift();
    assert.equal(args.length, 6, 'Use [--seal] --result <xcresult> --output <new directory> --context <JSON>');
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace(/^--/, ''); assert.ok(['result', 'output', 'context'].includes(key) && !Object.hasOwn(input, key)); input[key] = args[i + 1];
    }
    if (seal) { console.log(JSON.stringify(sealAppMemoryContext(input), null, 2)); process.exitCode = 0; }
    else { const summary = captureAppMemory(input); console.log(JSON.stringify(summary, null, 2)); process.exitCode = captureExitCode(summary); }
  } catch (error) {
    console.error(JSON.stringify({ status: 'failed-or-unavailable', error: error.message, measurements: null, acceptance_status: 'unadopted' })); process.exitCode = 1;
  }
}
