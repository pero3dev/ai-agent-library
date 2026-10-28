import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import childProcess, { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { performance } from 'node:perf_hooks'
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareMemoryCSVNumbers, enforceCompactCaps, equalMemoryDecimalTokens, exportMemory, memoryCaps, memoryCommandBudget, memoryObservation,
  normalizeMemoryCandidates, parseMemoryCSV, selectLegacySummary, trustedMemoryContract, validateMemoryCSV,
  validateMemoryMetricSet, verifyMemoryCase, verifyMemoryProvenance, writeOwnedEvidence } from '../../ios/tests/export-memory.mjs'

const exporter = fileURLToPath(new URL('../../ios/tests/export-memory.mjs', import.meta.url))
const id = 'PublishedPerformanceUITests/testPublishedArticleAppMemory()'
const head = 'a'.repeat(40)
const clone = value => structuredClone(value)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const posixOnly = { skip: process.platform === 'win32' ? 'Local xcrun executable double uses POSIX; no real Xcode process runs' : false }

// Arbitrary candidates exercise normalization only. Fixed-wire fixtures below
// use adopted identifiers with synthetic values, never a product budget.
const metric = (name, values = ['-4.00', '0', '+1e0']) => ({
  _type: { _name: 'ActionTestPerformanceMetricSummary' }, identifier: { _type: { _name: 'String' }, _value: name },
  displayName: { _type: { _name: 'String' }, _value: 'Fictional ' + name }, unitOfMeasurement: { _type: { _name: 'String' }, _value: 'fictional-units' },
  baselineAverage: { _type: { _name: 'Double' }, _value: '0.0' }, baselineName: { _type: { _name: 'String' }, _value: '' },
  measurements: { _values: values.map(value => ({ _type: { _name: 'Double' }, _value: value })) }
})
const fixedMetric = (index, values) => ({ ...metric(trustedMemoryContract.metrics[index].identifier, values),
  displayName: { _type: { _name: 'String' }, _value: trustedMemoryContract.metrics[index].display_name },
  unitOfMeasurement: { _type: { _name: 'String' }, _value: 'kB' } })
const summaryFixture = () => ({ _type: { _name: 'ActionTestSummary' }, identifier: { _value: id },
  testStatus: { _value: 'Success' }, performanceMetrics: { _values: [fixedMetric(0, ['100', '101', '102']),
    fixedMetric(1, ['110', '111', '112']), fixedMetric(2, ['-4.00', '0', '+1e0'])] } })
const arbitrarySummaryFixture = () => ({ ...summaryFixture(), performanceMetrics: {
  _values: [metric('synthetic.alpha'), metric('synthetic.beta', ['1', '2', '3'])] } })
const testsFixture = () => ({ testNodes: [{ nodeType: 'Test Suite', result: 'Passed',
  children: [{ nodeType: 'Test Case', nodeIdentifier: id, result: 'Passed' }] }] })
const detailsFixture = () => ({ testIdentifier: id, testResult: 'Passed', hasPerformanceMetrics: true,
  devices: [{ deviceId: '11111111-2222-3333-4444-555555555555', deviceName: 'owned-memory-fixture',
    modelName: 'iPhone 16', platform: 'iOS Simulator', osVersion: '18.5' }],
  testPlanConfigurations: [{ configurationName: 'Test Scheme Action' }] })
const rootFixture = () => ({ _type: { _name: 'ActionsInvocationRecord' }, actions: { _values: [
  { actionResult: { testsRef: { id: { _value: 'plan-id' } } } } ] } })
const planFixture = () => ({ _type: { _name: 'ActionTestPlanRunSummaries' }, summaries: [
  { _type: { _name: 'ActionTestMetadata' }, identifier: { _value: id }, summaryRef: { id: { _value: 'summary-id' } } } ] })
const contextFixture = () => ({ schema_version: 1, ...memoryObservation, configuration: 'Debug', expected_articles: 199,
  expected_source_head: head, checkout_head: head, source_tree: 'b'.repeat(40),
  source_sha256: Object.fromEntries(['.github/workflows/ios-memory.yml', 'ios/AILibraryUITests/PublishedPerformanceUITests.swift',
    'ios/tests/export-memory.mjs', 'tests/unit/ios-memory-export.test.mjs'].map(name => [name, 'c'.repeat(64)])),
  github: { repository: 'pero3dev/ai-agent-library', event_name: 'pull_request', run_id: '123', run_attempt: '1',
    sha: 'd'.repeat(40), workflow_sha: 'e'.repeat(40),
    workflow_ref: 'pero3dev/ai-agent-library/.github/workflows/ios-memory.yml@refs/pull/123/merge' },
  destination: { uuid: '11111111-2222-3333-4444-555555555555',
    device_type_identifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16',
    runtime_identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-18-5', device_name: 'owned-memory-fixture',
    device_model_name: 'iPhone 16', os_version: '18.5', owned: true },
  application: { bundle_identifier: memoryObservation.target_application, version: '0.2.22', build: '24',
    content_revision: 'f'.repeat(64), articles: 199, content_audited: true, fixture_audited: true } })

// Current fb29 / run40748853889 attempt1 typed/CSV wire fixture, without activity or device identifiers.
const currentFB29Summary = {"_type":{"_name":"ActionTestSummary","_supertype":{"_name":"ActionTestSummaryIdentifiableObject","_supertype":{"_name":"ActionAbstractTestSummary"}}},"identifier":{"_type":{"_name":"String"},"_value":"PublishedPerformanceUITests/testPublishedArticleAppMemory()"},"testStatus":{"_type":{"_name":"String"},"_value":"Success"},"performanceMetrics":{"_type":{"_name":"Array"},"_values":[{"_type":{"_name":"ActionTestPerformanceMetricSummary"},"baselineAverage":{"_type":{"_name":"Double"},"_value":"0.0"},"baselineName":{"_type":{"_name":"String"},"_value":""},"displayName":{"_type":{"_name":"String"},"_value":"Absolute Memory Physical (prototype)"},"identifier":{"_type":{"_name":"String"},"_value":"com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical_absolute"},"maxPercentRegression":{"_type":{"_name":"Double"},"_value":"10.0"},"maxPercentRelativeStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"maxRegression":{"_type":{"_name":"Double"},"_value":"0.0"},"maxStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"measurements":{"_type":{"_name":"Array"},"_values":[{"_type":{"_name":"Double"},"_value":"115629.696"},{"_type":{"_name":"Double"},"_value":"116989.568"},{"_type":{"_name":"Double"},"_value":"117530.24"}]},"polarity":{"_type":{"_name":"String"},"_value":"prefers smaller"},"unitOfMeasurement":{"_type":{"_name":"String"},"_value":"kB"}},{"_type":{"_name":"ActionTestPerformanceMetricSummary"},"baselineAverage":{"_type":{"_name":"Double"},"_value":"0.0"},"baselineName":{"_type":{"_name":"String"},"_value":""},"displayName":{"_type":{"_name":"String"},"_value":"Memory Peak Physical (prototype)"},"identifier":{"_type":{"_name":"String"},"_value":"com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical_peak"},"maxPercentRegression":{"_type":{"_name":"Double"},"_value":"10.0"},"maxPercentRelativeStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"maxRegression":{"_type":{"_name":"Double"},"_value":"0.0"},"maxStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"measurements":{"_type":{"_name":"Array"},"_values":[{"_type":{"_name":"Double"},"_value":"117972.608"},{"_type":{"_name":"Double"},"_value":"119398.016"},{"_type":{"_name":"Double"},"_value":"120151.68"}]},"polarity":{"_type":{"_name":"String"},"_value":"prefers smaller"},"unitOfMeasurement":{"_type":{"_name":"String"},"_value":"kB"}},{"_type":{"_name":"ActionTestPerformanceMetricSummary"},"baselineAverage":{"_type":{"_name":"Double"},"_value":"0.0"},"baselineName":{"_type":{"_name":"String"},"_value":""},"displayName":{"_type":{"_name":"String"},"_value":"Memory Physical (prototype)"},"identifier":{"_type":{"_name":"String"},"_value":"com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical"},"maxPercentRegression":{"_type":{"_name":"Double"},"_value":"10.0"},"maxPercentRelativeStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"maxRegression":{"_type":{"_name":"Double"},"_value":"0.0"},"maxStandardDeviation":{"_type":{"_name":"Double"},"_value":"10.0"},"measurements":{"_type":{"_name":"Array"},"_values":[{"_type":{"_name":"Double"},"_value":"3489.792"},{"_type":{"_name":"Double"},"_value":"3129.344"},{"_type":{"_name":"Double"},"_value":"2441.216"}]},"polarity":{"_type":{"_name":"String"},"_value":"prefers smaller"},"unitOfMeasurement":{"_type":{"_name":"String"},"_value":"kB"}}]}}
const currentFB29CSV = Buffer.from("\"Destination\",\"Configuration\",\"Absolute Memory Physical (prototype) (Average)\",\"Absolute Memory Physical (prototype) (Iterations)\",\"Absolute Memory Physical (prototype) (Baseline)\",\"Memory Peak Physical (prototype) (Average)\",\"Memory Peak Physical (prototype) (Iterations)\",\"Memory Peak Physical (prototype) (Baseline)\",\"Memory Physical (prototype) (Average)\",\"Memory Physical (prototype) (Iterations)\",\"Memory Physical (prototype) (Baseline)\"\n\"iPhone 16 iOS Simulator 18.5\",\"Test Scheme Action\",\"116716.5013 kB\",\"[115629.696, 116989.568, 117530.24]\",\"0\",\"119174.1013 kB\",\"[117972.608, 119398.016, 120151.68]\",\"0\",\"3020.117333 kB\",\"[3489.792, 3129.344, 2441.216]\",\"0\"")

function temporary(t) {
  const directory = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ailibrary-memory-export-test-')))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}

function inputFixture(t) {
  const root = temporary(t), result = path.join(root, 'memory.xcresult'), context = path.join(root, 'context.json')
  mkdirSync(result); writeFileSync(path.join(result, 'database.sqlite3'), 'immutable synthetic result')
  writeFileSync(context, JSON.stringify(contextFixture()))
  return { root, result, context, output: path.join(root, 'export'), expectedHead: head }
}

function verboseSummaryFixture(summary, count) {
  return { ...summary, activitySummaries: { _values: Array.from({ length: count }, (_, index) => ({
    _type: { _name: 'ActionTestActivitySummary' },
    title: { _value: 'Synthetic UI activity ' + String(index).padStart(4, '0') + '; no empirical payload' },
    activityType: { _value: 'synthetic.ui.activity' }
  })) } }
}

function memoryCSVFixture(summary, details) {
  const header = ['Destination', 'Configuration'], device = details.devices[0]
  const row = [[device.modelName, device.platform, device.osVersion].join(' '), details.testPlanConfigurations[0].configurationName]
  for (const metric of summary.performanceMetrics._values) {
    const values = metric.measurements._values.map(value => value._value), title = metric.displayName._value
    for (const suffix of ['Average', 'Iterations', 'Baseline']) header.push(title + ' (' + suffix + ')')
    const mean = values.reduce((total, value) => total + Number(value) / values.length, 0)
    row.push(mean.toFixed(6) + ' kB', '[' + values.join(', ') + ']', '0')
  }
  const quoted = value => '"' + value.replaceAll('"', '""') + '"'
  return header.map(quoted).join(',') + '\n' + row.map(quoted).join(',') + '\n'
}

function rewriteCSVFixture(bytes, mutate) {
  const parsed = parseMemoryCSV(bytes); mutate(parsed)
  const quoted = value => '"' + value.replaceAll('"', '""') + '"'
  return Buffer.from(parsed.header.map(quoted).join(',') + '\n' + parsed.row.map(quoted).join(',') + '\n')
}

function fixtureCLI(t, mode = 'complete', flags = []) {
  const options = inputFixture(t), bin = path.join(options.root, 'bin'); mkdirSync(bin)
  const commands = path.join(options.root, 'calls.jsonl'), database = path.join(options.result, 'database.sqlite3')
  const fixtures = { tests: testsFixture(), details: detailsFixture(), root: rootFixture(), plan: planFixture(), summary: summaryFixture() }
  if (mode === 'failed-case') { fixtures.tests.testNodes[0].children[0].result = 'Failed'; fixtures.details.testResult = 'Failed' }
  if (mode === 'wrong-summary') fixtures.summary.identifier._value = 'Foreign/test()'
  if (mode === 'extra-legacy-case') fixtures.plan.summaries.push({ _type: { _name: 'ActionTestMetadata' },
    identifier: { _value: 'Other/testForeign()' }, summaryRef: { id: { _value: 'foreign-summary-id' } } })
  if (mode === 'nonfinite') fixtures.summary.performanceMetrics._values[0].measurements._values[0]._value = 'NaN'
  if (mode === 'typed-missing') fixtures.summary.performanceMetrics._values[0].measurements._values.pop()
  const script = `#!${process.execPath}
const fs = require('node:fs'), path = require('node:path');
const args = process.argv.slice(2), data = ${JSON.stringify(fixtures)}, mode = ${JSON.stringify(mode)};
const verboseSummaryFixture = ${verboseSummaryFixture.toString()};
const memoryCSVFixture = ${memoryCSVFixture.toString()};
fs.appendFileSync(${JSON.stringify(commands)}, JSON.stringify(args) + '\\n');
if (args.includes('tests')) {
  if (mode === 'command-exit') process.exit(9);
  if (mode === 'command-signal') process.kill(process.pid, 'SIGKILL');
  if (mode === 'replace-context') {
    fs.renameSync(${JSON.stringify(options.context)}, ${JSON.stringify(options.context + '.original')});
    fs.writeFileSync(${JSON.stringify(options.context)}, 'replacement');
  }
  if (mode === 'inject-hardlink') fs.linkSync(${JSON.stringify(database)}, path.join(${JSON.stringify(options.output)}, 'modern-tests.json'));
  if (mode === 'inject-symlink') fs.symlinkSync(${JSON.stringify(database)}, path.join(${JSON.stringify(options.output)}, 'modern-tests.json'));
  if (mode === 'oversized-json') { process.stdout.write(' '.repeat(524289)); process.exit(0); }
  if (mode === 'invalid-utf8') { process.stdout.write(Buffer.from([255])); process.exit(0); }
  console.log(JSON.stringify(data.tests));
} else if (args.includes('test-details')) {
  if (mode === 'oversized-details') data.details.syntheticPadding = 'x'.repeat(524288);
  console.log(JSON.stringify(data.details));
}
else if (args.includes('object')) {
  const idx = args.indexOf('--id');
  let value = idx < 0 ? data.root : args[idx + 1] === 'plan-id' ? data.plan : data.summary;
  if ((mode === 'oversized-root' && idx < 0) || (mode === 'oversized-plan' && idx >= 0 && args[idx + 1] === 'plan-id')) {
    value = { ...value, syntheticPadding: 'x'.repeat(524288) };
  }
  const isSummary = idx >= 0 && args[idx + 1] === 'summary-id';
  if (isSummary && ['large-summary', 'oversized-summary'].includes(mode)) {
    value = verboseSummaryFixture(value, mode === 'large-summary' ? 2800 : 4200);
  }
  console.log(JSON.stringify(value, null, isSummary && ['large-summary', 'oversized-summary'].includes(mode) ? 2 : undefined));
} else if (args.includes('export')) {
  const out = args[args.indexOf('--output-path') + 1];
  if (mode.startsWith('diagnostic-')) console.log('SYNTHETIC CSV EXPORT');
  if (mode === 'diagnostic-stdout-cap') process.stdout.write('x'.repeat(16385));
  if (mode === 'diagnostic-member-before' || mode === 'diagnostic-member-after') {
    fs.writeFileSync(path.join(out, mode.endsWith('before') ? '000-sidecar.json' : 'zzz-sidecar.json'), 'synthetic unadopted sidecar');
  }
  if (mode === 'known-manifest' || mode === 'known-manifest-invalid-JSON') {
    fs.writeFileSync(path.join(out, 'manifest.json'), mode === 'known-manifest' ? '{"files":["ignored.csv"],"metric":"ignored"}' : Buffer.from([255, 0, 1]));
  }
  if (mode === 'known-manifest-oversize') fs.writeFileSync(path.join(out, 'manifest.json'), 'x'.repeat(16385));
  if (mode === 'known-manifest-hardlink') fs.linkSync(${JSON.stringify(database)}, path.join(out, 'manifest.json'));
  if (mode === 'known-manifest-symlink') fs.symlinkSync(${JSON.stringify(database)}, path.join(out, 'manifest.json'));
  if (mode === 'nested-manifest') { fs.mkdirSync(path.join(out, 'nested')); fs.writeFileSync(path.join(out, 'nested', 'manifest.json'), '{}'); }
  if (mode === 'directory-manifest') fs.mkdirSync(path.join(out, 'manifest.json'));
  if (mode === 'diagnostic-symlink' || mode === 'diagnostic-hardlink') {
    fs[mode.endsWith('symlink') ? 'symlinkSync' : 'linkSync'](${JSON.stringify(database)}, path.join(out, '000-unsafe.csv'));
  }
  if (mode === 'diagnostic-entry-cap' || mode === 'diagnostic-inventory-byte-cap') {
    const entries = mode === 'diagnostic-entry-cap' ? 65 : 60;
    for (let index = 0; index < entries; index++) fs.writeFileSync(path.join(out,
      '000-' + String(index).padStart(3, '0') + (mode === 'diagnostic-inventory-byte-cap' ? '-'.repeat(220) : '') + '.json'), 'synthetic');
  }
  if (mode === 'diagnostic-path-cap' || mode === 'diagnostic-depth-cap') {
    let folder = out;
    for (let index = 0; index < (mode === 'diagnostic-path-cap' ? 4 : 5); index++) {
      folder = path.join(folder, mode === 'diagnostic-path-cap' ? 'a'.repeat(140) : 'a'); fs.mkdirSync(folder);
    }
    fs.writeFileSync(path.join(folder, 'deep.csv'), 'uncaptured synthetic');
  }
  if (mode === 'foreign-csv-directory') fs.mkdirSync(path.join(${JSON.stringify(options.output)}, 'csv'));
  const count = mode === 'many-csv' ? 17 : ['diagnostic-member-before', 'diagnostic-member-after', 'diagnostic-symlink', 'diagnostic-hardlink'].includes(mode) ? 2 : 1;
  for (let index = 0; index < count; index++) {
    const file = path.join(out, 'synthetic-' + index + '.csv');
    if (mode === 'csv-hardlink') fs.linkSync(${JSON.stringify(database)}, file);
    else {
      let bytes = mode === 'large-csv' ? 'x'.repeat(65537) : memoryCSVFixture(data.summary, data.details);
      if (mode === 'tampered-csv-average') bytes = bytes.replace('101.000000 kB', '101.100000 kB');
      fs.writeFileSync(file, bytes);
    }
  }
} else process.exit(7);
`
  writeFileSync(path.join(bin, 'xcrun'), script, { mode: 0o755 })
  const run = spawnSync(process.execPath, [exporter, '--result', options.result, '--output', options.output,
    '--context', options.context, '--expected-head', head, ...flags], {
    encoding: 'utf8', timeout: 15000, env: { ...process.env, PATH: [bin, path.dirname(process.execPath), process.env.PATH ?? ''].join(path.delimiter) }
  })
  assert.equal(run.error, undefined)
  return { ...options, run, calls: () => existsSync(commands) ? readFileSync(commands, 'utf8').trim().split('\n').map(JSON.parse) : [],
    summary: () => JSON.parse(readFileSync(path.join(options.output, 'summary.json'), 'utf8')),
    verboseSummaryBytes: () => Buffer.from(JSON.stringify(verboseSummaryFixture(fixtures.summary, mode === 'large-summary' ? 2800 : 4200), null, 2) + '\n'),
    databaseBytes: () => readFileSync(database, 'utf8') }
}

test('fixed one case and modern/legacy identity join accept a synthetic passed case', () => {
  assert.equal(verifyMemoryCase(testsFixture(), detailsFixture()), id)
  assert.deepEqual(selectLegacySummary(rootFixture(), planFixture(), summaryFixture(), id), { plan_ref: 'plan-id', summary_ref: 'summary-id' })
})

test('extra, foreign, skipped, failed and mismatched cases are refused', () => {
  for (const mutate of [
    value => value.testNodes[0].children.push(clone(value.testNodes[0].children[0])),
    value => { value.testNodes[0].children[0].nodeIdentifier = 'Other/test()' },
    value => { value.testNodes[0].children[0].result = 'Skipped' },
    value => { value.testNodes[0].children[0].result = 'Failed' },
    value => { value.testNodes[0].result = 'Failed' }
  ]) { const report = testsFixture(); mutate(report); assert.throws(() => verifyMemoryCase(report, detailsFixture())) }
  for (const patch of [{ testIdentifier: 'Other/test()' }, { testResult: 'Failed' }, { hasPerformanceMetrics: false }, { devices: [] }]) {
    assert.throws(() => verifyMemoryCase(testsFixture(), { ...detailsFixture(), ...patch }))
  }
})

test('legacy invocation, plan, duplicate refs, summary type/status and identifiers fail closed', () => {
  const baseline = [rootFixture(), planFixture(), summaryFixture(), id]
  for (const mutate of [
    value => { value[0]._type._name = 'Wrong' }, value => { value[0].actions._values.push(clone(value[0].actions._values[0])) },
    value => { delete value[0].actions._values[0].actionResult.testsRef },
    value => { value[1]._type._name = 'Wrong' }, value => { value[1].summaries.push(clone(value[1].summaries[0])) },
    value => { value[1].summaries[0].identifier._value = 'Other/test()' },
    value => { const foreign = clone(value[1].summaries[0]); foreign.identifier._value = 'Other/testForeign()'; value[1].summaries.push(foreign) },
    value => { value[1].summaries = [] },
    value => { value[2]._type._name = 'Wrong' }, value => { value[2].testStatus._value = 'Failure' },
    value => { value[2].identifier._value = 'Other/test()' }
  ]) { const args = clone(baseline); mutate(args); assert.throws(() => selectLegacySummary(...args)) }
})

test('candidate set preserves signed, zero and decimal spelling without identifying memory units', () => {
  const values = normalizeMemoryCandidates(arbitrarySummaryFixture(), id)
  assert.equal(values.length, 2)
  assert.deepEqual(values[0].raw_samples, ['-4.00', '0', '+1e0'])
  assert.deepEqual(values[0].samples, [-4, 0, 1])
  assert.equal(values[0].unit, 'fictional-units')
  assert.equal(values[0].interpretation, 'unadopted-candidate')
})

test('missing, extra, duplicate, mistyped, nonfinite and underflowed metric samples are refused', () => {
  for (const mutate of [
    value => { value.performanceMetrics._values = [] },
    value => { value.performanceMetrics._values.push(clone(value.performanceMetrics._values[0])) },
    value => { value.performanceMetrics._values[0]._type._name = 'Wrong' },
    value => { value.performanceMetrics._values[0].measurements._values.pop() },
    value => { value.performanceMetrics._values[0].measurements._values.push({ _type: { _name: 'Double' }, _value: '4' }) },
    value => { value.performanceMetrics._values[0].measurements._values[0]._type._name = 'Int' },
    value => { delete value.performanceMetrics._values[0].measurements._values[0]._value }
  ]) { const summary = summaryFixture(); mutate(summary); assert.throws(() => normalizeMemoryCandidates(summary, id)) }
  for (const token of ['NaN', 'Infinity', '-Infinity', '1e999', '1e-999', '', ' ', true, null, ' 1']) {
    const summary = summaryFixture(); summary.performanceMetrics._values[0].measurements._values[0]._value = token
    assert.throws(() => normalizeMemoryCandidates(summary, id), String(token))
  }
})

test('fixed source contract is deeply frozen and rejects runtime substitution or arbitrary candidates', () => {
  const candidates = normalizeMemoryCandidates(summaryFixture(), id)
  assert.equal(trustedMemoryContract.id, 'xcode16.4-app-memory-v1')
  assert.ok(Object.isFrozen(trustedMemoryContract)); assert.ok(Object.isFrozen(trustedMemoryContract.metrics))
  for (const value of trustedMemoryContract.metrics) assert.ok(Object.isFrozen(value))
  assert.ok(Object.isFrozen(trustedMemoryContract.csv)); assert.ok(Object.isFrozen(trustedMemoryContract.csv.fixed_headers)); assert.ok(Object.isFrozen(trustedMemoryContract.csv.suffixes))
  assert.throws(() => { trustedMemoryContract.metrics[0].identifier = 'foreign' })
  assert.throws(() => { trustedMemoryContract.csv.suffixes.push('foreign') })
  assert.equal(validateMemoryMetricSet(candidates).confirmed, true)
  assert.throws(() => validateMemoryMetricSet(candidates, { identifiers: ['synthetic.alpha'] }))
  assert.throws(() => validateMemoryMetricSet(candidates, clone(trustedMemoryContract)))
  assert.throws(() => validateMemoryMetricSet(normalizeMemoryCandidates(arbitrarySummaryFixture(), id)))
  assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes: Buffer.from('opaque synthetic schema\n') }], candidates, detailsFixture(), contextFixture()))
  assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes: Buffer.from('x') }, { name: 'one.csv', bytes: Buffer.from('y') }], candidates))
  for (const bytes of [Buffer.alloc(0), Buffer.from([255]), Buffer.from('x\0y'), Buffer.alloc(65537)]) {
    assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes }], candidates))
  }
})

test('generic wide CSV parser preserves quoted fields without adopting a wire schema', () => {
  const parsed = parseMemoryCSV(Buffer.from('"Fictional B","Fictional A","Quoted name","Line"\r\n"[1, 2, 3]","-4.00","a""b","one\ntwo"\r\n'))
  assert.deepEqual(parsed.header, ['Fictional B', 'Fictional A', 'Quoted name', 'Line'])
  assert.deepEqual(parsed.row, ['[1, 2, 3]', '-4.00', 'a"b', 'one\ntwo'])
  assert.deepEqual(parseMemoryCSV(Buffer.from('"A","B"\n"2","1"')), { header: ['A', 'B'], row: ['2', '1'] })
  assert.equal(trustedMemoryContract.id, 'xcode16.4-app-memory-v1')
  assert.equal(validateMemoryMetricSet(normalizeMemoryCandidates(summaryFixture(), id)).confirmed, true)
})

test('generic wide CSV parser rejects malformed quotes, rows, headers and overwide records', () => {
  for (const text of [
    '', 'A,B\n1,2\n', '"A","B"\n"1",2\n', '"A","B"\n"1","2',
    '"A","B"\n"1","2"trailing', '"A","B"\r"1","2"',
    '"A","B"\n"1"\n', '"A","B"\n"1","2","3"\n',
    '"A","B"\n"1","2"\n"3","4"\n', '"A","B"\n"1","2"\n\n',
    '"A","A"\n"1","2"\n', '"","B"\n"1","2"\n',
    '"A","B"\n"1","2",', '"A","B"\n"1","2"\0',
    '"A","B"\n"1","2"\n \n'
  ]) assert.throws(() => parseMemoryCSV(Buffer.from(text)), JSON.stringify(text))
  const wide = Array.from({ length: 65 }, (_, index) => `"Fictional-${index}"`).join(',')
  assert.throws(() => parseMemoryCSV(Buffer.from(wide + '\n' + wide + '\n')), /column safety cap/)
})

test('generic wide CSV parser enforces bytes, UTF8 and aggregate input bounds', () => {
  for (const bytes of [undefined, '"A"\n"1"', Buffer.alloc(0), Buffer.from([255]), Buffer.alloc(65537)]) {
    assert.throws(() => parseMemoryCSV(bytes))
  }
  assert.throws(() => parseMemoryCSV(Buffer.from('\ufeff"A"\n"1"\n')))
})

test('generic exact decimal helpers preserve signed and zero samples with strict iteration order', () => {
  const result = compareMemoryCSVNumbers(['-4.00', '0', '+1e0'], '[-4, -0.0, 1.000]', '-1.00')
  assert.deepEqual(result.raw_iterations, ['-4', '-0.0', '1.000'])
  assert.equal(result.typed_mean, -1); assert.equal(result.CSV_average, -1)
  assert.equal(result.mean_comparison.empirical_absolute_epsilon, 0)
  assert.equal(result.mean_comparison.typed_mean_numerator, '-300')
  assert.equal(result.mean_comparison.typed_mean_denominator, '300')
  assert.equal(equalMemoryDecimalTokens('-0', '+0e2'), true)
  assert.equal(equalMemoryDecimalTokens('-1.50e1', '-15'), true)
  assert.equal(equalMemoryDecimalTokens('.01', '1e-2'), true)
  assert.equal(equalMemoryDecimalTokens('1.0000000000000001', '1'), false)
  assert.throws(() => compareMemoryCSVNumbers(['-4', '0', '1'], '[0, -4, 1]', '-1'))
  assert.throws(() => compareMemoryCSVNumbers(['1.0000000000000001', '1', '1'], '[1, 1, 1]', '1.0'))
})

test('generic mean comparison separates printed rounding from bounded binary64 arithmetic', () => {
  for (const sign of ['', '-']) {
    const samples = [sign + '1', sign + '1', sign + '1.15']
    compareMemoryCSVNumbers(samples, '[' + samples.join(', ') + ']', sign + '1.0')
    const outside = [sign + '1', sign + '1', sign + '1.15000000000001']
    assert.throws(() => compareMemoryCSVNumbers(outside, '[' + outside.join(', ') + ']', sign + '1.0'), /rounding bounds/)
  }
  compareMemoryCSVNumbers(['0', '0', '0'], '[0, -0.00, +0e1]', '0.0')
  assert.throws(() => compareMemoryCSVNumbers(['1', '2', '3'], '[1, 2, 3]', '2e0'), /plain printed average/)
})

function plainDouble(value) {
  const token = String(value), match = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(token)
  if (!match) return token
  const digits = match[2] + (match[3] ?? ''), position = match[2].length + Number(match[4])
  return match[1] + (position <= 0 ? '0.' + '0'.repeat(-position) + digits :
    position >= digits.length ? digits + '0'.repeat(position - digits.length) : digits.slice(0, position) + '.' + digits.slice(position))
}

test('generic mean comparison accepts representable positive and negative binary64 reductions', () => {
  for (const sign of [1, -1]) {
    const samples = [0.1, 0.2, 0.3].map(value => value * sign), raw = samples.map(String)
    const ordinaryMean = String((samples[0] + samples[1] + samples[2]) / 3)
    const dividedMean = String(samples.reduce((total, value) => total + value / 3, 0))
    for (const mean of [ordinaryMean, dividedMean]) {
      const result = compareMemoryCSVNumbers(raw, '[' + raw.join(', ') + ']', mean)
      assert.equal(result.mean_comparison.arithmetic_model.Apple_implementation_verified, false)
      assert.equal(result.mean_comparison.arithmetic_model.maximum_rounding_depth, 3)
      assert.notEqual(result.mean_comparison.rounding_allowances.wire_decimal_to_binary64.numerator, '0')
    }
    assert.throws(() => compareMemoryCSVNumbers(raw, '[' + raw.join(', ') + ']', String(0.2000000000000002 * sign)), /rounding bounds/)
  }
})

test('generic binary64 rounding allowance scales with actual samples and has no floor of one', () => {
  for (const magnitude of [1e-100, 1e100]) {
    const samples = [0.1, 0.2, 0.3].map(value => value * magnitude), raw = samples.map(String)
    const mean = plainDouble((samples[0] + samples[1] + samples[2]) / 3)
    const result = compareMemoryCSVNumbers(raw, '[' + raw.join(', ') + ']', mean)
    assert.equal(result.mean_comparison.empirical_absolute_epsilon, 0)
    assert.throws(() => compareMemoryCSVNumbers(raw, '[' + raw.join(', ') + ']', plainDouble(0.3 * magnitude)), /rounding bounds/)
  }
  const samples = ['10000000000000000', '1', '-10000000000000000']
  compareMemoryCSVNumbers(samples, '[' + samples.join(', ') + ']', '0')
  assert.throws(() => compareMemoryCSVNumbers(samples, '[' + samples.join(', ') + ']', '10'), /rounding bounds/)
})

test('generic subnormal allowance remains an exact nonzero rational instead of underflowing', () => {
  const result = compareMemoryCSVNumbers(['5e-324', '0', '-0'], '[5e-324, 0, 0]', '0')
  assert.deepEqual(result.mean_comparison.rounding_allowances.gradual_underflow,
    { numerator: '3', denominator: (1n << 1074n).toString() })
  assert.equal(result.mean_comparison.rounding_allowances.total.numerator === '0', false)
  assert.equal(result.mean_comparison.empirical_absolute_epsilon, 0)
})

test('generic mean comparison refuses reduction overflow instead of accepting an infinite bound', () => {
  for (const sign of [1, -1]) {
    const maximum = String(Number.MAX_VALUE * sign), raw = [maximum, maximum, '0']
    assert.throws(() => compareMemoryCSVNumbers(raw, '[' + raw.join(', ') + ']', '0'), /could overflow/)
  }
})

test('generic exact comparison refuses missing, extra, malformed or nonfinite samples', () => {
  for (const iterations of ['[]', '[1,2]', '[1,2,3,4]', '[[1,2,3]]', '[1,,3]', '[1,2,NaN]', '1,2,3']) {
    assert.throws(() => compareMemoryCSVNumbers(['1', '2', '3'], iterations, '2'))
  }
  for (const samples of [[], ['1', '2'], ['1', '2', '3', '4'], null]) {
    assert.throws(() => compareMemoryCSVNumbers(samples, '[1,2,3]', '2'))
  }
  for (const token of ['NaN', 'Infinity', '-Infinity', '1e999', '1e-999', '0e999', '', ' ', true, null, '1'.repeat(513)]) {
    assert.throws(() => equalMemoryDecimalTokens(token, '0'), String(token))
    assert.throws(() => compareMemoryCSVNumbers([token, '0', '0'], '[0,0,0]', '0'), String(token))
  }
  for (const average of ['', ' ', 'NaN', 'Infinity', '2 s', '2e0', '1'.repeat(513)]) {
    assert.throws(() => compareMemoryCSVNumbers(['1', '2', '3'], '[1,2,3]', average))
  }
})

test('current fb29 typed and CSV wire fixture joins all three metrics, samples and unadopted baselines', () => {
  assert.equal(currentFB29CSV.length, 667)
  assert.equal(hash(currentFB29CSV), 'dba73c0c1c1218f1b6ace611d04c28184ffb784fc2250e43eb1801217b67a3db')
  const candidates = normalizeMemoryCandidates(currentFB29Summary, id), typed = validateMemoryMetricSet(candidates)
  const csv = validateMemoryCSV([{ name: 'current.csv', bytes: currentFB29CSV }], candidates, detailsFixture(), contextFixture())
  assert.equal(typed.metrics.length, 3); assert.equal(csv.status, 'matched-fixed-memory-csv')
  assert.equal(csv.header_columns, 11); assert.equal(csv.data_rows, 1); assert.equal(csv.file_count, 1)
  assert.equal(csv.destination, 'iPhone 16 iOS Simulator 18.5'); assert.equal(csv.configuration, 'Test Scheme Action')
  for (const [index, metric] of typed.metrics.entries()) {
    assert.equal(metric.unit, 'kB'); assert.equal(metric.sample_count, 3)
    assert.deepEqual(csv.metrics[index].raw_iterations, metric.raw_samples)
    assert.equal(metric.baseline.average_raw, '0.0'); assert.equal(metric.baseline.name, '')
    assert.equal(metric.baseline.acceptance, 'unadopted'); assert.equal(csv.metrics[index].baseline_raw, '0')
    assert.equal(csv.metrics[index].mean_comparison.empirical_absolute_epsilon, 0)
  }
})

test('fixed metric set rejects missing, extra, unknown, mistyped or inconsistent metadata and baselines', () => {
  const baseline = normalizeMemoryCandidates(summaryFixture(), id)
  for (const mutate of [
    values => values.pop(), values => values.push(clone(values[0])),
    values => { values[0].identifier += '.foreign' }, values => { values[0].display_name += ' Runner' },
    values => { values[0].unit = 'MB' }, values => { values[0].sample_count = 2 },
    values => { values[0].samples[0] = 99 }, values => { values[0].raw_samples.pop() }, values => { values[0].raw_samples[0] = 100 },
    values => { values[0].baseline.average_raw = '1' }, values => { values[0].baseline.name = 'adopted budget' },
    values => { delete values[0].baseline }
  ]) { const candidates = clone(baseline); mutate(candidates); assert.throws(() => validateMemoryMetricSet(candidates)) }
  for (const mutate of [
    summary => { summary.performanceMetrics._values[0].identifier._type._name = 'Int' },
    summary => { summary.performanceMetrics._values[0].baselineAverage._type._name = 'Int' },
    summary => { delete summary.performanceMetrics._values[0].baselineName },
    summary => { summary.performanceMetrics._values[0].baselineAverage._value = 'Infinity' },
    summary => { summary.performanceMetrics._values[0].measurements._values[0]._value = 100 }
  ]) { const summary = summaryFixture(); mutate(summary); assert.throws(() => normalizeMemoryCandidates(summary, id)) }
})

test('memory CSV header correlation is by the exact column-name set rather than column positions', () => {
  const candidates = normalizeMemoryCandidates(currentFB29Summary, id), files = bytes => [{ name: 'current.csv', bytes }]
  const baseline = validateMemoryCSV(files(currentFB29CSV), candidates, detailsFixture(), contextFixture())
  const reordered = rewriteCSVFixture(currentFB29CSV, parsed => {
    parsed.header.reverse(); parsed.row.reverse()
  })
  const actual = validateMemoryCSV(files(reordered), [...candidates].reverse(), detailsFixture(), contextFixture())
  assert.deepEqual(actual.metrics, baseline.metrics)
  assert.equal(actual.destination, baseline.destination)
})

test('memory CSV refuses altered headers, samples, units, means, baselines, configurations and extra records', () => {
  const candidates = normalizeMemoryCandidates(currentFB29Summary, id)
  const invalid = mutate => rewriteCSVFixture(currentFB29CSV, mutate)
  for (const bytes of [
    invalid(value => { value.header[0] = 'Foreign Destination' }),
    invalid(value => { value.header[1] = value.header[0] }),
    invalid(value => { value.header.pop(); value.row.pop() }),
    invalid(value => { value.header.push('Foreign'); value.row.push('0') }),
    invalid(value => { value.row[0] = 'owned-memory-fixture iOS Simulator 18.5' }),
    invalid(value => { value.row[1] = 'Debug' }),
    invalid(value => { value.row[2] = '116716.5013 MB' }),
    invalid(value => { value.row[2] = '1.167165013e5 kB' }),
    invalid(value => { value.row[2] = '116716.6013 kB' }),
    invalid(value => { value.row[3] = '[116989.568, 115629.696, 117530.24]' }),
    invalid(value => { value.row[3] = '[115629.69600000001, 116989.568, 117530.24]' }),
    invalid(value => { value.row[4] = '1' }), invalid(value => { value.row[4] = '0.0' }),
    Buffer.concat([currentFB29CSV, currentFB29CSV.subarray(currentFB29CSV.indexOf('\n') + 1)])
  ]) assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes }], candidates, detailsFixture(), contextFixture()))
  const files = [{ name: 'one.csv', bytes: currentFB29CSV }]
  assert.throws(() => validateMemoryCSV([...files, { name: 'two.csv', bytes: currentFB29CSV }], candidates, detailsFixture(), contextFixture()))
  assert.throws(() => validateMemoryCSV([], candidates, detailsFixture(), contextFixture()))
  assert.throws(() => validateMemoryCSV(files, candidates, detailsFixture(), contextFixture(), clone(trustedMemoryContract)))
})

test('memory CSV result UUID, custom name, model, platform, OS and Debug producer context must agree', () => {
  const candidates = normalizeMemoryCandidates(currentFB29Summary, id), files = [{ name: 'one.csv', bytes: currentFB29CSV }]
  for (const mutate of [
    (details, context) => { details.devices[0].deviceId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    (details, context) => { details.devices[0].deviceName = 'foreign-owned-name' },
    (details, context) => { details.devices[0].modelName = 'iPhone 15' },
    (details, context) => { details.devices[0].platform = 'iOS' },
    (details, context) => { details.devices[0].osVersion = '18.6' },
    (details, context) => { details.devices.push(clone(details.devices[0])) },
    (details, context) => { details.testPlanConfigurations[0].configurationName = 'Debug' },
    (details, context) => { details.testPlanConfigurations.push(clone(details.testPlanConfigurations[0])) },
    (details, context) => { context.destination.uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    (details, context) => { context.destination.owned = false },
    (details, context) => { context.destination.runtime_identifier = 'foreign-runtime' },
    (details, context) => { context.configuration = 'Release' }
  ]) {
    const details = detailsFixture(), context = contextFixture(); mutate(details, context)
    assert.throws(() => validateMemoryCSV(files, candidates, details, context))
  }
})

test('producer provenance requires independent expected head while allowing PR synthetic github SHA', () => {
  const result = verifyMemoryProvenance(contextFixture(), head)
  assert.equal(result.status, 'producer-context-consistent'); assert.equal(result.official_workflow_API_verified, false)
  assert.equal(result.runtime_checkout_cryptographically_verified, false); assert.equal(result.protocol_payload_verified, false)
  assert.throws(() => verifyMemoryProvenance(contextFixture(), '0'.repeat(40)))
  for (const mutate of [
    value => { value.checkout_head = '0'.repeat(40) }, value => { value.scenario = 'launch-to-published-readiness' },
    value => { value.metric_configuration = 'XCTMemoryMetric()' }, value => { value.expected_articles = 3 },
    value => { value.github.event_name = 'pull_request_target' }, value => { value.github.event_name = 'push' },
    value => { value.github.run_id = '1;bad' }, value => { value.destination.owned = false },
    value => { value.destination.device_model_name = 'Other' }, value => { value.application.articles = 3 },
    value => { value.application.fixture_audited = false }, value => { value.source_sha256.extra = 'f'.repeat(64) }
  ]) { const context = contextFixture(); mutate(context); assert.throws(() => verifyMemoryProvenance(context, head)) }
})

test('command deadlines clamp every child to remaining shared budget and refuse exhausted time', () => {
  assert.equal(memoryCommandBudget(170000, 0), 60000)
  assert.equal(memoryCommandBudget(170000, 169950), 50)
  assert.throws(() => memoryCommandBudget(170000, 170000))
  assert.throws(() => memoryCommandBudget(Infinity, 0))
})

test('compact member, duplicate and aggregate caps reject instead of truncating', () => {
  assert.equal(enforceCompactCaps([{ path: 'modern-tests.json', bytes: memoryCaps.json }]), memoryCaps.json)
  assert.throws(() => enforceCompactCaps([{ path: 'foreign.txt', bytes: 1 }]))
  assert.throws(() => enforceCompactCaps([{ path: 'modern-tests.json', bytes: memoryCaps.json + 1 }]))
  assert.throws(() => enforceCompactCaps([{ path: 'csv/one.csv', bytes: memoryCaps.csv + 1 }]))
  assert.throws(() => enforceCompactCaps([{ path: 'summary.json', bytes: 1 }, { path: 'summary.json', bytes: 1 }]))
  assert.throws(() => enforceCompactCaps(Array.from({ length: 17 }, (_, index) => ({ path: `csv/${index}.csv`, bytes: 1 }))))
  assert.throws(() => enforceCompactCaps(['modern-tests.json', 'modern-details.json', 'legacy-root.json', 'legacy-plan.json', 'legacy-summary.json'].map(name => ({ path: name, bytes: memoryCaps.json }))))
})

test('fresh owned evidence refuses existing output and overlapping inputs', t => {
  const fixture = inputFixture(t); mkdirSync(fixture.output)
  assert.throws(() => writeOwnedEvidence(fixture), /EEXIST/)
  assert.throws(() => writeOwnedEvidence({ ...fixture, output: path.join(fixture.result, 'export') }), /overlap/)
  assert.throws(() => writeOwnedEvidence({ ...fixture, context: path.join(fixture.result, 'context.json') }), /overlap/)
})

test('owned writer rejects late root, context and previously written file replacement', t => {
  for (const mode of ['root', 'context', 'leaf']) {
    const fixture = inputFixture(t), writer = writeOwnedEvidence(fixture)
    writer.write('modern-tests.json', '{}')
    if (mode === 'root') { renameSync(fixture.output, fixture.output + '.old'); mkdirSync(fixture.output) }
    if (mode === 'context') { renameSync(fixture.context, fixture.context + '.old'); writeFileSync(fixture.context, '{}') }
    if (mode === 'leaf') { const leaf = path.join(fixture.output, 'modern-tests.json'); renameSync(leaf, leaf + '.old'); writeFileSync(leaf, '{}') }
    assert.throws(() => writer.write('summary.json', '{}'), /identity/)
  }
})

test('hardlinked and symbolic input files cannot create an output', posixOnly, t => {
  for (const mode of ['hardlink', 'symlink']) {
    const fixture = inputFixture(t), original = fixture.context + '.source'; renameSync(fixture.context, original)
    if (mode === 'hardlink') linkSync(original, fixture.context); else symlinkSync(original, fixture.context)
    assert.throws(() => writeOwnedEvidence(fixture))
    assert.equal(existsSync(fixture.output), false)
  }
})

test('actual CLI double accepts only the fixed three metrics joined to one CSV and exits0', posixOnly, t => {
  const fixture = fixtureCLI(t)
  assert.equal(fixture.run.status, 0, fixture.run.stderr)
  const summary = fixture.summary(); assert.equal(summary.status, 'matched-memory-observation')
  assert.equal(summary.accepted_measurements.length, 3); assert.equal(summary.candidates.length, 3)
  assert.equal(summary.protocol_payload_verified, false); assert.equal(summary.csv_validation.schema_verified, true)
  assert.equal(summary.product_performance_acceptance, false); assert.equal(summary.CSV_export_manifest.status, 'absent')
  assert.deepEqual(summary.accepted_measurements[2].raw_samples, ['-4.00', '0', '+1e0'])
  assert.equal(summary.warmup_verification.source_assertion_independently_verified, false)
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1)
  const manifest = JSON.parse(readFileSync(path.join(fixture.output, 'manifest.json'), 'utf8'))
  for (const member of manifest.files) {
    const bytes = readFileSync(path.join(fixture.output, member.path)); assert.equal(bytes.length, member.bytes); assert.equal(hash(bytes), member.sha256)
  }
  const commands = JSON.parse(readFileSync(path.join(fixture.output, 'commands.json'), 'utf8'))
  assert.equal(commands.length, 6); assert.ok(commands.every(command => command.timeout_ms > 0 && command.timeout_ms <= 60000))
  assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
})

test('only the fixed raw legacy summary gets a 1MiB member cap', () => {
  assert.equal(memoryCaps.json, 512 * 1024); assert.equal(memoryCaps.legacySummary, 1024 * 1024)
  assert.equal(memoryCaps.aggregate, 2 * 1024 * 1024)
  assert.equal(enforceCompactCaps([{ path: 'legacy-summary.json', bytes: memoryCaps.legacySummary }]), memoryCaps.legacySummary)
  assert.throws(() => enforceCompactCaps([{ path: 'legacy-summary.json', bytes: memoryCaps.legacySummary + 1 }]))
  for (const name of ['modern-tests.json', 'modern-details.json', 'legacy-root.json', 'legacy-plan.json',
    'context.json', 'summary.json', 'provenance.json', 'manifest.json']) {
    assert.equal(enforceCompactCaps([{ path: name, bytes: memoryCaps.json }]), memoryCaps.json)
    assert.throws(() => enforceCompactCaps([{ path: name, bytes: memoryCaps.json + 1 }]), name)
  }
  assert.throws(() => enforceCompactCaps([{ path: 'commands.json', bytes: memoryCaps.commandReceipt + 1 }]))
})

test('CLI retains a verbose 700–900KiB synthetic legacy summary verbatim before fixed-wire acceptance', posixOnly, t => {
  const fixture = fixtureCLI(t, 'large-summary'), expected = fixture.verboseSummaryBytes()
  assert.ok(expected.length >= 700 * 1024 && expected.length <= 900 * 1024)
  assert.equal(fixture.run.status, 0, fixture.run.stderr)
  const retained = readFileSync(path.join(fixture.output, 'legacy-summary.json'))
  assert.deepEqual(retained, expected, 'Pretty raw stdout is not truncated, minified or transformed')
  const summary = fixture.summary(); assert.equal(summary.status, 'matched-memory-observation')
  assert.equal(summary.accepted_measurements.length, 3); assert.equal(summary.metric_contract_accepted, true)
  assert.equal(summary.candidates.length, 3); assert.equal(summary.csv_validation.files.length, 1)
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1)
  assert.equal(fixture.calls().length, 6, 'Each existing fixed child command runs exactly once')
  const manifest = JSON.parse(readFileSync(path.join(fixture.output, 'manifest.json'), 'utf8'))
  for (const member of manifest.files) {
    const bytes = readFileSync(path.join(fixture.output, member.path))
    assert.equal(bytes.length, member.bytes); assert.equal(hash(bytes), member.sha256)
  }
  assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
})

test('CLI refuses over-1MiB legacy summary and over-512KiB other JSON without partial acceptance', posixOnly, t => {
  for (const [mode, calls] of [['oversized-summary', 5], ['oversized-details', 2], ['oversized-root', 3], ['oversized-plan', 4]]) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    assert.equal(fixture.summary().accepted_measurements, null); assert.equal(fixture.summary().metric_contract_accepted, false)
    assert.equal(fixture.calls().length, calls, 'No child is retried or CSV export started')
    assert.equal(existsSync(path.join(fixture.output, 'legacy-summary.json')), false, 'Oversized or incomplete raw summary is not written')
    assert.equal(existsSync(path.join(fixture.output, 'csv')), false)
    assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
    if (mode === 'oversized-summary') assert.ok(fixture.verboseSummaryBytes().length > memoryCaps.legacySummary)
  }
})

test('larger raw summary preserves the 2MiB aggregate and 32KiB failure-receipt reserve', t => {
  const maximum = [{ path: 'legacy-summary.json', bytes: memoryCaps.legacySummary },
    { path: 'modern-tests.json', bytes: memoryCaps.json }, { path: 'legacy-plan.json', bytes: memoryCaps.json }]
  assert.equal(enforceCompactCaps(maximum), memoryCaps.aggregate)
  assert.throws(() => enforceCompactCaps([...maximum, { path: 'modern-details.json', bytes: 1 }]), /aggregate/)
  const fixture = inputFixture(t), writer = writeOwnedEvidence(fixture)
  writer.write('legacy-summary.json', Buffer.alloc(memoryCaps.legacySummary))
  writer.write('modern-tests.json', Buffer.alloc(memoryCaps.json))
  writer.write('legacy-plan.json', Buffer.alloc(memoryCaps.json - 32 * 1024))
  assert.throws(() => writer.write('modern-details.json', 'x'), /reserved failure receipts/)
  writer.writeFailureReceipt('summary.json', '{}'); writer.write('commands.json', '[]')
  writer.writeFailureReceipt('manifest.json', JSON.stringify({ files: writer.manifest() }))
  assert.ok(enforceCompactCaps([...writer.manifest(), { path: 'manifest.json', bytes: readFileSync(path.join(fixture.output, 'manifest.json')).length }]) <= memoryCaps.aggregate)
})

test('CSV export captures bounded verbatim stdout and a complete member inventory before fixed-wire acceptance', posixOnly, t => {
  const fixture = fixtureCLI(t, 'diagnostic-complete')
  assert.equal(fixture.run.status, 0, fixture.run.stderr)
  assert.equal(readFileSync(path.join(fixture.output, 'csv-export-stdout.txt'), 'utf8'), 'SYNTHETIC CSV EXPORT\n')
  const inventory = JSON.parse(readFileSync(path.join(fixture.output, 'csv-export-inventory.json'), 'utf8'))
  assert.equal(inventory.status, 'complete'); assert.equal(inventory.traversal_complete, true)
  assert.equal(inventory.captured_csv_files, 1); assert.deepEqual(inventory.issues, [])
  assert.deepEqual(inventory.entries.map(entry => [entry.relative_path, entry.captured_as]),
    [['synthetic-0.csv', 'csv/candidate-01.csv']])
  assert.equal(fixture.summary().accepted_measurements.length, 3); assert.equal(fixture.calls().length, 6)
})

test('unknown CSV export members retain both safe CSVs before and after the rejection without becoming accepted', posixOnly, t => {
  for (const mode of ['diagnostic-member-before', 'diagnostic-member-after', 'diagnostic-symlink', 'diagnostic-hardlink']) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    const inventory = JSON.parse(readFileSync(path.join(fixture.output, 'csv-export-inventory.json'), 'utf8'))
    assert.equal(inventory.status, 'rejected'); assert.equal(inventory.traversal_complete, true)
    assert.equal(inventory.captured_csv_files, 2); assert.equal(inventory.entries.length, 3)
    assert.equal(inventory.entries.filter(entry => entry.rejection !== null).length, 1)
    assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 2)
    for (const [index, name] of ['candidate-01.csv', 'candidate-02.csv'].entries()) {
      assert.equal(readFileSync(path.join(fixture.output, 'csv', name), 'utf8'), memoryCSVFixture(summaryFixture(), detailsFixture()))
    }
    assert.equal(fixture.summary().accepted_measurements, null); assert.equal(fixture.summary().metric_contract_accepted, false)
    assert.equal(fixture.calls().length, 6); assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
  }
})

test('CSV count rejection retains only the sixteen bounded candidates and never retries a child', posixOnly, t => {
  const fixture = fixtureCLI(t, 'many-csv')
  assert.equal(fixture.run.status, 1)
  const inventory = JSON.parse(readFileSync(path.join(fixture.output, 'csv-export-inventory.json'), 'utf8'))
  assert.equal(inventory.status, 'rejected'); assert.equal(inventory.captured_csv_files, 16)
  assert.equal(inventory.entries.length, 17); assert.ok(inventory.issues.includes('csv-file-count'))
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 16)
  assert.equal(fixture.calls().length, 6); assert.equal(fixture.summary().accepted_measurements, null)
})

test('CSV diagnostic traversal, relative paths and metadata bytes fail closed within fixed bounds', posixOnly, t => {
  for (const [mode, issue] of [['diagnostic-entry-cap', 'inventory-entry-cap'], ['diagnostic-inventory-byte-cap', 'inventory-byte-cap'],
    ['diagnostic-path-cap', 'relative-path-cap'], ['diagnostic-depth-cap', 'depth-cap']]) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    const bytes = readFileSync(path.join(fixture.output, 'csv-export-inventory.json')), inventory = JSON.parse(bytes)
    assert.ok(bytes.length <= memoryCaps.csvDiagnostic); assert.ok(inventory.entries.length <= memoryCaps.csvInventoryEntries)
    assert.ok(inventory.issues.includes(issue), mode)
    if (mode.includes('inventory-') || mode === 'diagnostic-entry-cap') assert.equal(inventory.traversal_complete, false)
    assert.equal(fixture.summary().accepted_measurements, null); assert.equal(fixture.calls().length, 6)
  }
})

test('CSV diagnostic files and stdout enforce their own 16KiB cap without changing JSON or aggregate limits', posixOnly, t => {
  for (const name of ['csv-export-stdout.txt', 'csv-export-inventory.json', 'csv-export-manifest.json']) {
    assert.equal(enforceCompactCaps([{ path: name, bytes: 16384 }]), 16384)
    assert.throws(() => enforceCompactCaps([{ path: name, bytes: 16385 }]))
  }
  const fixture = fixtureCLI(t, 'diagnostic-stdout-cap')
  assert.equal(fixture.run.status, 1); assert.equal(fixture.calls().length, 6)
  assert.equal(existsSync(path.join(fixture.output, 'csv-export-stdout.txt')), false)
  assert.equal(existsSync(path.join(fixture.output, 'csv')), false)
  assert.equal(fixture.summary().accepted_measurements, null)
  assert.equal(memoryCaps.json, 524288); assert.equal(memoryCaps.legacySummary, 1048576); assert.equal(memoryCaps.aggregate, 2097152)
})

test('only a bounded regular root export manifest is retained opaque and never drives metric acceptance', posixOnly, t => {
  const expected = [Buffer.from('{"files":["ignored.csv"],"metric":"ignored"}'), Buffer.from([255, 0, 1])]
  const observations = []
  for (const [index, mode] of ['known-manifest', 'known-manifest-invalid-JSON'].entries()) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 0, fixture.run.stderr)
    assert.deepEqual(readFileSync(path.join(fixture.output, 'csv-export-manifest.json')), expected[index])
    const summary = fixture.summary(), diagnostic = summary.CSV_export_manifest
    assert.equal(diagnostic.status, 'retained-opaque-diagnostic'); assert.equal(diagnostic.schema_not_used, true)
    assert.equal(diagnostic.metric_acceptance_depends_on_contents, false)
    assert.equal(diagnostic.sha256, hash(expected[index])); assert.equal(diagnostic.bytes, expected[index].length)
    assert.equal(summary.csv_validation.schema_verified, true); assert.equal(summary.csv_validation.file_count, 1)
    assert.equal(summary.product_performance_acceptance, false); assert.equal(summary.protocol_payload_verified, false)
    assert.deepEqual(readdirSync(path.join(fixture.output, 'csv')), ['candidate-01.csv'])
    assert.equal(summary.CSV_original_paths[0].original_relative_path, 'synthetic-0.csv')
    const inventory = JSON.parse(readFileSync(path.join(fixture.output, 'csv-export-inventory.json'), 'utf8'))
    assert.equal(inventory.status, 'complete'); assert.equal(inventory.retained_opaque_manifest, true)
    assert.equal(inventory.captured_csv_files, 1); assert.deepEqual(inventory.issues, [])
    observations.push(summary.accepted_measurements)
  }
  assert.deepEqual(observations[0], observations[1], 'Opaque bytes cannot change accepted metric data')
})

test('oversized, linked, nested and nonregular export manifests still reject while preserving safe CSV', posixOnly, t => {
  for (const mode of ['known-manifest-oversize', 'known-manifest-hardlink', 'known-manifest-symlink', 'nested-manifest', 'directory-manifest']) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    assert.equal(existsSync(path.join(fixture.output, 'csv-export-manifest.json')), false)
    assert.equal(fixture.summary().accepted_measurements, null); assert.equal(fixture.summary().metric_contract_accepted, false)
    assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1)
    const inventory = JSON.parse(readFileSync(path.join(fixture.output, 'csv-export-inventory.json'), 'utf8'))
    assert.equal(inventory.status, 'rejected'); assert.equal(inventory.retained_opaque_manifest, false)
    assert.equal(inventory.captured_csv_files, 1); assert.ok(inventory.issues.length > 0)
    assert.equal(fixture.calls().length, 6); assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
  }
})

test('CLI cannot become accepted when one retained CSV mean differs from the typed samples', posixOnly, t => {
  const fixture = fixtureCLI(t, 'tampered-csv-average')
  assert.equal(fixture.run.status, 1)
  assert.match(fixture.summary().error, /rounding bounds/)
  assert.equal(fixture.summary().accepted_measurements, null); assert.equal(fixture.summary().metric_contract_accepted, false)
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1)
  assert.match(readFileSync(path.join(fixture.output, 'csv/candidate-01.csv'), 'utf8'), /101\.100000 kB/)
  assert.equal(fixture.calls().length, 6)
})

test('CLI failed stage, signal, invalid UTF8, caps and unowned leaves cannot become accepted', posixOnly, t => {
  for (const mode of ['failed-case', 'wrong-summary', 'extra-legacy-case', 'nonfinite', 'typed-missing', 'command-exit', 'command-signal',
    'oversized-json', 'invalid-utf8', 'many-csv', 'large-csv', 'csv-hardlink', 'inject-hardlink', 'inject-symlink', 'foreign-csv-directory']) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
    assert.equal(fixture.summary().accepted_measurements, null)
    if (['nonfinite', 'typed-missing'].includes(mode)) assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1, 'Raw CSV survives later candidate validation failure')
    if (mode === 'command-exit' || mode === 'command-signal') assert.equal(fixture.calls().length, 1, 'Failed child is never retried')
  }
})

test('CLI context replacement is detected without rewriting the replacement or inputs', posixOnly, t => {
  const fixture = fixtureCLI(t, 'replace-context')
  assert.equal(fixture.run.status, 1); assert.equal(readFileSync(fixture.context, 'utf8'), 'replacement')
  assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
})

test('unknown or repeated CLI options and runtime contract overrides are refused before commands', posixOnly, t => {
  for (const flags of [['--contract', '{}'], ['--expected-head', head], ['--mode', 'accept']]) {
    const fixture = fixtureCLI(t, 'complete', flags)
    assert.equal(fixture.run.status, 1); assert.equal(fixture.calls().length, 0)
    assert.equal(existsSync(fixture.output), false)
  }
})


// Deterministic, synchronous boundary doubles. They are local to each test and
// restored with the builtin ESM bindings; no SDK process or real long wait runs.
function withBuiltinOverrides(overrides, action) {
  const originals = []
  try {
    for (const [object, key, value] of overrides) {
      originals.push([object, key, Object.getOwnPropertyDescriptor(object, key)])
      Object.defineProperty(object, key, { configurable: true, writable: true, value })
    }
    syncBuiltinESMExports()
    return action()
  } finally {
    for (const [object, key, descriptor] of originals.reverse()) {
      if (descriptor) Object.defineProperty(object, key, descriptor); else delete object[key]
    }
    syncBuiltinESMExports()
  }
}

test('legacy exact-one counts all metadata, including a foreign case in another branch', () => {
  const plan = planFixture()
  plan.unrelated = { children: [{ _type: { _name: 'ActionTestMetadata' },
    identifier: { _value: 'Other/testForeign()' }, summaryRef: { id: { _value: 'foreign-summary-id' } } }] }
  assert.throws(() => selectLegacySummary(rootFixture(), plan, summaryFixture(), id), /one exact legacy/)
})

test('same-inode growth or timestamp change before open is rejected before allocation/output', posixOnly, t => {
  const actualOpen = fs.openSync, actualWrite = fs.writeFileSync, actualAlloc = Buffer.alloc
  for (const mode of ['over-cap-growth', 'within-cap-growth', 'same-size-time-change']) {
    const fixture = inputFixture(t); actualWrite(fixture.context, '{}')
    const originalInode = fs.statSync(fixture.context).ino
    const allocations = []; let injected = false
    withBuiltinOverrides([
      [fs, 'openSync', (file, ...args) => {
        if (file === fixture.context && !injected) {
          injected = true
          if (mode === 'same-size-time-change') fs.utimesSync(file, 1, 1)
          else actualWrite(file, mode === 'over-cap-growth' ? 'x'.repeat(memoryCaps.json + 1) : '{} ')
        }
        return actualOpen(file, ...args)
      }],
      [Buffer, 'alloc', (bytes, ...args) => { allocations.push(bytes); return actualAlloc(bytes, ...args) }]
    ], () => assert.throws(() => writeOwnedEvidence(fixture), /identity or bounds changed before read/))
    assert.equal(injected, true, mode)
    assert.equal(fs.statSync(fixture.context).ino, originalInode, 'Race keeps the same inode')
    assert.equal(allocations.some(size => size > memoryCaps.json), false, 'Opened cap is checked before Buffer.alloc')
    assert.equal(existsSync(fixture.output), false, 'Invalid context creates no evidence output')
  }
})

function deadlineFixture(t, stage) {
  const fixture = inputFixture(t)
  const actualReadDirectory = fs.readdirSync, actualWrite = fs.writeFileSync, actualParse = JSON.parse
  let elapsed = 0, triggered = false, commands = 0, finalArmed = false, finalChecks = 0
  const expire = () => { triggered = true; elapsed = memoryCaps.exportMilliseconds + 1 }
  const run = (binary, args) => {
    assert.equal(binary, 'xcrun'); assert.equal(args[0], 'xcresulttool'); commands++
    let value
    if (args.includes('tests')) value = testsFixture()
    else if (args.includes('test-details')) value = detailsFixture()
    else if (args.includes('object')) {
      const selected = args.indexOf('--id')
      value = selected < 0 ? rootFixture() : args[selected + 1] === 'plan-id' ? planFixture() : summaryFixture()
    } else {
      assert.ok(args.includes('export'))
      const directory = args[args.indexOf('--output-path') + 1]
      actualWrite(path.join(directory, 'synthetic-0.csv'), memoryCSVFixture(summaryFixture(), detailsFixture()))
    }
    return { status: 0, signal: null, stdout: Buffer.from(value ? JSON.stringify(value) : ''), stderr: Buffer.alloc(0) }
  }
  withBuiltinOverrides([
    [childProcess, 'spawnSync', run],
    [performance, 'now', () => {
      if (stage === 'final-return' && finalArmed && ++finalChecks === 2) expire()
      return elapsed
    }],
    [fs, 'readdirSync', (directory, ...args) => {
      const names = actualReadDirectory(directory, ...args)
      if (stage === 'csv-walk' && path.basename(directory).startsWith('.csv-export-')) expire()
      return names
    }],
    [JSON, 'parse', (...args) => {
      const value = actualParse(...args)
      if (stage === 'normalization' && value?._type?._name === 'ActionTestSummary') {
        const metrics = value.performanceMetrics
        Object.defineProperty(value, 'performanceMetrics', { get() { expire(); return metrics } })
      }
      return value
    }],
    [fs, 'writeFileSync', (file, bytes, ...args) => {
      const result = actualWrite(file, bytes, ...args)
      if (Buffer.isBuffer(bytes)) {
        const text = bytes.toString('utf8')
        if (!triggered && stage === 'accepted-receipt' && text.includes('"status": "matched-memory-observation"')) expire()
        if (text.includes('"files": [') && !text.includes('"status":')) {
          if (!triggered && stage === 'manifest-receipt') expire()
          if (stage === 'final-return') finalArmed = true
        }
      }
      return result
    }]
  ], () => assert.throws(() => exportMemory(fixture), /shared deadline exhausted/, stage))
  assert.equal(triggered, true, stage)
  assert.equal(commands, 6, 'No external command is retried after expiration')
  const summary = JSON.parse(readFileSync(path.join(fixture.output, 'summary.json'), 'utf8'))
  assert.equal(summary.status, 'failed-or-unavailable', stage)
  assert.equal(summary.accepted_measurements, null)
  assert.match(summary.error, /shared deadline exhausted/)
  const receipts = JSON.parse(readFileSync(path.join(fixture.output, 'commands.json'), 'utf8'))
  assert.equal(receipts.length, 6)
  const manifestFile = path.join(fixture.output, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  assert.equal(manifest.files.some(member => member.path === 'manifest.json'), false, 'Updated manifest excludes itself')
  for (const member of manifest.files) {
    const bytes = readFileSync(path.join(fixture.output, member.path))
    assert.equal(bytes.length, member.bytes); assert.equal(hash(bytes), member.sha256)
  }
  enforceCompactCaps([...manifest.files, { path: 'manifest.json', bytes: readFileSync(manifestFile).length }])
  if (stage !== 'csv-walk') assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 1)
  assert.equal(readFileSync(path.join(fixture.result, 'database.sqlite3'), 'utf8'), 'immutable synthetic result')
}

test('shared deadline covers CSV walking, normalization, accepted/manifest writes and final return', posixOnly, t => {
  for (const stage of ['csv-walk', 'normalization', 'accepted-receipt', 'manifest-receipt', 'final-return']) deadlineFixture(t, stage)
})

test('failure receipt downgrade refuses a late replacement, hardlink or symbolic leaf', posixOnly, t => {
  for (const mode of ['replacement', 'hardlink', 'symlink']) {
    const fixture = inputFixture(t), writer = writeOwnedEvidence(fixture)
    writer.write('summary.json', '{"status":"metric-contract-unconfirmed"}')
    const leaf = path.join(fixture.output, 'summary.json'), original = leaf + '.original'
    renameSync(leaf, original)
    if (mode === 'hardlink') linkSync(original, leaf)
    else if (mode === 'symlink') symlinkSync(original, leaf)
    else writeFileSync(leaf, 'replacement')
    const before = readFileSync(leaf)
    assert.throws(() => writer.writeFailureReceipt('summary.json', '{"status":"failed-or-unavailable"}'))
    assert.deepEqual(readFileSync(leaf), before, mode)
    assert.equal(readFileSync(original, 'utf8'), '{"status":"metric-contract-unconfirmed"}')
  }
})
