import assert from 'node:assert/strict'
import test from 'node:test'
import { AGENT_LINEAGE_STAGES, worldModelUsage, worldEvaluation } from '../../lib/agent-lineage-model.mjs'

test('world model usages can overlap and prediction never claims a verified real outcome', () => {
  assert.deepEqual(worldModelUsage('combined'), { environment: true, prediction: true, infrastructure: true, verifiedRealOutcome: false })
  for (const kind of ['environment', 'prediction', 'infrastructure', 'combined']) assert.equal(worldModelUsage(kind).verifiedRealOutcome, false)
  assert.equal(worldModelUsage('prediction').environment, false)
  assert.equal(worldModelUsage('infrastructure').infrastructure, true)
  assert.throws(() => worldModelUsage('__proto__'), RangeError)
})
test('policy evaluation retains prediction error, closed-loop latency and safety beyond infrastructure fidelity', () => {
  assert.deepEqual(worldEvaluation('policy'), ['予測誤り', '閉ループ遅延', '安全性'])
  assert.deepEqual(worldEvaluation('infrastructure'), ['忠実度', '生成効率'])
  const local = worldEvaluation('policy')
  local.pop()
  assert.equal(worldEvaluation('policy').length, 3)
  assert.throws(() => worldEvaluation('unknown'), RangeError)
})
test('lineage, world models and physical AI provide 31 readable paused stages', () => {
  assert.equal(Object.values(AGENT_LINEAGE_STAGES).reduce((sum, stages) => sum + stages.length, 0), 31)
  for (const stages of Object.values(AGENT_LINEAGE_STAGES)) for (const stage of stages) assert.ok(stage.label && stage.title && stage.detail)
})
