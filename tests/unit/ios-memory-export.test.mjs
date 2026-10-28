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
import { enforceCompactCaps, exportMemory, memoryCaps, memoryCommandBudget, memoryObservation,
  normalizeMemoryCandidates, selectLegacySummary, trustedMemoryContract, validateMemoryCSV,
  validateMemoryMetricSet, verifyMemoryCase, verifyMemoryProvenance, writeOwnedEvidence } from '../../ios/tests/export-memory.mjs'

const exporter = fileURLToPath(new URL('../../ios/tests/export-memory.mjs', import.meta.url))
const id = 'PublishedPerformanceUITests/testPublishedArticleAppMemory()'
const head = 'a'.repeat(40)
const clone = value => structuredClone(value)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const posixOnly = { skip: process.platform === 'win32' ? 'Local xcrun executable double uses POSIX; no real Xcode process runs' : false }

// These metric names, units and CSV bytes are deliberately fictional. They are
// not a memory wire contract, empirical measurements or a product baseline.
const metric = (name, values = ['-4.00', '0', '+1e0']) => ({
  _type: { _name: 'ActionTestPerformanceMetricSummary' }, identifier: { _value: name },
  displayName: { _value: 'Fictional ' + name }, unitOfMeasurement: { _value: 'fictional-units' },
  measurements: { _values: values.map(value => ({ _type: { _name: 'Double' }, _value: value })) }
})
const summaryFixture = () => ({ _type: { _name: 'ActionTestSummary' }, identifier: { _value: id },
  testStatus: { _value: 'Success' }, performanceMetrics: { _values: [metric('synthetic.alpha'), metric('synthetic.beta', ['1', '2', '3'])] } })
const testsFixture = () => ({ testNodes: [{ nodeType: 'Test Suite', result: 'Passed',
  children: [{ nodeType: 'Test Case', nodeIdentifier: id, result: 'Passed' }] }] })
const detailsFixture = () => ({ testIdentifier: id, testResult: 'Passed', hasPerformanceMetrics: true,
  devices: [{ deviceName: 'owned-memory-fixture', platform: 'iOS Simulator', osVersion: '18.5' }],
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
  if (mode === 'foreign-csv-directory') fs.mkdirSync(path.join(${JSON.stringify(options.output)}, 'csv'));
  const count = mode === 'many-csv' ? 17 : 2;
  for (let index = 0; index < count; index++) {
    const file = path.join(out, 'synthetic-' + index + '.csv');
    if (mode === 'csv-hardlink') fs.linkSync(${JSON.stringify(database)}, file);
    else fs.writeFileSync(file, mode === 'large-csv' ? 'x'.repeat(65537) : 'fictional CSV ' + index + '\\n');
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
  const values = normalizeMemoryCandidates(summaryFixture(), id)
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

test('null contract remains pending and neither runtime objects nor CSV bytes can adopt it', () => {
  const candidates = normalizeMemoryCandidates(summaryFixture(), id)
  assert.equal(trustedMemoryContract, null)
  assert.deepEqual(validateMemoryMetricSet(candidates), { status: 'metric-contract-unconfirmed', confirmed: false, accepted_measurements: null, candidate_count: 2 })
  assert.throws(() => validateMemoryMetricSet(candidates, { identifiers: ['synthetic.alpha'] }))
  const csv = validateMemoryCSV([{ name: 'one.csv', bytes: Buffer.from('opaque synthetic schema\n') }], candidates)
  assert.equal(csv.schema_verified, false); assert.equal(csv.metric_set_correlated, false)
  assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes: Buffer.from('x') }, { name: 'one.csv', bytes: Buffer.from('y') }], candidates))
  for (const bytes of [Buffer.alloc(0), Buffer.from([255]), Buffer.from('x\0y'), Buffer.alloc(65537)]) {
    assert.throws(() => validateMemoryCSV([{ name: 'one.csv', bytes }], candidates))
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

test('actual CLI double collects two arbitrary metric rows and two CSVs but exits pending2', posixOnly, t => {
  const fixture = fixtureCLI(t)
  assert.equal(fixture.run.status, 2, fixture.run.stderr)
  const summary = fixture.summary(); assert.equal(summary.status, 'metric-contract-unconfirmed')
  assert.equal(summary.accepted_measurements, null); assert.equal(summary.candidates.length, 2)
  assert.equal(summary.protocol_payload_verified, false); assert.equal(summary.csv_validation.schema_verified, false)
  assert.equal(summary.warmup_verification.source_assertion_independently_verified, false)
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 2)
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

test('CLI retains a verbose 700–900KiB synthetic legacy summary verbatim and remains pending2', posixOnly, t => {
  const fixture = fixtureCLI(t, 'large-summary'), expected = fixture.verboseSummaryBytes()
  assert.ok(expected.length >= 700 * 1024 && expected.length <= 900 * 1024)
  assert.equal(fixture.run.status, 2, fixture.run.stderr)
  const retained = readFileSync(path.join(fixture.output, 'legacy-summary.json'))
  assert.deepEqual(retained, expected, 'Pretty raw stdout is not truncated, minified or transformed')
  const summary = fixture.summary(); assert.equal(summary.status, 'metric-contract-unconfirmed')
  assert.equal(summary.accepted_measurements, null); assert.equal(summary.metric_contract_accepted, false)
  assert.equal(summary.candidates.length, 2); assert.equal(summary.csv_validation.files.length, 2)
  assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 2)
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

test('CLI failed stage, signal, invalid UTF8, caps and unowned leaves cannot become accepted', posixOnly, t => {
  for (const mode of ['failed-case', 'wrong-summary', 'extra-legacy-case', 'nonfinite', 'typed-missing', 'command-exit', 'command-signal',
    'oversized-json', 'invalid-utf8', 'many-csv', 'large-csv', 'csv-hardlink', 'inject-hardlink', 'inject-symlink', 'foreign-csv-directory']) {
    const fixture = fixtureCLI(t, mode)
    assert.equal(fixture.run.status, 1, mode + ': ' + fixture.run.stderr)
    assert.equal(fixture.databaseBytes(), 'immutable synthetic result')
    assert.equal(fixture.summary().accepted_measurements, null)
    if (['nonfinite', 'typed-missing'].includes(mode)) assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 2, 'Raw CSV survives later candidate validation failure')
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
      for (let index = 0; index < 2; index++) actualWrite(path.join(directory, `synthetic-${index}.csv`), 'fictional CSV\n')
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
        if (!triggered && stage === 'pending-receipt' && text.includes('"status": "metric-contract-unconfirmed"')) expire()
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
  if (stage !== 'csv-walk') assert.equal(readdirSync(path.join(fixture.output, 'csv')).length, 2)
  assert.equal(readFileSync(path.join(fixture.result, 'database.sqlite3'), 'utf8'), 'immutable synthetic result')
}

test('shared deadline covers CSV walking, normalization, pending/manifest writes and final return', posixOnly, t => {
  for (const stage of ['csv-walk', 'normalization', 'pending-receipt', 'manifest-receipt', 'final-return']) deadlineFixture(t, stage)
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
