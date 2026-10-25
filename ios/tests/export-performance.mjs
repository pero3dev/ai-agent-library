#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const scenario = 'testLaunchToPublishedReadiness'
const className = 'PublishedPerformanceUITests'
const maxJSONBytes = 16 * 1024 * 1024
// Adopt an identifier/unit only after inspecting the first retained Xcode 16.4
// clock result. The generic legacy type and a human display name do not identify
// XCTClockMetric. No value below is guessed from another metric or SDK version.
const verifiedClockContract = null
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
    const rawSamples = measurements.map(item => item?._value)
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
        name: metric.baselineName?._value ?? null,
        average: metric.baselineAverage?._value ?? null,
        maximum_percent_regression: metric.maxPercentRegression?._value ?? null,
        maximum_relative_standard_deviation: metric.maxPercentRelativeStandardDeviation?._value ?? null
      }
    }
  })
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
  if (!files.length || files.length > 16) throw new Error('Expected nonempty CSV metric export')
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
  const clockContractConfirmed = verifiedClockContract !== null &&
    metrics[0].identifier === verifiedClockContract.identifier && metrics[0].unit === verifiedClockContract.unit
  const result = {
    schema_version: 1, status: !clockContractConfirmed ? 'collected-pending-metric-contract-review' :
      (details.testResult === 'Passed' ? 'measured-and-exported' : 'measured-with-test-failure'), context, test_id: id,
    test_result: details.testResult, devices: details.devices,
    declared_metric: 'XCTClockMetric', declared_recorded_iterations: 3,
    discarded_warmup_invocations: 1, metrics, csv, commands,
    metric_contract: { status: clockContractConfirmed ? 'confirmed' : 'pending-first-real-Xcode16.4-clock-output',
      confirmed: clockContractConfirmed, adopted_reference: verifiedClockContract,
      note: 'The source declares XCTClockMetric; generic legacy samples do not independently prove its API identity.' },
    csv_validation: 'Raw nonempty UTF-8 bytes retained only; columns/row count/value agreement are unvalidated. Numeric evidence comes separately from typed legacy fields.',
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
