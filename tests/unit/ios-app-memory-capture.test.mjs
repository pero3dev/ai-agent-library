import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captureAppMemory, captureExitCode, fingerprintResult } from '../../ios/tests/capture-app-memory.mjs';

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
  context.result_binding = { inventory_sha256: fingerprintResult(input.result).sha256, expected_device_id: deviceID,
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
  const commands = [], options = { emptyCSV: false, noCSV: false, symlinkCSV: false, failDetails: false, mutateOnInvocation: false, removeOnInvocation: false };
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
  assert.ok(existsSync(path.join(value.input.output, 'invocation.legacy.raw.json')));
  assert.ok(existsSync(path.join(value.input.output, 'metrics-csv', 'unknown-memory-and-clock.csv')));
});

test('early unbound schema cannot hide an unavailable result at the final rehash', t => {
  const value = fixture(t); value.options.removeOnInvocation = true;
  delete value.data.invocation.actions._values[0].actionResult.testsRef;
  const result = value.capture();
  assert.equal(result.status, 'failed-or-unavailable'); assert.equal(captureExitCode(result), 1);
  assert.equal(result.result_seal.status, 'changed-or-unavailable');
  assert.match(result.error, /Result seal recheck failed/); assert.equal(result.measurements, null);
  assert.ok(existsSync(path.join(value.input.output, 'invocation.legacy.raw.json')));
});
