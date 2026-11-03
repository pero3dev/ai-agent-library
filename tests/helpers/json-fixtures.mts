import assert from 'node:assert/strict'
import { isRecord } from '../../scripts/lib/json-guards.mjs'

export function requiredFixture<T>(value: T | null | undefined): T {
  assert.ok(value !== null && value !== undefined, 'expected fixture value is present')
  return value
}

export function objectFixture(value: unknown): Record<string, unknown> {
  assert.ok(isRecord(value), 'fixture must be an object')
  return value
}

export function stringFixture(value: unknown): string {
  assert.equal(typeof value, 'string', 'fixture must be a string')
  if (typeof value !== 'string') throw new Error('fixture must be a string')
  return value
}

export function objectArrayFixture(value: unknown): Record<string, unknown>[] {
  assert.ok(Array.isArray(value), 'fixture must be an array')
  return (value as unknown[]).map(objectFixture)
}

type WorkflowStep = Record<string, unknown> & { run?: string, 'working-directory'?: string }

function workflowStep(value: unknown): WorkflowStep {
  const step = objectFixture(value)
  if (step.run !== undefined) stringFixture(step.run)
  if (step['working-directory'] !== undefined) stringFixture(step['working-directory'])
  return { ...step, ...(typeof step.run === 'string' ? { run: step.run } : {}), ...(typeof step['working-directory'] === 'string' ? { 'working-directory': step['working-directory'] } : {}) }
}

type WorkflowRunDefaults = { run?: Record<string, unknown> }
type WorkflowFixture = { jobs: Record<string, { steps: WorkflowStep[], defaults?: WorkflowRunDefaults }>, defaults?: WorkflowRunDefaults }

/** Trusted test input still checks the structural fields consumed by a workflow assertion. */
export function workflowFixture(value: unknown): WorkflowFixture {
  const workflow = objectFixture(value)
  const jobs = objectFixture(workflow.jobs)
  const result: WorkflowFixture['jobs'] = {}
  for (const [name, data] of Object.entries(jobs)) {
    const job = objectFixture(data)
    result[name] = { ...job, steps: job.steps === undefined ? [] : objectArrayFixture(job.steps).map(workflowStep), ...(job.defaults === undefined ? {} : { defaults: { run: objectFixture(objectFixture(job.defaults).run ?? {}) } }) }
  }
  return { ...workflow, jobs: result, ...(workflow.defaults === undefined ? {} : { defaults: { run: objectFixture(objectFixture(workflow.defaults).run ?? {}) } }) }
}
