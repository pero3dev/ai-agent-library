import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, readdirSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { RAW_ARTIFACT, PARSER_GATE, verifyParserEvent, UnknownReparseEvidence, verifyArtifactMetadata, downloadExistingArtifact, extractExistingArtifact, prepareDerivedContext, reparseExistingArtifact } from '../../ios/tests/reparse-app-memory-artifact.mjs';
import path from 'node:path';
import { captureAppMemory, captureExitCode, fingerprintResult, sealAppMemoryContext, defaultRun } from '../../ios/tests/capture-app-memory.mjs';

import { beginReaderSession, READER_LIMITS } from '../../ios/tests/app-memory-reader-session.mjs';

const protocol = JSON.parse(readFileSync(new URL('../../ios/tests/app-memory-observation-protocol.json', import.meta.url)));
const id = protocol.selector + '()';
const digest = value => createHash('sha256').update(value).digest('hex');
function fixture(t) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ailibrary-memory-capture-test-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const input = { result: path.join(root, 'test.xcresult'), output: path.join(root, 'capture'), context: path.join(root, 'context.json') };
  mkdirSync(input.result); writeFileSync(path.join(input.result, 'raw-marker'), 'SYNTHETIC result; no SDK invocation');
  const context = { source_head: 'a'.repeat(40), source_tree: 'b'.repeat(40), configuration: 'Debug', expected_articles: 199,
    actual_app_package: { status: 'passed', articles: 199, revision: 'c'.repeat(64) }, scenario: protocol.scenario,
    query: protocol.query, target_id: protocol.target_id, selector: protocol.selector, declared_iteration_count: 5, diagnostics_enabled: false };
  const deviceID = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
  const actionStart = Date.parse('2026-10-26T10:00:00.000+0000'), actionEnd = actionStart + 30000;
  context.result_binding = { inventory_sha256: fingerprintResult(input.result).sha256, preseal_inventory: fingerprintResult(input.result), expected_device_id: deviceID,
    expected_configuration_id: '1', expected_configuration_name: 'Test Scheme Action',
    action_window: { not_before_ms: actionStart - 1000, not_after_ms: actionEnd + 1000 } };
  const saveContext = () => writeFileSync(input.context, JSON.stringify(context)); saveContext();
  const metric = (name, unit, values) => ({ _type: { _name: 'ActionTestPerformanceMetricSummary' },
    identifier: { _value: 'unadopted.' + name }, displayName: { _value: name }, unitOfMeasurement: { _value: unit },
    measurements: { _values: values.map(value => ({ _type: { _name: 'Double' }, _value: value })) } });
  const typed = (value, type = 'String') => ({ _type: { _name: type }, _value: value });
  const reference = (value, target) => ({ _type: { _name: 'Reference' }, id: typed(value), targetType: { name: typed(target) } });
  const device = { architecture: 'arm64', deviceId: deviceID, deviceName: 'iPhone 16', modelName: 'iPhone 16',
    osBuildNumber: '22F77', osVersion: '18.5', platform: 'iOS Simulator' };
  const config = { configurationId: '1', configurationName: 'Test Scheme Action' };
  const url = 'test://com.apple.xcode/AILibrary/AILibraryUITests/' + protocol.class_name + '/' + protocol.method;
  const metadata = { _type: { _name: 'ActionTestMetadata' }, identifier: typed(id), identifierURL: typed(url),
    testStatus: typed('Success'), summaryRef: reference('SUMMARY', 'ActionTestSummary') };
  const data = {
    tests: { devices: [structuredClone(device)], testPlanConfigurations: [structuredClone(config)],
      testNodes: [{ nodeType: 'Test Case', nodeIdentifier: id, nodeIdentifierURL: url, result: 'Passed' }] },
    details: { testIdentifier: id, testIdentifierURL: url, testResult: 'Passed', hasPerformanceMetrics: true,
      devices: [structuredClone(device)], testPlanConfigurations: [structuredClone(config)], startTime: actionStart / 1000 + 1,
      testRuns: [{ nodeType: 'Device', nodeIdentifier: deviceID, name: 'iPhone 16', result: 'Passed',
        children: [{ nodeType: 'Test Plan Configuration', nodeIdentifier: '1', name: 'Test Scheme Action', result: 'Passed' }] }] },
    invocation: { _type: { _name: 'ActionsInvocationRecord' }, actions: { _values: [{ _type: { _name: 'ActionRecord' },
      actionResult: { _type: { _name: 'ActionResult' }, status: typed('succeeded'), testsRef: reference('PLAN', 'ActionTestPlanRunSummaries') },
      schemeCommandName: typed('Test'), schemeTaskName: typed('Action'), testPlanName: typed('AILibrary'),
      startedTime: typed(new Date(actionStart).toISOString(), 'Date'), endedTime: typed(new Date(actionEnd).toISOString(), 'Date'),
      runDestination: { _type: { _name: 'ActionRunDestinationRecord' }, targetArchitecture: typed('arm64'), targetDeviceRecord: { _type: { _name: 'ActionDeviceRecord' }, identifier: typed(deviceID), name: typed('iPhone 16'),
        operatingSystemVersion: typed('18.5'), nativeArchitecture: typed('arm64'),
        platformRecord: { identifier: typed('com.apple.platform.iphonesimulator') } } } }] } },
    plan: { _type: { _name: 'ActionTestPlanRunSummaries' }, summaries: { _values: [{ name: typed('Test Scheme Action'),
      testableSummaries: { _values: [{ targetName: typed('AILibraryUITests'), testKind: typed('UI'), tests: { _values: [metadata] } }] } }] } },
    summary: { _type: { _name: 'ActionTestSummary' }, identifier: typed(id), identifierURL: typed(url), testStatus: typed('Success'),
      performanceMetrics: { _values: [metric('memoryPeak-unknown', 'unknown-memory-unit', ['20.0', '21.1']),
        metric('memoryGrowth-unknown', 'unknown-growth-unit', ['-1.25', '0.4']), metric('Clock-unadopted-here', 'unknown-clock-unit', ['1.2', '1.4'])] } },
    CSV: '"Unadopted arbitrary columns","Growth possibly negative","More columns"\n"unknown","-1.25 unknown-unit","no clock schema copied"\n'
  };
  const commands = [], options = { mutateReaderOnInvocation: false, emptyCSV: false, noCSV: false, symlinkCSV: false, failDetails: false, mutateOnInvocation: false, removeOnInvocation: false };
  const run = args => {
    commands.push(args);
    if (args[0] === 'export') {
      const output = args[args.indexOf('--output-path') + 1], file = path.join(output, 'unknown-memory-and-clock.csv');
      if (options.symlinkCSV) symlinkSync(input.context, file);
      else if (!options.noCSV) writeFileSync(file, options.emptyCSV ? '' : data.CSV);
      return Buffer.alloc(0);
    }
    let value;
    if (args[1] === 'test-results' && args[2] === 'tests') value = data.tests;
    else if (args[1] === 'test-results' && args[2] === 'test-details') {
      if (options.failDetails) { const error = new Error('synthetic tool failure'); error.status = 9; throw error; }
      value = data.details;
    } else {
      const ref = args.includes('--id') ? args[args.indexOf('--id') + 1] : null;
      value = ref === 'PLAN' ? data.plan : ref === 'SUMMARY' ? data.summary : data.invocation;
    }
    if (value === data.invocation && options.mutateReaderOnInvocation) writeFileSync(path.join(args[args.indexOf('--path') + 1], 'raw-marker'), 'MUTATED reader copy only');
    if (value === data.invocation && options.mutateOnInvocation) writeFileSync(path.join(input.result, 'raw-marker'), 'MUTATED during raw capture');
    if (value === data.invocation && options.removeOnInvocation) rmSync(input.result, { recursive: true });
    return Buffer.from(JSON.stringify(value));
  };
  return { root, input, context, saveContext, data, metadata, commands, options,
    capture: () => captureAppMemory(input, { run }),
    saved: name => JSON.parse(readFileSync(path.join(input.output, name), 'utf8')) };
}

// All tools below are fixtures. No xcrun, XCTest, SDK, Simulator or network runs.
test('multiple raw memory rows and signed growth stay raw, with arbitrary CSV and an exit2 review gate', t => {
  const value = fixture(t), before = digest(readFileSync(value.input.context));
  const result = value.capture();
  assert.equal(result.status, 'raw-associated-awaiting-source-and-metric-review');
  assert.equal(result.binding.complete_source_binding, false); assert.equal(result.binding.source_identity.xcresult_verified, false);
  assert.equal(captureExitCode(result), 2); assert.equal(result.measurements, null);
  assert.equal(result.acceptance_status, 'unadopted'); assert.equal(result.metric_contract_status, 'unobserved');
  assert.equal(result.result_seal.status, 'matched-before-and-after');
  assert.ok(Object.values(result.observed).every(item => item === null));
  const typed = value.saved('typed-metrics.raw.json');
  assert.equal(typed.raw_metrics.length, 3);
  assert.equal(typed.raw_metrics[1].measurements._values[0]._value, '-1.25');
  assert.equal(typed.raw_metrics[1].unitOfMeasurement._value, 'unknown-growth-unit');
  assert.equal(readFileSync(path.join(value.input.output, result.csv[0].file), 'utf8'), value.data.CSV);
  assert.equal(digest(readFileSync(value.input.context)), before);
  assert.equal(readFileSync(path.join(value.input.result, 'raw-marker'), 'utf8'), 'SYNTHETIC result; no SDK invocation');
  assert.ok(value.saved('capture-manifest.json').files.every(file => typeof file.sha256 === 'string'));
});

test('old Clock case, multiple cases, or skipped case cannot be accepted as the new observation', t => {
  for (const change of [data => { data.tests.testNodes[0].nodeIdentifier = 'PublishedPerformanceUITests/testLaunchToPublishedReadiness()'; },
    data => { data.tests.testNodes.push({ ...data.tests.testNodes[0] }); }, data => { data.tests.testNodes[0].result = 'Skipped'; }]) {
    const value = fixture(t); change(value.data); const result = value.capture();
    assert.equal(captureExitCode(result), 1); assert.equal(result.measurements, null);
    assert.equal(result.status, 'failed-or-unavailable');
    assert.ok(existsSync(path.join(value.input.output, 'tests.raw.json')));
  }
});

test('details, actual device, action and summary identity must bind to the exact single case', t => {
  for (const change of [data => { data.details.testIdentifier = 'wrong'; }, data => { data.details.devices[0].osVersion = 'unobserved'; },
    data => { data.invocation.actions._values.push(data.invocation.actions._values[0]); }, data => { data.summary.identifier._value = 'wrong'; },
    data => { data.details.testPlanConfigurations.push(data.details.testPlanConfigurations[0]); }]) {
    const value = fixture(t); change(value.data); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(result.measurements, null);
  }
});

test('missing typed rows or measurements are unavailable and never become zero samples', t => {
  for (const change of [data => { delete data.summary.performanceMetrics; }, data => { data.summary.performanceMetrics._values = []; },
    data => { delete data.summary.performanceMetrics._values[0].measurements; }]) {
    const value = fixture(t); change(value.data); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(result.measurements, null);
    assert.equal(result.observed.sample_values, null); assert.equal(result.observed.recorded_sample_count, null);
    assert.ok(existsSync(path.join(value.input.output, 'test-summary.legacy.raw.json')));
  }
});

test('the independently audited full app package and protocol must agree before any tool request', t => {
  for (const change of [context => { context.actual_app_package.articles = 3; }, context => { context.query = 'different query'; },
    context => { context.diagnostics_enabled = true; }]) {
    const value = fixture(t); change(value.context); value.saveContext(); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(value.commands.length, 0);
  }
});

test('missing, empty or symlink CSV cannot be mistaken for a measured zero', { skip: process.platform === 'win32' }, t => {
  for (const option of ['noCSV', 'emptyCSV', 'symlinkCSV']) {
    const value = fixture(t); value.options[option] = true; const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(result.measurements, null);
  }
});

test('failed test and failed tool retain diagnostic raw data and commands without accepted samples', t => {
  const failed = fixture(t); failed.data.tests.testNodes[0].result = 'Failed'; failed.data.details.testResult = 'Failed';
  const a = failed.capture(); assert.equal(a.status, 'failed-or-unavailable'); assert.equal(a.measurements, null);
  assert.equal(a.result_seal.status, 'matched-before-and-after');
  assert.ok(existsSync(path.join(failed.input.output, 'typed-metrics.raw.json')));
  const tool = fixture(t); tool.options.failDetails = true; const b = tool.capture();
  assert.equal(b.status, 'failed-or-unavailable'); assert.equal(b.measurements, null);
  assert.equal(b.result_seal.status, 'matched-before-and-after');
  assert.equal(tool.saved('capture-commands.json').at(-1).exit_code, 9);
  assert.ok(existsSync(path.join(tool.input.output, 'tests.raw.json')));
});

test('fresh exclusive output and nonoverlap protect prior evidence and all inputs', t => {
  const value = fixture(t); mkdirSync(value.input.output); const sentinel = path.join(value.input.output, 'keep'); writeFileSync(sentinel, 'preserve');
  assert.throws(value.capture, /EEXIST/); assert.equal(readFileSync(sentinel, 'utf8'), 'preserve');
  rmSync(value.input.output, { recursive: true }); value.input.output = value.input.result;
  assert.throws(value.capture, /overlap/);
  assert.equal(readFileSync(path.join(value.input.result, 'raw-marker'), 'utf8'), 'SYNTHETIC result; no SDK invocation');
});


test('wrong actual UUID in any modern/legacy/context link is rejected despite matching display names', t => {
  const wrong = '11111111-2222-3333-4444-555555555555';
  for (const change of [v => { v.data.tests.devices[0].deviceId = wrong; }, v => { v.data.details.devices[0].deviceId = wrong; },
    v => { v.data.details.testRuns[0].nodeIdentifier = wrong; },
    v => { v.data.invocation.actions._values[0].runDestination.targetDeviceRecord.identifier._value = wrong; },
    v => { v.context.result_binding.expected_device_id = wrong; v.saveContext(); }]) {
    const value = fixture(t); change(value); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(result.measurements, null); assert.equal(captureExitCode(result), 1);
    assert.match(result.error, /UUID|Identity mismatch/);
  }
});

test('actual configuration IDs, run nodes and legacy plan identity must agree with context', t => {
  for (const change of [v => { v.data.tests.testPlanConfigurations[0].configurationId = '2'; },
    v => { v.data.details.testRuns[0].children[0].nodeIdentifier = '2'; },
    v => { v.data.plan.summaries._values[0].name._value = 'Other Configuration'; },
    v => { v.context.result_binding.expected_configuration_id = '2'; v.saveContext(); }]) {
    const value = fixture(t); change(value); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.match(result.error, /configuration/);
  }
});

test('wrong action status/command and testsRef or summaryRef target cannot bind a matching case', t => {
  for (const change of [v => { v.data.invocation.actions._values[0].actionResult.status._value = 'cancelled'; },
    v => { v.data.invocation.actions._values[0].schemeCommandName._value = 'Build'; },
    v => { v.data.invocation.actions._values[0].actionResult.testsRef.targetType.name._value = 'WrongPlanType'; },
    v => { v.metadata.summaryRef.targetType.name._value = 'WrongSummaryType'; }]) {
    const value = fixture(t); change(value); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.match(result.error, /Identity mismatch/);
  }
});

test('stale external context result seal or invocation window fails without rebadging old raw', t => {
  const seal = fixture(t); writeFileSync(path.join(seal.input.result, 'raw-marker'), 'DIFFERENT result bytes');
  const a = seal.capture(); assert.equal(a.status, 'failed-or-unavailable'); assert.match(a.error, /Stale or wrong context/); assert.equal(seal.commands.length, 0);
  const window = fixture(t); window.context.result_binding.action_window.not_before_ms += 100000;
  window.context.result_binding.action_window.not_after_ms += 100000; window.saveContext();
  const b = window.capture(); assert.equal(b.status, 'failed-or-unavailable'); assert.match(b.error, /Stale context/);
});

test('unobserved identity schema or missing external UUID/config stays raw-unbound exit2', t => {
  for (const change of [v => { delete v.data.tests.devices; }, v => { delete v.data.details.testRuns; },
    v => { v.context.result_binding.expected_device_id = null; v.context.result_binding.expected_configuration_id = null; v.saveContext(); },
    v => { delete v.data.invocation.actions._values[0].actionResult.testsRef; },
    v => { v.data.invocation._type._name = 'UnobservedInvocationV2'; },
    v => { v.data.summary._type._name = 'UnobservedSummaryV2'; }]) {
    const value = fixture(t); change(value); const result = value.capture();
    assert.equal(result.status, 'raw-unbound-awaiting-binding-review'); assert.equal(captureExitCode(result), 2);
    assert.equal(result.measurements, null); assert.equal(result.binding.complete_source_binding, false);
    assert.ok(result.binding.unknown_or_unbound.length > 0);
    assert.equal(result.result_seal.status, 'matched-before-and-after');
  }
});

test('well-shaped source head/tree remain external assertions rather than xcresult-verified source identity', t => {
  const value = fixture(t); value.context.source_head = 'd'.repeat(40); value.context.source_tree = 'e'.repeat(40); value.saveContext();
  const result = value.capture(); assert.equal(captureExitCode(result), 2);
  assert.equal(result.binding.source_identity.status, 'trusted-external-workflow-context-only');
  assert.equal(result.binding.source_identity.xcresult_verified, false); assert.equal(result.binding.complete_source_binding, false);
  assert.equal(result.binding.source_identity.asserted_source_head, 'd'.repeat(40)); assert.equal(result.measurements, null);
});


test('early unbound schema cannot hide result mutation after the initial seal', t => {
  const value = fixture(t); value.options.mutateOnInvocation = true;
  delete value.data.invocation.actions._values[0].actionResult.testsRef;
  const result = value.capture();
  assert.equal(result.status, 'failed-or-unavailable'); assert.equal(captureExitCode(result), 1);
  assert.equal(result.result_seal.status, 'changed-or-unavailable');
  assert.match(result.error, /Result seal recheck failed/); assert.equal(result.measurements, null);
  assert.ok(existsSync(path.join(value.input.output, 'reader-command-04.stdout.raw')));
  assert.ok(existsSync(path.join(value.input.output, 'metrics-csv', 'unknown-memory-and-clock.csv')));
});

test('early unbound schema cannot hide an unavailable result at the final rehash', t => {
  const value = fixture(t); value.options.removeOnInvocation = true;
  delete value.data.invocation.actions._values[0].actionResult.testsRef;
  const result = value.capture();
  assert.equal(result.status, 'failed-or-unavailable'); assert.equal(captureExitCode(result), 1);
  assert.equal(result.result_seal.status, 'changed-or-unavailable');
  assert.match(result.error, /Result seal recheck failed/); assert.equal(result.measurements, null);
  assert.ok(existsSync(path.join(value.input.output, 'reader-command-04.stdout.raw')));
});

// Synthetic custom display names model the observed B16 name/model distinction.
test('owned custom display name preserves UUID binding while modelName is required independently', t => {
  const value = fixture(t), name = 'AILibrary-app-memory-synthetic-owned-device';
  value.data.tests.devices[0].deviceName = name; value.data.details.devices[0].deviceName = name;
  value.data.details.testRuns[0].name = name;
  value.data.invocation.actions._values[0].runDestination.targetDeviceRecord.name._value = name;
  const result = value.capture();
  assert.equal(result.status, 'raw-associated-awaiting-source-and-metric-review');
  assert.equal(captureExitCode(result), 2); assert.equal(result.measurements, null);
  assert.ok(result.binding.checked.includes('requested model'));
  assert.ok(result.binding.checked.includes('external context device UUID'));
  assert.equal(result.binding.observed_common_identity.device_id, value.context.result_binding.expected_device_id);
  assert.equal(result.binding.complete_source_binding, false);
  assert.equal(result.result_seal.status, 'matched-before-and-after');

  const unknown = fixture(t);
  delete unknown.data.tests.devices[0].modelName; delete unknown.data.details.devices[0].modelName;
  const unbound = unknown.capture();
  assert.equal(unbound.status, 'raw-unbound-awaiting-binding-review'); assert.equal(captureExitCode(unbound), 2);
  assert.ok(unbound.binding.unknown_or_unbound.includes('device model'));
  assert.equal(unbound.measurements, null); assert.equal(unbound.result_seal.status, 'matched-before-and-after');
});

test('iPhone 16 display name cannot mask a wrong model or disagreement between raw device names', t => {
  for (const [change, expected] of [
    [v => { v.data.tests.devices[0].modelName = 'iPhone 17'; v.data.details.devices[0].modelName = 'iPhone 17'; }, /requested model/],
    [v => { v.data.tests.devices[0].deviceName = 'different modern list name'; }, /device deviceName/],
    [v => { v.data.invocation.actions._values[0].runDestination.targetDeviceRecord.name._value = 'different legacy name'; }, /legacy device name/]
  ]) {
    const value = fixture(t); change(value); const result = value.capture();
    assert.equal(result.status, 'failed-or-unavailable'); assert.equal(captureExitCode(result), 1);
    assert.match(result.error, expected); assert.equal(result.measurements, null);
    assert.equal(result.result_seal.status, 'matched-before-and-after');
  }
});

// These tests describe the new isolation boundary, not an adopted result schema.
test('preseal saves the complete source filelist and collector commands target only a byte-identical owned reader copy', t => {
  const value = fixture(t), before = fingerprintResult(value.input.result);
  value.context.result_binding.inventory_sha256 = null; delete value.context.result_binding.preseal_inventory; value.saveContext();
  const sealed = sealAppMemoryContext({ ...value.input, output: path.join(value.root, 'sealed') });
  assert.deepEqual(JSON.parse(readFileSync(sealed.inventory)), before);
  const context = JSON.parse(readFileSync(sealed.context));
  assert.deepEqual(context.result_binding.preseal_inventory, before);
  assert.equal(context.result_binding.expected_configuration_id, '1');
  value.input.context = sealed.context; const result = value.capture();
  assert.equal(captureExitCode(result), 2); assert.equal(result.measurements, null);
  assert.ok(value.commands.length > 0);
  for (const args of value.commands) assert.equal(args[args.indexOf('--path') + 1], path.join(value.input.output, 'reader-copy.xcresult'));
  assert.deepEqual(fingerprintResult(value.input.result), before);
  assert.deepEqual(fingerprintResult(path.join(value.input.output, 'reader-copy.xcresult')), before);
  assert.equal(value.saved('reader-isolation.final.json').cleanup, 'owned-temp-cache-removed');
  assert.equal(value.saved('reader-command-01.receipt.json').original_difference.status, 'identical');
});

test('missing preseal inventory stays unknown while a known preseal file change fails before official reads with relative diff evidence', t => {
  const unknown = fixture(t); delete unknown.context.result_binding.preseal_inventory; unknown.saveContext();
  const unbound = unknown.capture(); assert.equal(captureExitCode(unbound), 2); assert.equal(unknown.commands.length, 0);
  assert.match(unbound.error, /preseal file inventory/); assert.equal(unbound.measurements, null);
  const changed = fixture(t); writeFileSync(path.join(changed.input.result, 'raw-marker'), 'changed after sealing');
  const failed = changed.capture(); assert.equal(captureExitCode(failed), 1); assert.equal(changed.commands.length, 0);
  assert.deepEqual(changed.saved('preseal-file-comparison.json').changed, ['raw-marker']);
  assert.equal(readFileSync(path.join(changed.input.result, 'raw-marker'), 'utf8'), 'changed after sealing');
});

test('a reader mutation is retained as a named copy mismatch without changing the immutable original or adopting raw values', t => {
  const value = fixture(t), before = fingerprintResult(value.input.result); value.options.mutateReaderOnInvocation = true;
  const result = value.capture(); assert.equal(captureExitCode(result), 1); assert.equal(result.measurements, null);
  assert.equal(result.result_seal.status, 'matched-before-and-after');
  assert.deepEqual(fingerprintResult(value.input.result), before);
  const receipt = value.saved('reader-command-04.receipt.json');
  assert.deepEqual(receipt.copy_difference.changed, ['raw-marker']); assert.equal(receipt.original_difference.status, 'identical');
  assert.equal(readFileSync(path.join(value.input.output, 'reader-copy.xcresult/raw-marker'), 'utf8'), 'MUTATED reader copy only');
  assert.ok(value.saved('reader-command-04.copy-after.json').files.some(file => file.path === 'raw-marker'));
  assert.ok(existsSync(path.join(value.input.output, 'reader-command-04.stdout.raw')));
  assert.equal(value.saved('reader-isolation.final.json').reader_difference.status, 'different');
  assert.equal(value.saved('reader-isolation.final.json').cleanup, 'owned-temp-cache-removed');
});

test('a forged preseal filelist cannot reuse a matching context hash to pass the copy boundary', t => {
  const value = fixture(t); value.context.result_binding.preseal_inventory.files[0].sha256 = 'f'.repeat(64); value.saveContext();
  const result = value.capture(); assert.equal(captureExitCode(result), 1); assert.equal(value.commands.length, 0);
  assert.match(result.error, /Corrupt preseal inventory/); assert.equal(result.measurements, null);
  assert.equal(result.result_seal.status, 'matched-before-and-after');
});

test('reader copy admission and command environment limits are explicit and cannot target the original', t => {
  const value = fixture(t), expected = fingerprintResult(value.input.result), out = path.join(value.root, 'reader-budget'); mkdirSync(out);
  const write = (name, bytes) => writeFileSync(path.join(out, name), bytes, { flag: 'wx' });
  let calls = 0;
  assert.throws(() => beginReaderSession({ source: value.input.result, output: out, expected, fingerprint: fingerprintResult, write, owned: () => {}, run: () => { calls++; }, limits: { ...READER_LIMITS, copy_bytes: 1 } }), /copy byte limit/);
  assert.equal(calls, 0); assert.ok(!existsSync(path.join(out, 'reader-copy.xcresult')));
  const other = path.join(value.root, 'reader-environment'); mkdirSync(other);
  const session = beginReaderSession({ source: value.input.result, output: other, expected, fingerprint: fingerprintResult, owned: () => {}, write: (name, bytes) => writeFileSync(path.join(other, name), bytes, { flag: 'wx' }),
    run: (args, options) => { assert.equal(args[args.indexOf('--path') + 1], path.join(other, 'reader-copy.xcresult')); assert.ok(options.timeout <= 60000); assert.equal(options.maxBuffer, 16 * 1024 * 1024); assert.equal(options.env.TMPDIR, path.join(other, 'reader-tmp')); assert.equal(options.env.CFFIXED_USER_HOME, path.join(other, 'reader-cache')); assert.equal(options.env.HOME, process.env.HOME); return Buffer.from('{}'); } });
  session.command(['get', 'test-results', 'tests', '--path', value.input.result]); session.finish();
  assert.ok(existsSync(value.input.result)); assert.ok(!existsSync(path.join(other, 'reader-tmp'))); assert.ok(!existsSync(path.join(other, 'reader-cache')));
});

test('oversized reader stdout fails with bounded receipt and retains original and reader evidence', t => {
  const value = fixture(t), out = path.join(value.root, 'reader-output-bound'); mkdirSync(out);
  const session = beginReaderSession({ source: value.input.result, output: out, expected: fingerprintResult(value.input.result), fingerprint: fingerprintResult, owned: () => {}, write: (name, bytes) => writeFileSync(path.join(out, name), bytes, { flag: 'wx' }), run: () => Buffer.from('oversized'), limits: { ...READER_LIMITS, command_bytes: 1 } });
  assert.throws(() => session.command(['get', 'test-results', 'tests', '--path', value.input.result]), /output limit/);
  assert.throws(() => session.command(['get', 'test-results', 'tests', '--path', value.input.result]), /already failed/);
  session.finish(); const receipt = JSON.parse(readFileSync(path.join(out, 'reader-command-01.receipt.json')));
  assert.equal(receipt.stdout_bytes, 9); assert.equal(receipt.copy_difference.status, 'identical');
  assert.ok(!existsSync(path.join(out, 'reader-command-01.stdout.raw')));
  assert.deepEqual(fingerprintResult(value.input.result), fingerprintResult(path.join(out, 'reader-copy.xcresult')));
});

test('seal preparation refuses an already sealed context instead of silently rebadging a prior mismatch', t => {
  const value = fixture(t), before = digest(readFileSync(value.input.context)), output = path.join(value.root, 'resealed');
  assert.throws(() => sealAppMemoryContext({ ...value.input, output }), /Refuse to reseal/);
  assert.equal(digest(readFileSync(value.input.context)), before); assert.ok(!existsSync(output));
});

// v6 deadlines use one monotonic window, including prehash and finalization work.
function timedReader(t, options = {}) {
  const value = fixture(t), output = path.join(value.root, 'timed-reader'); mkdirSync(output);
  const write = (name, bytes) => { writeFileSync(path.join(output, name), bytes, { flag: 'wx' }); options.onWrite?.(name); };
  const session = beginReaderSession({ source: value.input.result, output, expected: fingerprintResult(value.input.result),
    fingerprint: options.fingerprint ?? fingerprintResult, owned: () => {}, write, run: options.run ?? (() => Buffer.from('{}')),
    limits: { ...READER_LIMITS, total_ms: 10, command_ms: 5 }, clock: options.clock });
  return { value, output, session, command: () => session.command(['get', 'test-results', 'tests', '--path', value.input.result]),
    saved: name => JSON.parse(readFileSync(path.join(output, name))) };
}

test('slow exit0 beyond the shared monotonic deadline fails command and finish with raw stdout and timing receipts', t => {
  let now = 0; const r = timedReader(t, { clock: () => now, run: () => { now = 1001; return Buffer.from('retained slow exit0'); } });
  const original = fingerprintResult(r.value.input.result);
  assert.throws(r.command, /deadline exceeded/);
  const receipt = r.saved('reader-command-01.receipt.json');
  assert.equal(receipt.exit_code, 0); assert.equal(receipt.timing.after_return.session_exceeded, true);
  assert.equal(receipt.timing.after_return.command_exceeded, true); assert.match(receipt.error, /deadline/);
  assert.equal(readFileSync(path.join(r.output, 'reader-command-01.stdout.raw'), 'utf8'), 'retained slow exit0');
  assert.throws(r.session.finish, /deadline/); assert.equal(r.saved('reader-isolation.final.json').timing.after_cleanup.session_exceeded, true);
  assert.deepEqual(fingerprintResult(r.value.input.result), original);
});

test('per-command overrun fails even when the total session window has time left', t => {
  let now = 0; const r = timedReader(t, { clock: () => now, run: () => { now = 6; return Buffer.from('{}'); } });
  assert.throws(r.command, /deadline exceeded/); const receipt = r.saved('reader-command-01.receipt.json');
  assert.equal(receipt.timing.after_return.command_exceeded, true); assert.equal(receipt.timing.after_return.session_exceeded, false);
  assert.equal(receipt.exit_code, 0); r.session.finish();
});

test('prehash time is charged before any runner invocation', t => {
  let now = 0, armed = false, calls = 0;
  const r = timedReader(t, { clock: () => now, fingerprint: file => { const result = fingerprintResult(file); if (armed) now = 6; return result; }, run: () => { calls++; return Buffer.from('{}'); } });
  armed = true; assert.throws(r.command, /deadline exceeded/); assert.equal(calls, 0);
  const receipt = r.saved('reader-command-01.receipt.json'); assert.equal(receipt.exit_code, null);
  assert.equal(receipt.timing.after_prehash.command_exceeded, true); assert.equal(receipt.timing.after_return.command_exceeded, true);
  r.session.finish();
});

test('intent writes cannot leave a stale timeout that starts a runner after expiration', t => {
  let now = 0, calls = 0; const r = timedReader(t, { clock: () => now, onWrite: name => { if (name === 'reader-command-01.intent.json') now = 1001; }, run: () => { calls++; return Buffer.from('{}'); } });
  assert.throws(r.command, /deadline exceeded/); assert.equal(calls, 0);
  assert.equal(r.saved('reader-command-01.receipt.json').timing.before_runner.session_exceeded, true);
  assert.throws(r.session.finish, /deadline/);
});

test('default runner checks the shared deadline immediately before actual spawn without invoking an Apple tool', t => {
  let now = 0; const r = timedReader(t, { clock: () => now, run: (args, options) => { now = 1001; return defaultRun(args, options); } });
  assert.throws(r.command, /before actual spawn/); const receipt = r.saved('reader-command-01.receipt.json');
  assert.equal(receipt.process_receipt.pid_group, null); assert.equal(receipt.process_receipt.cleanup, 'not-spawned-deadline-exceeded');
  assert.equal(receipt.process_receipt.actual_timeout_ms, 0); assert.throws(r.session.finish, /deadline/);
});

test('remaining timeout is recomputed after prehash and immediately before the runner', t => {
  let now = 0, armed = false, received = null;
  const r = timedReader(t, { clock: () => now, fingerprint: file => { const result = fingerprintResult(file); if (armed && now === 0) now = 3; return result; },
    onWrite: name => { if (name === 'reader-command-01.intent.json') now = 4; },
    run: (_args, options) => { received = options.timeout; return Buffer.from('{}'); } });
  armed = true; assert.doesNotThrow(r.command); assert.equal(received, 1);
  assert.equal(r.saved('reader-command-01.intent.json').timeout_ms, 2);
  assert.equal(r.saved('reader-command-01.receipt.json').actual_runner_timeout_ms, 1); r.session.finish();
});

test('finish rejects an expired session with no commands and still removes only owned temp/cache', t => {
  let now = 0; const r = timedReader(t, { clock: () => now }); now = 1001;
  assert.throws(r.session.finish, /deadline/); const receipt = r.saved('reader-isolation.final.json');
  assert.equal(receipt.command_count, 0); assert.equal(receipt.timing.before.session_exceeded, true);
  assert.equal(receipt.cleanup, 'owned-temp-cache-removed'); assert.ok(existsSync(r.value.input.result));
});

// Existing-artifact reparse contract fixtures: no network or Apple tool is invoked.
function metadataFixture(expected = RAW_ARTIFACT) {
  const repository = { id: 42, full_name: expected.repository, private: false };
  return { run: { id: expected.run_id, head_sha: expected.head_sha, repository, head_repository: repository, event: 'pull_request', head_branch: expected.original_branch, run_attempt: 1, status: 'completed', conclusion: 'failure' },
    artifact: { id: expected.artifact_id, name: expected.artifact_name, expired: false, expires_at: expected.artifact_expires_at, size_in_bytes: expected.zip_bytes, digest: 'sha256:' + expected.zip_sha256, workflow_run: { id: expected.run_id, head_sha: expected.head_sha, repository_id: 42, head_repository_id: 42 } } };
}
function syntheticZip(value, rows) {
  // Store-only text ZIP fixture built with Node buffers; no external setup process.
  const crc32 = bytes => { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; };
  const locals = [], central = []; let offset = 0;
  for (const row of rows) {
    const name = Buffer.from(row.name), data = Buffer.from(row.text), crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    const item = Buffer.alloc(46); item.writeUInt32LE(0x02014b50); item.writeUInt16LE((3 << 8) | 20, 4); item.writeUInt16LE(20, 6); item.writeUInt16LE(0x800, 8); item.writeUInt16LE(0x21, 14);
    item.writeUInt32LE(crc, 16); item.writeUInt32LE(data.length, 20); item.writeUInt32LE(data.length, 24); item.writeUInt16LE(name.length, 28);
    item.writeUInt32LE(((row.link ? 0o120777 : 0o100600) << 16) >>> 0, 38); item.writeUInt32LE(offset, 42);
    locals.push(local, name, data); central.push(item, name); offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(rows.length, 8); end.writeUInt16LE(rows.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  const bytes = Buffer.concat([...locals, directory, end]), file = path.join(value.root, 'synthetic.zip'); writeFileSync(file, bytes);
  return { file, expected: { ...RAW_ARTIFACT, zip_bytes: bytes.length, zip_sha256: digest(bytes), entries: rows.length, expanded_bytes: rows.reduce((sum, row) => sum + Buffer.byteLength(row.text), 0) } };
}

test('artifact API binding distinguishes original UI run/head and rejects wrong run/head/artifact or unavailable metadata', () => {
  const good = metadataFixture(); const proof = verifyArtifactMetadata(good.run, good.artifact);
  assert.equal(proof.original_workflow_conclusion, 'failure'); assert.equal(proof.head_sha_external, RAW_ARTIFACT.head_sha);
  for (const change of [v => { v.run.head_sha = 'f'.repeat(40); }, v => { v.artifact.id++; }, v => { v.artifact.workflow_run.id++; }, v => { v.run.repository.private = true; }, v => { v.artifact.expired = true; }]) {
    const v = metadataFixture(); change(v); assert.throws(() => verifyArtifactMetadata(v.run, v.artifact));
  }
  const unknown = metadataFixture(); delete unknown.artifact.workflow_run.head_sha;
  assert.throws(() => verifyArtifactMetadata(unknown.run, unknown.artifact), UnknownReparseEvidence);
});

test('mock artifact download binds exact ZIP bytes and does not forward auth or retain signed URL/token', async t => {
  const value = fixture(t), zip = syntheticZip(value, [{ name: 'note.txt', text: 'SYNTHETIC not an observation' }]);
  const output = path.join(value.root, 'download'); mkdirSync(output); const m = metadataFixture(zip.expected); let calls = 0;
  const secret = 'SYNTHETIC_TOKEN_NEVER_LOGGED', request = async (url, options) => {
    calls++; assert.equal(options.redirect, 'manual');
    if (calls <= 3) assert.equal(options.headers.Authorization, 'Bearer ' + secret);
    else assert.equal(options.headers.Authorization, undefined);
    if (calls === 1) return new Response(JSON.stringify(m.run)); if (calls === 2) return new Response(JSON.stringify(m.artifact));
    if (calls === 3) return new Response(null, { status: 302, headers: { location: 'https://synthetic.blob.core.windows.net/archive?secret=SAS_NEVER_LOGGED' } });
    return new Response(readFileSync(zip.file));
  };
  const result = await downloadExistingArtifact(output, secret, { request, expected: zip.expected });
  assert.equal(calls, 4); assert.equal(digest(readFileSync(result)), zip.expected.zip_sha256);
  const receipts = ['GitHub-metadata-proof.json', 'acquisition.json'].map(name => readFileSync(path.join(output, name), 'utf8')).join('');
  assert.ok(!receipts.includes(secret)); assert.ok(!receipts.includes('SAS_NEVER_LOGGED'));
});

test('ZIP extraction checks exact SHA, traversal/link/duplicate names and CRC before allowing use', t => {
  const safe = fixture(t), zip = syntheticZip(safe, [{ name: 'Data/plain.txt', text: 'safe synthetic bytes' }]);
  assert.equal(extractExistingArtifact(zip.file, path.join(safe.root, 'expanded'), zip.expected).safepath_no_links, true);
  assert.throws(() => extractExistingArtifact(zip.file, path.join(safe.root, 'wrong-sha'), { ...zip.expected, zip_sha256: 'f'.repeat(64) }));
  for (const rows of [[{ name: '../escape', text: 'x' }], [{ name: 'a\\b', text: 'x' }], [{ name: 'a:b', text: 'x' }], [{ name: '/absolute', text: 'x' }], [{ name: 'link', text: 'target', link: true }], [{ name: 'same', text: 'x' }, { name: 'same', text: 'x' }]]) {
    const value = fixture(t), bad = syntheticZip(value, rows); assert.throws(() => extractExistingArtifact(bad.file, path.join(value.root, 'rejected'), bad.expected), /ZIP safe extraction/);
  }
  const value = fixture(t), crc = syntheticZip(value, [{ name: 'plain.txt', text: 'CRC protected synthetic bytes' }]), bytes = readFileSync(crc.file);
  const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02])); assert.ok(central >= 0); bytes.writeUInt32LE(0x12345678, central + 16); writeFileSync(crc.file, bytes);
  assert.throws(() => extractExistingArtifact(crc.file, path.join(value.root, 'bad-crc'), { ...crc.expected, zip_sha256: digest(bytes) }), /ZIP safe extraction/);
});

test('derived artifact preseal keeps original failure/context bytes and external configuration null distinct from parser identity', t => {
  const value = fixture(t), original = path.join(value.root, 'original'); mkdirSync(original); mkdirSync(path.join(original, 'memory-search.xcresult'));
  writeFileSync(path.join(original, 'memory-search.xcresult/raw-marker'), 'SYNTHETIC artifact snapshot');
  const snapshot = fingerprintResult(path.join(original, 'memory-search.xcresult')), expected = { ...RAW_ARTIFACT, snapshot_seal: snapshot.sha256 };
  const context = { ...value.context, Xcode: 'Xcode 16.4\nBuild version 16F6', source_head: expected.head_sha, source_tree: expected.tree, app_version: '0.2.14', app_build: '16', result_binding: { ...value.context.result_binding, inventory_sha256: expected.original_seal, expected_configuration_id: null } };
  delete context.result_binding.preseal_inventory; const contextBytes = Buffer.from(JSON.stringify(context)); writeFileSync(path.join(original, 'context-sealed.json'), contextBytes); mkdirSync(path.join(original, 'raw-capture'));
  writeFileSync(path.join(original, 'raw-capture/memory-observation-summary.json'), JSON.stringify({ status: 'failed-or-unavailable', error: 'Stale or wrong context result inventory', result_seal: { before_sha256: snapshot.sha256, after_sha256: snapshot.sha256 } }));
  writeFileSync(path.join(original, 'raw-capture/capture-commands.json'), '[]'); writeFileSync(path.join(original, 'raw-capture/result-inventory.raw.json'), JSON.stringify(snapshot));
  const out = path.join(value.root, 'derived'); mkdirSync(out);
  try {
    const prepared = prepareDerivedContext(original, out, { head: 'd'.repeat(40), tree: 'e'.repeat(40), source_app_version: '0.2.15', source_app_build: '17' }, expected);
    const derived = JSON.parse(readFileSync(prepared.context)); assert.equal(digest(readFileSync(path.join(original, 'context-sealed.json'))), digest(contextBytes));
    assert.equal(derived.source_head, expected.head_sha); assert.equal(derived.result_binding.expected_configuration_id, null);
    assert.deepEqual(derived.result_binding.preseal_inventory, snapshot); assert.equal(derived.artifact_reparse_provenance.original_bind_success, false);
    assert.equal(derived.artifact_reparse_provenance.parser_checkout_external.head, 'd'.repeat(40)); assert.equal(derived.artifact_reparse_provenance.original_app_version, '0.2.14');
    assert.deepEqual(fingerprintResult(prepared.seed), snapshot); assert.equal(lstatSync(original).mode & 0o777, 0o500);
  } finally {
    const restore = dir => { chmodSync(dir, 0o700); for (const name of readdirSync(dir)) { const file = path.join(dir, name); if (lstatSync(file).isDirectory()) restore(file); else chmodSync(file, 0o600); } }; restore(original);
  }
});

test('unobserved acquisition metadata stays exit2 with no original ZIP or reader and no success rebadging', async t => {
  const value = fixture(t), out = path.join(value.root, 'unknown-acquisition'), data = metadataFixture(); delete data.artifact.workflow_run.head_sha;
  const savedFetch = globalThis.fetch; let requests = 0;
  globalThis.fetch = async () => new Response(JSON.stringify(++requests === 1 ? data.run : data.artifact));
  try {
    const code = await reparseExistingArtifact(out, 'SYNTHETIC_READ_TOKEN', { head: 'd'.repeat(40), tree: 'e'.repeat(40), source_app_version: '0.2.15', source_app_build: '17' });
    assert.equal(code, 2); assert.equal(requests, 2); const summary = JSON.parse(readFileSync(path.join(out, 'reparse-summary.json')));
    assert.equal(summary.original_failure_verified_in_this_run, false); assert.equal(summary.original_bind_success, false);
    assert.equal(summary.source_attestation, false); assert.equal(summary.metric_adoption, null);
    assert.ok(!existsSync(path.join(out, 'artifact-original.zip'))); assert.ok(!existsSync(path.join(out, 'reparse-capture')));
  } finally { globalThis.fetch = savedFetch; }
});

test('temporary parser event gate requires same-repo public Draft literal branch/main and rejects expiry', () => {
  const event = () => ({ repository: { full_name: RAW_ARTIFACT.repository, private: false }, pull_request: { draft: true, head: { repo: { full_name: RAW_ARTIFACT.repository }, ref: PARSER_GATE.branch }, base: { ref: 'main', sha: PARSER_GATE.base } } });
  const now = Date.parse('2026-10-26T00:00:00Z'); assert.equal(verifyParserEvent(event(), now).base, PARSER_GATE.base);
  for (const change of [e => { e.repository.private = true; }, e => { e.pull_request.draft = false; }, e => { e.pull_request.head.repo.full_name = 'other/repo'; }, e => { e.pull_request.head.ref = 'codex/other'; }, e => { e.pull_request.base.sha = 'f'.repeat(40); }]) { const e = event(); change(e); assert.throws(() => verifyParserEvent(e, now)); }
  assert.throws(() => verifyParserEvent(event(), Date.parse(PARSER_GATE.expires_at)), /expired/);
});
