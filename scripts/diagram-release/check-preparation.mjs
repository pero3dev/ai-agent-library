import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { parseArgs, kitRoot, repoRoot, outputRoot, insideExisting, newChild } from './portable-paths.mjs'
import { runInferenceChecks, inference, SPECULATIVE_ORACLE, BATCH_ORACLE, samplingOracle } from './inference-checks.mjs'
import { foundations, runFoundationsChecks } from './foundations-checks.mjs'
import { training, trainingPath, trainingProfiles, TRAINING_ORACLE, runTrainingChecks } from './training-checks.mjs'
import { pretraining, pretrainingPath, pretrainingProfiles, runPretrainingChecks } from './pretraining-checks.mjs'
import { restoreC1ReleaseBodies, restoreC2ReleaseBodies, restoreD1CaseNames, restoreD1ReleaseBodies, restoreD2CaseNames } from './predecessor-proof.mjs'
import { alignment, alignmentPath, alignmentProfiles, ALIGNMENT_ORACLE, runAlignmentChecks } from './alignment-checks.mjs'
import { reasoning, reasoningPath, reasoningProfiles, REASONING_ORACLE, runReasoningChecks } from './reasoning-checks.mjs'
import { isKnownRootFavicon404 } from './known-site-observations.mjs'
const args = parseArgs(process.argv.slice(2), ['repo', 'output'])
if (args.help) { console.log('Offline: node check-preparation.mjs --output=<evidence-directory> [--repo=<repository-root; default cwd>]'); process.exit(0) }
const repo = await repoRoot(args.repo), output = await outputRoot(args.output, repo)
const hash = data => createHash('sha256').update(data).digest('hex')
const manifestText = await readFile(join(kitRoot, 'source-mapping.json'), 'utf8')
assert.ok(!manifestText.includes('\r'), 'The portable manifest must use LF line endings')
const manifest = JSON.parse(manifestText)
const files = []
for (const item of [...manifest.sourceFiles, ...manifest.addedFiles]) {
  let file
  if (item.location === 'repository') {
    assert.ok(['tests/unit/diagram-release-portable.test.mjs', 'website/tests/browser/alignment.spec.mjs', 'website/tests/browser/reasoning.spec.mjs'].includes(item.file), 'Only the fixed repository-owned tests may live outside the kit')
    file = await insideExisting(repo, join(repo, item.file))
  } else {
    assert.equal(item.location, undefined, 'Unknown manifest file location')
    assert.match(item.file, /^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Kit manifest files must be plain filenames')
    file = await insideExisting(kitRoot, join(kitRoot, item.file))
  }
  const body = await readFile(file)
  assert.ok(!body.includes(13), `Portable file must use LF line endings: ${item.file}`)
  assert.notEqual(body[0], 10, `Portable file must not start with an empty line: ${item.file}`)
  assert.ok(body.at(-1) === 10 && body.at(-2) !== 10, `Portable file must end with exactly one LF: ${item.file}`)
  assert.equal(hash(body), item.portableSHA256, `Portable file differs from manifest: ${item.file}`)
  if (manifest.byteIdenticalFiles.includes(item.file)) assert.equal(hash(body), item.sourceRawSHA256, `Reviewed fixture changed: ${item.file}`)
  if (manifest.normalizedSourceIdenticalFiles.includes(item.file)) assert.equal(hash(body), item.normalizedSourceSHA256, `Reviewed fixture differs after CRLF-to-LF normalization: ${item.file}`)
  if (item.sourceEdits) {
    let reviewedComparable = body.toString('utf8')
    for (const edit of item.reviewedSuccessor.sourceEdits || []) {
      assert.equal(reviewedComparable.split(edit.after).length - 1, 1, 'A declared reviewed-successor replacement must occur exactly once')
      assert.ok(!reviewedComparable.includes(edit.before), 'The reviewed successor statements remain unexpectedly')
      reviewedComparable = reviewedComparable.replace(edit.after, () => edit.before)
    }
    assert.equal(hash(reviewedComparable), item.reviewedSuccessor.normalizedSourceSHA256, `Reviewed successor differs beyond declared normalization edits: ${item.file}`)
    let comparable = body.toString('utf8')
    for (const edit of item.sourceEdits) {
      assert.equal(comparable.split(edit.after).length - 1, 1, 'A declared file replacement must occur exactly once')
      assert.ok(!comparable.includes(edit.before), 'The original file statements remain unexpectedly')
      comparable = comparable.replace(edit.after, () => edit.before)
    }
    assert.equal(hash(comparable), item.normalizedSourceSHA256, `Reviewed file changed beyond the declared source edits: ${item.file}`)
  }
  files.push({ file: item.file, bytes: body.length, sha256: hash(body) })
}
assert.equal(manifest.c2Revision.proofFile, 'c2-predecessor-proof.json', 'Use the fixed C2 sidecar only')
const proofPath = await insideExisting(kitRoot, join(kitRoot, manifest.c2Revision.proofFile))
const proof = JSON.parse(await readFile(proofPath, 'utf8'))
const currentBodies = Object.fromEntries(await Promise.all([...manifest.sourceFiles, ...manifest.addedFiles].filter(item => !item.location).map(async item => [item.file, await readFile(join(kitRoot, item.file), 'utf8')])))
assert.equal(manifest.d1Revision.proofFile, 'd1-predecessor-proof.json', 'Use the fixed D1 sidecar only')
const d1Proof = JSON.parse(await readFile(join(kitRoot, 'd1-predecessor-proof.json'), 'utf8'))
assert.equal(manifest.d2Revision.proofFile, 'd2-predecessor-proof.json')
const d2Proof = JSON.parse(await readFile(join(kitRoot, 'd2-predecessor-proof.json'), 'utf8'))
const d1Bodies = restoreD1ReleaseBodies(currentBodies, d2Proof)
const c2Bodies = restoreC2ReleaseBodies(d1Bodies, d1Proof)
const c1Bodies = restoreC1ReleaseBodies(c2Bodies, proof)
for (const segment of manifest.protectedSegments) {
  const body = c1Bodies[segment.file], start = body.indexOf(segment.start)
  const endMarker = segment.portableEnd || segment.end, end = endMarker ? body.indexOf(endMarker, start) : body.length
  assert.ok(start >= 0 && end > start, `Missing protected code: ${segment.file}`)
  let comparable = body.slice(start, end)
  if (segment.sourceEdits) {
    assert.equal(hash(comparable), segment.candidateSHA256, `Declared source-change candidate differs: ${segment.file}`)
    for (const edit of segment.sourceEdits) {
      assert.equal(comparable.split(edit.after).length - 1, 1, 'A declared replacement must occur exactly once')
      assert.ok(!comparable.includes(edit.before), 'The original statement remains unexpectedly')
      comparable = comparable.replace(edit.after, () => edit.before)
    }
  }
  assert.equal(hash(comparable), segment.normalizedSourceSHA256, `Reviewed check or identity body changed beyond the declared source edits: ${segment.file}: ${segment.start}`)
}
for (const predecessor of [...manifest.c1Revision.predecessorFiles, ...manifest.captureRevision.predecessorFiles]) {
  assert.ok(['verify-public.mjs', 'extract-ci-html.mjs', 'collect-deployment.ps1', 'training-checks.mjs', 'inference-checks.mjs'].includes(predecessor.file), 'Only fixed release files have predecessor comparisons')
  let comparable = c1Bodies[predecessor.file]
  for (const edit of predecessor.sourceEdits.toReversed()) {
    assert.equal(comparable.split(edit.after).length - 1, 1, 'A declared C1 replacement must occur exactly once')
    assert.ok(!comparable.includes(edit.before), 'The predecessor C1 statements remain unexpectedly')
    comparable = comparable.replace(edit.after, () => edit.before)
  }
  assert.equal(hash(comparable), predecessor.previousSHA256, `A release file changed beyond the declared additions: ${predecessor.file}`)
}
const names = [], foundationNames = [], trainingNames = [], pretrainingNames = [], alignmentNames = [], reasoningNames = []
await runInferenceChecks({ check: async name => names.push(name) })
await runFoundationsChecks({ check: async name => foundationNames.push(name) })
await runTrainingChecks({ check: async name => trainingNames.push(name) })
await runPretrainingChecks({ check: async name => pretrainingNames.push(name) })
await runAlignmentChecks({ check: async name => alignmentNames.push(name) })
await runReasoningChecks({ check: async name => reasoningNames.push(name) })
assert.equal(reasoningNames.length, 14); assert.equal(new Set(reasoningNames).size, 14)
assert.equal(reasoning.length, 2)
assert.equal(reasoning.reduce((sum, item) => sum + item.labels.length, 0), 9)
assert.equal(reasoning.reduce((sum, item) => sum + item.steps.length, 0), 8)
assert.deepEqual(reasoning.map(item => item.steps), [[0, 2, 3], [0, 1, 2, 3, 4]])
assert.equal(reasoningProfiles.length, 6)
assert.equal(reasoning.reduce((sum, item) => sum + item.controls.length, 0), 2)
assert.equal(reasoning.reduce((sum, item) => sum + item.controls.reduce((count, control) => count + control.options.length, 0), 0), 5)
assert.equal(REASONING_ORACLE.evaluation.settingGrid.observations, 30)
assert.equal(REASONING_ORACLE.evaluation.trials.length * REASONING_ORACLE.evaluation.metrics.length, 12)
assert.ok(REASONING_ORACLE.evaluation.metrics.every(item => item.value === null && item.unit === null && item.status === 'unmeasured'))
assert.equal(alignmentNames.length, 16); assert.equal(new Set(alignmentNames).size, 16)
assert.equal(alignment.length, 3)
assert.equal(alignment.reduce((sum, item) => sum + item.labels.length, 0), 15)
assert.equal(alignment.reduce((sum, item) => sum + item.steps.length, 0), 15)
assert.equal(alignmentProfiles.length, 6)
assert.equal(alignment.reduce((sum, item) => sum + item.controls.length, 0), 2)
assert.equal(alignment.reduce((sum, item) => sum + item.controls.reduce((count, control) => count + control.options.length, 0), 0), 5)
for (const [beta, values] of Object.entries(ALIGNMENT_ORACLE.dpo)) {
  const odds = 4 ** Number(beta)
  assert.ok(Math.abs(values.probability - odds / (1 + odds)) < 1e-12)
  assert.ok(Math.abs(values.loss + Math.log(values.probability)) < 1e-12)
  assert.ok(Math.abs(values.margin - Math.log(odds)) < 1e-12)
}
assert.equal(pretrainingNames.length, 20); assert.equal(new Set(pretrainingNames).size, 20)
assert.equal(pretraining.length, 5)
assert.equal(pretraining.reduce((sum, item) => sum + item.labels.length, 0), 23)
assert.equal(pretraining.reduce((sum, item) => sum + item.steps.length, 0), 19)
assert.equal(pretrainingProfiles.length, 6)
assert.equal(pretraining.reduce((sum, item) => sum + item.controls.length, 0), 11)
assert.equal(pretraining.reduce((sum, item) => sum + item.controls.reduce((count, control) => count + control.options.length, 0), 0), 31)
assert.equal(names.length, 14); assert.equal(new Set(names).size, 14)
assert.equal(foundationNames.length, 18); assert.equal(new Set(foundationNames).size, 18)
assert.equal(trainingNames.length, 13); assert.equal(new Set(trainingNames).size, 13)
assert.equal(inference.reduce((sum, item) => sum + item.labels.length, 0), 23)
assert.equal(training.reduce((sum, item) => sum + item.labels.length, 0), 10)
assert.equal(training.reduce((sum, item) => sum + item.steps.length, 0), 9)
assert.equal(trainingProfiles.length, 6)
assert.deepEqual(TRAINING_ORACLE.weights, { x: 240, y: 186, width: 160, height: 98 })
assert.deepEqual(TRAINING_ORACLE.runtimeNodes, ['model-candidate', 'permission-check', 'operation', 'result-verification'])
const runner = await readFile(join(kitRoot, 'verify-public.mjs'), 'utf8')
const extractor = await readFile(join(kitRoot, 'extract-ci-html.mjs'), 'utf8')
const collector = await readFile(join(kitRoot, 'collect-deployment.ps1'), 'utf8')
const quotedRoutes = block => [...block.matchAll(/^\s*'(\/docs\/[^']+)'[,]?$/gm)].map(match => match[1])
const extractorBlock = extractor.match(/const routes = \[\n([\s\S]*?)\n\]/)?.[1]
const collectorBlock = collector.match(/\$expectedRoutes = @\(\n([\s\S]*?)\n\)/)?.[1]
assert.ok(extractorBlock && collectorBlock, 'Missing fixed artifact route declarations')
assert.equal(runner.split('const artifactRoutes = [reasoningPath, alignmentPath, pretrainingPath, trainingPath, inferencePath, ...foundations.map(item => item.route), moePath, variantsPath, transformerPath]').length - 1, 1)
const runnerRoutes = [reasoningPath, alignmentPath, pretrainingPath, trainingPath, '/docs/llm-internals/inference-internals', ...foundations.map(item => item.route)]
for (const name of ['moePath', 'variantsPath', 'transformerPath']) {
  const match = runner.match(new RegExp(`const ${name} = '([^']+)'`))
  assert.ok(match, `Missing fixed runner route ${name}`); runnerRoutes.push(match[1])
}
for (const routes of [quotedRoutes(extractorBlock), quotedRoutes(collectorBlock), runnerRoutes]) {
  assert.equal(routes.length, 10); assert.equal(new Set(routes).size, 10)
  assert.deepEqual(routes.toSorted(), [...manifest.c1Revision.artifactRoutes, pretrainingPath, alignmentPath, reasoningPath].toSorted())
  assert.ok(!routes.includes('/docs/implementation/embeddings'))
}
// Execute only the registration statements. check records names and never runs
// a case callback; no Playwright import, launch, request or public audit occurs.
const declarationsStart = runner.indexOf('const variants = ['), declarationsEnd = runner.indexOf('const sceneMarkers =', declarationsStart)
const registrationStart = runner.indexOf('  await runFoundationsChecks('), registrationEnd = runner.indexOf('\n} catch (error) { report.fatalError', registrationStart)
assert.ok(declarationsStart >= 0 && declarationsEnd > declarationsStart && registrationStart >= 0 && registrationEnd > registrationStart)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const apiNames = ['usePage', 'open', 'structure', 'sceneDelivery', 'stage', 'phase', 'geometry', 'screenshot', 'rootOf', 'panelOf', 'expect']
const register = new AsyncFunction('check', 'runFoundationsChecks', 'runInferenceChecks', 'runTrainingChecks', 'runPretrainingChecks', 'runAlignmentChecks', 'runReasoningChecks', ...apiNames, runner.slice(declarationsStart, declarationsEnd) + '\n' + runner.slice(registrationStart, registrationEnd))
const runnerNames = []
await register(async name => runnerNames.push(name), runFoundationsChecks, runInferenceChecks, runTrainingChecks, runPretrainingChecks, runAlignmentChecks, runReasoningChecks, ...apiNames.map(() => undefined))
assert.equal(runnerNames.length, 121); assert.equal(new Set(runnerNames).size, 121)
assert.deepEqual(alignmentNames, manifest.d1Revision.addedCaseNames)
assert.deepEqual(reasoningNames, manifest.d2Revision.addedCaseNames)
const d1RunnerNames = restoreD2CaseNames(runnerNames, reasoningNames, d2Proof)
const oldRunnerNames = restoreD1CaseNames(d1RunnerNames, alignmentNames, d1Proof)
assert.deepEqual(oldRunnerNames.filter(name => !pretrainingNames.includes(name)), proof.priorCaseNames, 'All 71 prior case names must remain in order')
assert.deepEqual(runnerNames.filter(name => pretrainingNames.includes(name)), pretrainingNames)
assert.deepEqual(pretrainingNames, manifest.c2Revision.addedCaseNames)
assert.deepEqual(oldRunnerNames.filter(name => !trainingNames.includes(name) && !pretrainingNames.includes(name)), manifest.c1Revision.regressionBaseline.caseNames, 'All 58 prior case names must remain in order')
assert.deepEqual(runnerNames.filter(name => trainingNames.includes(name)), trainingNames)
assert.deepEqual(trainingNames, manifest.c1Revision.addedCaseNames)
assert.match(runner, /expectedCaseCount: 121,/)
const positive = values => values.every(p => p >= 0 && p <= 1) && Math.abs(values.reduce((a, b) => a + b, 0) - 1) < 1e-12
for (const fixture of SPECULATIVE_ORACLE) for (const key of ['p', 'q', 'exit']) assert.ok(positive(fixture[key]))
for (const fixture of SPECULATIVE_ORACLE) assert.equal(Math.min(1, fixture.p[fixture.token] / fixture.q[fixture.token]), fixture.alpha)
for (const mode of ['ordinary', 'continuous']) assert.equal(BATCH_ORACLE[mode].length, 8)
let fixtures = 0
for (const t of [.5, 1, 2]) for (const method of ['top-k', 'top-p']) for (const threshold of method === 'top-k' ? [1, 2, 4] : [.6, .8, 1]) for (const u of [.22, .62, .92]) {
  const value = samplingOracle(t, method, threshold, u)
  assert.ok(positive(value.probabilities)); assert.ok(positive(value.selected)); assert.ok(value.selected[value.token] > 0); fixtures++
}
assert.equal(fixtures, 54)
for (const icons of [undefined, [], [{ rel: 'icon', href: 'https://pero3dev.github.io/ai-agent-library/favicon.svg' }]]) assert.equal(isKnownRootFavicon404({ url: 'https://pero3dev.github.io/favicon.ico', text: 'Failed to load resource: the server responded with a status of 404 ()' }, icons), false)
const report = { evidenceClass: 'offline-preparation-only', networkExecuted: false, publicAuditExecuted: false, buildExecuted: false, independentReviewStatus: 'pending', priorCases: { total: 107, caseNamesPreserved: true, protectedBodiesRestored: true }, newCases: 14, totalCases: 121, reasoningStages: 9, reasoningReadStops: 8, reasoningScreenConditions: 6, alignmentStages: 15, alignmentReadStops: 15, alignmentScreenConditions: 6, pretrainingStages: 23, pretrainingReadStops: 19, pretrainingScreenConditions: 6, inferenceStages: 23, trainingStages: 10, trainingReadStops: 9, trainingScreenConditions: 6, artifactRoutes: [...manifest.c1Revision.artifactRoutes, pretrainingPath, alignmentPath, reasoningPath], samplingOracleSettings: fixtures, inferenceCaseNames: names, foundationsCaseNames: foundationNames, trainingCaseNames: trainingNames, pretrainingCaseNames: pretrainingNames, alignmentCaseNames: alignmentNames, reasoningCaseNames: reasoningNames, allCaseNames: runnerNames, mandatoryFavicon: '/ai-agent-library/favicon.svg', favicon404Exception: false, files }
const run = await newChild(output, 'preparation-' + new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'))
await writeFile(join(run, 'preparation.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
