import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { editedPaths } from '../.codex/hooks/edited-paths.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const patch = (...lines) => ({ tool_name: 'apply_patch', cwd: root, tool_input: { command: ['*** Begin Patch', ...lines, '*** End Patch'].join('\n') } })
const invoke = (script, event, cwd = root) => spawnSync(process.execPath, [path.join(root, '.codex/hooks', script)], {
  input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8', cwd
})

test('Codex patch extraction covers multiple files, deletion, spaces, and move targets', () => {
  const event = patch('*** Add File: docs/new file.md', '+text', '*** Update File: docs/old.md', '*** Move to: website/generated/moved.md', '@@', '-old', '+new', '*** Delete File: docs/gone.md')
  assert.deepEqual(editedPaths(event, root), ['docs/new file.md', 'docs/old.md', 'website/generated/moved.md', 'docs/gone.md'].map(file => path.join(root, file)))
})

for (const entry of [
  ['*** Add File: website/content/probe.mdx', '+probe'],
  ['*** Update File: website/generated/routes.json', '@@', '-[]', '+[]'],
  ['*** Delete File: website/out/index.html'],
  ['*** Update File: docs/source.md', '*** Move to: website/.next/moved.md', '@@', '-old', '+new'],
  ['*** Update File: website/public/_pagefind/index.js', '*** Move to: docs/moved.md', '@@', '-old', '+new'],
  ['*** Add File: website/next-env.d.ts', '+probe']
]) {
  test(`PreToolUse blocks generated targets: ${entry[0]}`, () => {
    const result = invoke('guard-generated.mjs', patch(...entry))
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /生成物/)
  })
}

test('PreToolUse resolves patch paths from event cwd and permits editable sources', () => {
  const event = patch('*** Add File: content/probe.mdx', '+probe')
  event.cwd = path.join(root, 'website')
  assert.equal(invoke('guard-generated.mjs', event).status, 2)
  assert.equal(invoke('guard-generated.mjs', patch('*** Add File: website/content-src/probe.mdx', '+probe')).status, 0)
  assert.equal(invoke('guard-generated.mjs', { tool_input: { file_path: path.join(root, 'website/out/probe.html') } }).status, 2)
  assert.equal(invoke('guard-generated.mjs', { tool_input: { file_path: path.join(root, 'docs/01-concepts/agent-loop.md') } }).status, 0)
})

test('PreToolUse reports unreadable patch input instead of silently bypassing checks', () => {
  for (const event of ['invalid json', { tool_name: 'apply_patch', tool_input: {} }, patch('malformed patch')]) {
    assert.equal(invoke('guard-generated.mjs', event).status, 2)
  }
})

test('configured hook command locates the checkout from a subdirectory', () => {
  const config = JSON.parse(readFileSync(path.join(root, '.codex/hooks.json'), 'utf8'))
  for (const [name, expected] of [['PreToolUse', 2], ['PostToolUse', 0]]) {
    const command = config.hooks[name][0].hooks[0].command
    const result = spawnSync(command, {
      shell: true, cwd: path.join(root, 'website'), encoding: 'utf8',
      input: JSON.stringify(patch('*** Add File: website/out/probe.html', '+probe'))
    })
    assert.equal(result.status, expected, result.stderr)
  }
})

test('PostToolUse validates every edited doc and move destination; deleted files are skipped', t => {
  const tempBase = path.resolve(os.tmpdir())
  const fixture = mkdtempSync(path.join(tempBase, 'ai-agent-library-hooks-'))
  t.after(() => {
    // 削除対象はこのテストが作成した一時ディレクトリだけに限定する。
    assert.equal(path.dirname(path.resolve(fixture)), tempBase)
    assert.ok(path.basename(fixture).startsWith('ai-agent-library-hooks-'))
    rmSync(fixture, { recursive: true, force: true })
  })
  cpSync(path.join(root, '.codex/hooks'), path.join(fixture, '.codex/hooks'), { recursive: true })
  cpSync(path.join(root, 'scripts/lib'), path.join(fixture, 'scripts/lib'), { recursive: true })
  mkdirSync(path.join(fixture, 'docs/01-concepts'), { recursive: true })
  const valid = readFileSync(path.join(root, 'docs/01-concepts/agent-loop.md'), 'utf8')
  writeFileSync(path.join(fixture, 'docs/01-concepts/valid.md'), valid)
  writeFileSync(path.join(fixture, 'docs/01-concepts/invalid.md'), '# 不正な記事\n')
  writeFileSync(path.join(fixture, 'docs/01-concepts/moved.md'), '# 移動先も不正\n')
  const event = patch('*** Update File: docs/01-concepts/valid.md', '@@', ' context', '*** Add File: docs/01-concepts/invalid.md', '+text', '*** Update File: docs/01-concepts/old.md', '*** Move to: docs/01-concepts/moved.md', '@@', '-old', '+new', '*** Delete File: docs/01-concepts/gone.md')
  event.cwd = fixture
  const result = spawnSync(process.execPath, [path.join(fixture, '.codex/hooks/validate-doc.mjs')], { input: JSON.stringify(event), encoding: 'utf8' })
  assert.equal(result.status, 2, result.stderr)
  assert.match(result.stderr, /invalid\.md/)
  assert.match(result.stderr, /moved\.md/)
  assert.doesNotMatch(result.stderr, /\/(?:valid|old|gone)\.md:/)
})
