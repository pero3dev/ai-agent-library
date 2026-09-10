import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { editedPaths } from '../.codex/hooks/edited-paths.mjs'
import { generatedPath, normalizeEditEvent, relativeInside } from './lib/hook-core.mjs'
import { hookCommand } from './lib/hook-command.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const patch = (...lines) => ({ tool_name: 'apply_patch', cwd: root, tool_input: { command: ['*** Begin Patch', ...lines, '*** End Patch'].join('\n') } })
const invoke = (script, event, cwd = root) => spawnSync(process.execPath, [path.join(root, '.codex/hooks', script)], {
  input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8', cwd
})
const invokeAdapter = (client, script, event, repo = root, cwd = repo) => spawnSync(process.execPath, [path.join(repo, `.${client}/hooks`, script)], {
  input: typeof event === 'string' ? event : JSON.stringify(event), encoding: 'utf8', cwd,
})
function fixtureRoot(t) {
  const tempBase = realpathSync(os.tmpdir())
  const fixture = mkdtempSync(path.join(tempBase, 'ai-agent-library-hooks-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(fixture)), tempBase)
    assert.ok(path.basename(fixture).startsWith('ai-agent-library-hooks-'))
    rmSync(fixture, { recursive: true, force: true })
  })
  return fixture
}
function copyHooks(repo) {
  for (const client of ['codex', 'claude']) cpSync(path.join(root, `.${client}/hooks`), path.join(repo, `.${client}/hooks`), { recursive: true })
  cpSync(path.join(root, 'scripts/lib'), path.join(repo, 'scripts/lib'), { recursive: true })
  mkdirSync(path.join(repo, 'website'), { recursive: true })
}
function git(repo, ...args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}
function invokeCommand(client, mode, event, repo, cwd = repo) {
  return spawnSync(hookCommand(client, mode), {
    shell: true, cwd, encoding: 'utf8', input: JSON.stringify(event),
    env: { ...process.env, CLAUDE_PROJECT_DIR: repo },
  })
}

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

test('hook configuration stays in sync with shared bootstrap and exact tool matchers', () => {
  for (const client of ['codex', 'claude']) {
    const configPath = client === 'codex' ? '.codex/hooks.json' : '.claude/settings.json'
    const config = JSON.parse(readFileSync(path.join(root, configPath), 'utf8'))
    for (const [event, mode] of [['PreToolUse', 'guard'], ['PostToolUse', 'validate']]) {
      assert.equal(config.hooks[event][0].hooks[0].command, hookCommand(client, mode))
      const matcher = new RegExp(config.hooks[event][0].matcher)
      for (const name of ['Edit', 'Write', 'MultiEdit']) assert.ok(matcher.test(name))
      for (const name of ['Bash', 'Read', 'OtherWriteTool']) assert.ok(!matcher.test(name))
    }
  }
})

test('relative path boundaries cover POSIX, Windows drives, UNC paths, and prefix collisions', () => {
  for (const [api, base, inside, outside] of [
    [path.posix, '/repo space', '/repo space/website/out/a', '/repo space-other/website/out/a'],
    [path.win32, 'C:\\repo space', 'c:\\repo space\\website\\out\\a', 'D:\\repo space\\website\\out\\a'],
    [path.win32, '\\\\host\\share\\repo', '\\\\host\\share\\repo\\website\\out\\a', '\\\\host\\share\\repo-other\\a'],
  ]) {
    assert.equal(relativeInside(base, inside, api), 'website/out/a')
    assert.equal(relativeInside(base, outside, api), null)
    assert.ok(generatedPath(relativeInside(base, inside, api)))
  }
  for (const file of ['website/out', 'website/OUT/a', 'website/test-results/a', 'website/playwright-report/a']) assert.ok(generatedPath(file))
  for (const file of ['website/outside/a', 'website/content-src/a', '../website/out/a', null]) assert.ok(!generatedPath(file))
})

test('both adapters agree on legacy single-file, inherited MultiEdit, and multi-file events', () => {
  for (const client of ['codex', 'claude']) {
    for (const [tool_input, expected] of [
      [{ file_path: 'website/content-src/new file.mdx' }, 0],
      [{ file_path: 'website/generated/new file.mdx' }, 2],
      [{ file_path: 'website/out/index.html', edits: [{ old_string: 'a', new_string: 'b' }] }, 2],
      [{ edits: [{ file_path: 'docs/new file.md' }, { file_path: 'website/test-results/result.json' }] }, 2],
      [{ edits: [{ file_path: 'docs/new file.md' }, { file_path: 'website/content-src/new file.mdx' }] }, 0],
    ]) {
      const result = invokeAdapter(client, 'guard-generated.mjs', { tool_name: 'MultiEdit', tool_input })
      assert.equal(result.status, expected, `${client}: ${result.stderr}`)
    }
  }
})

test('both adapters report malformed JSON, unknown paths, invalid cwd, and invalid edits', () => {
  const invalid = [
    'invalid json', null, [], {}, { tool_input: [] }, { tool_input: { file_path: '' } },
    { tool_input: { file_path: 'docs/a.md', edits: {} } }, { tool_input: { edits: [{}] } },
    { tool_input: { file_path: 'docs/a.md', edits: [null] } },
    { tool_input: { file_path: 'docs/a.md', edits: [{ file_path: 12 }] } },
    { cwd: 'relative', tool_input: { file_path: 'docs/a.md' } },
    { cwd: null, tool_input: { file_path: 'docs/a.md' } },
    { tool_input: { file_path: 'docs/a\u0000.md' } },
  ]
  for (const client of ['codex', 'claude']) {
    for (const script of ['guard-generated.mjs', 'validate-doc.mjs']) {
      for (const event of invalid) {
        const result = invokeAdapter(client, script, event)
        assert.equal(result.status, 2, `${client}/${script}: ${JSON.stringify(event)}`)
        assert.match(result.stderr, /編集対象を検査できません/)
      }
    }
  }
})

test('patch extraction preserves CRLF, spaces, multiple patches, and rejects ambiguous targets', () => {
  const event = patch('*** Add File: docs/a file.md', '+*** Add File: website/out/not-a-target.md', '*** Update File: docs/b.md', '*** Move to: docs/new file.md', '@@', '+updated')
  event.tool_input.command = event.tool_input.command.replace(/\n/g, '\r\n') + '\r\n'
  assert.deepEqual(normalizeEditEvent(event).paths, ['docs/a file.md', 'docs/b.md', 'docs/new file.md'])
  for (const bad of [
    patch('*** Move to: docs/new.md'), patch('*** Add File: '),
    patch('*** Rename File: docs/a.md'),
    patch('*** Update File: docs/a.md', '*** Move to: docs/b.md', '*** Move to: docs/c.md'),
    { tool_name: 'apply_patch', tool_input: { command: '*** Add File: website/out/a' } },
  ]) assert.throws(() => normalizeEditEvent(bad), /apply_patch/)
})

test('adapters anchor legacy events to their checkout and reject foreign event cwd', t => {
  const fixture = fixtureRoot(t)
  const repo = path.join(fixture, 'repo with spaces')
  const foreign = path.join(fixture, 'other repository')
  copyHooks(repo)
  mkdirSync(foreign)
  for (const client of ['codex', 'claude']) {
    const event = { tool_input: { file_path: 'website/out/probe.html' } }
    assert.equal(invokeAdapter(client, 'guard-generated.mjs', event, repo, foreign).status, 2)
    const result = invokeAdapter(client, 'guard-generated.mjs', { ...event, cwd: foreign }, repo)
    assert.equal(result.status, 2)
    assert.match(result.stderr, /cwd.*リポジトリ外/)
    assert.equal(invokeAdapter(client, 'guard-generated.mjs', { cwd: path.join(repo, 'website'), tool_input: { file_path: 'out/probe.html' } }, repo).status, 2)
  }
})

test('both adapters validate all MultiEdit docs and report read failures', t => {
  const repo = fixtureRoot(t)
  copyHooks(repo)
  mkdirSync(path.join(repo, 'docs/01-concepts'), { recursive: true })
  writeFileSync(path.join(repo, 'docs/01-concepts/invalid.md'), '# 不正な記事\n')
  mkdirSync(path.join(repo, 'docs/01-concepts/unreadable.md'))
  const event = { cwd: repo, tool_name: 'MultiEdit', tool_input: { edits: [
    { file_path: 'docs/01-concepts/invalid.md' }, { file_path: 'docs/01-concepts/unreadable.md' },
    { file_path: 'docs/01-concepts/deleted.md' }, { file_path: 'website/source.ts' },
  ] } }
  for (const client of ['codex', 'claude']) {
    const result = invokeAdapter(client, 'validate-doc.mjs', event, repo)
    assert.equal(result.status, 2)
    assert.match(result.stderr, /invalid\.md/)
    assert.match(result.stderr, /unreadable\.md: 読込失敗/)
    assert.doesNotMatch(result.stderr, /deleted\.md|source\.ts/)
  }
})

test('configured commands locate a detached worktree from its subdirectory on both adapters', t => {
  const fixture = fixtureRoot(t)
  const repo = path.join(fixture, 'source repo')
  const worktree = path.join(fixture, 'detached worktree')
  copyHooks(repo)
  git(repo, 'init', '--quiet')
  git(repo, 'add', '.')
  git(repo, '-c', 'user.name=Hook Fixture', '-c', 'user.email=hook-fixture@example.invalid', 'commit', '--quiet', '-m', 'Isolated hook fixture')
  git(repo, 'worktree', 'add', '--quiet', '--detach', worktree)
  mkdirSync(path.join(worktree, 'website'), { recursive: true })
  for (const client of ['codex', 'claude']) {
    for (const [mode, expected] of [['guard', 2], ['validate', 0]]) {
      const result = invokeCommand(client, mode, { cwd: path.join(worktree, 'website'), tool_input: { file_path: 'out/probe.html' } }, worktree, path.join(worktree, 'website'))
      assert.equal(result.status, expected, result.stderr)
    }
  }
})

test('configured commands reject a foreign project before importing its hook code', t => {
  const repo = fixtureRoot(t)
  git(repo, 'init', '--quiet')
  mkdirSync(path.join(repo, 'scripts/lib'), { recursive: true })
  writeFileSync(path.join(repo, 'scripts/lib/hook-core.mjs'), '// unrelated project\n')
  for (const client of ['codex', 'claude']) {
    mkdirSync(path.join(repo, `.${client}/hooks`), { recursive: true })
    writeFileSync(path.join(repo, `.${client}/hooks/guard-generated.mjs`), "import{writeFileSync}from'node:fs';writeFileSync('must-not-run','bad')\n")
    const result = invokeCommand(client, 'guard', { tool_input: { file_path: 'source.md' } }, repo)
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /Not an AI Agent Library hook root/)
    assert.ok(!existsSync(path.join(repo, 'must-not-run')))
  }
})

test('existing symlinks to generated paths are detected; a symlinked hook directory is not imported', t => {
  const fixture = fixtureRoot(t)
  const repo = path.join(fixture, 'repository')
  const foreign = path.join(fixture, 'foreign')
  copyHooks(repo)
  mkdirSync(path.join(repo, 'website/out'), { recursive: true })
  mkdirSync(foreign)
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  symlinkSync(path.join(repo, 'website/out'), path.join(repo, 'alias-output'), linkType)
  git(repo, 'init', '--quiet')
  for (const client of ['codex', 'claude']) {
    const result = invokeAdapter(client, 'guard-generated.mjs', { cwd: repo, tool_input: { file_path: 'alias-output/new.html' } }, repo)
    assert.equal(result.status, 2)
    assert.match(result.stderr, /生成物/)
    const ownedHooks = path.join(repo, `.${client}/hooks`)
    assert.equal(path.dirname(path.dirname(ownedHooks)), repo)
    rmSync(ownedHooks, { recursive: true })
    writeFileSync(path.join(foreign, 'guard-generated.mjs'), "throw Error('must not be imported')\n")
    symlinkSync(foreign, ownedHooks, linkType)
    const command = invokeCommand(client, 'guard', { cwd: repo, tool_input: { file_path: 'source.md' } }, repo)
    assert.equal(command.status, 2)
    assert.match(command.stderr, /Hook path resolves outside/)
    assert.doesNotMatch(command.stderr, /must not be imported/)
  }
})
