import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkStructure, loadStructure } from '../../scripts/check-structure.mjs'
import { inventoryRoots, measureInventory, parseInventoryOptions, structureInventory } from '../../scripts/structure-inventory.mjs'
import { ROOT } from '../../scripts/lib/tooling-common.mjs'

function fixture(t) {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-structure-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), base)
    assert.ok(path.basename(root).startsWith('ai-agent-library-structure-'))
    rmSync(root, { recursive: true, force: true })
  })
  const write = (file, text = '') => { const target = path.join(root, file); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, text) }
  const contract = loadStructure(ROOT)
  const files = [...contract.root_files, ...contract.required_files, 'harness/structure.json']
  for (const file of files) write(file, file.endsWith('.md') ? '# Fixture\n' : '')
  write('harness/structure.json', readFileSync(path.join(ROOT, 'harness/structure.json')))
  return { root, write, files }
}

test('final structure has 15 root files, eight Markdown entries and required checked indexes', t => {
  const { root, files } = fixture(t)
  const result = checkStructure(root, { trackedFiles: files })
  assert.equal(result.verified, true, result.problems.join('\n'))
  assert.equal(result.root_files, 15)
  assert.equal(result.root_markdown_files, 8)
  assert.equal(checkStructure(root, { trackedFiles: files.filter(file => file !== 'project/README.md') }).verified, false)
})

test('tracked root plans, generated dependencies, retired placements and new top directories fail', t => {
  const { root, files, write } = fixture(t)
  for (const file of ['OLD-PLAN.md', 'unexpected/data.json', 'website/out/index.html', 'website/node_modules/pkg/index.js', 'scripts/example.test.mjs', 'website/scripts/example.test.mjs', 'tests/harness/fixture.example', '.codex/hooks/edited-paths.mjs', 'examples/typescript/.gitkeep']) {
    write(file)
    const result = checkStructure(root, { trackedFiles: [...files, file] })
    assert.ok(result.problems.some(problem => problem.includes(file)), file)
    assert.equal(result.verified, false, file)
  }
})

test('new project Markdown cannot silently leave the existing link collector', t => {
  const { root, files, write } = fixture(t)
  write('project/plans/new.md', '# New\n')
  assert.equal(checkStructure(root, { trackedFiles: [...files, 'project/plans/new.md'] }).verified, true)
  write('project/.hidden/unchecked.md', '# Hidden\n')
  assert.ok(checkStructure(root, { trackedFiles: [...files, 'project/.hidden/unchecked.md'] }).problems.some(problem => problem.includes('リンク検査から脱落')))
  assert.ok(checkStructure(root, { trackedFiles: files, linkCollector: () => [] }).problems.some(problem => problem.includes('project/README.md')))
})

test('case variants of Markdown extensions cannot bypass project link coverage', t => {
  const { root, files, write } = fixture(t)
  for (const file of ['project/unchecked.MD', 'project/plans/mixed.Md']) {
    write(file, '# Unchecked\n\n[broken](missing.md)\n')
    const result = checkStructure(root, { trackedFiles: [...files, file] })
    assert.equal(result.verified, false)
    assert.ok(result.problems.some(problem => problem.includes('リンク検査から脱落') && problem.includes(file)))
  }
})

test('Windows helper is allowed only at the relocated test helper path', t => {
  const { root, files, write } = fixture(t)
  const current = 'tests/helpers/windows-test-path.mjs'
  const retired = 'scripts/lib/windows-test-path.mjs'
  write(current)
  write(retired)
  assert.equal(checkStructure(root, { trackedFiles: [...files, current] }).verified, true)
  const result = checkStructure(root, { trackedFiles: [...files, current, retired] })
  assert.equal(result.verified, false)
  assert.ok(result.problems.some(problem => problem.includes('廃止済みの配置') && problem.includes(retired)))
})

test('storage categories partition bytes without following links or counting nested roots twice', t => {
  const { root, write } = fixture(t)
  const storage = path.join(root, 'storage')
  for (const [file, bytes] of [['source.md', 3], ['node_modules/pkg/index.js', 5], ['website/out/index.html', 7], ['.git/objects/object', 11], ['.git/harness-eval/case/log', 13], ['.git/harness-tools/bin/tool', 17], ['local.txt', 19], ['.git/structure-cleanup/evidence.log', 23], ['.git/STRUCTURE_EVIDENCE', 29], ['.git/HEAD', 31]]) write(`storage/${file}`, 'x'.repeat(bytes))
  write('outside/secret.txt', 'NOT_READ_OR_COUNTED')
  symlinkSync(path.join(root, 'outside'), path.join(storage, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  symlinkSync(path.join(root, 'missing'), path.join(storage, 'dangling'), process.platform === 'win32' ? 'junction' : 'dir')
  const result = measureInventory([{ path: storage, kind: 'checkout' }, { path: path.join(storage, '.git'), kind: 'common-git' }, { path: path.join(storage, '.git/harness-eval'), kind: 'worktree' }], { common: path.join(storage, '.git'), checkouts: [{ path: storage, tracked: new Set(['source.md']) }] })
  assert.equal(result.totals.bytes, 158)
  assert.equal(result.totals.files, 10)
  assert.equal(result.totals.tracked_paths, 1)
  assert.deepEqual(Object.values(result.groups).map(row => row.bytes), [3, 5, 7, 42, 13, 17, 71])
  assert.equal(result.skipped_links.length, 2)
  assert.equal(result.completeness, 'partial')
  assert.equal(result.roots.filter(row => row.status === 'measured').length, 1)
  assert.doesNotMatch(JSON.stringify(result), /NOT_READ_OR_COUNTED/)
})

test('scope deduplication does not confuse a sibling prefix with a nested worktree', () => {
  const root = path.resolve('repo')
  const sibling = path.resolve('repo-copy')
  const result = inventoryRoots([{ path: root }, { path: root }, { path: path.join(root, '.git') }, { path: sibling }])
  assert.equal(result.length, 3)
  assert.equal(result.filter(row => row.status === 'measured').length, 2)
})

test('worktree inventory explicitly excludes unselected and different-common checkouts', t => {
  const { root, files, write } = fixture(t)
  const own = path.join(root, 'owned')
  const foreign = path.join(root, 'foreign')
  const current = path.join(root, 'current')
  for (const file of files) write(`current/${file}`, readFileSync(path.join(root, file)))
  write('current/.git/objects/data', 'git')
  write('owned/doc.md', 'owned')
  write('foreign/.git/data', 'foreign')
  const calls = []
  const gitReader = (cwd, ...args) => {
    calls.push({ cwd, args })
    if (args[0] === 'worktree') return [current, own, foreign].map(directory => `worktree ${directory}\0HEAD fixture\0\0`).join('')
    if (args[0] === 'ls-files') return cwd === current ? files.join('\0') : 'doc.md'
    if (args[1] === '--show-toplevel') return cwd
    if (args[1] === '--git-common-dir') return path.join(cwd === foreign ? foreign : current, '.git')
    throw new Error('unexpected Git command')
  }
  const defaultResult = structureInventory(current, { gitReader })
  assert.ok(defaultResult.worktrees.every(row => row.status === 'not-requested' && row.storage === 'not-measured'))
  const selected = structureInventory(current, { worktrees: true, gitReader })
  assert.equal(selected.totals.bytes - defaultResult.totals.bytes, 5)
  assert.equal(selected.worktrees.find(row => row.path === own).status, 'selected')
  assert.equal(selected.worktrees.find(row => row.path === foreign).status, 'unavailable-or-different-common-git')
  assert.ok(calls.every(call => ['rev-parse', 'ls-files', 'worktree'].includes(call.args[0])))
  assert.equal(selected.automatic_deletion, false)
  assert.equal(selected.retention.completed_evidence_minimum_days, 90)
  assert.equal(selected.retention.inventory_threshold_bytes, 524288000)
})

test('inventory CLI rejects unsupported, repeated and incomplete input without allowing deletion', () => {
  assert.deepEqual(parseInventoryOptions(['--root', 'repo', '--worktrees']), { root: 'repo', worktrees: true })
  assert.deepEqual(parseInventoryOptions([]), { worktrees: false })
  for (const args of [['--delete'], ['--root'], ['--root', '--worktrees'], ['--root', '--worktrees', 'repo'], ['--worktrees', 'true'], ['--worktrees', '--worktrees'], ['--root', 'one', '--root', 'two'], ['unexpected']]) assert.throws(() => parseInventoryOptions(args))
})
