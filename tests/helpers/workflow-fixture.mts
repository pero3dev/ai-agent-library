import assert from 'node:assert/strict'

export interface WorkflowStep { uses?: string; run?: string; if?: string; with: Record<string, unknown> }
export interface WorkflowJob { name?: string; needs: string[]; steps: WorkflowStep[] }
export function workflowFixture(value: unknown): { 'run-name'?: string; on: Record<string, unknown>; permissions: unknown; jobs: Record<string, WorkflowJob> } {
  const object = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)
  assert(object(value) && object(value.on) && object(value.jobs))
  assert(value['run-name'] === undefined || typeof value['run-name'] === 'string')
  const jobs: Record<string, WorkflowJob> = {}
  for (const [name, job] of Object.entries(value.jobs)) {
    assert(object(job) && Array.isArray(job.steps))
    assert(job.name === undefined || typeof job.name === 'string')
    const needs = job.needs === undefined ? [] : Array.isArray(job.needs) ? job.needs : [job.needs]
    assert(needs.every((item: unknown) => typeof item === 'string'))
    const steps: WorkflowStep[] = job.steps.map((step: unknown) => {
      assert(object(step))
      for (const key of ['uses', 'run', 'if']) assert(step[key] === undefined || typeof step[key] === 'string')
      assert(step.uses === undefined || typeof step.uses === 'string')
      assert(step.run === undefined || typeof step.run === 'string')
      assert(step.if === undefined || typeof step.if === 'string')
      assert(step.with === undefined || object(step.with))
      return { uses: step.uses, run: step.run, if: step.if, with: step.with ?? {} }
    })
    jobs[name] = { name: job.name, needs, steps }
  }
  return { 'run-name': value['run-name'], on: value.on, permissions: value.permissions, jobs }
}
