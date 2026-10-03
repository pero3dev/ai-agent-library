import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { readRoadmapSource, roadmapSource, ROADMAP_HISTORY } from '../../scripts/lib/roadmap-source.mjs'
import { roadmapTasks } from '../../scripts/harness-policy.mjs'

const table = (id, file) => `| タスク | 成果物 | ステータス |\n| --- | --- | --- |\n| ${id} | \`${file}\` | 完了 |\n`

test('old layouts and split history resolve the same complete task inventory', () => {
  const old = table('2-1', 'docs/01-concepts/agent-loop.md')
  const files = new Map([['ROADMAP.md', old]])
  const read = file => { assert.ok(files.has(file)); return files.get(file) }
  const inventory = ['docs/01-concepts/agent-loop.md']
  const before = roadmapTasks(roadmapSource(read, file => files.has(file)), inventory)
  files.set('ROADMAP.md', '# 作業の入口\n[History](malicious.md)\n')
  files.set(ROADMAP_HISTORY, old)
  assert.deepEqual(roadmapTasks(roadmapSource(read, file => files.has(file)), inventory), before)
})

test('duplicate IDs across current roadmap and history fail instead of masking a task', () => {
  const text = table('2-1', 'docs/01-concepts/agent-loop.md')
  assert.throws(() => roadmapTasks(roadmapSource(() => text, () => true), ['docs/01-concepts/agent-loop.md']), /重複/)
})

test('filesystem source reads the fixed history path and ignores arbitrary Markdown links', t => {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-roadmap-'))
  t.after(() => { assert.equal(path.dirname(root), base); rmSync(root, { recursive: true, force: true }) })
  writeFileSync(path.join(root, 'ROADMAP.md'), '# Entry\n[Ignore](outside.md)\n')
  assert.match(readRoadmapSource(root), /Entry/)
  mkdirSync(path.dirname(path.join(root, ROADMAP_HISTORY)), { recursive: true })
  writeFileSync(path.join(root, ROADMAP_HISTORY), table('2-1', 'docs/01-concepts/agent-loop.md'))
  assert.match(readRoadmapSource(root), /2-1/)
})
