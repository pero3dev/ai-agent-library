import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fixtureGit, isolatedGitEnv } from '../helpers/isolated-git.mjs'

test('fixture Git ignores forced signing, user aliases and hooks without changing user config', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'isolated-git-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const config = path.join(root, 'forced.gitconfig')
  const contents = '[commit]\n gpgsign = true\n[gpg]\n program = nonexistent-signing-command\n[alias]\n poison = !exit 42\n'
  writeFileSync(config, contents)
  const env = isolatedGitEnv({ ...process.env, GIT_CONFIG_GLOBAL: config })
  assert.notEqual(env.GIT_CONFIG_GLOBAL, config)
  const git = (...args) => fixtureGit(args, { cwd: root, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: config } }).trim()
  git('init', '--quiet'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
  writeFileSync(path.join(root, 'value'), 'test')
  git('add', 'value'); git('commit', '--quiet', '-m', 'fixture')
  assert.equal(git('config', '--get', 'commit.gpgsign'), 'false')
  assert.throws(() => execFileSync('git', ['poison'], { cwd: root, env, stdio: 'pipe' }))
  assert.equal(readFileSync(config, 'utf8'), contents)
})
