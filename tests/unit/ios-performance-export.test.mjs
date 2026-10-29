import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { load as loadYaml } from 'js-yaml';
import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportPerformance, metricReference, normalizeMetrics, validateClockCSV, verifiedCase, verifiedDetails, performanceScenario, verifiedScenarioContext, bindLongScrollInput, parseLongScrollProtocol, performanceNotMeasured } from '../../ios/tests/export-performance.mjs';

const exporter = fileURLToPath(new URL('../../ios/tests/export-performance.mjs', import.meta.url));
const identifier = 'PublishedPerformanceUITests/testLaunchToPublishedReadiness()';
const caseNode = (result, id = identifier) => ({ nodeType: 'Test Case', nodeIdentifier: id, result });
const report = result => ({ testNodes: [{ nodeType: 'Test Suite', children: [caseNode(result)] }] });
const posixOnly = { skip: process.platform === 'win32' ? 'The xcrun executable/symlink fixture uses POSIX; no actual Xcode process runs' : false };

// Legacy wire fields are documented by xcresulttool formatDescription --legacy.
// Most durations below are synthetic. The explicitly labelled 247-byte fixture
// and Clock identity came from run40188893652, not a timing target or baseline.
function metricSummary(samples = ['3.00', '1.00', '2.00'], unit = 'synthetic-unit') {
  return {
    _type: { _name: 'ActionTestSummary' }, identifier: { _value: identifier },
    testStatus: { _value: 'Success' },
    performanceMetrics: { _values: [{
      _type: { _name: 'ActionTestPerformanceMetricSummary' },
      identifier: { _value: 'unidentified.synthetic.metric' },
      displayName: { _value: 'Synthetic metric, not an identified clock' },
      unitOfMeasurement: { _value: unit },
      baselineAverage: { _value: '0.0' }, baselineName: { _value: '' },
      measurements: { _values: samples.map(value => ({ _type: { _name: 'Double' }, _value: value })) },
    }] },
  };
}

function clockSummary(samples) {
  const summary = metricSummary(samples, 's'), metric = summary.performanceMetrics._values[0];
  metric.identifier._value = 'com.apple.dt.XCTMetric_Clock.time.monotonic';
  metric.displayName._value = 'Clock Monotonic Time';
  return summary;
}
const detailsFixture = () => ({ testIdentifier: identifier, testResult: 'Passed', hasPerformanceMetrics: true,
  devices: [{ deviceName: 'iPhone 16', platform: 'iOS Simulator', osVersion: '18.5' }],
  testPlanConfigurations: [{ configurationId: '1', configurationName: 'Test Scheme Action' }] });
const csvHeader = '"Destination","Configuration","Clock Monotonic Time (Average)","Clock Monotonic Time (Iterations)","Clock Monotonic Time (Baseline)"';
const csvFixture = (overrides = {}) => {
  const values = { destination: 'iPhone 16 iOS Simulator 18.5', configuration: 'Test Scheme Action',
    average: '2.0000000 s', iterations: '[3.00, 1.00, 2.00]', baseline: '0', ...overrides };
  return csvHeader + '\n' + Object.values(values).map(value => '"' + value.replaceAll('"', '""') + '"').join(',');
};
// Exact captured bytes, including the absence of a final newline. No output
// bundle or host-specific path/device UUID is required by the portable tests.
const observedCSV = csvHeader + '\n"iPhone 16 iOS Simulator 18.5","Test Scheme Action","13.6226208 s","[13.72942072, 15.904793718, 11.233647974]","0"';
const observedSamples = ['13.72942072', '15.904793718', '11.233647974'];
const normalizedClock = samples => normalizeMetrics(clockSummary(samples), identifier, 'Passed')[0];

function reference(id = 'summary-id', testID = identifier) {
  return { _type: { _name: 'ActionTestMetadata' }, identifier: { _value: testID }, summaryRef: { id: { _value: id } } };
}

function temporary(t) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ailibrary-ios-performance-test-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

// Runs the actual exporter CLI with a local xcrun double. This exercises command
// selection, exit status and retained files without Xcode, Simulator or a device.
function runFixtureCLI(t, mode = 'complete', fixtureOptions = {}) {
  const root = temporary(t);
  const result = path.join(root, 'raw.xcresult');
  const bin = path.join(root, 'bin');
  mkdirSync(result); mkdirSync(bin);
  const context = path.join(root, 'context.json');
  const contextBytes = JSON.stringify({ expected_articles: 4, configuration: 'Debug', ...fixtureOptions.context });
  writeFileSync(context, contextBytes);
  const database = path.join(result, 'database.sqlite3');
  const databaseBytes = 'synthetic immutable xcresult bytes';
  writeFileSync(database, databaseBytes);
  const output = path.join(root, 'export');
  const protocolLog = path.join(root, 'protocol.log');
  if (fixtureOptions.protocolInput === 'symlink') symlinkSync(context, protocolLog);
  else if (fixtureOptions.protocolInput === 'hardlink') linkSync(context, protocolLog);
  else if (fixtureOptions.protocolBytes !== undefined) writeFileSync(protocolLog, fixtureOptions.protocolBytes);
  const outputs = {
    report: report('Passed'),
    details: { ...detailsFixture(), hasPerformanceMetrics: mode !== 'missing-flag' },
    invocation: { actions: { _values: [{ actionResult: { testsRef: { id: { _value: 'plan-id' } } } }] } },
    plan: { summaries: [reference()] },
    summary: clockSummary(mode === 'missing-sample' ? ['1', '2'] : undefined),
  };
  if (fixtureOptions.caseID) {
    const id = fixtureOptions.caseID;
    outputs.report = { testNodes: [{ nodeType: 'Test Suite', children: [caseNode('Passed', id)] }] };
    outputs.details.testIdentifier = id;
    outputs.plan = { summaries: [reference('summary-id', id)] };
    outputs.summary.identifier._value = id;
  }
  if (mode === 'legacy-status-missing') delete outputs.summary.testStatus;
  if (mode === 'legacy-status-conflict') outputs.summary.testStatus._value = 'Failure';
  if (mode === 'foreign-metric') outputs.summary.performanceMetrics._values[0].identifier._value = 'foreign.metric';
  if (mode === 'wrong-unit') outputs.summary.performanceMetrics._values[0].unitOfMeasurement._value = 'ms';
  let csv = csvFixture();
  if (mode === 'header-only') csv = csvHeader;
  if (mode === 'different-samples') csv = csvFixture({ iterations: '[1, 3, 2]' });
  if (mode === 'bad-rounding') csv = csvFixture({ average: '2.0000001 s' });
  if (mode === 'invalid-csv') csv = csvFixture() + 'unquoted garbage';
  const commands = path.join(root, 'commands.jsonl');
  const mockSource = `#!/usr/bin/env node
const { appendFileSync, linkSync, mkdirSync, symlinkSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2), fixture = ${JSON.stringify(outputs)}, mode = ${JSON.stringify(mode)};
appendFileSync(${JSON.stringify(commands)}, JSON.stringify(args) + String.fromCharCode(10));
if (args.includes('tests') && mode.startsWith('inject-')) {
  const name = mode.includes('-summary-') ? 'performance-summary.json' : mode.includes('-log-') ? 'extraction-commands.json' : 'tests.raw.json';
  const target = mode.includes('-result') ? ${JSON.stringify(database)} : ${JSON.stringify(context)};
  const destination = path.join(${JSON.stringify(output)}, name);
  if (mode.includes('-hardlink')) linkSync(target, destination); else symlinkSync(target, destination);
  if (mode.endsWith('-fail')) process.exit(7);
}
if (args.includes('export')) {
  const out = args[args.indexOf('--output-path') + 1];
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, 'raw.csv'), ${JSON.stringify(csv)});
  if (mode === 'multiple-csv') writeFileSync(path.join(out, 'second.csv'), ${JSON.stringify(csv)});
} else if (args.includes('tests')) console.log(JSON.stringify(fixture.report));
else if (args.includes('test-details')) console.log(JSON.stringify(fixture.details));
else if (args.includes('object')) {
  const index = args.indexOf('--id');
  console.log(JSON.stringify(index < 0 ? fixture.invocation : args[index + 1] === 'plan-id' ? fixture.plan : fixture.summary));
} else process.exit(9);
`;
  writeFileSync(path.join(bin, 'xcrun'), mockSource, { mode: 0o755 });
  const scenarioArgs = fixtureOptions.scenario === undefined ? [] : ['--scenario', fixtureOptions.scenario];
  const protocolArgs = fixtureOptions.protocolBytes === undefined ? [] :
    ['--protocol-log', fixtureOptions.protocolInput === 'context' ? context : protocolLog];
  const run = spawnSync(process.execPath, [exporter, '--result', result, '--output', output, '--context', context, ...scenarioArgs, ...protocolArgs], {
    encoding: 'utf8', timeout: 15000,
    env: { ...process.env, PATH: [bin, path.dirname(process.execPath), process.env.PATH ?? ''].join(path.delimiter) },
  });
  assert.equal(run.error, undefined);
  const rawCSV = () => {
    const directory = readdirSync(output).find(name => name.startsWith('metrics-csv-'));
    assert.ok(directory, 'Raw CSV must survive later parsing failures');
    return readFileSync(path.join(output, directory, 'raw.csv'), 'utf8');
  };
  return { run, root, context, contextBytes, database, databaseBytes, output, rawCSV,
    get summary() { return JSON.parse(readFileSync(path.join(output, 'performance-summary.json'), 'utf8')); }, commands: () => readFileSync(commands, 'utf8').trim().split('\n').map(JSON.parse) };
}

test('one passed dedicated case retains its actual report identifier', () => {
  assert.equal(verifiedCase(report('Passed')), identifier);
});

test('an executed failed case remains failed and can still be inspected', () => {
  assert.equal(verifiedCase(report('Failed')), identifier);
  verifiedDetails(report('Failed'), { testIdentifier: identifier, testResult: 'Failed' }, identifier);
});

test('missing, skipped, extra or unrelated cases cannot select a performance result', () => {
  for (const value of [
    { testNodes: [] }, report('Skipped'),
    { testNodes: [caseNode('Passed'), caseNode('Passed')] },
    { testNodes: [caseNode('Passed', 'Other/testLaunchToPublishedReadiness()')] },
    { testNodes: [caseNode('Passed', 'PublishedPerformanceUITests/other()')] },
  ]) assert.throws(() => verifiedCase(value));
});

test('the observed hosted functional ID shape agrees across list and details', () => {
  // This class/method identifier was observed in a hosted functional xcresult;
  // these minimal field fixtures are not a captured performance result.
  const hostedID = 'NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()';
  verifiedDetails({ testNodes: [caseNode('Passed', hostedID)] }, { testIdentifier: hostedID, testResult: 'Passed' }, hostedID);
});

test('the same test ID with a different result, or another detail ID, fails closed', () => {
  assert.throws(() => verifiedDetails(report('Failed'), { testIdentifier: identifier, testResult: 'Passed' }, identifier));
  assert.throws(() => verifiedDetails(report('Passed'), { testIdentifier: 'Other/test()', testResult: 'Passed' }, identifier));
});

test('typed samples retain raw spelling, raw units and actual sample count', () => {
  const metric = normalizeMetrics(metricSummary(), identifier, 'Passed')[0];
  assert.equal(metric.unit, 'synthetic-unit');
  assert.deepEqual(metric.raw_samples, ['3.00', '1.00', '2.00']);
  assert.deepEqual(metric.samples, [3, 1, 2]);
  assert.equal(metric.sample_count, 3);
  assert.equal(metric.minimum, 1); assert.equal(metric.median, 2); assert.equal(metric.maximum, 3);
});

test('actual numeric zeros remain different from absent measurements', () => {
  assert.deepEqual(normalizeMetrics(metricSummary([0, 0, 0]), identifier, 'Passed')[0].samples, [0, 0, 0]);
});

test('missing or blank metric units and names are never invented', () => {
  const missing = metricSummary(); delete missing.performanceMetrics._values[0].unitOfMeasurement;
  assert.throws(() => normalizeMetrics(missing, identifier, 'Passed'));
  for (const unit of ['', '  ']) assert.throws(() => normalizeMetrics(metricSummary(undefined, unit), identifier, 'Passed'));
  const unnamed = metricSummary(); unnamed.performanceMetrics._values[0].displayName._value = '';
  assert.throws(() => normalizeMetrics(unnamed, identifier, 'Passed'));
});

test('missing or extra samples cannot satisfy three recorded observations', () => {
  for (const values of [[], ['1', '2'], ['1', '2', '3', '4']]) assert.throws(() => normalizeMetrics(metricSummary(values), identifier, 'Passed'));
});

test('NaN, infinity, negatives and nonnumeric values cannot become measurements', () => {
  for (const value of ['NaN', 'Infinity', '-0.1', '0x10', '', ' ', true, null]) {
    assert.throws(() => normalizeMetrics(metricSummary([value, '1', '2']), identifier, 'Passed'));
  }
});

test('absent or multiple metrics cannot become a single-metric success', () => {
  assert.throws(() => normalizeMetrics({}, identifier, 'Passed'));
  const multiple = metricSummary(); multiple.performanceMetrics._values.push(structuredClone(multiple.performanceMetrics._values[0]));
  assert.throws(() => normalizeMetrics(multiple, identifier, 'Passed'));
});

test('a foreign legacy summary or metric wire type cannot substitute for the result', () => {
  const wrongID = metricSummary(); wrongID.identifier._value = 'Other/test()';
  assert.throws(() => normalizeMetrics(wrongID, identifier, 'Passed'));
  const wrongSummary = metricSummary(); wrongSummary._type._name = 'Other';
  assert.throws(() => normalizeMetrics(wrongSummary, identifier, 'Passed'));
  const wrongMetric = metricSummary(); wrongMetric.performanceMetrics._values[0]._type._name = 'Other';
  assert.throws(() => normalizeMetrics(wrongMetric, identifier, 'Passed'));
});

test('nested legacy metadata selects the exact actual modern ID', () => {
  assert.equal(metricReference({ summaries: [{ tests: [reference()] }] }, identifier), 'summary-id');
});

test('missing, differently qualified or ambiguous legacy references are rejected', () => {
  assert.throws(() => metricReference({}, identifier));
  assert.throws(() => metricReference(reference('summary-id', 'Extra/' + identifier), identifier));
  assert.throws(() => metricReference({ tests: [reference('one'), reference('two')] }, identifier));
});

test('repeating the same reference does not fabricate duplicate measurements', () => {
  assert.equal(metricReference({ tests: [reference(), reference()] }, identifier), 'summary-id');
});

test('an output inside the raw xcresult cannot mutate the source bundle', t => {
  const root = temporary(t), result = path.join(root, 'raw.xcresult');
  mkdirSync(result);
  assert.throws(() => exportPerformance({ result, output: path.join(result, 'inside'), context: path.join(root, 'context.json') }));
  assert.equal(existsSync(path.join(result, 'inside')), false);
});

test('CLI error reporting also refuses output ancestor symlinks', posixOnly, t => {
  const root = temporary(t), outside = path.join(root, 'outside'), alias = path.join(root, 'alias');
  mkdirSync(outside); symlinkSync(outside, alias, 'dir');
  const context = path.join(root, 'context.json'); writeFileSync(context, '{}');
  const run = spawnSync(process.execPath, [exporter, '--result', path.join(root, 'raw.xcresult'), '--output', path.join(alias, 'evidence'), '--context', context], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(JSON.parse(run.stderr).error, /symbolic links/);
  assert.equal(existsSync(path.join(outside, 'evidence')), false);
});

test('the CLI accepts the verified clock identity and matching CSV without adopting a product target', posixOnly, t => {
  const value = runFixtureCLI(t);
  assert.equal(value.run.status, 0, value.run.stderr);
  assert.equal(value.summary.status, 'measured-and-exported');
  assert.equal(value.summary.metric_contract.confirmed, true);
  assert.equal(value.summary.metrics[0].sample_count, 3);
  assert.equal(value.summary.metrics[0].identifier, 'com.apple.dt.XCTMetric_Clock.time.monotonic');
  assert.equal(value.summary.csv_validation.status, 'matched-clock-and-typed-values');
  assert.equal(value.summary.csv_validation.typed_mean_seconds, 2);
  assert.equal(value.summary.acceptance_status, 'unadopted');
  assert.equal(value.rawCSV(), csvFixture());
  const csvCommand = value.commands().find(args => args.includes('export'));
  assert.deepEqual(csvCommand.slice(0, 3), ['xcresulttool', 'export', 'metrics']);
  assert.equal(csvCommand[csvCommand.indexOf('--test-id') + 1], identifier);
  assert.ok(value.commands().filter(args => args.includes('object')).every(args => args.includes('--legacy')));
});

test('typed-sample rejection keeps raw CSV and reports missing values as null', posixOnly, t => {
  const value = runFixtureCLI(t, 'missing-sample');
  assert.equal(value.run.status, 1);
  assert.equal(value.summary.status, 'failed-or-unavailable');
  assert.equal(value.summary.measurements, null);
  assert.equal(value.rawCSV(), csvFixture());
  assert.ok(existsSync(path.join(value.output, 'test-summary.legacy.json')));
});

test('an absent recorded-metrics flag is rejected after raw CSV is retained', posixOnly, t => {
  const value = runFixtureCLI(t, 'missing-flag');
  assert.equal(value.run.status, 1);
  assert.equal(value.summary.status, 'failed-or-unavailable');
  assert.equal(value.summary.measurements, null);
  assert.equal(value.rawCSV(), csvFixture());
});

test('legacy Success only maps to the verified modern Passed result', () => {
  for (const status of [undefined, '', 'Failure', 'Passed', 'success']) {
    const value = metricSummary();
    if (status === undefined) delete value.testStatus;
    else value.testStatus._value = status;
    assert.throws(() => normalizeMetrics(value, identifier, 'Passed'), /Passed\/Success mapping/);
  }
  for (const result of [undefined, 'Failed', 'Skipped']) {
    assert.throws(() => normalizeMetrics(metricSummary(), identifier, result), /Passed\/Success mapping/);
  }
});

test('contradictory or missing legacy status rejects the CLI result independently of clock identity', posixOnly, t => {
  for (const mode of ['legacy-status-conflict', 'legacy-status-missing']) {
    const value = runFixtureCLI(t, mode);
    assert.equal(value.run.status, 1);
    assert.equal(value.summary.status, 'failed-or-unavailable');
    assert.match(value.summary.error, /Passed\/Success mapping/);
    assert.equal(value.summary.measurements, null);
    assert.equal(value.rawCSV(), csvFixture());
  }
});

function rejectedCLI(options) {
  const run = spawnSync(process.execPath, [exporter, '--result', options.result, '--output', options.output, '--context', options.context], {
    encoding: 'utf8', timeout: 15000, env: { ...process.env, PATH: '' },
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 1);
  return JSON.parse(run.stderr);
}

test('a pre-existing output never truncates raw files or context aliases through any fixed leaf', posixOnly, t => {
  const names = ['performance-summary.json', 'extraction-commands.json', 'tests.raw.json', 'test-details.raw.json',
    'invocation.legacy.json', 'test-plan.legacy.json', 'test-summary.legacy.json'];
  for (const kind of ['symlink', 'hardlink']) for (const name of names) {
    const root = temporary(t), output = path.join(root, 'export'), context = path.join(root, 'context.json');
    mkdirSync(output);
    const bytes = '{"expected_articles":4,"configuration":"Debug","retain":"input bytes"}';
    writeFileSync(context, bytes);
    const destination = path.join(output, name);
    if (kind === 'symlink') symlinkSync(context, destination); else linkSync(context, destination);
    const failure = rejectedCLI({ result: path.join(root, 'missing.xcresult'), output, context });
    assert.match(failure.error, /fresh directory/);
    assert.equal(readFileSync(context, 'utf8'), bytes);
    assert.equal(readFileSync(destination, 'utf8'), bytes);
    assert.deepEqual(readdirSync(output), [name]);
  }
});

test('existing empty or raw output directories must be retained instead of reused', t => {
  for (const existingRaw of [false, true]) {
    const root = temporary(t), output = path.join(root, 'export'), context = path.join(root, 'context.json');
    mkdirSync(output); writeFileSync(context, '{}');
    if (existingRaw) writeFileSync(path.join(output, 'tests.raw.json'), 'retained raw bytes');
    assert.match(rejectedCLI({ result: path.join(root, 'missing.xcresult'), output, context }).error, /fresh directory/);
    assert.deepEqual(readdirSync(output), existingRaw ? ['tests.raw.json'] : []);
    if (existingRaw) assert.equal(readFileSync(path.join(output, 'tests.raw.json'), 'utf8'), 'retained raw bytes');
  }
});

test('context at any fixed output leaf and either-direction input overlap are rejected without writes', t => {
  const root = temporary(t), output = path.join(root, 'export');
  mkdirSync(output);
  const context = path.join(output, 'tests.raw.json'), bytes = '{"retain":"context inside output"}';
  writeFileSync(context, bytes);
  assert.match(rejectedCLI({ result: path.join(root, 'missing.xcresult'), output, context }).error, /cannot overlap/);
  assert.equal(readFileSync(context, 'utf8'), bytes);
  const outsideContext = path.join(root, 'context.json'); writeFileSync(outsideContext, '{}');
  assert.match(rejectedCLI({ result: path.join(output, 'raw.xcresult'), output, context: outsideContext }).error, /cannot overlap/);
  assert.match(rejectedCLI({ result: output, output: path.join(output, 'inside'), context: outsideContext }).error, /cannot overlap/);
  assert.equal(existsSync(path.join(output, 'inside')), false);
  assert.match(rejectedCLI({ result: path.join(root, 'missing.xcresult'), output: outsideContext, context: outsideContext }).error, /cannot overlap/);
  assert.equal(readFileSync(outsideContext, 'utf8'), '{}');
});

test('a symlink context input cannot alias a later output leaf', posixOnly, t => {
  const root = temporary(t), output = path.join(root, 'export'), context = path.join(root, 'context.json');
  symlinkSync(path.join(output, 'performance-summary.json'), context);
  assert.match(rejectedCLI({ result: path.join(root, 'missing.xcresult'), output, context }).error, /symbolic links/);
  assert.equal(existsSync(output), false);
  assert.equal(lstatSync(context).isSymbolicLink(), true);
});

test('the safe writer refuses links inserted after preparation, including its failure-report path', posixOnly, t => {
  for (const mode of [
    'inject-summary-symlink', 'inject-summary-hardlink', 'inject-raw-symlink', 'inject-raw-hardlink',
    'inject-log-symlink', 'inject-log-hardlink', 'inject-summary-hardlink-result', 'inject-summary-symlink-fail',
  ]) {
    const value = runFixtureCLI(t, mode);
    assert.equal(value.run.status, 1);
    const failure = JSON.parse(value.run.stderr);
    if (mode.endsWith('-fail')) assert.equal(failure.command_result.exit_code, 7);
    else assert.match(failure.error, /EEXIST/);
    assert.equal(readFileSync(value.context, 'utf8'), value.contextBytes, mode);
    assert.equal(readFileSync(value.database, 'utf8'), value.databaseBytes, mode);
    const leaf = mode.includes('-summary-') ? 'performance-summary.json' : mode.includes('-log-') ? 'extraction-commands.json' : 'tests.raw.json';
    const target = mode.includes('-result') ? value.database : value.context;
    const destination = path.join(value.output, leaf);
    if (mode.includes('-hardlink')) assert.equal(lstatSync(destination).ino, lstatSync(target).ino);
    else assert.equal(lstatSync(destination).isSymbolicLink(), true);
  }
});

test('the captured 247-byte CSV agrees with the observed typed seconds and precision', () => {
  assert.equal(Buffer.byteLength(observedCSV), 247);
  assert.equal(createHash('sha256').update(observedCSV).digest('hex'), '154faa23ef6bb36ff08759061026f2b183604ce8f2517eb89af315230ae79374');
  const result = validateClockCSV(observedCSV, normalizedClock(observedSamples), detailsFixture());
  assert.equal(result.status, 'matched-clock-and-typed-values');
  assert.equal(result.sample_count, 3);
  assert.equal(result.average_raw, '13.6226208 s');
  assert.equal(result.mean_comparison.printed_decimal_scale, 7);
  assert.equal(result.mean_comparison.half_rounding_unit_seconds, 5e-8);
  assert.equal(result.mean_comparison.floating_epsilon_seconds, 0);
  assert.equal(Number(result.mean_comparison.difference_numerator) / Number(result.mean_comparison.difference_denominator), 4e-9);
  assert.equal(result.baseline_acceptance, 'unadopted');
});

test('quoted CSV accepts optional final LF or CRLF without adding a data row', () => {
  for (const csv of [csvFixture(), csvFixture() + '\n', csvFixture().replaceAll('\n', '\r\n') + '\r\n']) {
    assert.equal(validateClockCSV(csv, normalizedClock(), detailsFixture()).data_rows, 1);
  }
});

test('header-only, malformed, unquoted, duplicate or extra CSV data is rejected', () => {
  for (const csv of [csvHeader, csvFixture().replace('"Destination"', '"Elsewhere"'),
    csvFixture().replace('"Configuration"', '"Destination"'), csvFixture() + '\n' + csvFixture().split('\n')[1],
    csvFixture() + ',"extra"', csvFixture().slice(0, -1), csvFixture() + 'garbage',
    csvFixture().replace('\n', '\r'), '\ufeff' + csvFixture(), csvFixture().replace('"Destination"', 'Destination'),
    csvFixture() + '\n\n', csvFixture() + '\0']) {
    assert.throws(() => validateClockCSV(csv, normalizedClock(), detailsFixture()));
  }
});

test('a foreign metric ID, display name, unit or non-Double sample is refused', () => {
  for (const override of [{ identifier: 'foreign.metric' }, { display_name: 'CPU Time' }, { unit: 'ms' }]) {
    assert.throws(() => validateClockCSV(csvFixture(), { ...normalizedClock(), ...override }, detailsFixture()), /verified clock contract/);
  }
  const wrongType = clockSummary(); wrongType.performanceMetrics._values[0].measurements._values[0]._type._name = 'String';
  assert.throws(() => normalizeMetrics(wrongType, identifier, 'Passed'), /typed Double/);
});

test('CSV destination and configuration must agree with the sole actual expected device and plan', () => {
  for (const update of [value => { value.devices = []; }, value => { value.devices.push({ ...value.devices[0] }); },
    value => { value.devices[0].osVersion = '18.4'; }, value => { value.devices[0].deviceName = 'iPhone 15'; },
    value => { value.devices[0].platform = 'iOS'; }, value => { value.testPlanConfigurations = []; },
    value => { value.testPlanConfigurations[0].configurationName = 'Other'; },
    value => { value.testPlanConfigurations.push({ ...value.testPlanConfigurations[0] }); }]) {
    const details = detailsFixture(); update(details);
    assert.throws(() => validateClockCSV(csvFixture(), normalizedClock(), details));
  }
  for (const csv of [csvFixture({ destination: 'iPhone 15 iOS Simulator 18.5' }), csvFixture({ configuration: 'Other' })]) {
    assert.throws(() => validateClockCSV(csv, normalizedClock(), detailsFixture()), /destination\/configuration/);
  }
});

test('CSV iterations must match all three typed values in order, including decimal precision', () => {
  for (const iterations of ['[1, 3, 2]', '[3, 1]', '[3, 1, 2, 4]', '[3, 1, NaN]', '[3, true, 2]',
    '[3, 1, 2,]', '3, 1, 2', '[[3, 1, 2]]', '[3.00000000000000001, 1, 2]']) {
    assert.throws(() => validateClockCSV(csvFixture({ iterations }), normalizedClock(), detailsFixture()));
  }
  assert.equal(validateClockCSV(csvFixture({ iterations: '[3.0, 1e0, 2.000]' }), normalizedClock(), detailsFixture()).sample_count, 3);
});

test('CSV average rounding allowance is exactly half of its printed last decimal place', () => {
  const half = ['2.00000005', '2.00000005', '2.00000005'];
  const beyond = ['2.0000000501', '2.0000000501', '2.0000000501'];
  assert.equal(validateClockCSV(csvFixture({ iterations: '[' + half.join(', ') + ']' }), normalizedClock(half), detailsFixture()).status, 'matched-clock-and-typed-values');
  assert.throws(() => validateClockCSV(csvFixture({ iterations: '[' + beyond.join(', ') + ']' }), normalizedClock(beyond), detailsFixture()), /half of its printed/);
  assert.throws(() => validateClockCSV(observedCSV.replace('13.6226208 s', '13.6226209 s'), normalizedClock(observedSamples), detailsFixture()), /half of its printed/);
  assert.throws(() => validateClockCSV(observedCSV.replace('13.6226208 s', '13.622620800000000 s'), normalizedClock(observedSamples), detailsFixture()), /half of its printed/);
});

test('invalid averages, units and baseline values cannot become zero or a product baseline', () => {
  for (const average of ['2 ms', 'NaN s', 'Infinity s', '-1 s', '0x2 s', ' 2 s', '2  s', '2e9999 s', '0e400 s', '0e2 s']) {
    assert.throws(() => validateClockCSV(csvFixture({ average }), normalizedClock(), detailsFixture()));
  }
  for (const baseline of ['NaN', '1', '', '-1']) {
    assert.throws(() => validateClockCSV(csvFixture({ baseline }), normalizedClock(), detailsFixture()));
  }
  const missing = normalizedClock(); missing.baseline.average = null;
  assert.throws(() => validateClockCSV(csvFixture(), missing, detailsFixture()));
});

test('CLI failures retain every raw CSV while rejecting header-only, foreign, inconsistent or invalid data', posixOnly, t => {
  for (const mode of ['header-only', 'foreign-metric', 'wrong-unit', 'different-samples', 'bad-rounding', 'invalid-csv', 'multiple-csv']) {
    const value = runFixtureCLI(t, mode);
    assert.equal(value.run.status, 1, mode);
    assert.equal(value.summary.status, 'failed-or-unavailable', mode);
    assert.equal(value.summary.measurements, null, mode);
    assert.ok(value.rawCSV().length > 0, mode);
    assert.equal(readFileSync(value.context, 'utf8'), value.contextBytes, mode);
    assert.equal(readFileSync(value.database, 'utf8'), value.databaseBytes, mode);
  }
});


const searchName = 'search-query-to-visible-witness';
const searchID = 'PublishedPerformanceUITests/testSearchQueryToVisibleWitness()';
const searchContext = () => ({ scenario: searchName, test_method: 'testSearchQueryToVisibleWitness',
  search_witness: { negative_query: 'AILIBRARY_UI_PERF_NO_MATCH_67404f8127',
    positive_query: 'データを外部 API に出せるか', article_id: '03-implementation/model-selection' } });
const searchFixture = () => ({ scenario: searchName, caseID: searchID, context: searchContext() });

test('only the literal launch and explicit search scenarios select a method', () => {
  assert.equal(performanceScenario().name, 'launch-to-published-readiness');
  assert.equal(performanceScenario().method, 'testLaunchToPublishedReadiness');
  assert.equal(performanceScenario(searchName).method, 'testSearchQueryToVisibleWitness');
  for (const value of ['search', 'constructor', '__proto__', '', null, 0, {}, ['launch-to-published-readiness']]) {
    assert.throws(() => performanceScenario(value), /Unknown performance scenario/);
  }
});

test('search requires its exact one case and never falls back to the launch case', () => {
  const searchReport = { testNodes: [caseNode('Passed', searchID)] };
  assert.equal(verifiedCase(searchReport, searchName), searchID);
  assert.throws(() => verifiedCase(searchReport));
  for (const value of [report('Passed'), { testNodes: [] },
    { testNodes: [caseNode('Skipped', searchID)] },
    { testNodes: [caseNode('Passed', searchID), caseNode('Passed', identifier)] }]) {
    assert.throws(() => verifiedCase(value, searchName));
  }
});

test('legacy launch context remains compatible while search context must be explicit and exact', () => {
  assert.equal(verifiedScenarioContext({}).name, 'launch-to-published-readiness');
  assert.equal(verifiedScenarioContext(searchContext(), searchName).name, searchName);
  assert.throws(() => verifiedScenarioContext(searchContext()));
  for (const value of [{}, { scenario: searchName },
    { ...searchContext(), test_method: 'testLaunchToPublishedReadiness' },
    { ...searchContext(), search_witness: { ...searchContext().search_witness, positive_query: 'another query' } },
    { ...searchContext(), search_witness: { ...searchContext().search_witness, result_count: 1 } }]) {
    assert.throws(() => verifiedScenarioContext(value, searchName));
  }
  for (const value of [null, '', 'search', '__proto__']) {
    assert.throws(() => verifiedScenarioContext({ scenario: value }));
  }
});

test('explicit search CLI retains its own case, three typed samples and strict CSV identity', posixOnly, t => {
  const value = runFixtureCLI(t, 'complete', searchFixture());
  assert.equal(value.run.status, 0, value.run.stderr);
  assert.equal(value.summary.scenario, searchName);
  assert.equal(value.summary.test_id, searchID);
  assert.equal(value.summary.context.scenario, searchName);
  assert.equal(value.summary.metrics[0].sample_count, 3);
  assert.deepEqual(value.summary.metrics[0].samples, [3, 1, 2]);
  assert.equal(value.summary.csv_validation.status, 'matched-clock-and-typed-values');
  assert.match(value.summary.boundary, /keyboard and AX polling/);
  assert.equal(value.summary.acceptance_status, 'unadopted');
  assert.ok(value.commands().filter(args => args.includes('--test-id')).every(args => args[args.indexOf('--test-id') + 1] === searchID));
});

test('search context/method mismatch fails before xcresult commands and creates no fake observations', posixOnly, t => {
  const fixture = searchFixture(); fixture.context.test_method = 'testLaunchToPublishedReadiness';
  const value = runFixtureCLI(t, 'complete', fixture);
  assert.equal(value.run.status, 1);
  assert.equal(value.summary.measurements, null);
  assert.equal(existsSync(path.join(value.root, 'commands.jsonl')), false);
});

test('explicit search cannot inspect a launch result as a search result', posixOnly, t => {
  const fixture = searchFixture(); fixture.caseID = identifier;
  const value = runFixtureCLI(t, 'complete', fixture);
  assert.equal(value.run.status, 1);
  assert.equal(value.summary.measurements, null);
  assert.equal(value.commands().length, 1);
});

test('search retains missing metric samples and CSV disagreements as failures', posixOnly, t => {
  for (const mode of ['missing-sample', 'different-samples', 'bad-rounding']) {
    const value = runFixtureCLI(t, mode, searchFixture());
    assert.equal(value.run.status, 1, mode);
    assert.equal(value.summary.measurements, null);
    assert.equal(value.summary.acceptance_status, 'unadopted');
  }
});

test('an unrecognized CLI scenario is rejected before creating output or invoking xcrun', posixOnly, t => {
  const value = runFixtureCLI(t, 'complete', { scenario: '__proto__' });
  assert.equal(value.run.status, 1);
  assert.equal(existsSync(value.output), false);
  assert.equal(existsSync(path.join(value.root, 'commands.jsonl')), false);
});

const scrollName = 'long-article-bounded-scroll';
const scrollID = 'PublishedPerformanceUITests/testLongArticleBoundedScroll()';
// The source hash is pinned to an existing article. The JSON/CSV/protocol and
// subprocesses below are synthetic, never a Simulator timing observation.
const scrollSource = readFileSync(new URL('../../docs/03-implementation/openai-prompting.md', import.meta.url));
const scrollWorkload = () => ({ ...performanceScenario(scrollName).scroll_witness });
function scrollInputFixture() {
  const fixed = scrollWorkload();
  const document = { schema_version: 1, article_id: fixed.article_id, source_sha256: fixed.expected_source_sha256,
    blocks: [{ type: 'heading', heading_id: fixed.start_heading_id, inlines: [{ type: 'text', text: fixed.start_label }] },
      { type: 'paragraph', inlines: [{ type: 'text', text: 'Synthetic fixture, not generated article text' }] },
      { type: 'heading', heading_id: fixed.end_heading_id, inlines: [{ type: 'text', text: fixed.end_label }] }] };
  const documentBytes = Buffer.from(JSON.stringify(document));
  const audit = { status: 'passed', articles: 4 };
  const manifest = { schema_version: 2, articles: [{ id: fixed.article_id, title: fixed.article_title,
    source_path: fixed.source_path, source_sha256: fixed.expected_source_sha256, document_path: fixed.document_path },
    ...['a', 'b', 'c'].map(id => ({ id }))],
    files: { [fixed.document_path]: createHash('sha256').update(documentBytes).digest('hex') } };
  return { document, documentBytes, audit, manifest, manifestBytes: Buffer.from(JSON.stringify(manifest)) };
}
const scrollContext = () => {
  const input = scrollInputFixture();
  return { expected_articles: 4, configuration: 'Debug', actual_app_package: input.audit,
    scenario: scrollName, test_method: 'testLongArticleBoundedScroll', scroll_witness: scrollWorkload(),
    scroll_input_binding: bindLongScrollInput(scrollSource, input.manifestBytes, input.documentBytes, input.audit) };
};
const scrollProtocol = () => ({ schema_version: 1, scenario: scrollName, metric: 'XCTClockMetric', expected_articles: 4,
  workload: scrollWorkload(), declared_recorded_iterations: 3, block_invocations: 4, discarded_warmup_invocations: 1,
  invocations: [1, 2, 3, 4].map(index => ({ index, swipes: index + 3, start_fully_visible: true,
    end_initially_fully_visible: false, end_fully_visible: true, start_offset_points: 8, end_offset_points: 140.5 })) });
const protocolBytes = (value = scrollProtocol()) => Buffer.from('synthetic Xcode prefix AILIBRARY_LONG_SCROLL_PROTOCOL ' + JSON.stringify(value) + '\n');
const scrollFixture = () => ({ scenario: scrollName, caseID: scrollID, context: scrollContext(), protocolBytes: protocolBytes() });

test('long-scroll is explicit while launch/search selection and not-measured semantics stay distinct', () => {
  assert.equal(performanceScenario().method, 'testLaunchToPublishedReadiness');
  assert.equal(performanceScenario(searchName).method, 'testSearchQueryToVisibleWitness');
  assert.equal(performanceScenario(scrollName).method, 'testLongArticleBoundedScroll');
  assert.equal(performanceNotMeasured().includes('scrolling'), true);
  assert.deepEqual(performanceNotMeasured(), performanceNotMeasured(searchName));
  const omitted = performanceNotMeasured(scrollName);
  assert.equal(omitted.includes('scrolling'), false);
  for (const item of ['FPS', 'hitches', 'frame time', 'pure rendering time', 'image decoding', 'memory', 'Release', 'physical device', 'p95', 'product performance budgets']) assert.ok(omitted.includes(item), item);
  assert.throws(() => performanceScenario('long-scroll'), /Unknown/);
});

test('actual input binding hashes source/document/manifest bytes and checks the audited generated heading order', () => {
  const input = scrollInputFixture();
  const binding = bindLongScrollInput(scrollSource, input.manifestBytes, input.documentBytes, input.audit);
  assert.equal(binding.source_sha256, createHash('sha256').update(scrollSource).digest('hex'));
  assert.equal(binding.document_sha256, createHash('sha256').update(input.documentBytes).digest('hex'));
  assert.equal(binding.document_source_sha256, binding.source_sha256);
  assert.equal(binding.manifest_document_sha256, binding.document_sha256);
  assert.equal(binding.manifest_sha256, createHash('sha256').update(input.manifestBytes).digest('hex'));
  assert.equal(verifiedScenarioContext(scrollContext(), scrollName).name, scrollName);
});

test('source changes, wrong manifest identity/hash and an unpassed or wrong-count package audit fail input binding', () => {
  const input = scrollInputFixture();
  assert.throws(() => bindLongScrollInput(Buffer.concat([scrollSource, Buffer.from('\n')]), input.manifestBytes, input.documentBytes, input.audit));
  for (const change of [m => { m.articles[0].source_path = 'other.md'; }, m => { m.articles[0].title = 'Other'; },
    m => { m.articles[0].source_sha256 = '0'.repeat(64); }, m => { m.files = {}; },
    m => { m.articles.push({ ...m.articles[0] }); }, m => { m.schema_version = 1; }]) {
    const manifest = structuredClone(input.manifest); change(manifest);
    assert.throws(() => bindLongScrollInput(scrollSource, Buffer.from(JSON.stringify(manifest)), input.documentBytes, input.audit));
  }
  for (const audit of [undefined, { status: 'failed', articles: 4 }, { status: 'passed', articles: 3 }, { status: 'passed', articles: 5 }]) {
    assert.throws(() => bindLongScrollInput(scrollSource, input.manifestBytes, input.documentBytes, audit));
  }
});

test('a correctly rehashed document still fails if its fixed headings are missing, duplicated, reversed or renamed', () => {
  for (const change of [d => { d.blocks.shift(); }, d => { d.blocks.push(d.blocks[0]); }, d => { d.blocks.reverse(); },
    d => { d.blocks[0].inlines[0].text = 'another label'; }, d => { d.article_id = 'other'; },
    d => { d.source_sha256 = '1'.repeat(64); }]) {
    const input = scrollInputFixture(); change(input.document); const bytes = Buffer.from(JSON.stringify(input.document));
    input.manifest.files[scrollWorkload().document_path] = createHash('sha256').update(bytes).digest('hex');
    assert.throws(() => bindLongScrollInput(scrollSource, Buffer.from(JSON.stringify(input.manifest)), bytes, input.audit));
  }
});

test('scroll context requires exact workload, generated binding, configuration, article count and explicit matching method', () => {
  for (const change of [c => { delete c.scenario; }, c => { c.test_method = 'testLaunchToPublishedReadiness'; },
    c => { c.configuration = 'Release'; }, c => { c.expected_articles = '4'; }, c => { c.expected_articles = 3; },
    c => { c.scroll_witness.maximum_swipes = 17; }, c => { c.scroll_witness.extra = true; },
    c => { c.scroll_input_binding.source_sha256 = '0'.repeat(64); }, c => { delete c.scroll_input_binding; },
    c => { c.scroll_input_binding.document_sha256 = 'a'.repeat(64); }, c => { c.scroll_input_binding.manifest_sha256 = ''; },
    c => { c.scroll_input_binding.actual_Debug_package_audit = 'unavailable'; }, c => { c.actual_app_package.articles = 5; }]) {
    const context = scrollContext(); change(context); assert.throws(() => verifiedScenarioContext(context, scrollName));
  }
});

test('one complete bounded protocol retains four ordered actual counts, source expectation and raw log digest', () => {
  const bytes = protocolBytes(), context = scrollContext(); const value = parseLongScrollProtocol(bytes, context);
  assert.deepEqual(value.protocol.invocations.map(item => item.swipes), [4, 5, 6, 7]);
  assert.equal(value.protocol.workload.expected_source_sha256, context.scroll_input_binding.source_sha256);
  assert.equal(value.log_bytes, bytes.length);
  assert.equal(value.log_sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.match(value.scope, /expected source hash/);
  assert.equal(parseLongScrollProtocol(Buffer.from(bytes.toString().replace(/\n/g, '\r\n')), context).protocol.block_invocations, 4);
});

test('missing, duplicate, truncated, malformed, oversized and invalid-UTF8 protocols are not measurements', () => {
  const bytes = protocolBytes(), context = scrollContext();
  for (const value of [Buffer.from('no protocol\n'), Buffer.concat([bytes, bytes]), bytes.subarray(0, bytes.length - 1),
    Buffer.from('AILIBRARY_LONG_SCROLL_PROTOCOL {}broken\n'), Buffer.from('AILIBRARY_LONG_SCROLL_PROTOCOL ' + ' '.repeat(8193) + '\n'),
    Buffer.concat([Buffer.from([0xff]), bytes]), Buffer.alloc(16 * 1024 * 1024 + 1, 32)]) {
    assert.throws(() => parseLongScrollProtocol(value, context));
  }
});

test('extra/missing/reordered invocations, mismatched declarations and foreign protocols fail closed', () => {
  for (const change of [p => { p.invocations.pop(); }, p => { p.invocations.push(p.invocations[3]); },
    p => { p.invocations.reverse(); }, p => { p.invocations[1].index = 1; }, p => { p.block_invocations = 3; },
    p => { p.declared_recorded_iterations = 4; }, p => { p.discarded_warmup_invocations = 0; },
    p => { p.expected_articles = 199; }, p => { p.metric = 'XCTMemoryMetric'; }, p => { p.scenario = searchName; },
    p => { p.workload.end_heading_id = 'other'; }, p => { p.extra = true; }, p => { delete p.schema_version; }]) {
    const value = scrollProtocol(); change(value); assert.throws(() => parseLongScrollProtocol(protocolBytes(value), scrollContext()));
  }
});

test('the exact16-drag bound and start tolerance accept their boundaries and reject overflow, zero or invalid witnesses', () => {
  const value = scrollProtocol(); value.invocations[0].swipes = 16; value.invocations[0].start_offset_points = 64;
  assert.equal(parseLongScrollProtocol(protocolBytes(value), scrollContext()).protocol.invocations[0].swipes, 16);
  for (const change of [p => { p.swipes = 0; }, p => { p.swipes = 17; }, p => { p.swipes = 1.5; },
    p => { p.start_offset_points = 64.001; }, p => { p.start_offset_points = -0.1; },
    p => { p.end_offset_points = -1; }, p => { p.end_offset_points = '140'; },
    p => { p.start_fully_visible = false; }, p => { p.end_initially_fully_visible = true; },
    p => { p.end_fully_visible = false; }, p => { delete p.swipes; }, p => { p.extra = true; }]) {
    const record = scrollProtocol(); change(record.invocations[0]); assert.throws(() => parseLongScrollProtocol(protocolBytes(record), scrollContext()));
  }
});

test('explicit scroll CLI combines its validated protocol with the same strict typed Clock and CSV contract', posixOnly, t => {
  const value = runFixtureCLI(t, 'complete', scrollFixture());
  assert.equal(value.run.status, 0, value.run.stderr);
  assert.equal(value.summary.scenario, scrollName); assert.equal(value.summary.test_id, scrollID);
  assert.deepEqual(value.summary.metrics[0].samples, [3, 1, 2]);
  assert.equal(value.summary.csv_validation.status, 'matched-clock-and-typed-values');
  assert.deepEqual(value.summary.scroll_observation.protocol.invocations.map(item => item.swipes), [4, 5, 6, 7]);
  assert.ok(existsSync(path.join(value.output, 'long-scroll-protocol.json')));
  assert.ok(!value.summary.not_measured.includes('scrolling'));
  assert.equal(value.summary.acceptance_status, 'unadopted');
  assert.ok(value.commands().filter(args => args.includes('--test-id')).every(args => args[args.indexOf('--test-id') + 1] === scrollID));
});

test('scroll CLI rejects a wrong case, bad types/counts/units and CSV disagreements without inventing zero values', posixOnly, t => {
  for (const mode of ['missing-sample', 'wrong-unit', 'foreign-metric', 'different-samples', 'bad-rounding']) {
    const value = runFixtureCLI(t, mode, scrollFixture());
    assert.equal(value.run.status, 1, mode); assert.equal(value.summary.measurements, null, mode);
    assert.ok(value.rawCSV().length > 0, mode);
  }
  const fixture = scrollFixture(); fixture.caseID = identifier;
  const wrongCase = runFixtureCLI(t, 'complete', fixture);
  assert.equal(wrongCase.run.status, 1); assert.equal(wrongCase.summary.measurements, null);
});

test('malformed or missing scroll protocol stops before any xcresult command, and a log cannot be passed to launch', posixOnly, t => {
  const duplicate = scrollFixture(); duplicate.protocolBytes = Buffer.concat([protocolBytes(), protocolBytes()]);
  const value = runFixtureCLI(t, 'complete', duplicate);
  assert.equal(value.run.status, 1); assert.equal(existsSync(path.join(value.root, 'commands.jsonl')), false);
  const absent = scrollFixture(); delete absent.protocolBytes;
  const noLog = runFixtureCLI(t, 'complete', absent);
  assert.equal(noLog.run.status, 1); assert.equal(existsSync(noLog.output), false);
  const launchLog = runFixtureCLI(t, 'complete', { protocolBytes: protocolBytes() });
  assert.equal(launchLog.run.status, 1); assert.equal(existsSync(launchLog.output), false);
});

test('scroll CLI refuses a context alias or symlink/hardlink protocol input before creating output', posixOnly, t => {
  for (const mode of ['context', 'symlink', 'hardlink']) {
    const fixture = scrollFixture(); fixture.protocolInput = mode;
    const value = runFixtureCLI(t, 'complete', fixture);
    assert.equal(value.run.status, 1, mode); assert.equal(existsSync(value.output), false, mode);
    assert.equal(existsSync(path.join(value.root, 'commands.jsonl')), false, mode);
    assert.equal(readFileSync(value.context, 'utf8'), value.contextBytes, mode);
  }
});


test('the actual workflow export shell forwards exact arguments under nounset for all scenarios', {
  skip: process.platform === 'win32' ? 'The hosted macOS Bash workflow and POSIX executable argv fixture require /bin/bash' : false,
}, t => {
  const workflow = loadYaml(readFileSync(new URL('../../.github/workflows/ios-performance.yml', import.meta.url), 'utf8'));
  const steps = workflow.jobs['ios-published-readiness'].steps.filter(step => step.name === 'Export typed samples and retain raw unvalidated CSV');
  assert.equal(steps.length, 1);
  assert.equal(steps[0].if, 'always()');
  assert.equal(typeof steps[0].run, 'string');
  const root = temporary(t), bin = path.join(root, 'bin');
  mkdirSync(bin);
  // Only capture argv from the actual YAML shell block; do not run the exporter or Xcode.
  writeFileSync(path.join(bin, 'node'), '#!/bin/sh\nprintf \'%s\\0\' "$@"\n', { mode: 0o755 });
  for (const scenario of ['launch-to-published-readiness', 'search-query-to-visible-witness', 'long-article-bounded-scroll']) {
    const run = spawnSync('/bin/bash', ['--noprofile', '--norc', '-e', '-u', '-o', 'pipefail', '-c', steps[0].run], {
      cwd: root, encoding: 'utf8', timeout: 5000, maxBuffer: 4096,
      env: { PATH: bin, LC_ALL: 'C', PERFORMANCE_SCENARIO: scenario },
    });
    assert.equal(run.error, undefined, scenario);
    assert.equal(run.signal, null, scenario);
    assert.equal(run.status, 0, scenario + ': ' + run.stderr);
    assert.equal(run.stderr, '', scenario);
    assert.ok(run.stdout.endsWith('\0'), scenario);
    const expected = ['ios/tests/export-performance.mjs',
      '--result', '.local/ios-performance/evidence/performance.xcresult',
      '--output', '.local/ios-performance/evidence/export',
      '--context', '.local/ios-performance/evidence/context.json', '--scenario', scenario];
    if (scenario === 'long-article-bounded-scroll') expected.push('--protocol-log', '.local/ios-performance/evidence/performance.log');
    assert.deepEqual(run.stdout.slice(0, -1).split('\0'), expected, scenario);
  }
});
