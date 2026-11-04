import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

function object(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

const namespace = object(await import(pathToFileURL(createRequire(process.cwd() + '/package.json').resolve('js-yaml')).href) as unknown)
const { load, JSON_SCHEMA } = namespace
assert.ok(typeof load === 'function')
const parsed: unknown = Reflect.apply(load, undefined, [fs.readFileSync('.github/workflows/ios-core-notice-observation.yml', 'utf8'), { schema: JSON_SCHEMA }])
const workflow = object(parsed)
const events = object(workflow.on), pullRequest = object(events.pull_request)
assert.deepEqual(Object.keys(events).sort(), ['pull_request', 'workflow_dispatch'])
assert.ok(Array.isArray(pullRequest.paths))
assert.deepEqual([...pullRequest.paths].sort(), [
  '.github/workflows/ios-core-notice-observation.yml', 'ios/tests/observe-core-notice-hosted-20261031.py',
  'ios/tests/hosted-core-notice-pure-fixtures-20261031.py', 'ios/tests/verify-core-performance-notice-20261031.mjs',
  'tests/unit/ios-core-performance-notice-20261031.test.mjs', 'ios/tests/notice-hosted-20261031/*.mts'
].sort())
assert.deepEqual(workflow.permissions, { contents: 'read' })
assert.equal(object(workflow.concurrency)['cancel-in-progress'], false)
const job = object(object(workflow.jobs).observe)
assert.equal(job['runs-on'], 'macos-15')
assert.equal(job['timeout-minutes'], 35)
assert.ok(Array.isArray(job.steps))
const steps = (job.steps as unknown[]).map(object)
const find = (flag: string) => steps.findIndex(step => {
  if (step.run === undefined || step.run === null) return false
  assert.ok(typeof step.run === 'string')
  return step.run.includes('observe-core-notice-hosted-20261031.py ' + flag)
})
assert(find('--fixtures') >= 0 && find('--fixtures') < find('--prepare') && find('--prepare') < find('--run'))
assert.equal(steps[find('--fixtures')]['timeout-minutes'], 1)
assert(!steps.some(step => step['continue-on-error']))
assert(!steps[find('--prepare')].if && !steps[find('--run')].if)
assert.equal(steps.at(-1)!.if, 'always()')
assert(steps.filter(step => step.uses).every(step => /@[a-f0-9]{40}$/.test(step.uses as string)))
console.log(JSON.stringify({ state: 'workflow-schema-accepted', Node_version: process.version, paths: 6 }))
