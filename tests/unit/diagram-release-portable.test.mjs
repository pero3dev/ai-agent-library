import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse } from 'node:path'
import { kitRoot, parseArgs, assertInside, repoRoot, canonicalProspective, outputRoot, insideExisting, newChild, lockedPlaywright } from '../../scripts/diagram-release/portable-paths.mjs'
import { assertRuntimeBoundary } from '../../scripts/diagram-release/training-checks.mjs'
import { assertLossObservation, assertRatioObservation, assertDataObservation, assertMetricsObservation, assertUnknownCosts, pretraining, runPretrainingChecks } from '../../scripts/diagram-release/pretraining-checks.mjs'
import { restoreC1ReleaseBodies, restoreC2ReleaseBodies, restoreD1CaseNames, restoreD1ReleaseBodies, restoreD2CaseNames } from '../../scripts/diagram-release/predecessor-proof.mjs'
import { alignment, runAlignmentChecks, assertPreferenceObservation, assertRiskObservation, assertFeedbackObservation } from '../../scripts/diagram-release/alignment-checks.mjs'
import { createLocalAlignmentAdapter, alignmentLocalCases } from '../../scripts/diagram-release/local-alignment-adapter.mjs'
import { reasoning, runReasoningChecks, assertSequenceObservation, assertEvaluationObservation } from '../../scripts/diagram-release/reasoning-checks.mjs'
import { createLocalReasoningAdapter, reasoningLocalCases } from '../../scripts/diagram-release/local-reasoning-adapter.mjs'
// Offline fixtures are isolated in OS temp, retained for failure diagnosis.
const fixture = await mkdtemp(join(tmpdir(), 'diagram-portability-test-'))
const repo = join(fixture, 'repository with spaces')
await mkdir(join(repo, '.github/workflows'), { recursive: true })
await mkdir(join(repo, 'website'), { recursive: true })
await writeFile(join(repo, 'AGENTS.md'), '# Test fixture only\n')
await writeFile(join(repo, '.github/workflows/ci.yml'), 'name: fixture\n')
await writeFile(join(repo, 'website/package.json'), JSON.stringify({ name: 'ai-agent-library-website', devDependencies: { '@playwright/test': '1.0.0' } }))
await writeFile(join(repo, 'website/package-lock.json'), JSON.stringify({ packages: { 'node_modules/@playwright/test': { version: '2.0.0' } } }))
const output = await outputRoot(join(fixture, 'evidence with spaces'), repo)
const run = (name, args) => spawnSync(process.execPath, [join(kitRoot, name), ...args], { encoding: 'utf8', windowsHide: true })
const bad = (result, message) => { assert.notEqual(result.status, 0); assert.match(result.stderr + result.stdout, message) }
test('every package file already uses LF and checkout normalization is idempotent', async () => {
  for (const name of await readdir(kitRoot)) {
    const bytes = await readFile(join(kitRoot, name))
    assert.ok(!bytes.includes(13), `CR byte remains in ${name}`)
    assert.ok(bytes.equals(Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'))), `LF normalization changes ${name}`)
  }
})
test('strict CLI rejects unknown, duplicate, empty and misused flags', () => {
  for (const args of [['--surprise=x'], ['--output=x', '--output=y'], ['--output='], ['--help=yes'], ['output=x'], ['--output']]) assert.throws(() => parseArgs(args, ['output']))
})
test('runner launches bundled Chromium by default and Edge only for explicit msedge', async () => {
  const source = await readFile(join(kitRoot, 'verify-public.mjs'), 'utf8')
  const validationStart = source.indexOf("const engine = args.browser || 'chromium'")
  const validationEnd = source.indexOf('const repo = await repoRoot(args.repo)', validationStart)
  assert.ok(validationStart >= 0 && validationEnd > validationStart)
  const launchLines = source.match(/^  browser = await playwright\[engine\]\.launch\([^\n]+\n  report\.browser = [^\n]+$/gm)
  assert.equal(launchLines?.length, 1, 'Identify the actual runner launch and report boundary')
  // Execute the runner's actual selection/launch statements with a launch stub.
  // No Playwright import, browser process, HTTP request or public case is run.
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const selectAndLaunch = new AsyncFunction('args', 'assert', 'playwright', 'report', source.slice(validationStart, validationEnd) + '\nlet browser\n' + launchLines[0])
  for (const [args, engine, options, channel] of [
    [{}, 'chromium', { headless: true }, null],
    [{ browser: 'chromium' }, 'chromium', { headless: true }, null],
    [{ browser: 'chromium', channel: 'msedge' }, 'chromium', { headless: true, channel: 'msedge' }, 'msedge'],
    [{ browser: 'webkit' }, 'webkit', { headless: true }, null]
  ]) {
    const calls = [], report = {}
    const stub = Object.fromEntries(['chromium', 'webkit'].map(name => [name, { launch: async actual => { calls.push({ engine: name, options: actual }); return { version: () => 'offline-stub' } } }]))
    await selectAndLaunch(args, assert, stub, report)
    assert.deepEqual(calls, [{ engine, options }])
    assert.deepEqual(report.browser, { engine, channel, version: 'offline-stub' })
  }
  for (const [args, message] of [
    [{ browser: 'webkit', channel: 'msedge' }, /Chromium-only/],
    [{ browser: 'chromium', channel: 'chrome' }, /optional msedge/],
    [{ browser: 'firefox' }, /Unsupported browser/]
  ]) {
    let launched = false
    const stub = new Proxy({}, { get: () => { launched = true; throw Error('Unexpected launch attempt') } })
    await assert.rejects(selectAndLaunch(args, assert, stub, {}), message)
    assert.equal(launched, false)
  }
})
test('explicit repo and paths with spaces work; wrong cwd fails', async () => {
  assert.equal(await repoRoot(repo), repo); await assert.rejects(repoRoot(fixture))
})
test('output cannot be repo, repo child, kit child or filesystem root', async () => {
  for (const path of [repo, join(repo, 'logs'), join(kitRoot, 'logs'), parse(repo).root]) await assert.rejects(outputRoot(path, repo))
})
test('canonical prospective paths protect Windows short-name ancestors before mkdir', async () => {
  assert.equal(await canonicalProspective(join(repo, 'not-created', 'nested')), join(repo, 'not-created', 'nested'))
  if (process.platform !== 'win32') return
  const command = '$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFolder($env:DIAGRAM_TEST_REPO).ShortPath'
  const result = spawnSync('pwsh', ['-NoProfile', '-Command', command], { encoding: 'utf8', windowsHide: true, env: { ...process.env, DIAGRAM_TEST_REPO: repo } })
  assert.equal(result.status, 0, result.stderr)
  const shortPath = result.stdout.trim()
  assert.ok(shortPath.length > 0)
  await assert.rejects(outputRoot(shortPath, repo, false), /outside the repository/)
  await assert.rejects(outputRoot(join(shortPath, 'not-created', 'nested'), repo), /outside the repository/)
  await assert.rejects(readFile(join(repo, 'not-created')), { code: 'ENOENT' })
})
test('prefix siblings and parent traversal are outside output', () => {
  assert.throws(() => assertInside(output, output + '-sibling/file')); assert.throws(() => assertInside(output, join(output, '..', 'escaped'))); assert.throws(() => assertInside(output, output))
})
test('child names cannot escape or overwrite an earlier run', async () => {
  for (const name of ['../escape', '..', 'x/y', 'x\\y', '/absolute']) await assert.rejects(newChild(output, name))
  await newChild(output, 'one-run'); await assert.rejects(newChild(output, 'one-run'), { code: 'EEXIST' })
})
test('existing evidence must be a regular descendant file', async () => {
  const file = join(output, 'evidence.json'); await writeFile(file, '{}'); assert.equal(await insideExisting(output, file), file)
  for (const path of [repo, output, join(output, 'one-run')]) await assert.rejects(insideExisting(output, path))
})
test('junction escape is rejected before creating nested output', async () => {
  const target = join(fixture, 'outside'); await mkdir(target)
  const link = join(output, 'junction'); await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(insideExisting(output, link, 'directory'), /Symlink\/junction/)
  await assert.rejects(outputRoot(join(link, 'nested'), repo), /Symlink\/junction/)
  await assert.rejects(readFile(join(target, 'nested')), { code: 'ENOENT' })
})
test('Playwright lock mismatch fails before require', async () => { await assert.rejects(lockedPlaywright(repo), /lockfile must agree/) })
test('Playwright runtime chain rejects parent fallback and both dependency version mismatches', async () => {
  for (const scenario of ['valid', 'wrong-playwright', 'wrong-core', 'parent-playwright', 'parent-core']) {
    const depRepo = join(fixture, 'dependencies-' + scenario), website = join(depRepo, 'website')
    await mkdir(website, { recursive: true })
    const versions = Object.fromEntries(['@playwright/test', 'playwright', 'playwright-core'].map(name => ['node_modules/' + name, { version: '1.0.0' }]))
    await writeFile(join(website, 'package.json'), JSON.stringify({ devDependencies: { '@playwright/test': '1.0.0' } }))
    await writeFile(join(website, 'package-lock.json'), JSON.stringify({ packages: versions }))
    for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
      const fallback = scenario === 'parent-playwright' && name === 'playwright' || scenario === 'parent-core' && name === 'playwright-core'
      const directory = join(fallback ? depRepo : website, 'node_modules', name)
      await mkdir(directory, { recursive: true })
      const wrong = scenario === 'wrong-playwright' && name === 'playwright' || scenario === 'wrong-core' && name === 'playwright-core'
      await writeFile(join(directory, 'package.json'), JSON.stringify({ name, version: wrong ? '2.0.0' : '1.0.0', main: 'index.cjs' }))
      await writeFile(join(directory, 'index.cjs'), name === '@playwright/test' ? "module.exports = require('playwright/test')" : 'module.exports = { fixture: true }')
      if (name === 'playwright') await writeFile(join(directory, 'test.js'), "module.exports = require('playwright-core')")
    }
    if (scenario === 'valid') assert.equal((await lockedPlaywright(depRepo)).fixture, true)
    else await assert.rejects(lockedPlaywright(depRepo), scenario.startsWith('parent-') ? /inside the explicit output/ : /differs from website lockfile/)
  }
})
test('runner rejects unconfirmed release and zero SHA before browser/network', () => {
  bad(run('verify-public.mjs', []), /After confirmed Pages deployment/)
  bad(run('verify-public.mjs', ['--release-confirmed', '--deployed-sha=' + '0'.repeat(40), '--expected-build-id=x', '--artifact-evidence=x']), /After confirmed Pages deployment/)
  bad(run('verify-public.mjs', ['--release-confirmed=false']), /Invalid value/)
})
test('extractor rejects outside archive before invoking tar', () => { bad(run('extract-ci-html.mjs', [`--repo=${repo}`, `--output=${output}`, `--archive=${join(repo, 'AGENTS.md')}`]), /inside the explicit output/) })
test('runner rejects wrong evidence identity before Playwright loading', async () => {
  const evidence = join(output, 'wrong-identity.json'); await writeFile(evidence, JSON.stringify({ schemaVersion: 1, evidenceClass: 'fabricated' }))
  bad(run('verify-public.mjs', [`--repo=${repo}`, `--output=${output}`, '--release-confirmed', '--deployed-sha=' + 'a'.repeat(40), '--expected-build-id=x', `--artifact-evidence=${evidence}`]), /github-actions-pages-artifact/)
})
test('help needs no repository, dependency or network', () => {
  for (const name of ['verify-public.mjs', 'extract-ci-html.mjs', 'check-preparation.mjs', 'portable-paths.mjs']) assert.equal(run(name, ['--help']).status, 0, name)
})
test('PowerShell collector help and malformed options fail before external calls', () => {
  const invoke = args => spawnSync('pwsh', ['-NoProfile', '-File', join(kitRoot, 'collect-deployment.ps1'), ...args], { encoding: 'utf8', windowsHide: true })
  assert.equal(invoke(['-Help']).status, 0)
  assert.notEqual(invoke(['-Help', '-UnknownOption']).status, 0)
  bad(invoke([]), /Explicit release confirmation/)
})
test('synthetic tar extraction keeps ten identities and rejects missing, duplicate or mixed-build articles', async () => {
  const members = ['llm-internals/inference-internals', 'llm-foundations/how-llms-generate-text', 'llm-foundations/tokenization', 'llm-internals/mixture-of-experts-internals', 'llm-internals/attention-variants-and-long-context', 'llm-internals/transformer-architecture', 'llm-foundations/llm-training-pipeline', 'llm-internals/pretraining-and-scaling-laws', 'llm-internals/alignment-theory', 'llm-foundations/reasoning-models']
  const input = join(fixture, 'synthetic-pages')
  for (const member of members) {
    const file = join(input, 'docs', member + '.html')
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, '<!DOCTYPE html><html><body>' + 'fixture only '.repeat(12) + '<script>{"b":"synthetic-build"}</script></body></html>')
  }
  const archive = join(output, 'synthetic.tar')
  const makeArchive = (entries = ['docs']) => {
    const result = spawnSync('tar', ['-cf', archive, '-C', input, ...entries], { encoding: 'utf8', windowsHide: true })
    assert.equal(result.status, 0, result.stderr)
  }
  const args = [`--repo=${repo}`, `--output=${output}`, `--archive=${archive}`]
  makeArchive()
  const successful = run('extract-ci-html.mjs', args)
  assert.equal(successful.status, 0, successful.stderr)
  const report = JSON.parse(successful.stdout)
  assert.equal(report.documents.length, 10); assert.equal(report.expectedBuildId, 'synthetic-build')
  assert.deepEqual(report.documents.map(item => item.route), members.map(member => '/docs/' + member))
  assert.equal(report.portableReferences.documents.length, 10)
  for (const selected of [members.slice(0, 9), members.slice(1)]) {
    makeArchive(selected.map(member => 'docs/' + member + '.html'))
    bad(run('extract-ci-html.mjs', args), /Expected one unambiguous HTML member/)
  }
  makeArchive()
  const duplicate = spawnSync('tar', ['-rf', archive, '-C', input, 'docs/' + members.at(-1) + '.html'], { encoding: 'utf8', windowsHide: true })
  assert.equal(duplicate.status, 0, duplicate.stderr)
  bad(run('extract-ci-html.mjs', args), /Expected one unambiguous HTML member/)
  await writeFile(join(input, 'docs', members[0] + '.html'), '<!DOCTYPE html><html><body>' + 'fixture only '.repeat(12) + '<script>{"b":"different-build"}</script></body></html>')
  makeArchive()
  bad(run('extract-ci-html.mjs', args), /different builds/)
})
test('training runtime fixture rejects model-owned permission, bypasses and reordered verification', () => {
  const nodes = [
    { id: 'model-candidate', owner: 'model' }, { id: 'permission-check', owner: 'outside-model' },
    { id: 'operation', owner: 'outside-model' }, { id: 'result-verification', owner: 'outside-model' }
  ]
  const edges = [
    ['model-candidate', 'permission-check', 'candidate-only'],
    ['permission-check', 'operation', 'only-if-authorized'],
    ['operation', 'result-verification', 'check-result']
  ]
  assert.doesNotThrow(() => assertRuntimeBoundary(nodes, edges))
  assert.throws(() => assertRuntimeBoundary(nodes.map(node => node.id === 'permission-check' ? { ...node, owner: 'model' } : node), edges), /outside the model/)
  assert.throws(() => assertRuntimeBoundary(nodes, [['model-candidate', 'operation', 'candidate-only'], ...edges.slice(1)]), /permission checking/)
  assert.throws(() => assertRuntimeBoundary(nodes, edges.toReversed()), /permission checking/)
  assert.throws(() => assertRuntimeBoundary(nodes.filter(node => node.id !== 'result-verification'), edges), /outside the model/)
})
test('C2 loss validator rejects arithmetic PPL, altered prefixes, probability and loss', () => {
  const value = { rows: [
    { id: 'eval-0', token: 'A', prefix: [], probabilities: [.5, .25, .125, .125], probability: .5, loss: Math.log(2) },
    { id: 'eval-1', token: 'B', prefix: ['A'], probabilities: [.25, .25, .25, .25], probability: .25, loss: Math.log(4) },
    { id: 'eval-2', token: 'C', prefix: ['A', 'B'], probabilities: [.375, .25, .125, .25], probability: .125, loss: Math.log(8) }
  ], loss: Math.log(4), ppl: 4 }
  assert.doesNotThrow(() => assertLossObservation(value, 'A'))
  for (const mutate of [v => { v.ppl = 24 / 7 }, v => { v.rows[1].prefix = [] }, v => { v.rows[2].probability = .5 }, v => { v.loss = Math.log(2) }, v => { v.rows[0].probabilities[1] = .5 }]) {
    const bad = structuredClone(value); mutate(bad); assert.throws(() => assertLossObservation(bad, 'A'))
  }
})
test('C2 compute validator rejects sums, false fixed budgets and numeric unknown costs', () => {
  for (const [n, d, c] of [[1, 1, 1], [1, 2, 2], [2, 1, 2], [2, 2, 4], [.5, 2, 1], [2, .5, 1]]) assert.doesNotThrow(() => assertRatioObservation({ n, d, c }, { n, d, c }))
  assert.throws(() => assertRatioObservation({ n: 1, d: 1, c: 2 }, { n: 1, d: 1, c: 1 }))
  assert.throws(() => assertRatioObservation({ n: 2, d: 2, c: 1 }, { n: 2, d: 2, c: 1 }), /product/)
  assert.throws(() => assertRatioObservation({ n: NaN, d: 1, c: NaN }, { n: NaN, d: 1, c: NaN }))
  assert.doesNotThrow(() => assertUnknownCosts({ duration: null, price: null, energy: null }))
  assert.throws(() => assertUnknownCosts({ duration: 0, price: null, energy: null }), /never zero/)
})
test('C2 data validator rejects repeated occurrence IDs, wrong source counts and invented scores', () => {
  const value = {
    documents: ['A', 'B', 'C', 'D'].map(id => ({ id, positions: [id + '0', id + '1'] })),
    reads: ['A', 'B', 'C', 'D', 'A', 'B'].map((document, at) => ({ id: `read-${at}`, document, positions: [0, 1].map(position => ({ id: `read-${at}-${document}${position}`, source: `${document}${position}` })) })),
    counts: { reads: 6, documents: 4, occurrences: 12, positions: 8 }, vocabulary: null, quality: null, effect: null
  }
  assert.doesNotThrow(() => assertDataObservation(value))
  for (const mutate of [v => { v.reads[4].id = v.reads[0].id }, v => { v.reads[4].positions[0].id = v.reads[0].positions[0].id }, v => { v.counts.positions = 12 }, v => { v.vocabulary = 8 }, v => { v.quality = 100 }, v => { v.reads[4].document = 'C' }]) {
    const bad = structuredClone(value); mutate(bad); assert.throws(() => assertDataObservation(bad))
  }
})
test('C2 metric validator rejects strict greater-than, changed outputs and empirical judgments', () => {
  const base = { ids: ['A', 'B', 'C', 'D', 'E', 'F'], scores: [30, 40, 50, 60, 70, 80], denominator: 100, empirical: false, judgment: null }
  for (const [threshold, passes] of [[50, [0, 0, 1, 1, 1, 1]], [60, [0, 0, 0, 1, 1, 1]], [70, [0, 0, 0, 0, 1, 1]]]) assert.doesNotThrow(() => assertMetricsObservation({ ...base, passes }, threshold))
  const value = { ...base, passes: [0, 0, 0, 1, 1, 1] }
  for (const mutate of [v => { v.passes[3] = 0 }, v => { v.scores[0] = 50 }, v => { v.ids.reverse() }, v => { v.empirical = true }, v => { v.judgment = 'emergence' }]) {
    const bad = structuredClone(value); mutate(bad); assert.throws(() => assertMetricsObservation(bad, 60))
  }
})
test('C2 registers exactly 20 unique cases without executing callbacks', async () => {
  const names = []; await runPretrainingChecks({ check: async name => names.push(name) })
  assert.equal(names.length, 20); assert.equal(new Set(names).size, 20)
  assert.equal(pretraining.reduce((sum, item) => sum + item.labels.length, 0), 23)
  assert.equal(pretraining.reduce((sum, item) => sum + item.steps.length, 0), 19)
})
test('C2 predecessor proof rejects undeclared assertions, missing or duplicate edits and reordered old cases', async () => {
  const proof = JSON.parse(await readFile(join(kitRoot, 'c2-predecessor-proof.json'), 'utf8'))
  const files = await readdir(kitRoot)
  const d2 = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(join(kitRoot, file), 'utf8')])))
  const d1 = restoreD1ReleaseBodies(d2, JSON.parse(d2['d2-predecessor-proof.json']))
  const d1Proof = JSON.parse(await readFile(join(kitRoot, 'd1-predecessor-proof.json'), 'utf8'))
  const current = restoreC2ReleaseBodies(d1, d1Proof)
  assert.doesNotThrow(() => restoreC1ReleaseBodies(current, proof))
  assert.throws(() => restoreC1ReleaseBodies({ ...current, 'verify-public.mjs': current['verify-public.mjs'].replace("assert.deepEqual(unwanted, [], 'scene code from another article was delivered')", "assert.ok(true)") }, proof), /beyond declared/)
  const edit = proof.predecessorFiles[0].sourceEdits[0]
  for (const body of [current['extract-ci-html.mjs'].replace(edit.after, ''), current['extract-ci-html.mjs'] + edit.after]) assert.throws(() => restoreC1ReleaseBodies({ ...current, 'extract-ci-html.mjs': body }, proof), /exactly once/)
  for (const mutate of [p => { p.predecessorFiles[0].previousSHA256 = '0'.repeat(64) }, p => { p.predecessorFiles[0].file = '../extract-ci-html.mjs' }, p => { p.priorCaseNames.reverse() }, p => { p.priorCaseNames.pop() }, p => { p.priorCaseNames[0] += ' renamed' }]) {
    const bad = structuredClone(proof); mutate(bad); assert.throws(() => restoreC1ReleaseBodies(current, bad))
  }
  assert.throws(() => restoreC1ReleaseBodies({ ...current, 'training-checks.mjs': current['training-checks.mjs'] + '// undeclared\n' }, proof), /unchanged regression/)
})

test('D1 fixtures reject changed distributions, cancelled different-input terms, fabricated KL and pair-average confusion', () => {
  const fixture = (beta, stage = 6) => ({
    stage, fullKL: 'unknown', aggregation: 'expectation',
    rows: [
      { id: 'y-w', input: 'x-0', p: .5, q: .25, ratio: 2, logRatio: Math.log(2), weighted: beta * Math.log(2) },
      { id: 'y-l', input: 'x-0', p: .125, q: .25, ratio: .5, logRatio: -Math.log(2), weighted: -beta * Math.log(2) }
    ],
    normalizers: [0, 1].map(() => ({ id: 'z-x-0', input: 'x-0', cancelled: String(stage === 6) })),
    margin: Math.log(4 ** beta), probability: 4 ** beta / (1 + 4 ** beta), loss: Math.log(1 + 1 / 4 ** beta)
  })
  for (const beta of [.5, 1, 2]) for (const stage of [5, 6]) assert.doesNotThrow(() => assertPreferenceObservation(fixture(beta, stage), beta))
  for (const mutate of [v => { v.rows[0].p = .6 }, v => { v.rows[0].q = .2 }, v => { v.rows[0].ratio = 3 }, v => { v.rows[1].weighted = 0 }, v => { v.rows[1].input = 'x-1' }, v => { v.normalizers[1].input = 'x-1' }, v => { v.normalizers.pop() }, v => { v.normalizers[1].cancelled = 'false' }, v => { v.fullKL = 0 }, v => { v.margin = 0 }, v => { v.probability = .75 }, v => { v.loss = .8 }, v => { v.aggregation = 'single-pair' }]) {
    const bad = fixture(1); mutate(bad); assert.throws(() => assertPreferenceObservation(bad, 1))
  }
  assert.throws(() => assertPreferenceObservation(fixture(1), 3), /three fixed/)
})

test('D1 qualitative fixtures preserve shared output, both mitigations and orthogonal evaluation axes', () => {
  const risk = { stage: 2, output: 'answer-0', lanes: [{ id: 'proxy', value: 'unknown' }, { id: 'quality', value: 'unknown' }], guarantee: 'false', constraint: 'kl', reassessment: 'true', suppressionGuarantee: 'false' }
  assert.doesNotThrow(() => assertRiskObservation(risk))
  assert.doesNotThrow(() => assertRiskObservation({ ...risk, stage: 1, symptoms: ['verbosity', 'appearance'] }))
  for (const mutate of [v => { v.output = 'answer-1' }, v => { v.lanes[1].value = 0 }, v => { v.guarantee = 'true' }, v => { v.reassessment = 'false' }, v => { v.constraint = null }, v => { v.suppressionGuarantee = 'true' }]) {
    const bad = structuredClone(risk); mutate(bad); assert.throws(() => assertRiskObservation(bad))
  }
  assert.throws(() => assertRiskObservation({ ...risk, stage: 1, symptoms: ['verbosity'] }))
  const scope = { stage: 2, harmlessness: 'false', universality: 'false', answer: 'answer-0', axes: ['source', 'granularity'], sources: ['verifier', 'learned-reward-model'], granularities: ['process', 'outcome'], relation: 'orthogonal', caveat: 'true' }
  assert.doesNotThrow(() => assertFeedbackObservation(scope))
  for (const mutate of [v => { v.harmlessness = 'true' }, v => { v.universality = 'true' }, v => { v.axes.reverse() }, v => { v.sources.pop() }, v => { v.relation = 'subtype' }, v => { v.caveat = 'false' }]) {
    const bad = structuredClone(scope); mutate(bad); assert.throws(() => assertFeedbackObservation(bad))
  }
  const locations = { ...scope, stage: 1, marks: [{ granularity: 'outcome', target: 'final' }, ...['step-1', 'step-2', 'step-3'].map(target => ({ granularity: 'process', target }))] }
  assert.doesNotThrow(() => assertFeedbackObservation(locations))
  assert.throws(() => assertFeedbackObservation({ ...locations, marks: locations.marks.slice(0, 3) }))
  assert.throws(() => assertFeedbackObservation({ ...locations, marks: locations.marks.map((mark, i) => i === 0 ? { ...mark, target: 'step-1' } : mark) }))
  for (const selected of ['human', 'ai']) {
    const labels = { ...scope, stage: 4, selected, labels: ['human', 'ai'].map(id => ({ id, emphasized: String(id === selected) })), target: 'preference-data', labelGuarantee: 'false' }
    assert.doesNotThrow(() => assertFeedbackObservation(labels))
    assert.throws(() => assertFeedbackObservation({ ...labels, target: 'model-output' }))
    assert.throws(() => assertFeedbackObservation({ ...labels, labelGuarantee: 'true' }))
  }
})

test('D1 registers the approved 16 callbacks and local adapter rejects non-loopback without opening a browser', async () => {
  const cases = await alignmentLocalCases(), names = []
  await runAlignmentChecks({ check: async name => names.push(name) })
  assert.deepEqual(cases.map(item => item.name), names)
  assert.equal(names.length, 16); assert.equal(new Set(names).size, 16)
  assert.equal(alignment.reduce((n, item) => n + item.labels.length, 0), 15)
  assert.equal(alignment.reduce((n, item) => n + item.steps.length, 0), 15)
  const options = { browser: null, expect: null, outputPath: () => '', report: { evidenceClass: 'localhost-static-export-browser' } }
  for (const baseURL of ['http://127.0.0.1:4183', 'http://localhost:4183', 'http://[::1]:4183']) assert.doesNotThrow(() => createLocalAlignmentAdapter({ ...options, baseURL }))
  for (const baseURL of ['https://pero3dev.github.io', 'http://example.com', 'https://localhost:4183', 'http://localhost:4183/remote']) assert.throws(() => createLocalAlignmentAdapter({ ...options, baseURL }))
  assert.throws(() => createLocalAlignmentAdapter({ ...options, baseURL: 'http://localhost:4183', basePath: '/../foo' }))
})

test('D1 flat proof protects all old bodies/helper and reverses only one explicit control migration', async () => {
  const proof = JSON.parse(await readFile(join(kitRoot, 'd1-predecessor-proof.json'), 'utf8'))
  const d2 = Object.fromEntries(await Promise.all((await readdir(kitRoot)).map(async file => [file, await readFile(join(kitRoot, file), 'utf8')])))
  const current = restoreD1ReleaseBodies(d2, JSON.parse(d2['d2-predecessor-proof.json']))
  assert.doesNotThrow(() => restoreC2ReleaseBodies(current, proof))
  const restored = restoreC2ReleaseBodies(current, proof)
  assert.doesNotThrow(() => restoreC1ReleaseBodies(restored, JSON.parse(current['c2-predecessor-proof.json'])))
  assert.throws(() => restoreC2ReleaseBodies({ ...current, 'verify-public.mjs': current['verify-public.mjs'].replace("assert.deepEqual(unwanted, [], 'scene code from another article was delivered')", 'assert.ok(true)') }, proof), /beyond declared/)
  for (const file of ['pretraining-checks.mjs', 'c2-predecessor-proof.json', 'predecessor-proof.mjs']) assert.throws(() => restoreC2ReleaseBodies({ ...current, [file]: '// changed\n' + current[file] }, proof))
  const edit = proof.predecessorFiles[0].sourceEdits[0]
  for (const body of [current['extract-ci-html.mjs'].replace(edit.after, ''), current['extract-ci-html.mjs'] + edit.after]) assert.throws(() => restoreC2ReleaseBodies({ ...current, 'extract-ci-html.mjs': body }, proof), /exactly once/)
  for (const mutate of [p => { p.predecessorFiles[0].file = '../extract-ci-html.mjs' }, p => { p.predecessorFiles[0].previousSHA256 = '0'.repeat(64) }, p => { p.priorCaseNames.reverse() }, p => { p.controlMigration.newRoute = '/docs/other' }, p => { p.predecessorManifestSHA256 = '0'.repeat(64) }]) {
    const bad = structuredClone(proof); mutate(bad); assert.throws(() => restoreC2ReleaseBodies(current, bad))
  }
  const names = []; await runAlignmentChecks({ check: async name => names.push(name) })
  const all = [...proof.priorCaseNames]; all.splice(65, 0, ...names); all[all.indexOf(proof.controlMigration.oldName)] = proof.controlMigration.newName
  assert.deepEqual(restoreD1CaseNames(all, names, proof), proof.priorCaseNames)
  for (const mutate of [n => n.reverse(), n => { n[0] = proof.controlMigration.newName }, n => { n[n.indexOf(proof.controlMigration.newName)] = proof.controlMigration.oldName }, n => { [n[0], n[1]] = [n[1], n[0]] }, n => n.splice(65, 1)]) {
    const bad = [...all]; mutate(bad); assert.throws(() => restoreD1CaseNames(bad, names, proof))
  }
})

test('D1 synthetic tar rejects a link at the required ninth article instead of following it', async () => {
  const members = ['llm-internals/inference-internals', 'llm-foundations/how-llms-generate-text', 'llm-foundations/tokenization', 'llm-internals/mixture-of-experts-internals', 'llm-internals/attention-variants-and-long-context', 'llm-internals/transformer-architecture', 'llm-foundations/llm-training-pipeline', 'llm-internals/pretraining-and-scaling-laws', 'llm-internals/alignment-theory']
  const chunks = []
  for (const [index, member] of members.entries()) {
    const link = index === 8, data = link ? Buffer.alloc(0) : Buffer.from('<!DOCTYPE html><html><body>' + 'fixture '.repeat(20) + '<script>{"b":"synthetic-build"}</script></body></html>')
    const header = Buffer.alloc(512)
    header.write('docs/' + member + '.html', 0, 100); header.write('0000644\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116)
    header.write(data.length.toString(8).padStart(11, '0') + '\0', 124); header.write('00000000000\0', 136); header.fill(32, 148, 156); header[156] = link ? 50 : 48
    if (link) header.write('docs/' + members[0] + '.html', 157, 100)
    header.write('ustar\0', 257); header.write('00', 263)
    header.write(header.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0') + '\0 ', 148)
    chunks.push(header, data, Buffer.alloc((512 - data.length % 512) % 512))
  }
  chunks.push(Buffer.alloc(1024))
  const archive = join(output, 'linked-ninth.tar'); await writeFile(archive, Buffer.concat(chunks))
  bad(run('extract-ci-html.mjs', [`--repo=${repo}`, `--output=${output}`, `--archive=${archive}`]), /Not one regular file/)
})

test('D2 synthetic tar rejects a link at the required tenth article instead of following it', async () => {
  const members = ['llm-internals/inference-internals', 'llm-foundations/how-llms-generate-text', 'llm-foundations/tokenization', 'llm-internals/mixture-of-experts-internals', 'llm-internals/attention-variants-and-long-context', 'llm-internals/transformer-architecture', 'llm-foundations/llm-training-pipeline', 'llm-internals/pretraining-and-scaling-laws', 'llm-internals/alignment-theory', 'llm-foundations/reasoning-models']
  const chunks = []
  for (const [index, member] of members.entries()) {
    const link = index === 9, data = link ? Buffer.alloc(0) : Buffer.from('<!DOCTYPE html><html><body>' + 'fixture '.repeat(20) + '<script>{"b":"synthetic-build"}</script></body></html>')
    const header = Buffer.alloc(512)
    header.write('docs/' + member + '.html', 0, 100); header.write('0000644\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116)
    header.write(data.length.toString(8).padStart(11, '0') + '\0', 124); header.write('00000000000\0', 136); header.fill(32, 148, 156); header[156] = link ? 50 : 48
    if (link) header.write('docs/' + members[0] + '.html', 157, 100)
    header.write('ustar\0', 257); header.write('00', 263)
    header.write(header.reduce((a, b) => a + b, 0).toString(8).padStart(6, '0') + '\0 ', 148)
    chunks.push(header, data, Buffer.alloc((512 - data.length % 512) % 512))
  }
  chunks.push(Buffer.alloc(1024))
  const archive = join(output, 'linked-tenth.tar'); await writeFile(archive, Buffer.concat(chunks))
  bad(run('extract-ci-html.mjs', [`--repo=${repo}`, `--output=${output}`, `--archive=${archive}`]), /Not one regular file/)
})

test('D2 flat proof retains all 107 prior callbacks and detects missing edits, changed helpers and reordered names', async () => {
  const current = Object.fromEntries(await Promise.all((await readdir(kitRoot)).map(async file => [file, await readFile(join(kitRoot, file), 'utf8')])))
  const proof = JSON.parse(current['d2-predecessor-proof.json'])
  const restored = restoreD1ReleaseBodies(current, proof)
  assert.doesNotThrow(() => restoreC2ReleaseBodies(restored, JSON.parse(current['d1-predecessor-proof.json'])))
  assert.throws(() => restoreD1ReleaseBodies({ ...current, 'verify-public.mjs': current['verify-public.mjs'].replace("assert.deepEqual(unwanted, [], 'scene code from another article was delivered')", 'assert.ok(true)') }, proof), /beyond declared/)
  const weakenedProof = structuredClone(proof)
  const oldGuard = "assert.deepEqual(unwanted, [], 'scene code from another article was delivered')"
  weakenedProof.predecessorFiles.find(item => item.file === 'verify-public.mjs').sourceEdits.push({ before: oldGuard, after: 'assert.ok(true)' })
  assert.throws(() => restoreD1ReleaseBodies({ ...current, 'verify-public.mjs': current['verify-public.mjs'].replace(oldGuard, 'assert.ok(true)') }, weakenedProof), /reversal contract/)
  const changedModule = current['alignment-checks.mjs'].replace("assert.equal(value.guarantee, 'false', 'No quality guarantee')", 'assert.ok(true)')
  assert.notEqual(changedModule, current['alignment-checks.mjs'])
  const changedInventory = structuredClone(proof)
  changedInventory.historicalFiles.find(item => item.file === 'alignment-checks.mjs').sha256 = createHash('sha256').update(changedModule).digest('hex')
  assert.throws(() => restoreD1ReleaseBodies({ ...current, 'alignment-checks.mjs': changedModule }, changedInventory), /reversal contract/)
  for (const file of ['alignment-checks.mjs', 'pretraining-checks.mjs', 'd1-predecessor-proof.json', 'predecessor-proof.mjs']) assert.throws(() => restoreD1ReleaseBodies({ ...current, [file]: '// altered\n' + current[file] }, proof))
  const edit = proof.predecessorFiles[0].sourceEdits[0]
  for (const body of [current['extract-ci-html.mjs'].replace(edit.after, ''), current['extract-ci-html.mjs'] + edit.after]) assert.throws(() => restoreD1ReleaseBodies({ ...current, 'extract-ci-html.mjs': body }, proof), /exactly once/)
  for (const mutate of [p => { p.predecessorFiles[0].file = '../extract-ci-html.mjs' }, p => { p.predecessorFiles[0].previousSHA256 = '0'.repeat(64) }, p => p.priorCaseNames.reverse(), p => { p.predecessorManifestSHA256 = '0'.repeat(64) }]) {
    const badProof = structuredClone(proof); mutate(badProof); assert.throws(() => restoreD1ReleaseBodies(current, badProof))
  }
  const names = []; await runReasoningChecks({ check: async name => names.push(name) })
  const all = [...proof.priorCaseNames]; all.splice(81, 0, ...names)
  assert.deepEqual(restoreD2CaseNames(all, names, proof), proof.priorCaseNames)
  const splitBlock = [...all]
  const oldCase = splitBlock.splice(95, 1)[0]
  splitBlock.splice(83, 0, oldCase)
  assert.throws(() => restoreD2CaseNames(splitBlock, names, proof), /consecutive block/)
  for (const mutate of [n => n.reverse(), n => n.splice(81, 1), n => { [n[0], n[1]] = [n[1], n[0]] }, n => { n[81] = n[0] }]) {
    const invalid = [...all]; mutate(invalid); assert.throws(() => restoreD2CaseNames(invalid, names, proof))
  }
})

test('D2 local adapter uses the same fourteen callbacks and preserves the localhost boundary', async () => {
  const cases = await reasoningLocalCases(), names = []
  await runReasoningChecks({ check: async name => names.push(name) })
  assert.deepEqual(cases.map(item => item.name), names); assert.equal(names.length, 14)
  assert.equal(reasoning.reduce((sum, item) => sum + item.labels.length, 0), 9)
  assert.deepEqual(reasoning.map(item => item.steps), [[0, 2, 3], [0, 1, 2, 3, 4]])
  const options = { browser: null, expect: null, outputPath: () => '', report: { evidenceClass: 'localhost-static-export-browser' } }
  for (const baseURL of ['http://localhost:4183', 'http://127.0.0.1:4183', 'http://[::1]:4183']) assert.doesNotThrow(() => createLocalReasoningAdapter({ ...options, baseURL }))
  for (const baseURL of ['https://localhost:4183', 'http://example.com', 'http://localhost:4183/remote']) assert.throws(() => createLocalReasoningAdapter({ ...options, baseURL }))
  for (const extraSceneMarkers of [null, {}, [0], ['']]) assert.throws(() => createLocalAlignmentAdapter({ ...options, baseURL: 'http://localhost:4183', extraSceneMarkers }))
})

const sequenceObservation = stage => {
  const nodeTexts = [
    { id: 'input', text: '入力' }, { id: 'reasoning-region', text: '推論の模式領域' },
    { id: 'prior-symbols', text: '既生成' }, { id: 'next-prediction', text: '後続予測' },
    { id: 'final-answer', text: stage === 3 ? '最終回答' : '最終回答 未展開' }, { id: 'runtime-model', text: '推論時の重みは固定' },
    ...(stage === 2 ? [{ id: 'training-adjustment', text: '学習・推論処理の調整 CoT 指示だけとは限らない' }] : [])
  ]
  const caveatTexts = [{ id: 'not-private-thought', text: '記号は模式表示。実際の思考内容ではない' },
    ...(stage === 2 ? [{ id: 'reasoning-not-guaranteed', text: '検証の正しさは保証されない' }] : []),
    ...(stage === 3 ? [{ id: 'not-billing-formula', text: '比率・実費は示さない' }] : [])]
  return {
    stage, weights: 'fixed', content: 'not-reproduced', costEstimate: 'none', answerExpanded: String(stage === 3), nodes: nodeTexts.map(item => item.id), nodeTexts,
    edges: [{ source: 'prior-symbols', target: 'next-prediction', meaning: 'conditions-following-prediction' }, { source: 'next-prediction', target: 'final-answer', meaning: 'answer-after-reasoning' },
      ...(stage === 2 ? [{ source: 'training-adjustment', target: 'runtime-model', meaning: 'training-and-inference-configuration' }] : [])],
    bands: stage === 3 ? [{ id: 'reasoning', measured: 'false' }, { id: 'answer', measured: 'false' }] : [],
    bandTexts: stage === 3 ? [{ id: 'reasoning', text: '推論' }, { id: 'answer', text: '最終回答' }] : [],
    caveats: caveatTexts.map(item => item.id), caveatTexts,
    visibleText: [...nodeTexts.map(item => item.text), ...caveatTexts.map(item => item.text), '既生成の内容 → 後続予測の条件',
      stage < 3 ? '通常モデルも中間の考察を書ける' : '推論にも時間・費用がかかる', stage < 2 ? '記号の個数・長さはトークン数ではない' : ''].join(' ')
  }
}
test('D2 sequence oracle rejects missing visible meaning, reversed conditioning and invented measurements', () => {
  for (let stage = 0; stage < 4; stage++) assert.doesNotThrow(() => assertSequenceObservation(sequenceObservation(stage)))
  for (const mutate of [v => { v.stage = 4 }, v => { v.weights = 'updated' }, v => { v.content = 'actual-thought' }, v => { v.costEstimate = '12' }, v => { v.nodes = v.nodes.filter(id => id !== 'prior-symbols') }, v => { v.nodes.push('unknown') }, v => { v.edges[0].target = 'final-answer' }, v => { v.caveats = [] }, v => { v.visibleText = '' }, v => { v.answerExpanded = 'true' }]) {
    const value = sequenceObservation(2); mutate(value); assert.throws(() => assertSequenceObservation(value))
  }
  const measured = sequenceObservation(3); measured.bands[0].measured = 'true'; assert.throws(() => assertSequenceObservation(measured))
  for (const [stage, mutate] of [
    [0, v => { v.nodeTexts[2].text = '未来の入力' }], [0, v => { v.visibleText = v.visibleText.replace('既生成の内容 → 後続予測の条件', '後続予測 → 既生成の条件') }],
    [0, v => { v.visibleText = v.visibleText.replace('通常モデルも中間の考察を書ける', '通常モデルは考察を書けない') }],
    [1, v => { v.visibleText = v.visibleText.replace('記号の個数・長さはトークン数ではない', '記号は実トークン数') }],
    [1, v => { v.caveatTexts[0].text = '実際の思考内容である' }],
    [2, v => { v.nodeTexts.find(item => item.id === 'runtime-model').text = '推論中に重みを更新' }],
    [2, v => { v.nodeTexts.find(item => item.id === 'training-adjustment').text = 'CoT 指示だけで推論モデルになる' }],
    [2, v => { v.caveatTexts.find(item => item.id === 'reasoning-not-guaranteed').text = '検証の正しさは保証される' }],
    [2, v => { v.edges = v.edges.filter(item => item.meaning !== 'training-and-inference-configuration') }],
    [3, v => { v.nodeTexts.find(item => item.id === 'final-answer').text = '推論内容' }],
    [3, v => { v.bandTexts[0].text = '回答のみの費用' }], [3, v => { v.visibleText = v.visibleText.replace('推論にも時間・費用がかかる', '推論は無料') }],
    [3, v => { v.caveatTexts.find(item => item.id === 'not-billing-formula').text = '比率・実費を示す' }]
  ]) { const value = sequenceObservation(stage); mutate(value); assert.throws(() => assertSequenceObservation(value)) }
  for (let stage = 0; stage < 4; stage++) for (const key of ['nodeTexts', 'caveatTexts']) {
    const value = sequenceObservation(stage); value[key] = []; assert.throws(() => assertSequenceObservation(value))
  }
})

const metricObservation = (id, stage = 0) => ({ id, status: 'unmeasured', value: null, unit: null, text: stage === 4 ? '未計測' : ({ quality: '品質', cost: '費用', latency: '待ち時間' }[id] + ' 未計測') })
const evaluationObservation = (stage, taskFocus = 'multi-step', effortFocus = 'lower') => {
  const caveatTexts = [
    [{ id: 'no-auto-choice', text: '各欄は別タスク。表だけで採否を決めない' }],
    [{ id: 'provider-specific', text: '名称・仕様はモデル別' }],
    [{ id: 'benefit-not-guaranteed', text: '追加便益が小さい場合もある' }, { id: 'effort-not-permission', text: '曖昧な要件・権限制御は別に見直す' }],
    [{ id: 'effort-not-permission', text: '安全条件は実行側でも強制' }],
    [{ id: 'thought-not-cause', text: '見える思考から原因を断定しない' }]
  ][stage]
  const stageText = [
    '改善を評価する候補 低めとの比較が必要な候補 同じ実入力で設定を比較',
    '品質・費用・待ち時間は未計測',
    'すべての簡単な問いで悪化するわけではない',
    '必須手順を保ち、探索は境界内で 思考指示の効果はモデル別に比較',
    '同条件で複数回 品質・費用・待ち時間を同時に記録 設定内は同条件／設定間は思考量だけ変更 A/B は空の見本。推奨回数ではない 思考は非公開・要約のみの場合もある'
  ][stage]
  const candidateTexts = [
    ['多段の数学・計画 複雑なデバッグ', '事実検索 定型の抽出・分類'],
    ['正しさを 検証できる問題', '低遅延の対話 大量処理'],
    ['制約が多い 慎重な判断', '参照・手順が 定型化された問い']
  ]
  return {
    stage, taskFocus: stage === 0 ? taskFocus : 'none', effortFocus: [1, 2].includes(stage) ? effortFocus : 'none', measurement: 'unmeasured', decision: 'none',
    comparison: { input: 'same-input', model: 'same-model' }, comparisonText: stage === 0 ? '同じ実入力で設定を比較' : '同じ入力・モデル・指示・評価基準',
    variants: stage <= 2 ? ['lower', 'higher'].map(id => ({ id, emphasized: String([1, 2].includes(stage) && id === effortFocus), text: id === 'lower' ? '低めの思考量' : '高めの思考量', metrics: stage ? ['quality', 'cost', 'latency'].map(id => metricObservation(id, stage)) : [] })) : [],
    rows: stage === 0 ? ['multi-step', 'verifiable', 'constraints'].map((id, row) => ({ id, emphasized: String(id === taskFocus), candidates: ['improvement', 'lower-comparison'], candidateTexts: ['improvement', 'lower-comparison'].map((id, column) => ({ id, text: candidateTexts[row][column] })) })) : [],
    metrics: stage === 3 ? [] : Array.from({ length: stage === 4 ? 4 : stage === 0 ? 1 : 2 }, () => ['quality', 'cost', 'latency'].map(id => metricObservation(id, stage))).flat(),
    requiredConditions: ['goal', 'constraints', 'approval', 'evidence-check', 'business-rules'],
    requiredConditionTexts: ['goal', 'constraints', 'approval', 'evidence-check', 'business-rules'].map((id, index) => ({ id, text: ['目標', '制約', '承認', '根拠確認', '業務規程'][index] })),
    executionBoundary: 'outside-model', executionBoundaryText: 'モデル外の実行コード 安全条件は実行側でも強制', exploration: 'within-boundary', explorationText: '探索の余地 探索 必須手順を保ち、探索は境界内で',
    explorationBounds: { boundary: { x: 24, y: 130, width: 592, height: 150 }, token: { x: 210, y: 185, width: 130, height: 43 } },
    extraWork: stage === 2, extraWorkText: stage === 2 ? '追加の作業（模式）' : '',
    trials: stage === 4 ? ['lower-a', 'lower-b', 'higher-a', 'higher-b'].map((id, index) => ({ id, effort: id.split('-')[0], inputId: 'same-input', conditionId: id.split('-')[0] + '-settings', metrics: ['quality', 'cost', 'latency'], text: `${index < 2 ? '低め' : '高め'} ${index % 2 ? 'B' : 'A'} 未計測 未計測 未計測` })) : [],
    caveats: caveatTexts.map(item => item.id), caveatTexts, visibleText: [...caveatTexts.map(item => item.text), stageText].join(' ')
  }
}
test('D2 evaluation oracle rejects measurements, task conflation, active settings outside their stages and missing boundary', () => {
  for (const taskFocus of ['multi-step', 'verifiable', 'constraints']) for (const effortFocus of ['lower', 'higher']) for (let stage = 0; stage < 5; stage++) assert.doesNotThrow(() => assertEvaluationObservation(evaluationObservation(stage, taskFocus, effortFocus), { taskFocus, effortFocus }))
  for (const [stage, mutate] of [
    [0, v => { v.comparison.input = 'different-input' }], [0, v => { v.rows[0].candidates.pop() }], [0, v => { v.decision = 'higher' }],
    [1, v => { v.taskFocus = 'multi-step' }], [1, v => { v.metrics[0].value = 0 }], [1, v => { v.metrics[0].unit = 'seconds' }], [1, v => { v.variants[0].emphasized = 'false' }],
    [2, v => { v.extraWork = false }], [2, v => { v.caveats = [] }], [3, v => { v.executionBoundary = 'model' }], [3, v => { v.requiredConditions.pop() }],
    [4, v => { v.trials[0].conditionId = 'higher-settings' }], [4, v => { v.trials[0].inputId = 'different-input' }], [4, v => { v.metrics.pop() }], [4, v => { v.trials[0].metrics.pop() }]
  ]) { const value = evaluationObservation(stage); mutate(value); assert.throws(() => assertEvaluationObservation(value)) }
  for (const [stage, mutate] of [
    [0, v => { v.caveatTexts[0].text = '各欄は同じタスク。表だけで採否を決める' }],
    [0, v => { v.rows[0].candidateTexts[0].text = '' }], [0, v => { v.rows[0].candidateTexts[0].text = v.rows[0].candidateTexts[1].text }],
    [0, v => { v.rows[2].candidateTexts[1].text = '制約が多い慎重な判断' }], [0, v => { v.comparisonText = '異なる実入力で設定を比較' }],
    [0, v => { v.visibleText = v.visibleText.replace('改善を評価する候補', '必ず改善するタスク') }],
    [1, v => { v.variants[0].text = '高めの思考量' }], [1, v => { v.variants[1].metrics = [] }],
    [1, v => { v.metrics = v.metrics.slice(0, 3) }], [1, v => { v.variants[0].metrics[0].text = '品質は確実に向上' }],
    [1, v => { v.caveatTexts[0].text = '名称・仕様は全モデル共通' }], [1, v => { v.comparisonText = '異なる入力・モデル・指示・評価基準' }],
    [1, v => { v.visibleText = v.visibleText.replace('品質・費用・待ち時間は未計測', '品質だけを測る') }],
    [2, v => { v.caveatTexts[0].text = '追加便益は必ず大きい' }], [2, v => { v.caveatTexts[1].text = '思考量を増やせば権限制御は不要' }],
    [2, v => { v.visibleText = v.visibleText.replace('すべての簡単な問いで悪化するわけではない', 'すべての簡単な問いで悪化する') }],
    [2, v => { v.extraWorkText = '費用が2倍' }], [2, v => { v.variants[0].metrics.pop() }],
    [3, v => { v.executionBoundaryText = '安全条件はモデルだけが強制' }], [3, v => { v.requiredConditionTexts[2].text = '承認は省略' }],
    [3, v => { v.explorationText = '必須手順を省き、探索は境界外へ' }], [3, v => { v.caveatTexts[0].text = '安全条件は実行側で強制しない' }],
    [3, v => { v.visibleText = v.visibleText.replace('思考指示の効果はモデル別に比較', '全モデルで思考指示が必須') }],
    [3, v => { v.explorationBounds.token.x = 22 }], [3, v => { v.explorationBounds.token.y = 128 }],
    [3, v => { v.explorationBounds.token.x = 488 }], [3, v => { v.explorationBounds.token.y = 239 }],
    [3, v => { v.explorationBounds.token.width = 0 }], [3, v => { v.explorationBounds.boundary.x = NaN }],
    [4, v => { v.trials[2].text = '低め A 未計測 未計測 未計測' }], [4, v => { v.comparisonText = '' }],
    [4, v => { v.visibleText = v.visibleText.replace('設定内は同条件／設定間は思考量だけ変更', '毎回モデルと指示も変更') }],
    [4, v => { v.visibleText = v.visibleText.replace('推奨回数ではない', '推奨回数である') }],
    [4, v => { v.visibleText = v.visibleText.replace('思考は非公開・要約のみの場合もある', '全モデルで生の思考が見える') }],
    [4, v => { v.caveatTexts[0].text = '見える思考から原因を断定する' }]
  ]) { const value = evaluationObservation(stage); mutate(value); assert.throws(() => assertEvaluationObservation(value), `stage ${stage}: visible meaning/geometry mutation must fail`) }
  for (let stage = 0; stage < 5; stage++) {
    const empty = evaluationObservation(stage); empty.caveatTexts = []; assert.throws(() => assertEvaluationObservation(empty))
  }
  for (let row = 0; row < 3; row++) for (let column = 0; column < 2; column++) {
    const value = evaluationObservation(0); value.rows[row].candidateTexts[column].text = ''; assert.throws(() => assertEvaluationObservation(value))
  }
  const rounded = evaluationObservation(3); rounded.explorationBounds.token.x = 23.5; rounded.explorationBounds.token.y = 129.5
  assert.doesNotThrow(() => assertEvaluationObservation(rounded), 'Subpixel rectangle rounding within 1px is tolerated')
})
