import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { REPO_ROOT } from './lib/md-utils.mjs'

const article = 'docs/01-concepts/agent-loop.md'
const valid = readFileSync(path.join(REPO_ROOT, article), 'utf8')
function fixture(t, withArticle = true) {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-validator-cli-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), base)
    assert.ok(path.basename(root).startsWith('ai-agent-library-validator-cli-'))
    rmSync(root, { recursive: true, force: true })
  })
  const write = (file, text) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text) }
  for (const file of ['scripts/validate-docs.mjs', 'scripts/lib/md-utils.mjs', 'scripts/lib/validate-core.mjs']) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    cpSync(path.join(REPO_ROOT, file), path.join(root, file))
  }
  mkdirSync(path.join(root, 'docs'), { recursive: true })
  if (withArticle) write(article, valid)
  const run = (args, cwd = root) => spawnSync(process.execPath, [path.join(root, 'scripts/validate-docs.mjs'), ...args], { cwd, encoding: 'utf8', windowsHide: true, timeout: 10000 })
  return { root, write, run }
}
function failed(result) {
  assert.equal(result.status, 1, result.stdout + result.stderr)
  assert.doesNotMatch(result.stdout, /OK:/)
}

test('CLI validates --all, multiple files, absolute paths and subdirectory invocation', t => {
  const { root, write, run } = fixture(t)
  write('docs/01-concepts/tool-use.md', valid)
  for (const args of [['--all'], [article, 'docs/01-concepts/tool-use.md'], [path.join(root, article)]]) {
    const result = run(args)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, new RegExp(`OK: ${args.length === 1 && args[0] !== '--all' ? 1 : 2} files`))
  }
  assert.equal(run(['01-concepts/agent-loop.md'], path.join(root, 'docs')).status, 0)
  assert.equal(run(['--help']).status, 0)
})

test('CLI rejects unknown options and absent targets before any validation', t => {
  const { run } = fixture(t)
  for (const args of [[], ['--unknown'], [article, '--unknown'], ['--all', '--unknown'], ['--help', '--unknown'], ['--all', article], ['--all', '--all'], ['--warn-only=h2']]) failed(run(args))
  failed(fixture(t, false).run(['--all']))
})

test('CLI rejects out-of-project, non-Markdown, missing and directory targets instead of skipping them', t => {
  const { root, write, run } = fixture(t)
  write('README.md', valid)
  write('docs/01-concepts/topic.txt', valid)
  mkdirSync(path.join(root, 'docs/01-concepts/directory.md'))
  for (const target of ['README.md', 'docs/01-concepts/topic.txt', 'docs/01-concepts/missing.md', 'docs/01-concepts/directory.md', path.join(REPO_ROOT, article)]) {
    failed(run([target]))
    failed(run([article, target, '--warn-only=front-matter,h2,todo,filename,fence']))
  }
})

test('CLI rejects a docs junction resolving to content outside docs', t => {
  const { root, write, run } = fixture(t)
  write('outside/topic.md', valid)
  symlinkSync(path.join(root, 'outside'), path.join(root, 'docs/linked'), process.platform === 'win32' ? 'junction' : 'dir')
  failed(run(['docs/linked/topic.md', '--warn-only=filename']))
  failed(run(['--all']))
})

test('CLI --all rejects dangling docs links instead of silently reporting only other valid articles', t => {
  const { root, run } = fixture(t)
  symlinkSync(path.join(root, 'missing-target'), path.join(root, 'docs/linked'), process.platform === 'win32' ? 'junction' : 'dir')
  failed(run(['--all', '--warn-only=filename']))
})

test('CLI retains selected migration warnings but rejects unknown or empty check names', t => {
  const { write, run } = fixture(t)
  write(article, valid.replace('## この記事の目的', '## 目的'))
  failed(run([article]))
  const warned = run([article, '--warn-only=h2'])
  assert.equal(warned.status, 0, warned.stderr)
  assert.match(warned.stderr, /\[warning:h2\]/)
  assert.match(warned.stdout, /OK: 1 files\(警告/)
  assert.equal(run(['--all', '--warn-only=h2', '--warn-only=front-matter,todo,filename,fence']).status, 0)
  for (const option of ['--warn-only', '--warn-only=', '--warn-only=h2,', '--warn-only=unknown', '--warn-only=h2,unknown']) failed(run([article, option]))
})
