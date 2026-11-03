import assert from 'node:assert/strict'
import { isRecord } from '../../scripts/lib/json-guards.mjs'

/** @template T @param {T | null | undefined} value @returns {T} */
export function requiredFixture(value) {
  assert.ok(value !== null && value !== undefined, 'expected fixture value is present')
  return value
}

/** @param {unknown} value @returns {Record<string, unknown>} */
export function objectFixture(value) {
  assert.ok(isRecord(value), 'fixture must be an object')
  return value
}

/** @param {unknown} value @returns {string} */
export function stringFixture(value) {
  assert.equal(typeof value, 'string', 'fixture must be a string')
  if (typeof value !== 'string') throw new Error('fixture must be a string')
  return value
}

/** @param {unknown} value @returns {Record<string, unknown>[]} */
export function objectArrayFixture(value) {
  assert.ok(Array.isArray(value), 'fixture must be an array')
  return (/** @type {unknown[]} */ (value)).map(objectFixture)
}

/** @typedef {Record<string, unknown> & {run?: string, 'working-directory'?: string}} WorkflowStep */
/** @param {unknown} value @returns {WorkflowStep} */
function workflowStep(value) {
  const step = objectFixture(value)
  if (step.run !== undefined) stringFixture(step.run)
  if (step['working-directory'] !== undefined) stringFixture(step['working-directory'])
  return { ...step, ...(typeof step.run === 'string' ? { run: step.run } : {}), ...(typeof step['working-directory'] === 'string' ? { 'working-directory': step['working-directory'] } : {}) }
}

/** Trusted test input still checks the structural fields consumed by a workflow assertion.
 * @param {unknown} value
 * @returns {{jobs: Record<string, {steps: WorkflowStep[], defaults?: {run?: Record<string, unknown>}}>, defaults?: {run?: Record<string, unknown>}}}
 */
export function workflowFixture(value) {
  const workflow = objectFixture(value)
  const jobs = objectFixture(workflow.jobs)
  /** @type {Record<string, {steps: WorkflowStep[], defaults?: {run?: Record<string, unknown>}}>} */
  const result = {}
  for (const [name, data] of Object.entries(jobs)) {
    const job = objectFixture(data)
    result[name] = { ...job, steps: job.steps === undefined ? [] : objectArrayFixture(job.steps).map(workflowStep), ...(job.defaults === undefined ? {} : { defaults: { run: objectFixture(objectFixture(job.defaults).run ?? {}) } }) }
  }
  return { ...workflow, jobs: result, ...(workflow.defaults === undefined ? {} : { defaults: { run: objectFixture(objectFixture(workflow.defaults).run ?? {}) } }) }
}
