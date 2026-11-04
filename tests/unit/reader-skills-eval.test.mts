import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { forEachBounded, observeSkillReads, parseReaderEvalArgs, scoreTriggerResults, validateTriggerDataset, validateTriggerReport } from '../../scripts/evaluate-reader-skills.mjs'
import type { ReaderSkill } from '../../scripts/evaluate-reader-skills.mts'

const dataset = JSON.parse(readFileSync(new URL('../../plugins/ai-agent-library/evals/cases.json', import.meta.url), 'utf8')) as unknown

test('fixed routing dataset has ten positives, ten negatives, unique IDs and four expected skills', () => {
  const checked = validateTriggerDataset(dataset)
  assert.equal(checked.cases.filter(item => item.expected_skill === null).length, 10)
  assert.equal(checked.cases.length, 20)
  assert.throws(() => validateTriggerDataset({ ...checked, cases: checked.cases.slice(1) }), /20例/)
  assert.throws(() => validateTriggerDataset({ ...checked, cases: checked.cases.map((item, index) => index === 1 ? checked.cases[0] : item) }), /重複/)
  assert.throws(() => validateTriggerDataset({ ...checked, cases: checked.cases.map(item => ({ ...item, expected_skill: 'wrong-skill' })) }), /未知/)
})

test('observer counts actual complete successful reads, not filenames, grep, failed reads or self-report', () => {
  const skill: ReaderSkill = 'agent-design-review'
  const source = '---\nname: agent-design-review\n---\n\n# 実際の手順\n根拠を確認する。\n'
  const sources = new Map([[skill, source]])
  const event = (command: string, output: string, exitCode = 0) => JSON.stringify({ type: 'item.completed', item: {
    type: 'command_execution', command, aggregated_output: output, exit_code: exitCode,
  } })
  const filename = '.agents/skills/agent-design-review/SKILL.md'
  const noise = [event(`Get-ChildItem ${filename}`, source), event(`rg name ${filename}`, source), event(`Get-Content ${filename}`, 'file missing', 1),
    event(`echo cat ${filename}`, source), event(`Get-Content ${filename}`, 'name: agent-design-review'),
    JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'agent-design-reviewを使いました' } }), 'not json'].join('\n')
  assert.deepEqual(observeSkillReads(noise, sources).reads, [])
  const good = event(`Get-Content -Raw '${filename}'`, source.replace(/\n/g, '\r\n'))
  const observed = observeSkillReads(noise + '\n' + good + '\n' + JSON.stringify({ type: 'turn.completed' }), sources)
  assert.equal(observed.reads.length, 1)
  assert.equal(observed.reads[0].skill, skill)
  assert.equal(observed.reads[0].full_text_matched, true)
  assert.equal(observed.turn_completed, true)
  assert.equal(observed.observed_model, null)
  const mixed = observeSkillReads(event(`Get-Content '${filename}'; rg --files -g AGENTS.md`, source, 1), sources)
  assert.equal(mixed.reads.length, 1)
  assert.equal(mixed.reads[0].command_exit_code, 1)
  const blocked = observeSkillReads(JSON.stringify({ type: 'turn.completed' }), sources,
    'ERROR codex_core::tools::router: error=exec_command failed: CreateProcess Rejected("Get-Content .agents/skills/agent-design-review/SKILL.md blocked by policy")')
  assert.equal(blocked.reads.length, 0)
  assert.match(blocked.execution_error!, /blocked/)
  assert.deepEqual(blocked.attempted_skills, [skill])
  assert.equal(observeSkillReads('', sources, 'WARN failed shell snapshot').execution_error, null)
})

test('score separates execution errors, any activation and exact routing', () => {
  const metrics = scoreTriggerResults([
    { expected_skill: 'agent-design-review', observed_skills: ['agent-design-review'], completed: true },
    { expected_skill: 'agent-security-review', observed_skills: ['agent-eval-plan'], completed: true },
    { expected_skill: 'agent-architecture-choice', observed_skills: [], completed: true },
    { expected_skill: null, observed_skills: [], completed: true },
    { expected_skill: null, observed_skills: ['agent-eval-plan'], completed: true },
    { expected_skill: null, observed_skills: [], completed: false },
  ])
  assert.equal(metrics.true_positive, 2)
  assert.equal(metrics.expected_skill_hits, 1)
  assert.equal(metrics.false_positive, 1)
  assert.equal(metrics.true_negative, 1)
  assert.equal(metrics.false_negative, 1)
  assert.equal(metrics.execution_errors, 1)
  assert.equal(metrics.activation_accuracy, 3 / 5)
  assert.equal(metrics.exact_route_accuracy, 2 / 5)
})

test('model execution requires explicit run, trusted entrypoint and absolute owned output', () => {
  assert.equal(parseReaderEvalArgs(['--check']).run, false)
  assert.equal(parseReaderEvalArgs(['--run', '--codex-js', '/tmp/codex.js', '--output-dir', '/tmp/owned-fixture', '--approve-for-me']).automaticReview, true)
  assert.throws(() => parseReaderEvalArgs([]), /1つ/)
  assert.throws(() => parseReaderEvalArgs(['--run']), /必要/)
  assert.throws(() => parseReaderEvalArgs(['--run', '--codex-js', '/tmp/codex.js', '--output-dir', 'relative']), /絶対/)
  assert.throws(() => parseReaderEvalArgs(['--check', '--max-cases', '21']), /1〜20/)
  assert.throws(() => parseReaderEvalArgs(['--check', '--timeout-ms', '999']), /10000〜180000/)
  assert.throws(() => parseReaderEvalArgs(['--check', '--concurrency', '3']), /1〜2/)
})

test('case scheduler respects two in-flight executions and stops after an execution error', async () => {
  let active = 0; let peak = 0
  const calls: number[] = []
  await forEachBounded([1, 2, 3, 4], 2, async item => {
    calls.push(item); active++; peak = Math.max(active, peak)
    await new Promise(resolve => setTimeout(resolve, 5))
    active--; return true
  })
  assert.equal(peak, 2)
  assert.deepEqual(calls, [1, 2, 3, 4])
  const stopped: number[] = []
  await forEachBounded([1, 2, 3, 4], 2, async item => {
    stopped.push(item)
    await new Promise(resolve => setTimeout(resolve, item === 1 ? 1 : 10))
    return item !== 1
  })
  assert.deepEqual(stopped, [1, 2])
})

test('resume report cannot pad coverage with duplicates, relabel cases or redirect artifact paths', () => {
  const checked = validateTriggerDataset(dataset)
  const first = checked.cases[0]
  const result = { id: first.id, expected_skill: first.expected_skill, completed: true, timed_out: false, reads: [], observed_skills: [],
    artifacts: { events: `${first.id}/events.jsonl`, stderr: `${first.id}/stderr.txt`, answer: `${first.id}/answer.txt` }, exit_code: 0, duration_ms: 1 }
  const report = { schema_version: 1, dataset_id: checked.dataset_id, results: [result], execution: {}, cli_version: 'test',
    dataset_sha256: 'a'.repeat(64), skills_sha256: 'b'.repeat(64) }
  assert.equal(validateTriggerReport(report, checked).results.length, 1)
  assert.throws(() => validateTriggerReport({ ...report, results: [result, result] }, checked), /重複/)
  assert.throws(() => validateTriggerReport({ ...report, results: [{ ...result, expected_skill: null }] }, checked), /期待値/)
  assert.throws(() => validateTriggerReport({ ...report, results: [{ ...result, artifacts: { ...result.artifacts, events: '../other.jsonl' } }] }, checked), /実行結果/)
})
