import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { unitTestPlan } from '../../scripts/test-unit.mjs'

test('only the byte-bound POSIX Notice test is not run on Windows; Linux/macOS retain it', (t) => {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'unit-plan-'))
  t.after(() => { assert.equal(path.dirname(root), base); rmSync(root, { recursive: true, force: true }) })
  const unit = path.join(root, 'tests/unit')
  mkdirSync(unit, { recursive: true })
  for (const name of ['ordinary.test.mjs', 'ios-core-performance-notice-20261031.test.mjs', 'another.test.mjs', 'implementation.mts', 'helper.mjs']) writeFileSync(path.join(unit, name), '')
  const frozen = 'tests/unit/ios-core-performance-notice-20261031.test.mjs'
  const windows = unitTestPlan(root, 'win32')
  assert.deepEqual(windows.not_run, [frozen])
  assert.deepEqual(windows.files, ['tests/unit/another.test.mjs', 'tests/unit/ordinary.test.mjs'])
  for (const platform of (['linux', 'darwin'] as const)) {
    const plan = unitTestPlan(root, platform)
    assert.deepEqual(plan.not_run, [])
    assert.deepEqual(plan.files, ['tests/unit/another.test.mjs', frozen, 'tests/unit/ordinary.test.mjs'])
  }
})
