#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const scenario = 'testLaunchToPublishedReadiness'
const className = 'PublishedPerformanceUITests'
const maxJSONBytes = 16 * 1024 * 1024
// Adopted from the retained Xcode 16.4 result, not inferred from a generic metric.
// This identifies the format; it adopts no product threshold or XCTest baseline.
const verifiedClockContract = Object.freeze({
  identifier: 'com.apple.dt.XCTMetric_Clock.time.monotonic',
  display_name: 'Clock Monotonic Time', unit: 's',
  reference: {
    run_id: '40188893652', source_head: 'e8032494fb396718bbfe2218b1dfa428abfd7313',
    CSV_sha256: '154faa23ef6bb36ff08759061026f2b183604ce8f2517eb89af315230ae79374'
  }
})
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

function parseOptions(args) {
  const allowed = new Set(['result', 'output', 'context'])
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]?.replace(/^--/, '')
    if (!args[i]?.startsWith('--') || !allowed.has(name) || !args[i + 1] || Object.hasOwn(options, name)) {
      throw new Error('Use --result <xcresult> --output <evidence directory> --context <JSON>')
    }
    options[name] = path.resolve(args[i + 1])
  }
  if (Object.keys(options).length !== 3) throw new Error('All result/output/context paths are required')
  return options
}

function readJSON(file) {
  const data = readFileSync(file)
  if (data.length > maxJSONBytes) throw new Error('Oversized JSON evidence')
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data))
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return
  visit(value)
  if (Array.isArray(value)) for (const child of value) walk(child, visit)
  else for (const child of Object.values(value)) walk(child, visit)
}

export function verifiedCase(report) {
  const cases = []
  walk(report.testNodes, node => {
    if (node.nodeType === 'Test Case') cases.push(node)
  })
  if (cases.length !== 1) throw new Error('Expected exactly one dedicated performance case')
  const test = cases[0]
  const id = test.nodeIdentifier
  if (typeof id !== 'string' || id.length > 500 ||
      !id.split('/').includes(className) ||
      !id.endsWith('/' + scenario + '()') || !['Passed', 'Failed'].includes(test.result)) {
    throw new Error('The dedicated readiness performance case is missing, skipped or has an unexpected identifier')
  }
  return id
}

export function verifiedDetails(report, details, id) {
  const cases = []
  walk(report.testNodes, node => { if (node.nodeType === 'Test Case') cases.push(node) })
  if (cases.length !== 1 || details.testIdentifier !== id ||
      details.testResult !== cases[0].result || !['Passed', 'Failed'].includes(details.testResult)) {
    throw new Error('Test-list and detail identifiers/results must agree for the same executed case')
  }
}

/// Types/fields are from Xcode's formatDescription --legacy, not guessed from CSV columns.
export function normalizeMetrics(summary, id, modernResult) {
  if (summary._type?._name !== 'ActionTestSummary' || summary.identifier?._value !== id) {
    throw new Error('Legacy summary type and identifier must match the verified executed case')
  }
  // Only Passed <-> Success has been verified on an actual hosted result.
  // Other legacy outcomes remain unavailable until their mapping is verified.
  if (modernResult !== 'Passed' || summary.testStatus?._value !== 'Success') {
    throw new Error('Legacy and modern test results must have the verified Passed/Success mapping')
  }
  const rows = summary.performanceMetrics?._values
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Expected the single declared clock metric')
  return rows.map(metric => {
    if (metric._type?._name !== 'ActionTestPerformanceMetricSummary') throw new Error('Unexpected legacy metric type')
    const displayName = metric.displayName?._value
    const unit = metric.unitOfMeasurement?._value
    const measurements = metric.measurements?._values
    if (typeof displayName !== 'string' || !displayName.trim() ||
        typeof unit !== 'string' || !unit.trim() ||
        !Array.isArray(measurements) || measurements.length !== 3) {
      throw new Error('Metric display name/unit or three actual recorded samples are missing')
    }
    if (measurements.some(item => item?._type?._name !== 'Double')) throw new Error('Expected three typed Double measurements')
    const rawSamples = measurements.map(item => item._value)
    const samples = rawSamples.map(value => {
      if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid measurement')
      if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) throw new Error('Invalid numeric measurement')
      const number = Number(value)
      if (!Number.isFinite(number) || number < 0) throw new Error('Non-finite or negative measurement')
      return number
    })
    const sorted = [...samples].sort((a, b) => a - b)
    return {
      identifier: typeof metric.identifier?._value === 'string' ? metric.identifier._value : null,
      display_name: displayName, unit, raw_samples: rawSamples, samples,
      sample_count: samples.length, minimum: sorted[0], median: sorted[1], maximum: sorted[2],
      baseline: {
        acceptance_status: 'unadopted',
        name: metric.baselineName?._value ?? null,
        average: metric.baselineAverage?._value ?? null,
        maximum_percent_regression: metric.maxPercentRegression?._value ?? null,
        maximum_relative_standard_deviation: metric.maxPercentRelativeStandardDeviation?._value ?? null
      }
    }
  })
}

// Xcode 16.4 exported two fully quoted records. Parse quoted fields instead of
// splitting commas: the iteration array itself contains commas.
function quotedCSV(text) {
  if (typeof text !== 'string' || !text.length || text.includes('\0')) throw new Error('Invalid CSV text')
  const rows = []
  let cursor = 0
  while (cursor < text.length) {
    const row = []
    while (true) {
      if (text[cursor++] !== '"') throw new Error('CSV fields must be quoted')
      let value = '', closed = false
      while (cursor < text.length) {
        const character = text[cursor++]
        if (character !== '"') { value += character; continue }
        if (text[cursor] === '"') { value += '"'; cursor++; continue }
        closed = true
        break
      }
      if (!closed) throw new Error('Unterminated CSV field')
      row.push(value)
      if (row.length > 5) throw new Error('Unexpected CSV column count')
      if (text[cursor] === ',') { cursor++; continue }
      if (text[cursor] === '\r') {
        if (text[cursor + 1] !== '\n') throw new Error('Invalid CSV line ending')
        cursor += 2
      } else if (text[cursor] === '\n') cursor++
      else if (cursor !== text.length) throw new Error('Unexpected text after CSV field')
      break
    }
    rows.push(row)
    if (rows.length > 2) throw new Error('Expected exactly one CSV header and data row')
  }
  if (rows.length !== 2 || rows.some(row => row.length !== 5)) throw new Error('Expected five CSV headers and one data row')
  return rows
}

// Exact decimal arithmetic makes the rounding allowance come solely from the
// CSV's printed last place. No empirical percentage or timing tolerance is used.
function decimal(value) {
  const source = String(value)
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(source)
  if (!match || source.length > 512 || !Number.isFinite(Number(source))) throw new Error('Invalid finite decimal CSV value')
  const exponent = Number(match[3] ?? 0)
  if (!Number.isInteger(exponent) || Math.abs(exponent) > 400) throw new Error('Unsupported decimal exponent')
  const scale = (match[2]?.length ?? 0) - exponent
  return { coefficient: BigInt(match[1] + (match[2] ?? '')), scale, number: Number(source), source }
}
const power10 = exponent => 10n ** BigInt(exponent)
const decimalUnits = (value, scale) => value.coefficient * power10(scale - value.scale)
function equalDecimal(left, right) {
  const scale = Math.max(0, left.scale, right.scale)
  return decimalUnits(left, scale) === decimalUnits(right, scale)
}

export function validateClockCSV(text, metric, details) {
  if (metric.identifier !== verifiedClockContract.identifier ||
      metric.display_name !== verifiedClockContract.display_name || metric.unit !== verifiedClockContract.unit) {
    throw new Error('Recorded identifier, display name and unit must match the verified clock contract')
  }
  if (!Array.isArray(details.devices) || details.devices.length !== 1) throw new Error('Expected one CSV measurement device')
  const device = details.devices[0]
  if (device.deviceName !== 'iPhone 16' || device.platform !== 'iOS Simulator' || device.osVersion !== '18.5') {
    throw new Error('Unexpected performance measurement device')
  }
  const configurations = details.testPlanConfigurations
  if (!Array.isArray(configurations) || configurations.length !== 1 ||
      configurations[0].configurationName !== 'Test Scheme Action') throw new Error('Unexpected measurement configuration')
  const [header, row] = quotedCSV(text)
  const expectedHeader = ['Destination', 'Configuration', 'Clock Monotonic Time (Average)',
    'Clock Monotonic Time (Iterations)', 'Clock Monotonic Time (Baseline)']
  if (header.some((field, index) => field !== expectedHeader[index])) throw new Error('Unexpected CSV headers')
  const destination = [device.deviceName, device.platform, device.osVersion].join(' ')
  if (row[0] !== destination || row[1] !== configurations[0].configurationName) throw new Error('CSV destination/configuration differs from actual test details')
  // The observed average is plain decimal seconds. Reject scientific/coarse
  // exponent forms rather than deriving an unobserved, arbitrarily large unit.
  const averageMatch = /^((?:0|[1-9]\d*)(?:\.\d+)?) s$/.exec(row[2])
  if (!averageMatch) throw new Error('CSV average must use the observed plain decimal seconds format')
  const average = decimal(averageMatch[1])
  const iterationMatch = /^\[([^\[\]]*)\]$/.exec(row[3])
  if (!iterationMatch) throw new Error('Invalid CSV iteration array')
  const rawIterations = iterationMatch[1].split(',').map(value => value.trim())
  if (rawIterations.length !== 3 || metric.sample_count !== 3 || metric.raw_samples.length !== 3) throw new Error('Expected three CSV and typed samples')
  const iterations = rawIterations.map(decimal)
  const typed = metric.raw_samples.map(decimal)
  if (iterations.some((value, index) => !equalDecimal(value, typed[index]))) throw new Error('CSV iterations differ from typed measurements')
  if (metric.baseline.average === null || metric.baseline.average === undefined ||
      !equalDecimal(decimal(row[4]), decimal(metric.baseline.average))) throw new Error('CSV baseline differs from raw legacy baseline')
  const scale = Math.max(0, average.scale, ...typed.map(value => value.scale))
  const sum = typed.reduce((total, value) => total + decimalUnits(value, scale), 0n)
  const count = 3n
  const signedDifference = decimalUnits(average, scale) * count - sum
  const difference = signedDifference < 0n ? -signedDifference : signedDifference
  const halfUnitNumerator = count * power10(scale - average.scale)
  // Both sides are integers representing twice the difference. Decimal wire
  // values are exact here, so no floating epsilon is necessary (epsilon = 0).
  if (difference * 2n > halfUnitNumerator) throw new Error('CSV mean differs beyond half of its printed rounding unit')
  const mean = typed.reduce((total, value) => total + value.number / 3, 0)
  if (!Number.isFinite(mean)) throw new Error('Non-finite typed mean')
  return {
    status: 'matched-clock-and-typed-values', header_columns: 5, data_rows: 1,
    destination, configuration: row[1], unit: 's', sample_count: 3,
    raw_iterations: rawIterations, average_raw: row[2], CSV_average_seconds: average.number,
    typed_mean_seconds: mean,
    mean_comparison: { method: 'exact decimal integer arithmetic', printed_decimal_scale: average.scale,
      half_rounding_unit_seconds: Number.isFinite(0.5 * 10 ** -average.scale) && 0.5 * 10 ** -average.scale > 0 ? 0.5 * 10 ** -average.scale : null,
      floating_epsilon_seconds: 0, difference_numerator: difference.toString(),
      difference_denominator: (count * power10(scale)).toString(),
      typed_mean_numerator: sum.toString(), typed_mean_denominator: (count * power10(scale)).toString() },
    baseline_raw: row[4], baseline_acceptance: 'unadopted'
  }
}

export function metricReference(testPlan, expectedID) {
  const matches = []
  walk(testPlan, node => {
    const id = node.identifier?._value
    if (node._type?._name === 'ActionTestMetadata' && typeof id === 'string' &&
        id === expectedID &&
        typeof node.summaryRef?.id?._value === 'string') matches.push(node.summaryRef.id._value)
  })
  const unique = [...new Set(matches)]
  if (unique.length !== 1) throw new Error('Expected one legacy summary reference for the verified readiness case')
  return unique[0]
}

function runXcode(args) {
  return execFileSync('xcrun', ['xcresulttool', ...args], {
    encoding: 'utf8', timeout: 60000, maxBuffer: maxJSONBytes, stdio: ['ignore', 'pipe', 'pipe']
  })
}

const evidenceNames = new Set([
  'extraction-commands.json', 'performance-summary.json', 'tests.raw.json',
  'test-details.raw.json', 'invocation.legacy.json', 'test-plan.legacy.json',
  'test-summary.legacy.json'
])

function assertNoSymlinkAncestors(file) {
  for (let current = file; ; current = path.dirname(current)) {
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error('Evidence/input paths cannot contain symbolic links')
    } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (path.dirname(current) === current) break
  }
}

function includesPath(directory, file) {
  const relative = path.relative(directory, file)
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
}

const inodeKey = stat => `${stat.dev}:${stat.ino}`

function prepareOutput(input) {
  const options = Object.fromEntries(['result', 'output', 'context'].map(key => [key, path.resolve(input[key])]))
  for (const file of Object.values(options)) assertNoSymlinkAncestors(file)
  // A fresh output tree cannot contain or be contained by either input path.
  // This also rejects context == any fixed output leaf, not just the summary.
  for (const file of [options.result, options.context]) {
    if (includesPath(file, options.output) || includesPath(options.output, file)) {
      throw new Error('Evidence output and input paths cannot overlap')
    }
  }
  const inputInodes = new Set()
  for (const file of [options.result, options.context]) {
    try { inputInodes.add(inodeKey(lstatSync(file, { bigint: true }))) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  mkdirSync(path.dirname(options.output), { recursive: true })
  assertNoSymlinkAncestors(path.dirname(options.output))
  // Never reuse a previous run, even an empty directory. This prevents stale
  // raw evidence or any pre-existing symlink/hardlink leaf from being replaced.
  try { mkdirSync(options.output, { mode: 0o700 }) }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Evidence output must be a fresh directory that does not already exist')
    throw error
  }
  const rootInode = inodeKey(lstatSync(options.output, { bigint: true }))
  const assertOwnedRoot = () => {
    assertNoSymlinkAncestors(options.output)
    const stat = lstatSync(options.output, { bigint: true })
    if (!stat.isDirectory() || inodeKey(stat) !== rootInode) throw new Error('Evidence output directory identity changed')
  }
  return {
    options, output: options.output,
    write(name, bytes) {
      if (!evidenceNames.has(name)) throw new Error('Unknown fixed evidence filename')
      assertOwnedRoot()
      // O_EXCL refuses existing regular files, hardlinks and symlink leaves.
      // No O_TRUNC is used: a file is created once within this owned session.
      const fd = openSync(path.join(options.output, name), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
      try {
        const stat = fstatSync(fd, { bigint: true })
        if (!stat.isFile() || stat.nlink !== 1n || inputInodes.has(inodeKey(stat))) {
          throw new Error('Evidence file must be a new regular single-link inode distinct from inputs')
        }
        assertOwnedRoot()
        writeFileSync(fd, bytes)
      } finally { closeSync(fd) }
    },
    csvDirectory() {
      assertOwnedRoot()
      return mkdtempSync(path.join(options.output, 'metrics-csv-'))
    }
  }
}

function failureResult(error) {
  return { schema_version: 1, status: 'failed-or-unavailable', error: String(error.message),
    measurements: null, command_result: error.execution ?? null, acceptance_status: 'unadopted' }
}

function collectPerformance(options, evidence, commands) {
  const output = options.output
  const run = args => {
    try {
      const raw = runXcode(args)
      commands.push({ arguments: ['xcresulttool', ...args], exit_code: 0 })
      return raw
    } catch (error) {
      error.execution = { arguments: ['xcresulttool', ...args], exit_code: error.status ?? null }
      commands.push(error.execution)
      throw error
    }
  }
  const jsonCommand = (args, name) => {
    const raw = run(args)
    evidence.write(name, raw)
    return JSON.parse(raw)
  }
  const context = readJSON(options.context)
  if (!Number.isInteger(context.expected_articles) || context.expected_articles < 4 ||
      context.expected_articles > 2000 || context.configuration !== 'Debug') {
    throw new Error('Invalid independent article count or measurement configuration')
  }
  if (!existsSync(options.result) || !lstatSync(options.result).isDirectory()) throw new Error('Performance xcresult is unavailable')
  const report = jsonCommand(['get', 'test-results', 'tests', '--path', options.result, '--compact'], 'tests.raw.json')
  const id = verifiedCase(report)
  const details = jsonCommand(['get', 'test-results', 'test-details', '--test-id', id, '--path', options.result, '--compact'], 'test-details.raw.json')
  verifiedDetails(report, details, id)
  const csvDirectory = evidence.csvDirectory()
  const csvArgs = ['export', 'metrics', '--test-id', id, '--path', options.result, '--output-path', csvDirectory]
  run(csvArgs)
  const files = []
  const collectCSV = (directory, depth = 0) => {
    if (depth > 4 || files.length > 16) throw new Error('Unexpected CSV export layout')
    for (const name of readdirSync(directory).sort()) {
      const file = path.join(directory, name)
      const stat = lstatSync(file)
      if (stat.isSymbolicLink()) throw new Error('CSV export cannot contain symbolic links')
      if (stat.isDirectory()) collectCSV(file, depth + 1)
      else if (name.endsWith('.csv')) files.push(file)
    }
  }
  collectCSV(csvDirectory)
  if (files.length !== 1) throw new Error('Expected exactly one test-scoped CSV metric export')
  const csv = files.map(file => {
    const stat = lstatSync(file)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0 || stat.size > 8 * 1024 * 1024) throw new Error('Invalid CSV export')
    const bytes = readFileSync(file)
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { file: path.relative(output, file), bytes: bytes.length, sha256: digest(bytes) }
  })
  if (details.hasPerformanceMetrics !== true) throw new Error('Recorded performance metrics are required')
  const invocation = jsonCommand(['get', 'object', '--legacy', '--path', options.result, '--format', 'json'], 'invocation.legacy.json')
  const refs = [...new Set((invocation.actions?._values ?? [])
    .map(action => action.actionResult?.testsRef?.id?._value).filter(value => typeof value === 'string'))]
  if (refs.length !== 1) throw new Error('Expected one dedicated test action')
  const plans = jsonCommand(['get', 'object', '--legacy', '--path', options.result, '--id', refs[0], '--format', 'json'], 'test-plan.legacy.json')
  const summaryRef = metricReference(plans, id)
  const summary = jsonCommand(['get', 'object', '--legacy', '--path', options.result, '--id', summaryRef, '--format', 'json'], 'test-summary.legacy.json')
  const metrics = normalizeMetrics(summary, id, details.testResult)
  const csvValidation = validateClockCSV(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(files[0])), metrics[0], details)
  const clockContractConfirmed = true
  const result = {
    schema_version: 1, status: 'measured-and-exported', context, test_id: id,
    test_result: details.testResult, devices: details.devices,
    declared_metric: 'XCTClockMetric', declared_recorded_iterations: 3,
    discarded_warmup_invocations: 1, metrics, csv, commands,
    metric_contract: { status: 'confirmed', confirmed: clockContractConfirmed, adopted_reference: verifiedClockContract,
      note: 'Metric identity and CSV schema match the inspected Xcode 16.4 reference; product performance acceptance remains unadopted.' },
    csv_validation: csvValidation,
    legacy_test_status: summary.testStatus?._value ?? null,
    extraction: 'CSV export plus documented legacy ActionTestPerformanceMetricSummary fields; missing data fails instead of becoming zero',
    acceptance_status: 'unadopted',
    boundary: 'Debug Simulator launch through exact published-count label and learning guide; termination excluded; UI automation and AX polling included',
    not_measured: ['first-frame launch', 'disk-cold or first install', 'Release', 'physical device', 'CPU', 'memory', 'per-keystroke response', 'scrolling', 'image decoding', 'product performance budgets']
  }
  return result
}

export function exportPerformance(options) {
  const evidence = prepareOutput(options)
  const commands = []
  try {
    const result = collectPerformance(evidence.options, evidence, commands)
    evidence.write('extraction-commands.json', JSON.stringify(commands, null, 2) + '\n')
    evidence.write('performance-summary.json', JSON.stringify(result, null, 2) + '\n')
    return result
  } catch (error) {
    // Only the already-created owned session may save a failure. Never prepare
    // the output again or overwrite any leaf if preparation/writing was refused.
    for (const [name, value] of [
      ['extraction-commands.json', commands], ['performance-summary.json', failureResult(error)]
    ]) {
      try { evidence.write(name, JSON.stringify(value, null, 2) + '\n') }
      catch { /* Preserve existing evidence and the original error. */ }
    }
    throw error
  }
}

function main() {
  let options
  try {
    options = parseOptions(process.argv.slice(2))
    const result = exportPerformance(options)
    console.log(JSON.stringify(result, null, 2))
    if (result.test_result !== 'Passed' || !result.metric_contract.confirmed) process.exitCode = 1
  } catch (error) {
    const result = failureResult(error)
    console.error(JSON.stringify(result, null, 2))
    process.exitCode = 1
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main()
