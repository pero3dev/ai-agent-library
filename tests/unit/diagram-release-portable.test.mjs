import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse } from 'node:path'
import { kitRoot, parseArgs, assertInside, repoRoot, canonicalProspective, outputRoot, insideExisting, newChild, lockedPlaywright } from '../../scripts/diagram-release/portable-paths.mjs'
import { assertRuntimeBoundary } from '../../scripts/diagram-release/training-checks.mjs'
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
test('synthetic tar extraction keeps seven identities and rejects missing, duplicate or mixed-build articles', async () => {
  const members = ['llm-internals/inference-internals', 'llm-foundations/how-llms-generate-text', 'llm-foundations/tokenization', 'llm-internals/mixture-of-experts-internals', 'llm-internals/attention-variants-and-long-context', 'llm-internals/transformer-architecture', 'llm-foundations/llm-training-pipeline']
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
  assert.equal(report.documents.length, 7); assert.equal(report.expectedBuildId, 'synthetic-build')
  assert.deepEqual(report.documents.map(item => item.route), members.map(member => '/docs/' + member))
  assert.equal(report.portableReferences.documents.length, 7)
  makeArchive(members.slice(0, 6).map(member => 'docs/' + member + '.html'))
  bad(run('extract-ci-html.mjs', args), /Expected one unambiguous HTML member/)
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
