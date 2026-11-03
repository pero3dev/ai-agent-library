import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { nativeSimulatorContract as C, main as productionMain, readPublishedSimulatorReady as productionReadPublishedReady } from '../../ios/tests/native-simulator-prepare.mjs'

const base = fileURLToPath(new URL('../../', import.meta.url))
const workflow = fs.readFileSync(path.join(base, '.github/workflows/ios-published-candidate.yml'), 'utf8')
// Run every ownership/context/receipt case on every host against the exact
// production helper body with a module-local simulated Darwin platform. This
// facade never changes global process.platform or grants real device authority.
// The unmodified production exports have separate actual-host checks below.
const helperSource = fs.readFileSync(path.join(base, 'ios/tests/native-simulator-prepare.mjs'), 'utf8')
assert.ok(helperSource.startsWith('#!/usr/bin/env node\n'))
const facadePrefix = "import ailibTestProcess from 'node:process'\n" +
  "const process = new Proxy(ailibTestProcess, { get(target, key) { return key === 'platform' ? 'darwin' : Reflect.get(target, key, target) } })\n"
const firstLineEnd = helperSource.indexOf('\n') + 1
const facadeSource = helperSource.slice(0, firstLineEnd) + facadePrefix + helperSource.slice(firstLineEnd)
assert.equal(facadeSource.slice(0, firstLineEnd) + facadeSource.slice(firstLineEnd + facadePrefix.length), helperSource)
const simulatedDarwinModuleURL = 'data:text/javascript;base64,' + Buffer.from(facadeSource).toString('base64')
const { main, readPublishedSimulatorReady } = await import(simulatedDarwinModuleURL)
const NEW = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', OLD = 'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB'
const source = '874bf651db44b879214267e0c08767e754b51a49', checkout = '0e001e930126187339d6c3d705bd2cf49c566dce'
const tree = '0bbcdf2de779d0748d6343696717493f84d2a863'
const hash = x => createHash('sha256').update(x).digest('hex')
function step(text, name) {
  const start = text.indexOf(`      - name: ${name}\n`); assert.ok(start >= 0)
  const next = text.indexOf('\n      - ', start + 1)
  return text.slice(start, next < 0 ? undefined : next)
}
const fixed = step(workflow, 'Prepare the fixed disjoint full UI slice')
const contractSource = fixed.match(/cat >[^\n]+<<'NODE'\n([\s\S]*?)\n          NODE/)[1].replace(/^          /gm, '')
const uiStep = step(workflow, 'Run functional native UI tests against the published app')
const uiBlocks = [...uiStep.matchAll(/<<'NODE'\n([\s\S]*?)\n          NODE/g)].map(m => m[1].replace(/^          /gm, ''))
assert.equal(uiBlocks.length, 2)
function callerModule(code, contract) {
  return code.replaceAll("'./ios/tests/native-simulator-prepare.mjs'", JSON.stringify(simulatedDarwinModuleURL))
    .replaceAll("'./ios/tests/clipboard-canary-seed.mjs'", JSON.stringify(pathToFileURL(path.join(base, 'ios/tests/clipboard-canary-seed.mjs')).href))
    .replaceAll("'./.local/ios-published-candidate/evidence/ui-slice-contract.mjs'", JSON.stringify(pathToFileURL(contract).href))
}
function result(value = '') {
  return { status: 0, signal: null, error: undefined, stdout: Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)), stderr: Buffer.alloc(0) }
}
// Every child command, including the CLI's Git identity, is stubbed. No Git,
// SDK, Simulator, xcodebuild or pasteboard process is spawned by these tests.
async function fixture(slice, body) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(base, '.published-owner-fixture-')))
  const originalSpawn = childProcess.spawnSync, originalLog = console.log, cwd = process.cwd(), previousEnv = { ...process.env }
  const calls = [], logs = []; let made = null, clipboard = Buffer.alloc(0), testTree = null
  const event = path.join(root, 'event.json'), output = path.join(root, 'output.txt')
  fs.writeFileSync(event, JSON.stringify({ repository: { full_name: C.repository, private: false }, pull_request: {
    head: { sha: source }, base: { repo: { full_name: C.repository } } } }))
  fs.writeFileSync(output, '')
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: C.repository, GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: event,
    GITHUB_SHA: checkout, EXPECTED_SOURCE_HEAD: source, GITHUB_JOB: 'ios-published-candidate', UI_SLICE: slice,
    GITHUB_RUN_ID: '12345', GITHUB_RUN_ATTEMPT: '2', DEVELOPER_DIR: C.developer, GITHUB_WORKSPACE: root, GITHUB_OUTPUT: output }
  childProcess.spawnSync = (binary, args, options) => {
    calls.push({ binary, args: [...args], options })
    if (binary === '/usr/bin/git') { assert.deepEqual(args, ['rev-parse', 'HEAD', 'HEAD^{tree}']); return result(checkout + '\n' + tree + '\n') }
    if (binary === '/usr/bin/xcodebuild') return result('Xcode 16.4\nBuild version 16F6\n')
    assert.ok(['/usr/bin/xcrun', 'xcrun'].includes(binary), 'Unexpected stub binary')
    if (args[0] === '--sdk') return result('18.5\n')
    if (args[0] === 'xcresulttool') { assert.ok(testTree); return result(testTree) }
    assert.equal(args[0], 'simctl')
    if (args[1] === 'list') {
      if (args[2] === 'runtimes') return result({ runtimes: [{ identifier: C.runtime, version: C.version, name: 'iOS 18.5', isAvailable: true }] })
      if (args[2] === 'devicetypes') return result({ devicetypes: [{ identifier: C.type, name: C.model }] })
      assert.equal(args[2], 'devices'); return result({ devices: { [C.runtime]: [
        { udid: OLD, name: 'iPhone 16', state: 'Booted', isAvailable: true, deviceTypeIdentifier: C.type }, ...(made ? [made] : [])] } })
    }
    if (args[1] === 'create') { assert.equal(made, null); made = { udid: NEW, name: args[2], state: 'Shutdown', isAvailable: true, deviceTypeIdentifier: C.type }; return result(NEW + '\n') }
    assert.equal(args[2], NEW, 'Every device operation must address the created UUID')
    if (args[1] === 'boot') { made.state = 'Booted'; return result() }
    if (args[1] === 'bootstatus') return result()
    if (args[1] === 'shutdown') { made.state = 'Shutdown'; return result() }
    if (args[1] === 'delete') { made = null; return result() }
    if (args[1] === 'pbcopy') { clipboard = Buffer.from(options.input); return result() }
    if (args[1] === 'pbpaste') return result(clipboard)
    throw new Error('Unexpected stub argv: ' + args.join(' '))
  }
  syncBuiltinESMExports(); console.log = line => logs.push(line)
  const receipts = path.join(root, `.local/ios-published-candidate/evidence/owned-simulator/${slice}`)
  const h = { root, env, calls, logs, receipts, get made() { return made },
    prepare: (entry = main) => { const ready = entry(['prepare'], env); const outputs = Object.fromEntries(fs.readFileSync(output, 'utf8').trim().split('\n').map(row => { const at = row.indexOf('='); return [row.slice(0, at), row.slice(at + 1)] }))
      env.AILIBRARY_PUBLISHED_OWNER_TOKEN = outputs.owner_token; env.AILIBRARY_PUBLISHED_CREATED_UUID = outputs.created_uuid
      env.AILIBRARY_PUBLISHED_DESTINATION = outputs.destination; return ready },
    read: () => readPublishedSimulatorReady(env), cleanup: extra => main(['cleanup'], { ...env, ...extra }),
    tamper: (name, mutate) => { const file = path.join(receipts, name + '.json'), value = JSON.parse(fs.readFileSync(file)); mutate(value); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n') },
    installEnv: () => { for (const key of Object.keys(process.env)) if (/^(GITHUB_|AILIBRARY_|UI_SLICE$|EXPECTED_SOURCE_HEAD$|DEVELOPER_DIR$|COPY_SIMULATOR_ID$)/.test(key)) delete process.env[key]; Object.assign(process.env, env); process.chdir(root) },
    clipboard: value => { clipboard = Buffer.from(value) }, testTree: value => { testTree = value } }
  try { await body(h) }
  finally { childProcess.spawnSync = originalSpawn; syncBuiltinESMExports(); console.log = originalLog; process.chdir(cwd)
    for (const key of Object.keys(process.env)) if (!Object.hasOwn(previousEnv, key)) delete process.env[key]
    Object.assign(process.env, previousEnv); fs.rmSync(root, { recursive: true }) }
}

// These two tests use the real unmodified exports, never the facade. Each
// host runs its applicable check and explicitly skips the other host's case.
test('production CLI rejects an actual non-Darwin host at the platform assertion before any command', {
  skip: process.platform === 'darwin' ? 'Requires an actual non-Darwin host; current host is Darwin' : false,
}, async () => fixture('reading-state', h => {
  const platformRefusal = error => error.code === 'ERR_ASSERTION' && error.actual === process.platform && error.expected === 'darwin'
  assert.throws(() => productionMain(['prepare'], h.env), platformRefusal)
  assert.throws(() => productionReadPublishedReady(h.env), platformRefusal)
  assert.equal(h.calls.length, 0, 'The platform refusal must precede Git, Xcode and Simulator commands')
  assert.equal(fs.existsSync(h.receipts), false)
}))
test('production CLI on an actual Darwin host prepares, reads and cleans with stubbed commands', {
  skip: process.platform !== 'darwin' ? 'Requires an actual Darwin host; every child command is still stubbed' : false,
}, async () => fixture('reading-state', h => {
  const ready = h.prepare(productionMain)
  assert.equal(productionReadPublishedReady(h.env).UUID, ready.UUID)
  assert.equal(productionMain(['cleanup'], h.env).ok, true)
  assert.equal(h.made, null)
}))

for (const slice of ['reading-state', 'content-copy']) {
  test(slice + ': simulated-Darwin CLI profile creates one unique owned UUID, verifies ready and cleans only that UUID', async () => fixture(slice, h => {
    const ready = h.prepare(), prefix = `AILibrary-published-${slice}-12345-2-`
    assert.equal(ready.UUID, NEW); assert.ok(ready.name.startsWith(prefix)); assert.equal(ready.context.job, 'ios-published-candidate')
    assert.equal(ready.context.profile, 'published'); assert.equal(ready.context.ui_slice, slice)
    assert.equal(h.read().destination, `platform=iOS Simulator,id=${NEW}`)
    const start = h.calls.length; assert.equal(main(['ready'], h.env).UUID, NEW)
    assert.equal(h.calls.length, start + 1); assert.equal(h.calls.at(-1).binary, '/usr/bin/git', 'Ready handoff is receipt-only after one Git proof')
    const cleanup = h.cleanup(); assert.equal(cleanup.ok, true); assert.equal(cleanup.absent_after, true)
    for (const command of ['create', 'boot', 'bootstatus', 'shutdown', 'delete']) assert.equal(h.calls.filter(x => x.args[1] === command).length, 1)
    assert.ok(h.calls.filter(x => ['shutdown', 'delete'].includes(x.args[1])).every(x => x.args[2] === NEW))
    assert.equal(h.made, null)
    for (const call of h.calls.filter(x => x.binary === '/usr/bin/git')) { assert.equal(call.options.timeout, 30000); assert.equal(call.options.maxBuffer, 4096) }
    assert.equal(h.calls.find(x => x.args[1] === 'bootstatus').options.timeout, 300000)
  }))
  test(slice + ': YAML environment bindings feed the simulated-Darwin prepare/ready/cleanup CLI without Native aliases', async () => fixture(slice, h => {
    const prepare = step(workflow, 'Prepare one fresh owned published Simulator')
    assert.match(prepare, /id: published_simulator\n\s+timeout-minutes: 9\n\s+run: node ios\/tests\/native-simulator-prepare\.mjs prepare/)
    for (const name of ['Prepare the fixed disjoint full UI slice', 'Run all native XCTest units on the iPhone Simulator',
      'Build the selected UI targets before the content-copy Debug audit', 'Run functional native UI tests against the published app']) {
      const caller = step(workflow, name)
      for (const [key, output] of [['OWNER_TOKEN', 'owner_token'], ['CREATED_UUID', 'created_uuid'], ['DESTINATION', 'destination']]) {
        assert.ok(caller.includes(`AILIBRARY_PUBLISHED_${key}: \${{ steps.published_simulator.outputs.${output} }}`))
      }
    }
    const ready = h.prepare(); assert.equal(main(['ready'], h.env).destination, ready.destination)
    assert.equal(h.cleanup().status, 'owned-simulator-deleted'); assert.equal(workflow.includes('AILIBRARY_NATIVE_'), false)
  }))
  test(slice + ': actual YAML clipboard callers use the simulated-Darwin owned ready UUID and preserve the exact canary/results contract', async () => fixture(slice, async h => {
    const ready = h.prepare(), evidence = path.join(h.root, '.local/ios-published-candidate/evidence'), contract = path.join(evidence, 'ui-slice-contract.mjs')
    fs.writeFileSync(contract, contractSource); const { caseIDsForSlice } = await import(pathToFileURL(contract).href)
    const ids = caseIDsForSlice(slice), owned = { context: ready.context, token: ready.token, UUID: ready.UUID }
    fs.writeFileSync(path.join(evidence, 'ui-selection.json'), JSON.stringify({ status: 'fixed-disjoint-full-UI-slice', slice,
      source_head: source, event_commit: checkout, expected_case_IDs: ids, contract_SHA256: hash(contractSource),
      destination: { id: NEW }, owned_simulator: owned, source_case_files: [] }))
    h.installEnv(); await import('data:text/javascript;base64,' + Buffer.from(callerModule(uiBlocks[0], contract)).toString('base64') + '#before')
    const binding = JSON.parse(fs.readFileSync(path.join(evidence, 'copy-device.json')))
    assert.equal(binding.UUID, NEW); assert.deepEqual(binding.owned_simulator, owned)
    assert.equal(h.calls.filter(x => x.args[1] === 'boot').length, 1, 'Caller cannot re-boot or choose an existing named device')
    assert.equal(h.calls.filter(x => x.args[1] === 'bootstatus').length, 1)
    process.env.COPY_SIMULATOR_ID = NEW
    const bundleURL = 'test://com.apple.xcode/AILibrary/AILibraryUITests'
    const suites = [...new Set(ids.map(id => id.split('/')[0]))].sort().map(name => ({ nodeType: 'Test Suite', name, result: 'Passed',
      nodeIdentifierURL: `${bundleURL}/${name}`, children: ids.filter(id => id.startsWith(name + '/')).map(id => ({
        nodeType: 'Test Case', name: id.split('/')[1], nodeIdentifier: id, nodeIdentifierURL: `${bundleURL}/${id.slice(0, -2)}`, result: 'Passed' })) }))
    h.testTree({ devices: [{ deviceId: NEW, osVersion: '18.5', platform: 'iOS Simulator', modelName: 'iPhone 16' }], testNodes: [
      { nodeType: 'Test Plan', name: 'AILibrary', result: 'Passed', children: [{ nodeType: 'UI test bundle', name: 'AILibraryUITests', result: 'Passed', nodeIdentifierURL: bundleURL, children: suites }] }] })
    const expected = fs.readFileSync(path.join(base, 'ios/fixtures/first-code-copy-expected.txt')); assert.equal(expected.length, 374)
    fs.mkdirSync(path.join(h.root, 'ios/fixtures'), { recursive: true }); fs.writeFileSync(path.join(h.root, 'ios/fixtures/first-code-copy-expected.txt'), expected)
    h.clipboard(expected); await import('data:text/javascript;base64,' + Buffer.from(callerModule(uiBlocks[1], contract)).toString('base64') + '#after')
    assert.equal(JSON.parse(fs.readFileSync(path.join(evidence, 'ui-slice-summary.json'))).selected_UI_passed, slice === 'reading-state' ? 18 : 8)
    if (slice === 'content-copy') { const copy = JSON.parse(fs.readFileSync(path.join(evidence, 'code-copy-summary.json'))); assert.equal(copy.status, 'exact-first-code-copy-passed'); assert.equal(copy.actual_bytes, 374) }
    assert.equal(h.cleanup().ok, true)
  }))
}

for (const [name, change, expected] of [
  ['unknown job', e => { e.GITHUB_JOB = 'other' }, /Unknown Simulator ownership profile/],
  ['missing slice', e => { delete e.UI_SLICE }, /Unknown published UI slice/],
  ['unknown slice', e => { e.UI_SLICE = 'other' }, /Unknown published UI slice/],
  ['path slice', e => { e.UI_SLICE = '../reading-state' }, /Unknown published UI slice/],
  ['Native source alias cannot substitute', e => { e.AILIBRARY_NATIVE_SOURCE_HEAD = source; delete e.EXPECTED_SOURCE_HEAD },
    error => error.code === 'ERR_ASSERTION' && error.actual === source && error.expected === undefined],
  ['source mismatch', e => { e.EXPECTED_SOURCE_HEAD = 'f'.repeat(40) },
    error => error.code === 'ERR_ASSERTION' && error.actual === source && error.expected === 'f'.repeat(40)],
  ['wrong developer', e => { e.DEVELOPER_DIR = '/other/Xcode' },
    error => error.code === 'ERR_ASSERTION' && error.actual === '/other/Xcode' && error.expected === C.developer],
]) test('simulated-Darwin CLI boundary before device operations: ' + name, async () => fixture('reading-state', h => {
  change(h.env); assert.throws(() => main(['prepare'], h.env), expected)
  assert.equal(h.calls.some(x => x.binary === '/usr/bin/xcrun'), false)
  assert.equal(h.calls.some(x => x.binary === '/usr/bin/xcodebuild'), false)
  assert.equal(h.calls.filter(x => x.binary === '/usr/bin/git').length, name === 'wrong developer' ? 1 : 0)
}))
for (const [name, change] of [
  ['wrong token', e => { e.AILIBRARY_PUBLISHED_OWNER_TOKEN = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }],
  ['wrong UUID', e => { e.AILIBRARY_PUBLISHED_CREATED_UUID = OLD }],
  ['Native aliases cannot grant published ownership', e => { e.AILIBRARY_NATIVE_OWNER_TOKEN = e.AILIBRARY_PUBLISHED_OWNER_TOKEN;
    e.AILIBRARY_NATIVE_CREATED_UUID = e.AILIBRARY_PUBLISHED_CREATED_UUID; delete e.AILIBRARY_PUBLISHED_OWNER_TOKEN; delete e.AILIBRARY_PUBLISHED_CREATED_UUID }],
  ['other slice', e => { e.UI_SLICE = 'content-copy' }], ['other attempt', e => { e.GITHUB_RUN_ATTEMPT = '3' }]
]) test('ready and cleanup reject mismatched external owner context: ' + name, async () => fixture('reading-state', h => {
  h.prepare(); change(h.env); const n = h.calls.length; assert.throws(h.read); assert.throws(() => h.cleanup())
  assert.equal(h.calls.slice(n).some(x => x.binary === '/usr/bin/xcrun'), false); assert.equal(h.made.udid, NEW)
}))
for (const [name, file, change] of [
  ['slice', 'ready', r => { r.context.ui_slice = 'content-copy' }], ['UUID', 'ready', r => { r.UUID = OLD }],
  ['destination', 'ready', r => { r.destination = `platform=iOS Simulator,id=${OLD}` }],
  ['name', 'ready', r => { r.name = 'iPhone 16' }], ['runtime', 'ready', r => { r.runtime_identifier = 'other' }],
  ['not booted', 'ready', r => { r.inventory.device.state = 'Shutdown' }],
  ['create failure', 'create', r => { r.status = 70 }], ['before exclusion', 'intent', r => { r.preexisting_UUIDs.push(NEW) }]
]) test('ready receipt disagreement grants no clipboard authority: ' + name, async () => fixture('reading-state', h => {
  h.prepare(); h.tamper(file, change); const n = h.calls.length; assert.throws(h.read)
  assert.equal(h.calls.length, n + 1); assert.equal(h.calls.at(-1).binary, '/usr/bin/git')
}))

test('YAML binds exactly three xcode destinations and preserves fixed roster/canary/Release/limits', async () => {
  assert.equal((workflow.match(/-destination "\$AILIBRARY_PUBLISHED_DESTINATION"/g) ?? []).length, 3)
  assert.equal(workflow.includes('name=iPhone 16'), false); assert.equal(workflow.includes("device.name === 'iPhone 16'"), false)
  assert.ok(workflow.includes('[[ "$AILIBRARY_PUBLISHED_DESTINATION" == "platform=iOS Simulator,id=$COPY_SIMULATOR_ID" ]]'))
  // The checkout contains the current contract, not a private previous-workflow
  // snapshot. Keep the independently fixed 26-case roster explicit here.
  const expectedSlices = {
    "reading-state": [
      "NativeReaderUITests/testContentsBookmarkAndResumeAfterRelaunch()",
      "NativeReaderUITests/testHealthyLegacyHeadingPositionAndBookmarkPersistAfterNativeResumeAndRelaunch()",
      "NativeReaderUITests/testThreeArticlesHaveNativeBodyText()",
      "PublishedReaderUITests/testBodySearchArrivesAtNestedParagraphContainingAllTermsWithoutReaderGestures()",
      "PublishedReaderUITests/testBundledContentSelectionCancelConfirmAndRestartKeepReadingAndGuide()",
      "PublishedReaderUITests/testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions()",
      "PublishedReaderUITests/testChapter03LongArticleContentsBookmarkAndResume()",
      "PublishedReaderUITests/testFilteredFixtureActionsAndReadingChangesRemainIsolatedFromNormalLibrary()",
      "PublishedReaderUITests/testFilteredMoreActionsAboutRoundTripPreservesQueryAndLearningTag()",
      "PublishedReaderUITests/testFixtureCrossArticleBodyLinkReturnsToMeasuredSourcePositionAndBookmark()",
      "PublishedReaderUITests/testFixtureTallSingleBlockResumesNearItsMeasuredInternalRowAfterRelaunch()",
      "PublishedReaderUITests/testResumeUsesLaterReadingPositionInsteadOfReplayingThePreviousBodyQuery()",
      "ReaderViewportGeometryTests/testCopiedFramesSelectLowestFullyVisibleParagraph()",
      "ReaderViewportGeometryTests/testEqualTopFramesPreserveCollectionOrder()",
      "ReaderViewportGeometryTests/testForegroundOcclusionAndPartialFrameRemainExcluded()",
      "ReaderViewportGeometryTests/testInvalidViewportAndEmptyCollectionFailClosed()",
      "ReaderViewportGeometryTests/testNonfiniteEmptyAndOccludedFramesCannotWin()",
      "ReaderViewportGeometryTests/testUnknownOrAmbiguousForegroundDoesNotBecomeVisible()"
    ],
    "content-copy": [
      "PublishedReaderUITests/testChapter03LargeDiagramCanExpandAndShowSource()",
      "PublishedReaderUITests/testChapter08LargestTableReachesFinalRowAndColumn()",
      "PublishedReaderUITests/testFixtureBodyLinksShowFragmentFilenameFarAndDuplicateWitnesses()",
      "PublishedReaderUITests/testFixtureFirstCodeCopyUsesThePublicButton()",
      "PublishedReaderUITests/testGlossarySearchRelatedArticleAndReturnPreserveReaderState()",
      "PublishedReaderUITests/testLearningRouteShowsItsInstructionChapterOrderAndArticle()",
      "PublishedReaderUITests/testLearningTagSearchCombinesWithArticleSearchAndClearsZeroResults()",
      "PublishedReaderUITests/testRelatedChapterLinkClosesInPlaceAndOpensAnArticleWithoutLosingTheReader()"
    ]
  }
  const { ORIGINAL_CASE_IDS, SLICE_CASE_IDS, caseIDsForSlice } = await import(
    'data:text/javascript;base64,' + Buffer.from(contractSource).toString('base64'))
  assert.deepEqual(Object.keys(SLICE_CASE_IDS).sort(), Object.keys(expectedSlices).sort())
  assert.deepEqual(ORIGINAL_CASE_IDS, Object.values(expectedSlices).flat().sort())
  for (const [slice, expected] of Object.entries(expectedSlices)) {
    assert.deepEqual(SLICE_CASE_IDS[slice], expected); assert.deepEqual(caseIDsForSlice(slice), expected)
  }
  for (const [marker, count] of [
    ['-destination-timeout 120', 3], ['-parallel-testing-enabled NO -jobs 2', 3], ['expected.length, 374', 1],
    ["'e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8'", 1],
    ["-destination 'generic/platform=iOS Simulator'", 1], ['runs-on: macos-15\n', 1],
  ]) assert.equal(workflow.split(marker).length - 1, count, marker)
  assert.ok(workflow.includes("timeout-minutes: ${{ matrix.slice == 'reading-state' && 95 || 70 }}"))
  const canary = uiBlocks[0].match(/\/\/ BEGIN CONTENT-COPY CANARY SEED RECOVERY[\s\S]*?\/\/ END CONTENT-COPY CANARY SEED RECOVERY/)[0]
  assert.equal((canary.match(/seedClipboardCanary\(UUID, canary, seed\)/g) ?? []).length, 1)
  assert.ok(canary.includes("run('seed', ['simctl', 'pbcopy', UUID], canary)"))
  assert.ok(uiBlocks[0].includes("assert.ok(observed.equals(canary), 'Device pasteboard must first return the exact unique canary bytes')"))
  assert.ok(uiBlocks[0].indexOf('readPublishedSimulatorReady()') < uiBlocks[0].indexOf("['simctl', 'pbpaste'"))
  assert.ok(uiBlocks[1].indexOf('binding.UUID, owned.UUID') < uiBlocks[1].indexOf("['simctl', 'pbpaste'"))
  const cleanup = step(workflow, 'Clean up only the proven owned published Simulator')
  assert.match(cleanup, /if: always\(\)\n\s+timeout-minutes: 3/)
  assert.ok(workflow.indexOf(cleanup) > workflow.indexOf("run('actual', ['simctl', 'pbpaste'"))
  const retain = step(workflow, 'Retain bounded published Simulator ownership receipts')
  assert.ok(workflow.indexOf(retain) > workflow.indexOf(cleanup)); assert.match(retain, /matrix.slice.*github.run_id.*github.run_attempt/)
  assert.ok(retain.includes('path: .local/ios-published-candidate/evidence/owned-simulator/${{ matrix.slice }}'))
})
