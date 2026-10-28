#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, constants, fstatSync, ftruncateSync, lstatSync, mkdirSync, mkdtempSync, openSync, readdirSync, readSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

// No memory metric wire identifier, unit, cardinality or CSV schema has yet been
// adopted. Runtime data and CLI arguments cannot turn this bootstrap green.
export const trustedMemoryContract = null
export const memoryObservation = Object.freeze({
  scenario: 'published-article-app-memory', test_method: 'testPublishedArticleAppMemory',
  target_application: 'dev.pero3.aiagentlibrary.prototype',
  metric_configuration: 'XCTMemoryMetric(application: app)',
  article_id: '11-llm-internals/transformer-architecture'
})
export const memoryCaps = Object.freeze({ json: 512 * 1024, csv: 64 * 1024,
  aggregate: 2 * 1024 * 1024, csvFiles: 16, commandReceipt: 16 * 1024,
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
    if (!spelling(id) || !spelling(display) || !spelling(unit) || identifiers.has(id)) throw new Error('Missing or duplicate metric metadata')
    identifiers.add(id)
    const values = metric.measurements?._values
    if (!Array.isArray(values) || values.length !== 3 || values.some(value => value?._type?._name !== 'Double')) throw new Error('Expected exactly three typed Double samples per candidate')
    const raw = values.map(value => value._value)
    return { identifier: id, display_name: display, unit, raw_samples: raw,
      samples: raw.map(numberToken), sample_count: raw.length, interpretation: 'unadopted-candidate' }
  })
}

export function validateMemoryMetricSet(candidates, contract = trustedMemoryContract) {
  if (contract !== trustedMemoryContract || trustedMemoryContract !== null) throw new Error('Runtime memory contract overrides are forbidden; source adoption is required')
  if (!Array.isArray(candidates) || !candidates.length) throw new Error('No metric candidates')
  return { status: 'metric-contract-unconfirmed', confirmed: false,
    accepted_measurements: null, candidate_count: candidates.length }
}

export function validateMemoryCSV(files, candidates, contract = trustedMemoryContract) {
  validateMemoryMetricSet(candidates, contract)
  if (!Array.isArray(files) || !files.length || files.length > memoryCaps.csvFiles) throw new Error('Missing or oversized CSV candidate set')
  const names = new Set()
  return { status: 'retained-unadopted-CSV', schema_verified: false, metric_set_correlated: false,
    files: files.map(file => {
      if (!plain(file) || typeof file.name !== 'string' || !/^[a-zA-Z0-9_.-]+\.csv$/.test(file.name) ||
          names.has(file.name) || !Buffer.isBuffer(file.bytes) || !file.bytes.length ||
          file.bytes.length > memoryCaps.csv) throw new Error('Invalid or duplicate CSV candidate')
      names.add(file.name)
      const text = utf8(file.bytes)
      if (text.includes('\0')) throw new Error('NUL in CSV candidate')
      return { file: 'csv/' + file.name, bytes: file.bytes.length, sha256: digest(file.bytes) }
    }) }
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
  'legacy-summary.json', 'context.json', 'summary.json', 'commands.json', 'provenance.json', 'manifest.json'])

export function enforceCompactCaps(entries) {
  if (!Array.isArray(entries)) throw new Error('Invalid evidence inventory')
  let total = 0
  const seen = new Set()
  for (const entry of entries) {
    if (!plain(entry) || typeof entry.path !== 'string' || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 ||
        (!names.has(entry.path) && !/^csv\/[a-zA-Z0-9_.-]+\.csv$/.test(entry.path)) || seen.has(entry.path)) throw new Error('Unknown or duplicate compact evidence member')
    seen.add(entry.path)
    const cap = entry.path.startsWith('csv/') ? memoryCaps.csv : entry.path === 'commands.json' ? memoryCaps.commandReceipt : memoryCaps.json
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
    // A deadline can expire just after a pending receipt was written. Downgrade
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

function collectCSV(directory, checkpoint) {
  const found = [], identities = new Set()
  function visit(folder, depth) {
    checkpoint()
    if (depth > 4) throw new Error('Unexpected CSV export depth')
    noSymlinkAncestors(folder)
    const children = readdirSync(folder).sort()
    checkpoint()
    for (const name of children) {
      checkpoint()
      const file = path.join(folder, name), stat = lstatSync(file, { bigint: true })
      if (stat.isSymbolicLink()) throw new Error('CSV export symbolic link')
      if (stat.isDirectory()) visit(file, depth + 1)
      else {
        if (!stat.isFile() || !name.endsWith('.csv') || found.length >= memoryCaps.csvFiles) throw new Error('Unexpected CSV export member or count')
        checkpoint()
        const read = stableFile(file, memoryCaps.csv)
        checkpoint()
        if (identities.has(inode(read.identity))) throw new Error('Duplicate CSV inode')
        identities.add(inode(read.identity)); found.push({ name: `candidate-${String(found.length + 1).padStart(2, '0')}.csv`,
          original_relative_path: path.relative(directory, file), bytes: read.bytes })
      }
    }
    checkpoint()
  }
  visit(directory, 0)
  checkpoint()
  return found
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
  // These are boundary checks around synchronous work, not an atomic wall-clock
  // cancellation guarantee for filesystem calls or an entire process tree.
  const checkpoint = () => { memoryCommandBudget(deadline, performance.now()) }
  const bounded = action => { checkpoint(); const value = action(); checkpoint(); return value }
  const run = args => {
    checkpoint()
    evidence.assertIdentity()
    const timeout = memoryCommandBudget(deadline, performance.now())
    const result = spawnSync('xcrun', ['xcresulttool', ...args], { timeout, killSignal: 'SIGKILL',
      maxBuffer: memoryCaps.json + 1, stdio: ['ignore', 'pipe', 'pipe'] })
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
    const bytes = run(args); bounded(() => evidence.write(name, bytes)); return bounded(() => json(bytes))
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
    run(['export', 'metrics', '--test-id', id, '--path', evidence.options.result, '--output-path', scratch])
    const csv = collectCSV(scratch, checkpoint)
    for (const file of csv) bounded(() => evidence.write('csv/' + file.name, file.bytes))
    // All bounded raw candidates are already retained before interpretation.
    const candidates = bounded(() => normalizeMemoryCandidates(summary, id))
    const csvValidation = bounded(() => validateMemoryCSV(csv, candidates))
    const contract = bounded(() => validateMemoryMetricSet(candidates))
    const result = { schema_version: 1, status: contract.status, accepted_measurements: null,
      metric_contract_accepted: false, product_performance_acceptance: false,
      scenario: memoryObservation.scenario, test_id: id, test_result: details.testResult,
      provenance, declared_metric_configuration: memoryObservation.metric_configuration,
      declared_recorded_iterations: 3, declared_discarded_warmup_invocations: 1,
      warmup_verification: { declared_block_invocations: 4, protocol_payload_verified: false,
        source_assertion_independently_verified: false,
        note: 'The consumer must join this passed case and typed three samples to the reviewed Swift four-invocation assertion; typed three alone do not prove warm-up.' },
      protocol_payload_verified: false, candidates, csv_validation: csvValidation,
      CSV_original_paths: csv.map(file => ({ file: 'csv/' + file.name, original_relative_path: file.original_relative_path })),
      legacy_references: refs, observed_devices: details.devices,
      limits: 'Unaccepted Debug iOS18.5 Simulator candidates including UI/AX and warm-cache effects; not cold launch, lifetime peak, Mac/test-runner RSS, physical-device safety or product SLO.' }
    bounded(() => evidence.write('commands.json', JSON.stringify(commands, null, 2) + '\n'))
    bounded(() => evidence.write('summary.json', JSON.stringify(result, null, 2) + '\n'))
    bounded(() => evidence.write('manifest.json', JSON.stringify({ schema_version: 1, files: evidence.manifest() }, null, 2) + '\n'))
    checkpoint()
    return result
  } catch (error) {
    // Failure diagnostics use the reserved byte allowance even after the work
    // deadline. They are bounded best effort, without another external command.
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
    console.log(JSON.stringify({ status: result.status, accepted_measurements: null, metric_contract_accepted: false }))
    process.exitCode = 2
  } catch (error) {
    console.error(JSON.stringify(failure(error)))
    process.exitCode = 1
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main()
