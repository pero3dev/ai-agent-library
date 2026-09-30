import assert from 'node:assert/strict'
import { reasoning, runReasoningChecks } from './reasoning-checks.mjs'
import { createLocalAlignmentAdapter } from './local-alignment-adapter.mjs'

export function createLocalReasoningAdapter(options) {
  return createLocalAlignmentAdapter({ ...options, extraSceneMarkers: reasoning.map(item => item.marker) })
}

export async function reasoningLocalCases() {
  const cases = []
  await runReasoningChecks({ check: async (name, operation) => cases.push({ name, operation }) })
  assert.equal(cases.length, 14)
  return cases
}
