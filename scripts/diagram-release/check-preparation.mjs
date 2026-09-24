import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { parseArgs, kitRoot, repoRoot, outputRoot, insideExisting, newChild } from './portable-paths.mjs'
import { runInferenceChecks, inference, SPECULATIVE_ORACLE, BATCH_ORACLE, samplingOracle } from './inference-checks.mjs'
import { foundations, runFoundationsChecks } from './foundations-checks.mjs'
import { training, trainingPath, trainingProfiles, TRAINING_ORACLE, runTrainingChecks } from './training-checks.mjs'
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
    assert.equal(item.file, 'tests/unit/diagram-release-portable.test.mjs', 'Only the fixed repository-owned test may live outside the kit')
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
for (const segment of manifest.protectedSegments) {
  const body = await readFile(join(kitRoot, segment.file), 'utf8'), start = body.indexOf(segment.start)
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
  let comparable = await readFile(join(kitRoot, predecessor.file), 'utf8')
  for (const edit of predecessor.sourceEdits.toReversed()) {
    assert.equal(comparable.split(edit.after).length - 1, 1, 'A declared C1 replacement must occur exactly once')
    assert.ok(!comparable.includes(edit.before), 'The predecessor C1 statements remain unexpectedly')
    comparable = comparable.replace(edit.after, () => edit.before)
  }
  assert.equal(hash(comparable), predecessor.previousSHA256, `A release file changed beyond the declared additions: ${predecessor.file}`)
}
const names = [], foundationNames = [], trainingNames = []
await runInferenceChecks({ check: async name => names.push(name) })
await runFoundationsChecks({ check: async name => foundationNames.push(name) })
await runTrainingChecks({ check: async name => trainingNames.push(name) })
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
assert.equal(runner.split('const artifactRoutes = [trainingPath, inferencePath, ...foundations.map(item => item.route), moePath, variantsPath, transformerPath]').length - 1, 1)
const runnerRoutes = [trainingPath, '/docs/llm-internals/inference-internals', ...foundations.map(item => item.route)]
for (const name of ['moePath', 'variantsPath', 'transformerPath']) {
  const match = runner.match(new RegExp(`const ${name} = '([^']+)'`))
  assert.ok(match, `Missing fixed runner route ${name}`); runnerRoutes.push(match[1])
}
for (const routes of [quotedRoutes(extractorBlock), quotedRoutes(collectorBlock), runnerRoutes]) {
  assert.equal(routes.length, 7); assert.equal(new Set(routes).size, 7)
  assert.deepEqual(routes.toSorted(), manifest.c1Revision.artifactRoutes.toSorted())
}
// Execute only the registration statements. check records names and never runs
// a case callback; no Playwright import, launch, request or public audit occurs.
const declarationsStart = runner.indexOf('const variants = ['), declarationsEnd = runner.indexOf('const sceneMarkers =', declarationsStart)
const registrationStart = runner.indexOf('  await runFoundationsChecks('), registrationEnd = runner.indexOf('\n} catch (error) { report.fatalError', registrationStart)
assert.ok(declarationsStart >= 0 && declarationsEnd > declarationsStart && registrationStart >= 0 && registrationEnd > registrationStart)
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const apiNames = ['usePage', 'open', 'structure', 'sceneDelivery', 'stage', 'phase', 'geometry', 'screenshot', 'rootOf', 'panelOf', 'expect']
const register = new AsyncFunction('check', 'runFoundationsChecks', 'runInferenceChecks', 'runTrainingChecks', ...apiNames, runner.slice(declarationsStart, declarationsEnd) + '\n' + runner.slice(registrationStart, registrationEnd))
const runnerNames = []
await register(async name => runnerNames.push(name), runFoundationsChecks, runInferenceChecks, runTrainingChecks, ...apiNames.map(() => undefined))
assert.equal(runnerNames.length, 71); assert.equal(new Set(runnerNames).size, 71)
assert.deepEqual(runnerNames.filter(name => !trainingNames.includes(name)), manifest.c1Revision.regressionBaseline.caseNames, 'All 58 prior case names must remain in order')
assert.deepEqual(runnerNames.filter(name => trainingNames.includes(name)), trainingNames)
assert.deepEqual(trainingNames, manifest.c1Revision.addedCaseNames)
assert.match(runner, /expectedCaseCount: 71,/)
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
const report = { evidenceClass: 'offline-preparation-only', networkExecuted: false, publicAuditExecuted: false, buildExecuted: false, independentReviewStatus: 'pending', priorCases: { total: 58, caseNamesPreserved: true, protectedBodiesRestored: true }, newCases: 13, totalCases: 71, inferenceStages: 23, trainingStages: 10, trainingReadStops: 9, trainingScreenConditions: 6, artifactRoutes: manifest.c1Revision.artifactRoutes, samplingOracleSettings: fixtures, inferenceCaseNames: names, foundationsCaseNames: foundationNames, trainingCaseNames: trainingNames, allCaseNames: runnerNames, mandatoryFavicon: '/ai-agent-library/favicon.svg', favicon404Exception: false, files }
const run = await newChild(output, 'preparation-' + new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'))
await writeFile(join(run, 'preparation.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
