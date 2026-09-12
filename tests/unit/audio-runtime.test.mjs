import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('Windows audio wrapper shares state across a real linked worktree with spaces', { skip: process.platform !== 'win32' }, t => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'audio runtime '))
  t.after(() => {
    assert.ok(realpathSync(temporary).startsWith(realpathSync(os.tmpdir()) + path.sep))
    rmSync(temporary, { recursive: true, force: true })
  })
  const source = path.join(temporary, 'source')
  const linked = path.join(temporary, 'linked checkout')
  const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true })
  git(['init', source])
  git(['-C', source, '-c', 'user.name=Audio runtime test', '-c', 'user.email=audio-test@example.invalid', 'commit', '--allow-empty', '-m', 'fixture'])
  git(['-C', source, 'worktree', 'add', '--detach', linked])
  const plans = [source, linked].map(project => JSON.parse(execFileSync('powershell.exe', [
    '-NoProfile', '-File', path.join(root, 'scripts/Invoke-AudioLearning.ps1'),
    '-ProjectRoot', project, '-DryRun', '-SyncMain', '-Publish', '-AutoMerge'
  ], { encoding: 'utf8', windowsHide: true })))
  // Windows 8.3 aliases can survive realpath(). Compare the actual directory identity too.
  const expectedGit = statSync(path.join(source, '.git'), { bigint: true })
  const sharedState = plans[0].production[plans[0].production.indexOf('--state-dir') + 1]
  for (const plan of plans) {
    const statePath = plan.production[plan.production.indexOf('--state-dir') + 1]
    assert.equal(statePath, sharedState)
    assert.equal(plan.publication[plan.publication.indexOf('--state-dir') + 1], sharedState)
    assert.equal(path.basename(statePath), 'audio-learning')
    const actualGit = statSync(path.dirname(statePath), { bigint: true })
    assert.equal(actualGit.dev, expectedGit.dev)
    assert.equal(actualGit.ino, expectedGit.ino)
    assert.equal(plan.starts_engine, false)
    assert.equal(plan.sync_main, true)
    assert.ok(!plan.publication.includes('--apply'))
  }
})
