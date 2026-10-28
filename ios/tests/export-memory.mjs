#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, constants, fstatSync, ftruncateSync, lstatSync, mkdirSync, mkdtempSync, openSync, readdirSync, readSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

// Fixed source adoption from PR296 fb29 / run40748853889 attempt1 raw JSON/CSV.
// Baselines remain unadopted budgets; this contract verifies recorded wire data.
export const trustedMemoryContract = Object.freeze({
  id: 'xcode16.4-app-memory-v1', sample_count: 3,
  metrics: Object.freeze([
    Object.freeze({ identifier: 'com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical_absolute',
      display_name: 'Absolute Memory Physical (prototype)', unit: 'kB' }),
    Object.freeze({ identifier: 'com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical_peak',
      display_name: 'Memory Peak Physical (prototype)', unit: 'kB' }),
    Object.freeze({ identifier: 'com.apple.dt.XCTMetric_Memory-dev.pero3.aiagentlibrary.prototype.physical',
      display_name: 'Memory Physical (prototype)', unit: 'kB' })
  ]),
  csv: Object.freeze({ file_count: 1, data_rows: 1, header_columns: 11,
    fixed_headers: Object.freeze(['Destination', 'Configuration']),
    suffixes: Object.freeze(['Average', 'Iterations', 'Baseline']),
    configuration: 'Test Scheme Action', baseline: '0' })
})
export const memoryObservation = Object.freeze({
  scenario: 'published-article-app-memory', test_method: 'testPublishedArticleAppMemory',
  target_application: 'dev.pero3.aiagentlibrary.prototype',
  metric_configuration: 'XCTMemoryMetric(application: app)',
  article_id: '11-llm-internals/transformer-architecture'
})
export const memoryCaps = Object.freeze({ json: 512 * 1024, legacySummary: 1024 * 1024, csv: 64 * 1024,
  aggregate: 2 * 1024 * 1024, csvFiles: 16, commandReceipt: 16 * 1024,
  csvDiagnostic: 16 * 1024, csvInventoryEntries: 64, csvRelativePath: 512,
  exportMilliseconds: 170000, childMilliseconds: 60000 })
const sourcePaths = Object.freeze(['.github/workflows/ios-memory.yml',
  'ios/AILibraryUITests/PublishedPerformanceUITests.swift', 'ios/tests/export-memory.mjs',
  'tests/unit/ios-memory-export.test.mjs'])
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const utf8 = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes)
const inode = stat => `${stat.dev}:${stat.ino}`
const spelling = value => typeof value === 'string' && value.length > 0 && value.length <= 500 && !/[\0\r\n]/.test(value)
const hex40 = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const hex64 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const positiveInteger = value => (typeof value === 'string' && /^[1-9]\d*$/.test(value) && value.length <= 20) ||
  (Number.isSafeInteger(value) && value > 0)

function walk(value, visit) {
  if (!value || typeof value !== 'object') return
  visit(value)
  for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visit)
}

function caseID(id) {
  return ['PublishedPerformanceUITests/', 'AILibraryUITests/PublishedPerformanceUITests/',
    'AILibraryUITests.PublishedPerformanceUITests/'].some(prefix => id === prefix + memoryObservation.test_method + '()')
}

function selectedCase(tests) {
  const cases = []
  walk(tests.testNodes, node => { if (node.nodeType === 'Test Case') cases.push(node) })
  if (cases.length !== 1 || !caseID(cases[0].nodeIdentifier) || !['Passed', 'Failed'].includes(cases[0].result)) {
    throw new Error('Expected exactly one executed, fixed memory case')
  }
  return cases[0]
}

export function verifyMemoryCase(tests, details) {
  const selected = selectedCase(tests)
  if (selected.result !== 'Passed' || details.testIdentifier !== selected.nodeIdentifier ||
      details.testResult !== 'Passed' || details.hasPerformanceMetrics !== true) {
    throw new Error('Memory test list/details must identify the same passed case with metrics')
  }
  walk(tests.testNodes, node => {
    if (['Test Plan', 'UI test bundle', 'Test Suite'].includes(node.nodeType) &&
        node.result !== undefined && node.result !== 'Passed') throw new Error('Failed or skipped test container')
  })
  if (!Array.isArray(details.devices) || details.devices.length !== 1 ||
      !spelling(details.devices[0].deviceName) || details.devices[0].platform !== 'iOS Simulator' ||
      details.devices[0].osVersion !== '18.5') throw new Error('Expected one iOS 18.5 Simulator result')
  if (!Array.isArray(details.testPlanConfigurations) || details.testPlanConfigurations.length !== 1 ||
      !spelling(details.testPlanConfigurations[0].configurationName)) throw new Error('Expected one test configuration')
  return selected.nodeIdentifier
}

function planReference(root) {
  if (root._type?._name !== 'ActionsInvocationRecord') throw new Error('Unexpected legacy invocation type')
  const actions = root.actions?._values
  if (!Array.isArray(actions) || actions.length !== 1) throw new Error('Expected one dedicated legacy action')
  const ref = actions[0].actionResult?.testsRef?.id?._value
  if (!spelling(ref)) throw new Error('Missing dedicated legacy test plan reference')
  return ref
}

function summaryReference(plan, id) {
  if (plan._type?._name !== 'ActionTestPlanRunSummaries') throw new Error('Unexpected legacy plan type')
  const cases = []
  walk(plan, node => {
    if (node._type?._name === 'ActionTestMetadata') cases.push(node)
  })
  if (cases.length !== 1 || cases[0].identifier?._value !== id ||
      !spelling(cases[0].summaryRef?.id?._value)) throw new Error('Expected one exact legacy case summary reference')
  return cases[0].summaryRef.id._value
}

export function selectLegacySummary(root, plan, summary, selectedID) {
  if (!caseID(selectedID)) throw new Error('Foreign legacy memory case')
  const planRef = planReference(root), summaryRef = summaryReference(plan, selectedID)
  if (summary._type?._name !== 'ActionTestSummary' || summary.identifier?._value !== selectedID ||
      summary.testStatus?._value !== 'Success') throw new Error('Legacy memory summary must match passed modern case')
  return { plan_ref: planRef, summary_ref: summaryRef }
}

export function verifyMemoryProvenance(context, expectedHead) {
  if (!hex40(expectedHead) || !plain(context) || context.schema_version !== 1 ||
      context.expected_source_head !== expectedHead || context.checkout_head !== expectedHead ||
      !hex40(context.source_tree)) throw new Error('Expected source argument, checkout and context must agree')
  for (const [key, value] of Object.entries(memoryObservation)) {
    if (context[key] !== value) throw new Error('Foreign memory scenario, method, application or article')
  }
  if (context.configuration !== 'Debug' || !Number.isInteger(context.expected_articles) ||
      context.expected_articles < 4 || context.expected_articles > 2000) throw new Error('Expected independently counted full Debug package')
  const hashes = context.source_sha256
  if (!plain(hashes) || Object.keys(hashes).length !== sourcePaths.length ||
      sourcePaths.some(name => !hex64(hashes[name]))) throw new Error('Controlled Source4 hashes required')
  const github = context.github
  if (!plain(github) || github.repository !== 'pero3dev/ai-agent-library' ||
      !['pull_request', 'push'].includes(github.event_name) || !positiveInteger(github.run_id) ||
      !positiveInteger(github.run_attempt) || !hex40(github.sha) || !hex40(github.workflow_sha) ||
      typeof github.workflow_ref !== 'string' || github.workflow_ref.length > 1000 ||
      !github.workflow_ref.startsWith('pero3dev/ai-agent-library/.github/workflows/ios-memory.yml@') ||
      /[\0\r\n]/.test(github.workflow_ref)) throw new Error('Invalid memory workflow context')
  if (github.event_name === 'push' && github.sha !== expectedHead) throw new Error('Push SHA must equal expected source')
  const device = context.destination
  if (!plain(device) || typeof device.uuid !== 'string' ||
      !/^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/.test(device.uuid) ||
      device.device_type_identifier !== 'com.apple.CoreSimulator.SimDeviceType.iPhone-16' ||
      device.runtime_identifier !== 'com.apple.CoreSimulator.SimRuntime.iOS-18-5' ||
      device.device_model_name !== 'iPhone 16' || device.os_version !== '18.5' ||
      !spelling(device.device_name) || device.owned !== true) throw new Error('Expected owned iPhone 16 / iOS18.5 destination')
  const app = context.application
  if (!plain(app) || app.bundle_identifier !== memoryObservation.target_application ||
      !spelling(app.version) || !spelling(app.build) || !hex64(app.content_revision) ||
      app.articles !== context.expected_articles || app.content_audited !== true ||
      app.fixture_audited !== true) throw new Error('Actual Debug app and package audit context required')
  return { status: 'producer-context-consistent', expected_source_head: expectedHead,
    checkout_head: context.checkout_head, source_tree: context.source_tree,
    official_workflow_API_verified: false, runtime_checkout_cryptographically_verified: false,
    protocol_payload_verified: false,
    note: 'Context matches the separately supplied expected head; an independent consumer must join official head/event/run/attempt and source receipts.' }
}

function numberToken(value) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid typed measurement value')
  const token = String(value)
  if (token.length > 512 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) throw new Error('Invalid finite numeric spelling')
  const number = Number(token)
  if (!Number.isFinite(number) || (number === 0 && /[1-9]/.test(token.split(/[eE]/)[0]))) throw new Error('Non-finite or underflowed measurement')
  return number
}

export function normalizeMemoryCandidates(summary, selectedID) {
  if (summary._type?._name !== 'ActionTestSummary' || summary.identifier?._value !== selectedID ||
      !caseID(selectedID) || summary.testStatus?._value !== 'Success') throw new Error('Unexpected typed memory summary')
  const metrics = summary.performanceMetrics?._values
  if (!Array.isArray(metrics) || metrics.length < 1 || metrics.length > 64) throw new Error('Missing or oversized metric candidate set')
  const identifiers = new Set()
  return metrics.map(metric => {
    if (metric._type?._name !== 'ActionTestPerformanceMetricSummary') throw new Error('Unexpected metric type')
    const id = metric.identifier?._value, display = metric.displayName?._value, unit = metric.unitOfMeasurement?._value
    if ([metric.identifier, metric.displayName, metric.unitOfMeasurement].some(value => value?._type?._name !== 'String')) throw new Error('Expected typed String metric metadata')
    if (!spelling(id) || !spelling(display) || !spelling(unit) || identifiers.has(id)) throw new Error('Missing or duplicate metric metadata')
    identifiers.add(id)
    const values = metric.measurements?._values
    if (!Array.isArray(values) || values.length !== 3 || values.some(value => value?._type?._name !== 'Double' ||
        typeof value._value !== 'string')) throw new Error('Expected exactly three typed Double string tokens per candidate')
    const raw = values.map(value => value._value)
    if (metric.baselineAverage?._type?._name !== 'Double' || typeof metric.baselineAverage._value !== 'string' || metric.baselineName?._type?._name !== 'String' ||
        typeof metric.baselineName._value !== 'string') throw new Error('Expected typed memory baseline metadata')
    numberToken(metric.baselineAverage._value)
    return { identifier: id, display_name: display, unit, raw_samples: raw,
      samples: raw.map(numberToken), sample_count: raw.length, interpretation: 'unadopted-candidate',
      baseline: { average_raw: metric.baselineAverage._value, name: metric.baselineName._value, acceptance: 'unadopted' } }
  })
}

export function validateMemoryMetricSet(candidates, contract = trustedMemoryContract) {
  if (contract !== trustedMemoryContract) throw new Error('Runtime memory contract overrides are forbidden')
  if (!Array.isArray(candidates) || candidates.length !== contract.metrics.length) throw new Error('Expected the exact fixed three memory metrics')
  const byID = new Map()
  for (const candidate of candidates) {
    if (!plain(candidate) || byID.has(candidate.identifier)) throw new Error('Duplicate or invalid memory metric')
    byID.set(candidate.identifier, candidate)
  }
  const metrics = contract.metrics.map(expected => {
    const candidate = byID.get(expected.identifier)
    if (!candidate || candidate.display_name !== expected.display_name || candidate.unit !== expected.unit ||
        candidate.sample_count !== contract.sample_count || !Array.isArray(candidate.raw_samples) ||
        candidate.raw_samples.length !== contract.sample_count || !Array.isArray(candidate.samples) ||
        candidate.samples.length !== contract.sample_count ||
        candidate.raw_samples.some((value, index) => typeof value !== 'string' || numberToken(value) !== candidate.samples[index])) throw new Error('Memory metadata or three typed samples differ from the fixed contract')
    if (!plain(candidate.baseline) || typeof candidate.baseline.average_raw !== 'string' || candidate.baseline.name !== '' ||
        !equalMemoryDecimalTokens(candidate.baseline.average_raw, contract.csv.baseline)) throw new Error('Unexpected unadopted memory baseline')
    return { ...expected, raw_samples: [...candidate.raw_samples], samples: [...candidate.samples],
      sample_count: contract.sample_count, baseline: { ...candidate.baseline, acceptance: 'unadopted' },
      interpretation: 'verified-raw-observation' }
  })
  return { status: 'matched-fixed-memory-metric-set', confirmed: true, metrics, candidate_count: candidates.length }
}

export function validateMemoryCSV(files, candidates, details, context, contract = trustedMemoryContract) {
  const typed = validateMemoryMetricSet(candidates, contract)
  if (!Array.isArray(files) || files.length !== contract.csv.file_count) throw new Error('Expected exactly one dedicated memory CSV')
  const file = files[0]
  if (!plain(file) || typeof file.name !== 'string' || !/^[a-zA-Z0-9_.-]+\.csv$/.test(file.name) ||
      !Buffer.isBuffer(file.bytes) || !file.bytes.length || file.bytes.length > memoryCaps.csv) throw new Error('Invalid bounded CSV candidate')
  const { header, row } = parseMemoryCSV(file.bytes)
  const expectedHeaders = [...contract.csv.fixed_headers, ...contract.metrics.flatMap(metric =>
    contract.csv.suffixes.map(suffix => metric.display_name + ' (' + suffix + ')'))]
  if (header.length !== contract.csv.header_columns || expectedHeaders.some(name => !header.includes(name)) ||
      header.some(name => !expectedHeaders.includes(name))) throw new Error('Unexpected fixed memory CSV header set')
  const columns = new Map(header.map((name, index) => [name, row[index]]))
  if (!Array.isArray(details?.devices) || details.devices.length !== 1 ||
      !Array.isArray(details.testPlanConfigurations) || details.testPlanConfigurations.length !== 1) throw new Error('Expected one CSV device and configuration')
  const device = details.devices[0], destination = context?.destination
  if (!plain(destination) || typeof device.deviceId !== 'string' || typeof destination.uuid !== 'string' ||
      !/^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/.test(device.deviceId) ||
      device.deviceId.toUpperCase() !== destination.uuid.toUpperCase() || device.deviceName !== destination.device_name ||
      destination.owned !== true || destination.device_type_identifier !== 'com.apple.CoreSimulator.SimDeviceType.iPhone-16' ||
      destination.runtime_identifier !== 'com.apple.CoreSimulator.SimRuntime.iOS-18-5' ||
      device.modelName !== 'iPhone 16' || device.modelName !== destination.device_model_name ||
      device.platform !== 'iOS Simulator' || device.osVersion !== '18.5' || device.osVersion !== destination.os_version ||
      context.configuration !== 'Debug' || details.testPlanConfigurations[0].configurationName !== contract.csv.configuration) throw new Error('CSV result device/configuration differs from owned producer context')
  const destinationLabel = [device.modelName, device.platform, device.osVersion].join(' ')
  if (columns.get('Destination') !== destinationLabel || columns.get('Configuration') !== contract.csv.configuration) throw new Error('CSV destination or configuration differs from actual result metadata')
  const metrics = typed.metrics.map(metric => {
    const average = columns.get(metric.display_name + ' (Average)'), iterations = columns.get(metric.display_name + ' (Iterations)')
    const match = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+)) kB$/.exec(average)
    if (!match) throw new Error('Expected the observed plain decimal kB average spelling')
    const comparison = compareMemoryCSVNumbers(metric.raw_samples, iterations, match[1])
    const baseline = columns.get(metric.display_name + ' (Baseline)')
    if (baseline !== contract.csv.baseline || !equalMemoryDecimalTokens(baseline, metric.baseline.average_raw)) throw new Error('CSV and typed unadopted baselines differ')
    return { identifier: metric.identifier, display_name: metric.display_name, unit: metric.unit,
      ...comparison, average_raw: average, baseline_raw: baseline, baseline_average_raw: metric.baseline.average_raw, baseline_acceptance: 'unadopted' }
  })
  return { status: 'matched-fixed-memory-csv', schema_verified: true, metric_set_correlated: true,
    header_columns: header.length, data_rows: contract.csv.data_rows, file_count: files.length,
    destination: destinationLabel, configuration: contract.csv.configuration, metrics,
    files: [{ file: 'csv/' + file.name, bytes: file.bytes.length, sha256: digest(file.bytes) }] }
}

// Parsing and numeric correlation alone do not adopt a memory metric, unit or
// CSV wire schema. These helpers cannot enable acceptance in the exporter.
export function parseMemoryCSV(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > memoryCaps.csv) throw new Error('Expected bounded CSV bytes')
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw new Error('Unexpected CSV byte-order marker')
  const text = utf8(bytes)
  if (text.includes('\0')) throw new Error('NUL in CSV text')
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
      if (row.length > 64) throw new Error('CSV column safety cap exceeded')
      if (text[cursor] === ',') { cursor++; continue }
      if (text[cursor] === '\r') {
        if (text[cursor + 1] !== '\n') throw new Error('Invalid CSV line ending')
        cursor += 2
      } else if (text[cursor] === '\n') cursor++
      else if (cursor !== text.length) throw new Error('Unexpected text after CSV field')
      break
    }
    rows.push(row)
    if (rows.length > 2) throw new Error('Expected one CSV header and one data row')
  }
  if (rows.length !== 2 || rows[0].length !== rows[1].length) throw new Error('CSV header and data widths must agree')
  const [header, row] = rows
  if (header.some(name => !name.length) || new Set(header).size !== header.length) throw new Error('CSV headers must be nonempty and unique')
  return { header, row }
}

function memoryDecimal(value) {
  const number = numberToken(value), token = String(value)
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(token)
  if (!match) throw new Error('Invalid exact decimal token')
  const exponent = Number(match[5] ?? 0)
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 400) throw new Error('Decimal exponent exceeds arithmetic safety cap')
  const fraction = match[3] ?? match[4] ?? ''
  const coefficient = BigInt((match[2] ?? '0') + fraction) * (match[1] === '-' ? -1n : 1n)
  return { coefficient, scale: fraction.length - exponent, number, token }
}
const memoryPower10 = exponent => 10n ** BigInt(exponent)
const memoryDecimalUnits = (value, scale) => value.coefficient * memoryPower10(scale - value.scale)
const sameMemoryDecimal = (left, right) => {
  const scale = Math.max(0, left.scale, right.scale)
  return memoryDecimalUnits(left, scale) === memoryDecimalUnits(right, scale)
}

export function equalMemoryDecimalTokens(left, right) {
  return sameMemoryDecimal(memoryDecimal(left), memoryDecimal(right))
}

function exactMemoryDouble(value) {
  if (!Number.isFinite(value)) throw new Error('Cannot represent a non-finite binary64 value')
  if (value === 0) return { coefficient: 0n, scale: 0 }
  const storage = new DataView(new ArrayBuffer(8))
  storage.setFloat64(0, value, false)
  const bits = storage.getBigUint64(0, false), exponent = Number((bits >> 52n) & 0x7ffn)
  const fraction = bits & ((1n << 52n) - 1n)
  const significand = exponent === 0 ? fraction : (1n << 52n) | fraction
  const power = exponent === 0 ? -1074 : exponent - 1023 - 52
  const sign = (bits >> 63n) === 1n ? -1n : 1n
  let coefficient = power >= 0 ? sign * significand * (1n << BigInt(power)) : sign * significand * 5n ** BigInt(-power)
  let scale = Math.max(0, -power)
  while (scale > 0 && coefficient % 10n === 0n) { coefficient /= 10n; scale-- }
  return { coefficient, scale }
}

const memoryAbsolute = value => value < 0n ? -value : value
function memoryFraction(numerator, denominator) {
  if (denominator <= 0n) throw new Error('Invalid exact arithmetic denominator')
  let a = memoryAbsolute(numerator), b = denominator
  while (b !== 0n) { const next = a % b; a = b; b = next }
  return { numerator: numerator / a, denominator: denominator / a }
}
const addMemoryFractions = (left, right) => memoryFraction(left.numerator * right.denominator + right.numerator * left.denominator,
  left.denominator * right.denominator)
const memoryFractionReceipt = value => ({ numerator: value.numerator.toString(), denominator: value.denominator.toString() })

export function compareMemoryCSVNumbers(rawSamples, csvIterations, csvAverage) {
  if (!Array.isArray(rawSamples) || rawSamples.length !== 3 ||
      typeof csvIterations !== 'string' || csvIterations.length > memoryCaps.csv ||
      typeof csvAverage !== 'string' || csvAverage.length > 512 || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(csvAverage)) {
    throw new Error('Expected three typed samples, CSV iterations and a plain printed average')
  }
  const match = /^\[([^\[\]]*)\]$/.exec(csvIterations)
  if (!match) throw new Error('Invalid CSV iteration array')
  const rawIterations = match[1].split(',').map(value => value.trim())
  if (rawIterations.length !== 3) throw new Error('Expected exactly three CSV iterations')
  const typed = rawSamples.map(memoryDecimal), iterations = rawIterations.map(memoryDecimal), average = memoryDecimal(csvAverage)
  if (typed.some((value, index) => !sameMemoryDecimal(value, iterations[index]))) throw new Error('CSV iteration order or values differ from typed samples')
  const binary = typed.map(value => exactMemoryDouble(value.number))
  const scale = Math.max(0, average.scale, ...typed.map(value => value.scale), ...binary.map(value => value.scale))
  const decimalDenominator = memoryPower10(scale)
  const sum = typed.reduce((total, value) => total + memoryDecimalUnits(value, scale), 0n), count = 3n
  const signedDifference = memoryDecimalUnits(average, scale) * count - sum
  const difference = signedDifference < 0n ? -signedDifference : signedDifference
  const binaryUnits = binary.map(value => memoryDecimalUnits(value, scale))
  const sumAbsolute = binaryUnits.reduce((total, value) => total + memoryAbsolute(value), 0n)
  const maximum = exactMemoryDouble(Number.MAX_VALUE)
  if (sumAbsolute > memoryDecimalUnits(maximum, scale)) throw new Error('Binary64 reduction could overflow; mean comparison is unavailable')
  const conversion = binaryUnits.reduce((total, value, index) => total + memoryAbsolute(value - memoryDecimalUnits(typed[index], scale)), 0n)
  // This is an explicit common reduction model, not proof of Apple's internal
  // implementation: sum three inputs then divide by three, or divide each and
  // sum. Each input sees at most three rounded operations; gamma(3) = 3u/(1-3u),
  // u=2^-53, bounds the arithmetic error by sum(abs(binary inputs))/(2^53-3).
  // Five operations at most contribute gradual-underflow errors <= eta/2 each.
  // Their propagation is <= (1+u)^2, so 5/2*(1+u)^2*eta < 3eta, eta=2^-1074.
  // Keep this term rational: Number.MIN_VALUE/2 would silently become zero.
  const allowances = {
    printed_decimal: memoryFraction(1n, 2n * memoryPower10(average.scale)),
    wire_decimal_to_binary64: memoryFraction(conversion, count * decimalDenominator),
    binary64_arithmetic: memoryFraction(sumAbsolute, ((1n << 53n) - 3n) * decimalDenominator),
    gradual_underflow: memoryFraction(3n, 1n << 1074n)
  }
  const total = Object.values(allowances).reduce(addMemoryFractions, memoryFraction(0n, 1n))
  if (difference * total.denominator > total.numerator * count * decimalDenominator) throw new Error('CSV mean differs beyond its printed and derived binary64 rounding bounds')
  const mean = typed.reduce((total, value) => total + value.number / 3, 0)
  if (!Number.isFinite(mean)) throw new Error('Non-finite typed mean')
  return { sample_count: 3, raw_iterations: rawIterations, average_raw: csvAverage,
    CSV_average: average.number, typed_mean: mean,
    mean_comparison: { method: 'exact signed decimal integer arithmetic', printed_decimal_scale: average.scale,
      empirical_absolute_epsilon: 0,
      arithmetic_model: { operations: 'sum-then-divide or divide-each-then-sum for three binary64 inputs',
        maximum_rounding_depth: 3, maximum_rounded_operations: 5, Apple_implementation_verified: false,
        unit_roundoff: { numerator: '1', denominator: (1n << 53n).toString() } },
      rounding_allowances: Object.fromEntries(Object.entries({ ...allowances, total }).map(([key, value]) => [key, memoryFractionReceipt(value)])),
      difference_numerator: difference.toString(), difference_denominator: (count * decimalDenominator).toString(),
      typed_mean_numerator: sum.toString(), typed_mean_denominator: (count * decimalDenominator).toString() } }
}

function includesPath(parent, child) {
  const relative = path.relative(parent, child)
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))
}

function noSymlinkAncestors(file) {
  for (let current = file; ; current = path.dirname(current)) {
    try { if (lstatSync(current).isSymbolicLink()) throw new Error('Symbolic link in evidence/input path') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    if (path.dirname(current) === current) break
  }
}

function stableFile(file, cap) {
  noSymlinkAncestors(file)
  const initial = lstatSync(file, { bigint: true })
  if (!initial.isFile() || initial.nlink !== 1n || initial.size > BigInt(cap)) throw new Error('Input must be a bounded regular single-link file')
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const opened = fstatSync(fd, { bigint: true })
    // Recheck the opened inode before allocating: it can grow without changing
    // dev/ino between lstat and open. Both snapshots must remain bounded/equal.
    if (!opened.isFile() || opened.nlink !== 1n || opened.size > BigInt(cap) ||
        inode(opened) !== inode(initial) || opened.size !== initial.size ||
        opened.mtimeNs !== initial.mtimeNs || opened.ctimeNs !== initial.ctimeNs) throw new Error('Input identity or bounds changed before read')
    const bytes = Buffer.alloc(Number(opened.size) + 1)
    let offset = 0
    while (offset < bytes.length) { const count = readSync(fd, bytes, offset, bytes.length - offset, null); if (!count) break; offset += count }
    const after = fstatSync(fd, { bigint: true }), current = lstatSync(file, { bigint: true })
    if (offset !== Number(opened.size) || inode(after) !== inode(opened) || inode(current) !== inode(opened) ||
        after.size !== opened.size || after.mtimeNs !== opened.mtimeNs || after.ctimeNs !== opened.ctimeNs ||
        current.isSymbolicLink() || current.nlink !== 1n) throw new Error('Input changed during read')
    return { bytes: bytes.subarray(0, offset), identity: opened }
  } finally { closeSync(fd) }
}

const names = new Set(['modern-tests.json', 'modern-details.json', 'legacy-root.json', 'legacy-plan.json',
  'legacy-summary.json', 'context.json', 'summary.json', 'commands.json', 'provenance.json', 'manifest.json',
  'csv-export-stdout.txt', 'csv-export-inventory.json', 'csv-export-manifest.json'])
// The dedicated passed-case summary includes verbose UI activity records.
// Only this fixed raw output name receives a larger cap; callers cannot raise it.
const memoryJSONCap = name => name === 'legacy-summary.json' ? memoryCaps.legacySummary : memoryCaps.json
const memoryDiagnosticNames = new Set(['csv-export-stdout.txt', 'csv-export-inventory.json', 'csv-export-manifest.json'])
const memoryCommandOutputCap = name => name === 'csv-export-stdout.txt' ? memoryCaps.csvDiagnostic : memoryJSONCap(name)

export function enforceCompactCaps(entries) {
  if (!Array.isArray(entries)) throw new Error('Invalid evidence inventory')
  let total = 0
  const seen = new Set()
  for (const entry of entries) {
    if (!plain(entry) || typeof entry.path !== 'string' || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 ||
        (!names.has(entry.path) && !/^csv\/[a-zA-Z0-9_.-]+\.csv$/.test(entry.path)) || seen.has(entry.path)) throw new Error('Unknown or duplicate compact evidence member')
    seen.add(entry.path)
    const cap = entry.path.startsWith('csv/') ? memoryCaps.csv : entry.path === 'commands.json' ? memoryCaps.commandReceipt :
      memoryDiagnosticNames.has(entry.path) ? memoryCaps.csvDiagnostic : memoryJSONCap(entry.path)
    if (entry.bytes > cap) throw new Error('Compact member exceeds byte cap')
    total += entry.bytes
  }
  if (total > memoryCaps.aggregate) throw new Error('Compact aggregate exceeds byte cap')
  if (entries.filter(entry => entry.path.startsWith('csv/')).length > memoryCaps.csvFiles) throw new Error('Compact CSV file count exceeds cap')
  return total
}

export function writeOwnedEvidence(input) {
  const options = Object.fromEntries(['result', 'output', 'context'].map(key => [key, path.resolve(input[key])]))
  for (const value of Object.values(options)) noSymlinkAncestors(value)
  for (const file of [options.result, options.context]) {
    if (includesPath(file, options.output) || includesPath(options.output, file)) throw new Error('Input/output overlap')
  }
  if (includesPath(options.result, options.context) || includesPath(options.context, options.result)) throw new Error('Result/context overlap')
  const resultIdentity = lstatSync(options.result, { bigint: true })
  if (!resultIdentity.isDirectory()) throw new Error('Result must be a real xcresult directory')
  const context = stableFile(options.context, memoryCaps.json)
  const parent = lstatSync(path.dirname(options.output), { bigint: true })
  if (!parent.isDirectory()) throw new Error('Output parent must already be a real directory')
  mkdirSync(options.output, { mode: 0o700 })
  const rootIdentity = lstatSync(options.output, { bigint: true }), inventory = []
  const written = new Map()
  let csvIdentity = null
  function assertIdentity() {
    for (const file of Object.values(options)) noSymlinkAncestors(file)
    const root = lstatSync(options.output, { bigint: true }), result = lstatSync(options.result, { bigint: true })
    const ctx = lstatSync(options.context, { bigint: true })
    if (!root.isDirectory() || inode(root) !== inode(rootIdentity) || !result.isDirectory() ||
        inode(result) !== inode(resultIdentity) || !ctx.isFile() || ctx.nlink !== 1n ||
        inode(ctx) !== inode(context.identity) || ctx.size !== context.identity.size ||
        ctx.mtimeNs !== context.identity.mtimeNs || ctx.ctimeNs !== context.identity.ctimeNs) throw new Error('Owned directory or input identity changed')
    if (csvIdentity !== null) {
      const csv = lstatSync(path.join(options.output, 'csv'), { bigint: true })
      if (!csv.isDirectory() || csv.isSymbolicLink() || inode(csv) !== csvIdentity) throw new Error('CSV directory identity changed')
    }
    for (const [name, expected] of written) {
      const stat = lstatSync(path.join(options.output, name), { bigint: true })
      if (!stat.isFile() || stat.nlink !== 1n || inode(stat) !== expected.inode ||
          stat.size !== expected.size || stat.mtimeNs !== expected.mtime || stat.ctimeNs !== expected.ctime) throw new Error('Previously written evidence identity changed')
    }
  }
  return {
    options, contextBytes: context.bytes, assertIdentity,
    write(name, value) {
      if (!names.has(name) && !/^csv\/[a-zA-Z0-9_.-]+\.csv$/.test(name)) throw new Error('Unknown evidence leaf')
      const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value)
      const total = enforceCompactCaps([...inventory, { path: name, bytes: bytes.length }])
      if (!['commands.json', 'summary.json', 'manifest.json'].includes(name) &&
          total > memoryCaps.aggregate - 32 * 1024) throw new Error('Compact aggregate would consume reserved failure receipts')
      assertIdentity()
      if (name.startsWith('csv/')) {
        if (csvIdentity === null) {
          mkdirSync(path.join(options.output, 'csv'), { mode: 0o700 })
          csvIdentity = inode(lstatSync(path.join(options.output, 'csv'), { bigint: true }))
        }
        noSymlinkAncestors(path.join(options.output, 'csv'))
      }
      const file = path.join(options.output, name)
      const fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
      try {
        const stat = fstatSync(fd, { bigint: true })
        if (!stat.isFile() || stat.nlink !== 1n || [inode(context.identity), inode(resultIdentity)].includes(inode(stat))) throw new Error('Unowned evidence inode')
        assertIdentity(); writeFileSync(fd, bytes)
        const final = fstatSync(fd, { bigint: true }), current = lstatSync(file, { bigint: true })
        if (inode(final) !== inode(current) || !current.isFile() || current.nlink !== 1n || final.size !== BigInt(bytes.length)) throw new Error('Evidence leaf replaced during write')
        written.set(name, { inode: inode(final), size: final.size, mtime: final.mtimeNs, ctime: final.ctimeNs })
      } finally { closeSync(fd) }
      inventory.push({ path: name, bytes: bytes.length, sha256: digest(bytes) })
    },
    // A deadline can expire just after a successful receipt was written. Downgrade
    // only our still-identical summary/manifest in that failure path; never open
    // a replacement, linked leaf or unowned output with truncation enabled.
    writeFailureReceipt(name, value) {
      if (!['summary.json', 'manifest.json'].includes(name)) throw new Error('Not a failure receipt')
      const previous = written.get(name)
      if (!previous) return this.write(name, value)
      const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value)
      enforceCompactCaps([...inventory.filter(entry => entry.path !== name), { path: name, bytes: bytes.length }])
      assertIdentity()
      const file = path.join(options.output, name)
      const fd = openSync(file, constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0))
      try {
        const stat = fstatSync(fd, { bigint: true })
        if (!stat.isFile() || stat.nlink !== 1n || inode(stat) !== previous.inode ||
            stat.size !== previous.size || stat.mtimeNs !== previous.mtime || stat.ctimeNs !== previous.ctime) throw new Error('Owned failure receipt identity changed')
        assertIdentity()
        ftruncateSync(fd, 0); writeFileSync(fd, bytes)
        const final = fstatSync(fd, { bigint: true }), current = lstatSync(file, { bigint: true })
        if (inode(final) !== inode(current) || !current.isFile() || current.nlink !== 1n ||
            final.size !== BigInt(bytes.length)) throw new Error('Failure receipt replaced during write')
        written.set(name, { inode: inode(final), size: final.size, mtime: final.mtimeNs, ctime: final.ctimeNs })
      } finally { closeSync(fd) }
      inventory.splice(inventory.findIndex(entry => entry.path === name), 1,
        { path: name, bytes: bytes.length, sha256: digest(bytes) })
    },
    scratch() { assertIdentity(); return mkdtempSync(path.join(options.output, '.csv-export-')) },
    manifest() { assertIdentity(); return inventory.filter(entry => entry.path !== 'manifest.json') }
  }
}

function json(bytes, cap = memoryCaps.json) {
  if (!Buffer.isBuffer(bytes) || bytes.length > cap) throw new Error('Oversized JSON evidence')
  return JSON.parse(utf8(bytes))
}

function csvInventoryState() {
  return { schema_version: 1, status: 'collecting', traversal_complete: false, observed_entries: 0,
    entries_omitted: 0, captured_csv_files: 0, retained_opaque_manifest: false, entries: [], issues: [],
    limits: { depth: 4, entries: memoryCaps.csvInventoryEntries, relative_path_bytes: memoryCaps.csvRelativePath,
      CSV_files: memoryCaps.csvFiles, CSV_bytes: memoryCaps.csv, inventory_bytes: memoryCaps.csvDiagnostic } }
}

function collectCSV(directory, checkpoint, capture, inventory, captureManifest) {
  const found = [], identities = new Set()
  let stopped = false, firstError = null, opaqueManifest = null
  function reject(code, message) {
    if (!inventory.issues.includes(code)) inventory.issues.push(code)
    firstError ??= new Error(message)
  }
  function append(entry) {
    const bytes = Buffer.byteLength(JSON.stringify({ ...inventory, entries: [...inventory.entries, entry] }, null, 2))
    // Reserve room for sixteen CSV names, one opaque manifest and failure status.
    if (bytes > memoryCaps.csvDiagnostic - 2048) {
      inventory.entries_omitted++; stopped = true
      reject('inventory-byte-cap', 'CSV export inventory exceeds its bounded diagnostic allowance')
      return false
    }
    inventory.entries.push(entry)
    return true
  }
  function visit(folder, depth) {
    checkpoint()
    if (depth > 4) throw new Error('Unexpected CSV export depth')
    noSymlinkAncestors(folder)
    const children = readdirSync(folder).sort()
    checkpoint()
    for (const name of children) {
      checkpoint()
      if (stopped) return
      if (inventory.observed_entries >= memoryCaps.csvInventoryEntries) {
        inventory.observed_entries++; inventory.entries_omitted++; stopped = true
        reject('inventory-entry-cap', 'CSV export inventory entry cap exceeded'); return
      }
      inventory.observed_entries++
      const relative = path.relative(directory, path.join(folder, name))
      if (Buffer.byteLength(relative) > memoryCaps.csvRelativePath) {
        append({ relative_path: null, path_sha256: digest(Buffer.from(relative)), kind: 'uninspected',
          eligible_csv: false, captured_as: null, rejection: 'relative-path-cap' })
        reject('relative-path-cap', 'CSV export relative path exceeds its bounded allowance'); continue
      }
      const file = path.join(folder, name), stat = lstatSync(file, { bigint: true })
      const entry = { relative_path: relative,
        kind: stat.isSymbolicLink() ? 'symbolic-link' : stat.isDirectory() ? 'directory' : stat.isFile() ? 'regular-file' : 'non-regular',
        bytes: stat.isFile() && stat.size <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(stat.size) : null,
        eligible_csv: false, captured_as: null, rejection: null }
      let read = null, diagnosticManifest = false
      if (stat.isSymbolicLink()) { entry.rejection = 'symbolic-link'; reject(entry.rejection, 'CSV export symbolic link') }
      else if (name === 'manifest.json') {
        if (relative !== 'manifest.json' || !stat.isFile()) {
          entry.rejection = 'unsafe-or-nested-manifest'; reject(entry.rejection, 'Only one regular root manifest may be retained as opaque diagnostics')
        } else {
          try { read = stableFile(file, memoryCaps.csvDiagnostic) }
          catch { entry.rejection = 'unsafe-or-oversized-manifest'; reject(entry.rejection, 'Opaque export manifest failed bounded stable-file checks') }
          checkpoint()
          if (read && identities.has(inode(read.identity))) {
            read = null; entry.rejection = 'duplicate-manifest-inode'; reject(entry.rejection, 'Duplicate opaque manifest inode')
          }
          diagnosticManifest = read !== null
        }
      }
      else if (stat.isDirectory()) {
        if (depth === 4) { entry.rejection = 'depth-cap'; reject(entry.rejection, 'Unexpected CSV export depth') }
      } else if (!stat.isFile() || !name.endsWith('.csv')) {
        entry.rejection = 'unexpected-member'; reject(entry.rejection, 'Unexpected CSV export member or count')
      } else if (found.length >= memoryCaps.csvFiles) {
        entry.rejection = 'csv-file-count'; reject(entry.rejection, 'Unexpected CSV export member or count')
      } else {
        try { read = stableFile(file, memoryCaps.csv) }
        catch { entry.rejection = 'unsafe-or-oversized-CSV'; reject(entry.rejection, 'CSV export member failed bounded stable-file checks') }
        checkpoint()
        if (read && identities.has(inode(read.identity))) {
          read = null; entry.rejection = 'duplicate-CSV-inode'; reject(entry.rejection, 'Duplicate CSV inode')
        }
        entry.eligible_csv = read !== null
      }
      if (!append(entry)) return
      if (read) {
        if (diagnosticManifest) {
          captureManifest(read.bytes)
          identities.add(inode(read.identity)); inventory.retained_opaque_manifest = true
          entry.captured_as = 'csv-export-manifest.json'
          opaqueManifest = { file: entry.captured_as, bytes: read.bytes.length, sha256: digest(read.bytes) }
        } else {
          const candidate = { name: `candidate-${String(found.length + 1).padStart(2, '0')}.csv`, original_relative_path: relative, bytes: read.bytes }
          capture(candidate)
          identities.add(inode(read.identity)); found.push(candidate)
          entry.captured_as = 'csv/' + candidate.name; inventory.captured_csv_files = found.length
        }
      }
      if (stat.isDirectory() && entry.rejection === null) visit(file, depth + 1)
    }
    checkpoint()
  }
  visit(directory, 0)
  checkpoint()
  if (!found.length) reject('missing-CSV', 'Missing CSV export candidates')
  inventory.traversal_complete = !stopped && !inventory.issues.some(code => ['relative-path-cap', 'depth-cap'].includes(code))
  inventory.status = firstError ? 'rejected' : 'complete'
  return { files: found, error: firstError, opaqueManifest }
}

function failure(error) {
  return { schema_version: 1, status: 'failed-or-unavailable', accepted_measurements: null,
    metric_contract_accepted: false, error: String(error.message).slice(0, 2000),
    protocol_payload_verified: false, product_performance_acceptance: false }
}

export function memoryCommandBudget(deadline, now) {
  if (!Number.isFinite(deadline) || !Number.isFinite(now)) throw new Error('Invalid memory export deadline')
  const remaining = Math.floor(deadline - now)
  if (remaining <= 0) throw new Error('Memory export shared deadline exhausted')
  return Math.min(memoryCaps.childMilliseconds, remaining)
}

export function exportMemory(options) {
  if (!hex40(options.expectedHead)) throw new Error('A separate expected-head 40hex argument is required')
  const started = performance.now(), deadline = started + memoryCaps.exportMilliseconds
  const evidence = writeOwnedEvidence(options), commands = []
  let csvInventory = null, csvInventoryWritten = false
  // These are boundary checks around synchronous work, not an atomic wall-clock
  // cancellation guarantee for filesystem calls or an entire process tree.
  const checkpoint = () => { memoryCommandBudget(deadline, performance.now()) }
  const bounded = action => { checkpoint(); const value = action(); checkpoint(); return value }
  const run = (args, outputName) => {
    checkpoint()
    evidence.assertIdentity()
    const timeout = memoryCommandBudget(deadline, performance.now())
    const result = spawnSync('xcrun', ['xcresulttool', ...args], { timeout, killSignal: 'SIGKILL',
      maxBuffer: memoryCommandOutputCap(outputName) + 1, stdio: ['ignore', 'pipe', 'pipe'] })
    const entry = { binary: 'xcrun', arguments: ['xcresulttool', ...args], timeout_ms: timeout,
      exit_code: result.status, signal: result.signal, error: result.error?.message?.slice(0, 500) ?? null,
      stdout_bytes: result.stdout?.length ?? 0, stderr_bytes: result.stderr?.length ?? 0,
      stderr_tail: result.stderr?.subarray(-1024).toString('utf8') ?? '' }
    commands.push(entry)
    if (Buffer.byteLength(JSON.stringify(commands)) > memoryCaps.commandReceipt) throw new Error('Command receipt cap exceeded')
    evidence.assertIdentity()
    if (result.error || result.signal || result.status !== 0) throw new Error('xcresulttool command failed, timed out or exceeded output cap')
    checkpoint()
    return result.stdout ?? Buffer.alloc(0)
  }
  const rawJSON = (args, name) => {
    const bytes = run(args, name); bounded(() => evidence.write(name, bytes)); return bounded(() => json(bytes, memoryJSONCap(name)))
  }
  try {
    bounded(() => evidence.write('context.json', evidence.contextBytes))
    const context = bounded(() => json(evidence.contextBytes))
    const provenance = bounded(() => verifyMemoryProvenance(context, options.expectedHead))
    bounded(() => evidence.write('provenance.json', JSON.stringify(provenance, null, 2) + '\n'))
    const tests = rawJSON(['get', 'test-results', 'tests', '--path', evidence.options.result, '--compact'], 'modern-tests.json')
    const initial = bounded(() => selectedCase(tests))
    const details = rawJSON(['get', 'test-results', 'test-details', '--test-id', initial.nodeIdentifier,
      '--path', evidence.options.result, '--compact'], 'modern-details.json')
    const id = bounded(() => verifyMemoryCase(tests, details))
    const root = rawJSON(['get', 'object', '--legacy', '--path', evidence.options.result, '--format', 'json'], 'legacy-root.json')
    const planRef = bounded(() => planReference(root))
    const plan = rawJSON(['get', 'object', '--legacy', '--path', evidence.options.result, '--id', planRef, '--format', 'json'], 'legacy-plan.json')
    const summaryRef = bounded(() => summaryReference(plan, id))
    const summary = rawJSON(['get', 'object', '--legacy', '--path', evidence.options.result, '--id', summaryRef, '--format', 'json'], 'legacy-summary.json')
    const refs = bounded(() => selectLegacySummary(root, plan, summary, id))
    const scratch = bounded(() => evidence.scratch())
    const csvStdout = run(['export', 'metrics', '--test-id', id, '--path', evidence.options.result, '--output-path', scratch], 'csv-export-stdout.txt')
    bounded(() => evidence.write('csv-export-stdout.txt', csvStdout))
    csvInventory = csvInventoryState()
    const collection = collectCSV(scratch, checkpoint, file => bounded(() => evidence.write('csv/' + file.name, file.bytes)), csvInventory,
      bytes => bounded(() => evidence.write('csv-export-manifest.json', bytes)))
    bounded(() => evidence.write('csv-export-inventory.json', JSON.stringify(csvInventory, null, 2) + '\n'))
    csvInventoryWritten = true
    if (collection.error) throw collection.error
    const csv = collection.files
    // All bounded raw candidates are already retained before interpretation.
    const candidates = bounded(() => normalizeMemoryCandidates(summary, id))
    const csvValidation = bounded(() => validateMemoryCSV(csv, candidates, details, context))
    const contract = bounded(() => validateMemoryMetricSet(candidates))
    const result = { schema_version: 1, status: 'matched-memory-observation', accepted_measurements: contract.metrics,
      metric_contract_id: trustedMemoryContract.id, metric_contract_accepted: true, product_performance_acceptance: false,
      scenario: memoryObservation.scenario, test_id: id, test_result: details.testResult,
      provenance, declared_metric_configuration: memoryObservation.metric_configuration,
      declared_recorded_iterations: 3, declared_discarded_warmup_invocations: 1,
      warmup_verification: { declared_block_invocations: 4, protocol_payload_verified: false,
        source_assertion_independently_verified: false,
        note: 'The consumer must join this passed case and typed three samples to the reviewed Swift four-invocation assertion; typed three alone do not prove warm-up.' },
      protocol_payload_verified: false, candidates, csv_validation: csvValidation,
      CSV_export_manifest: { status: collection.opaqueManifest ? 'retained-opaque-diagnostic' : 'absent',
        ...(collection.opaqueManifest ?? {}), schema_not_used: true, metric_acceptance_depends_on_contents: false },
      CSV_original_paths: csv.map(file => ({ file: 'csv/' + file.name, original_relative_path: file.original_relative_path })),
      legacy_references: refs, observed_devices: details.devices,
      limits: 'Verified wire observations for Debug iOS18.5 Simulator including UI/AX and warm-cache effects; not cold launch, lifetime peak, Mac/test-runner RSS, physical-device safety or product SLO. Mean arithmetic uses a bounded reduction model, not a verified Apple implementation. Export-manifest bytes are opaque diagnostics.' }
    bounded(() => evidence.write('commands.json', JSON.stringify(commands, null, 2) + '\n'))
    bounded(() => evidence.write('summary.json', JSON.stringify(result, null, 2) + '\n'))
    bounded(() => evidence.write('manifest.json', JSON.stringify({ schema_version: 1, files: evidence.manifest() }, null, 2) + '\n'))
    checkpoint()
    return result
  } catch (error) {
    // Failure diagnostics use the reserved byte allowance even after the work
    // deadline. They are bounded best effort, without another external command.
    if (csvInventory && !csvInventoryWritten) {
      try {
        csvInventory.status = 'aborted'; csvInventory.traversal_complete = false
        evidence.write('csv-export-inventory.json', JSON.stringify(csvInventory, null, 2) + '\n')
      } catch { /* Never exceed caps or overwrite a previously written diagnostic. */ }
    }
    try { evidence.write('commands.json', JSON.stringify(commands, null, 2) + '\n') } catch { /* Keep the original owned receipt if present. */ }
    try { evidence.writeFailureReceipt('summary.json', JSON.stringify(failure(error), null, 2) + '\n') } catch { /* Never truncate an unowned/replaced receipt. */ }
    try { evidence.writeFailureReceipt('manifest.json', JSON.stringify({ schema_version: 1, files: evidence.manifest() }, null, 2) + '\n') } catch { /* Keep original evidence/error. */ }
    throw error
  }
}

function parseOptions(args) {
  const allowed = new Set(['result', 'output', 'context', 'expected-head']), options = {}
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index], key = flag?.slice(2)
    if (!flag?.startsWith('--') || !allowed.has(key) || Object.hasOwn(options, key) ||
        typeof args[index + 1] !== 'string' || !args[index + 1].length) throw new Error('Use only --result --output --context --expected-head with one value each')
    options[key] = args[index + 1]
  }
  if (Object.keys(options).length !== allowed.size || !hex40(options['expected-head'])) throw new Error('All four fixed memory export options are required')
  return { result: options.result, output: options.output, context: options.context, expectedHead: options['expected-head'] }
}

function main() {
  try {
    const result = exportMemory(parseOptions(process.argv.slice(2)))
    console.log(JSON.stringify({ status: result.status, accepted_measurement_count: result.accepted_measurements.length,
      metric_contract_id: result.metric_contract_id, metric_contract_accepted: result.metric_contract_accepted }))
    process.exitCode = 0
  } catch (error) {
    console.error(JSON.stringify(failure(error)))
    process.exitCode = 1
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main()
