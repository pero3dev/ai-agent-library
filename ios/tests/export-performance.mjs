#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const launchScenario = 'launch-to-published-readiness'
const searchScenario = 'search-query-to-visible-witness'
const scrollScenario = 'long-article-bounded-scroll'
const scrollProtocolPrefix = 'AILIBRARY_LONG_SCROLL_PROTOCOL '
const scenarioContracts = Object.freeze({
  [launchScenario]: Object.freeze({
    name: launchScenario, method: 'testLaunchToPublishedReadiness',
    boundary: 'Debug Simulator launch through exact published-count label and learning guide; termination excluded; UI automation and AX polling included'
  }),
  [searchScenario]: Object.freeze({
    name: searchScenario, method: 'testSearchQueryToVisibleWitness',
    search_witness: Object.freeze({ negative_query: 'AILIBRARY_UI_PERF_NO_MATCH_67404f8127',
      positive_query: 'データを外部 API に出せるか', article_id: '03-implementation/model-selection' }),
    boundary: 'Debug Simulator public negative-query replacement through exact positive query, filter summary and visible article witness; launch and negative reset excluded; keyboard and AX polling included'
  }),
  [scrollScenario]: Object.freeze({
    name: scrollScenario, method: 'testLongArticleBoundedScroll',
    scroll_witness: Object.freeze({
      article_id: '03-implementation/openai-prompting',
      article_title: 'OpenAI(GPT 系)特化プロンプティングガイド',
      source_path: 'docs/03-implementation/openai-prompting.md',
      document_path: 'articles/03-implementation--openai-prompting.json',
      expected_source_sha256: 'd81e7f0984464c530d0b8bbdd8fbfffea6c1e398f037ae2f2133f053dce5a45f',
      start_heading_id: 'メッセージ構造と指示階層', start_label: 'メッセージ構造と指示階層',
      end_heading_id: '長文長コンテキスト', end_label: '長文・長コンテキスト',
      maximum_swipes: 16, gesture: 'vertical-drag-0.80-to-0.40', start_offset_max_points: 64
    }),
    boundary: 'Debug Simulator fixed long-article heading through a fully visible fixed later heading using at most16 vertical drags; preparation and article reset excluded; gesture, idle and AX checks included'
  })
})

export function performanceScenario(name = launchScenario) {
  if (typeof name !== 'string' || !Object.hasOwn(scenarioContracts, name)) throw new Error('Unknown performance scenario')
  return scenarioContracts[name]
}

export function verifiedScenarioContext(context, requested = launchScenario) {
  const selected = performanceScenario(requested)
  // Missing scenario is accepted only for the already-observed legacy launch context.
  if ((context.scenario === undefined ? launchScenario : context.scenario) !== selected.name ||
      (context.test_method !== undefined && context.test_method !== selected.method)) {
    throw new Error('Measurement context and explicitly selected scenario/method must agree')
  }
  if (selected.name === searchScenario && (context.scenario !== selected.name || context.test_method !== selected.method ||
      !context.search_witness || Object.keys(context.search_witness).length !== 3 ||
      Object.entries(selected.search_witness).some(([key, value]) => context.search_witness[key] !== value))) {
    throw new Error('The explicit search scenario requires its fixed query and article witness context')
  }
  if (selected.name === scrollScenario) {
    if (!Number.isInteger(context.expected_articles) || context.expected_articles < 4 || context.expected_articles > 2000 ||
        context.configuration !== 'Debug' || context.scenario !== selected.name || context.test_method !== selected.method ||
        !sameFields(context.scroll_witness, selected.scroll_witness)) {
      throw new Error('The explicit scroll scenario requires its exact fixed workload context')
    }
    const input = context.scroll_input_binding
    if (!input || Object.keys(input).length !== 6 ||
        input.source_sha256 !== selected.scroll_witness.expected_source_sha256 ||
        input.document_source_sha256 !== input.source_sha256 ||
        !/^[a-f0-9]{64}$/.test(input.document_sha256) ||
        input.manifest_document_sha256 !== input.document_sha256 ||
        !/^[a-f0-9]{64}$/.test(input.manifest_sha256) || input.actual_Debug_package_audit !== 'passed' ||
        context.actual_app_package?.status !== 'passed' ||
        context.actual_app_package?.articles !== context.expected_articles) {
      throw new Error('The scroll workload must bind source, generated actual Debug document, manifest and package audit')
    }
  }
  return selected
}
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

const sameFields = (actual, expected) => actual && typeof actual === 'object' && !Array.isArray(actual) &&
  Object.keys(actual).length === Object.keys(expected).length &&
  Object.entries(expected).every(([key, value]) => actual[key] === value)
const boundedUTF8 = bytes => {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > maxJSONBytes) throw new Error('Invalid or oversized scroll evidence')
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// Workflow calls this on the already-audited actual Debug app, not on a claimed
// runtime source hash. The UI protocol carries the expected hash only.
export function bindLongScrollInput(sourceBytes, manifestBytes, documentBytes, packageAudit) {
  boundedUTF8(sourceBytes)
  const manifest = JSON.parse(boundedUTF8(manifestBytes)), document = JSON.parse(boundedUTF8(documentBytes))
  const expected = performanceScenario(scrollScenario).scroll_witness
  const matches = manifest.articles?.filter(article => article.id === expected.article_id)
  const documentSHA = digest(documentBytes), sourceSHA = digest(sourceBytes)
  if (packageAudit?.status !== 'passed' || !Number.isInteger(packageAudit.articles) ||
      packageAudit.articles < 4 || packageAudit.articles > 2000 || manifest.schema_version !== 2 ||
      !Array.isArray(manifest.articles) || manifest.articles.length !== packageAudit.articles || matches?.length !== 1 ||
      matches[0].title !== expected.article_title || matches[0].source_path !== expected.source_path ||
      matches[0].document_path !== expected.document_path || matches[0].source_sha256 !== sourceSHA ||
      sourceSHA !== expected.expected_source_sha256 || manifest.files?.[expected.document_path] !== documentSHA ||
      document.schema_version !== 1 || document.article_id !== expected.article_id || document.source_sha256 !== sourceSHA ||
      !Array.isArray(document.blocks)) throw new Error('Fixed scroll source/document/manifest bytes disagree')
  const heading = id => document.blocks.map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === 'heading' && block.heading_id === id)
  const start = heading(expected.start_heading_id), end = heading(expected.end_heading_id)
  const label = block => block.inlines?.length === 1 && block.inlines[0].type === 'text' ? block.inlines[0].text : null
  if (start.length !== 1 || end.length !== 1 || start[0].index >= end[0].index ||
      label(start[0].block) !== expected.start_label || label(end[0].block) !== expected.end_label) {
    throw new Error('The fixed scroll headings must be unique, ordered and label-matched in the actual document')
  }
  return { source_sha256: sourceSHA, document_source_sha256: document.source_sha256,
    document_sha256: documentSHA, manifest_document_sha256: manifest.files[expected.document_path],
    manifest_sha256: digest(manifestBytes), actual_Debug_package_audit: 'passed' }
}

export function parseLongScrollProtocol(bytes, context) {
  const selected = verifiedScenarioContext(context, scrollScenario)
  const text = boundedUTF8(bytes)
  const lines = text.split(/\r?\n/)
  const records = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.includes(scrollProtocolPrefix))
  if (records.length !== 1 || records[0].index === lines.length - 1) throw new Error('Expected exactly one complete scroll protocol; missing/duplicate records fail')
  const line = records[0].line, position = line.indexOf(scrollProtocolPrefix)
  const payload = line.slice(position + scrollProtocolPrefix.length)
  if (Buffer.byteLength(payload) > 8192) throw new Error('Scroll protocol exceeds its8-KiB bound')
  const record = JSON.parse(payload)
  const keys = ['schema_version', 'scenario', 'metric', 'expected_articles', 'workload', 'declared_recorded_iterations',
    'block_invocations', 'discarded_warmup_invocations', 'invocations']
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      Object.keys(record).length !== keys.length || keys.some(key => !Object.hasOwn(record, key)) ||
      record.schema_version !== 1 || record.scenario !== selected.name || record.metric !== 'XCTClockMetric' ||
      record.expected_articles !== context.expected_articles ||
      !sameFields(record.workload, selected.scroll_witness) || record.declared_recorded_iterations !== 3 ||
      record.block_invocations !== 4 || record.discarded_warmup_invocations !== 1 ||
      !Array.isArray(record.invocations) || record.invocations.length !== 4) {
    throw new Error('Scroll protocol workload, counts and selected context must agree exactly')
  }
  for (const [index, item] of record.invocations.entries()) {
    if (!item || Object.keys(item).length !== 7 || item.index !== index + 1 ||
        !Number.isInteger(item.swipes) || item.swipes < 1 || item.swipes > selected.scroll_witness.maximum_swipes ||
        item.start_fully_visible !== true || item.end_initially_fully_visible !== false || item.end_fully_visible !== true ||
        !Number.isFinite(item.start_offset_points) || item.start_offset_points < 0 ||
        item.start_offset_points > selected.scroll_witness.start_offset_max_points ||
        !Number.isFinite(item.end_offset_points) || item.end_offset_points < 0) {
      throw new Error('Four ordered complete bounded-scroll invocations and start/end witnesses are required')
    }
  }
  return { protocol: record, log_bytes: bytes.length, log_sha256: digest(bytes),
    scope: 'Runner-declared expected source hash; generated Debug input is bound separately; one warm-up plus three Clock records, not frames/FPS/Release/device/SLO' }
}

function readScrollProtocol(file, context) {
  assertNoSymlinkAncestors(file)
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const before = fstatSync(fd)
    if (!before.isFile() || before.nlink !== 1 || before.size < 1 || before.size > maxJSONBytes) throw new Error('Invalid bounded scroll protocol log')
    const bytes = Buffer.allocUnsafe(before.size + 1)
    let length = 0
    while (length < bytes.length) {
      const read = readSync(fd, bytes, length, bytes.length - length, null)
      if (!read) break
      length += read
    }
    if (length !== before.size || fstatSync(fd).size !== before.size) throw new Error('Scroll protocol log changed during its bounded read')
    return parseLongScrollProtocol(bytes.subarray(0, length), context)
  } finally { closeSync(fd) }
}

export function performanceNotMeasured(requested = launchScenario) {
  const selected = performanceScenario(requested)
  const unmeasured = ['first-frame launch', 'disk-cold or first install', 'Release', 'physical device', 'CPU', 'memory', 'per-keystroke response', 'scrolling', 'image decoding', 'product performance budgets']
  return selected.name === scrollScenario
    ? [...unmeasured.filter(value => value !== 'scrolling'), 'FPS', 'hitches', 'frame time', 'pure rendering time', 'p95']
    : unmeasured
}

function parseOptions(args) {
  const allowed = new Set(['result', 'output', 'context', 'scenario', 'protocol-log'])
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]?.replace(/^--/, '')
    if (!args[i]?.startsWith('--') || !allowed.has(name) || !args[i + 1] || Object.hasOwn(options, name)) {
      throw new Error('Use --result <xcresult> --output <evidence directory> --context <JSON> [--scenario <allowed scenario>] [--protocol-log <scroll runner log>]')
    }
    options[name] = name === 'scenario' ? performanceScenario(args[i + 1]).name : path.resolve(args[i + 1])
  }
  if (['result', 'output', 'context'].some(key => !Object.hasOwn(options, key))) throw new Error('All result/output/context paths are required')
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

export function verifiedCase(report, requested = launchScenario) {
  const selected = performanceScenario(requested)
  const cases = []
  walk(report.testNodes, node => {
    if (node.nodeType === 'Test Case') cases.push(node)
  })
  if (cases.length !== 1) throw new Error('Expected exactly one dedicated performance case')
  const test = cases[0]
  const id = test.nodeIdentifier
  if (typeof id !== 'string' || id.length > 500 ||
      !id.split('/').includes(className) ||
      !id.endsWith('/' + selected.method + '()') || !['Passed', 'Failed'].includes(test.result)) {
    throw new Error('The selected dedicated performance case is missing, skipped or has an unexpected identifier')
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
  'test-summary.legacy.json', 'long-scroll-protocol.json'
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
  options.scenario = performanceScenario(input.scenario).name
  if (Object.hasOwn(input, 'protocol-log')) {
    if (options.scenario !== scrollScenario || typeof input['protocol-log'] !== 'string' || !input['protocol-log']) {
      throw new Error('A protocol log is accepted only for the explicit scroll scenario')
    }
    options['protocol-log'] = path.resolve(input['protocol-log'])
    assertNoSymlinkAncestors(options['protocol-log'])
    const stat = lstatSync(options['protocol-log'])
    if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > maxJSONBytes ||
        [options.result, options.context].some(file => file === options['protocol-log'] ||
          (existsSync(file) && inodeKey(lstatSync(file)) === inodeKey(stat)))) {
      throw new Error('Scroll protocol log must be a bounded regular single-link input distinct from other inputs')
    }
  } else if (options.scenario === scrollScenario) throw new Error('The explicit scroll scenario requires its protocol log')
  const protectedInputs = [options.result, options.context, ...(options['protocol-log'] ? [options['protocol-log']] : [])]
  // A fresh output tree cannot contain or be contained by either input path.
  // This also rejects context == any fixed output leaf, not just the summary.
  for (const file of protectedInputs) {
    if (includesPath(file, options.output) || includesPath(options.output, file)) {
      throw new Error('Evidence output and input paths cannot overlap')
    }
  }
  const inputInodes = new Set()
  for (const file of protectedInputs) {
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
  const selected = verifiedScenarioContext(context, options.scenario)
  const scrollProtocol = selected.name === scrollScenario ? readScrollProtocol(options['protocol-log'], context) : null
  if (scrollProtocol) evidence.write('long-scroll-protocol.json', JSON.stringify(scrollProtocol, null, 2) + '\n')
  if (!existsSync(options.result) || !lstatSync(options.result).isDirectory()) throw new Error('Performance xcresult is unavailable')
  const report = jsonCommand(['get', 'test-results', 'tests', '--path', options.result, '--compact'], 'tests.raw.json')
  const id = verifiedCase(report, selected.name)
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
    schema_version: 1, status: 'measured-and-exported', context, scenario: selected.name, test_id: id,
    test_result: details.testResult, devices: details.devices,
    declared_metric: 'XCTClockMetric', declared_recorded_iterations: 3,
    discarded_warmup_invocations: 1, metrics, csv, commands,
    metric_contract: { status: 'confirmed', confirmed: clockContractConfirmed, adopted_reference: verifiedClockContract,
      note: 'Metric identity and CSV schema match the inspected Xcode 16.4 reference; product performance acceptance remains unadopted.' },
    csv_validation: csvValidation,
    legacy_test_status: summary.testStatus?._value ?? null,
    extraction: 'CSV export plus documented legacy ActionTestPerformanceMetricSummary fields; missing data fails instead of becoming zero',
    acceptance_status: 'unadopted',
    boundary: selected.boundary,
    ...(scrollProtocol ? { scroll_observation: scrollProtocol } : {}),
    not_measured: performanceNotMeasured(selected.name)
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
