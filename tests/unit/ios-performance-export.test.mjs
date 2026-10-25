import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportPerformance, metricReference, normalizeMetrics, validateClockCSV, verifiedCase, verifiedDetails } from '../../ios/tests/export-performance.mjs';

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
function runFixtureCLI(t, mode = 'complete') {
  const root = temporary(t);
  const result = path.join(root, 'raw.xcresult');
  const bin = path.join(root, 'bin');
  mkdirSync(result); mkdirSync(bin);
  const context = path.join(root, 'context.json');
  const contextBytes = JSON.stringify({ expected_articles: 4, configuration: 'Debug' });
  writeFileSync(context, contextBytes);
  const database = path.join(result, 'database.sqlite3');
  const databaseBytes = 'synthetic immutable xcresult bytes';
  writeFileSync(database, databaseBytes);
  const output = path.join(root, 'export');
  const outputs = {
    report: report('Passed'),
    details: { ...detailsFixture(), hasPerformanceMetrics: mode !== 'missing-flag' },
    invocation: { actions: { _values: [{ actionResult: { testsRef: { id: { _value: 'plan-id' } } } }] } },
    plan: { summaries: [reference()] },
    summary: clockSummary(mode === 'missing-sample' ? ['1', '2'] : undefined),
  };
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
  const run = spawnSync(process.execPath, [exporter, '--result', result, '--output', output, '--context', context], {
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
