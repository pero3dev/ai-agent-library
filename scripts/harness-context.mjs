#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { collectDocs } from './lib/md-utils.mjs'
import { roadmapTasks } from './harness-policy.mjs'
import { cli, git, jsonFile, parseOptions, ROOT, verificationManifest } from './lib/tooling-common.mjs'

const rulesFor = {
  'new-doc': ['AGENTS.md', 'harness/writing-rules.md', 'templates/doc-template.md', '.agents/skills/new-doc/SKILL.md'],
  'article-update': ['AGENTS.md', 'harness/writing-rules.md'],
  freshness: ['AGENTS.md', 'harness/writing-rules.md', 'freshness-automation.md', '.agents/skills/freshness-maintenance/SKILL.md'],
  'publish-review': ['AGENTS.md', 'harness/writing-rules.md', '.agents/skills/publish-review/SKILL.md'],
  examples: ['AGENTS.md', 'harness/writing-rules.md', '.agents/skills/examples-check/SKILL.md', 'examples/README.md'],
  website: ['AGENTS.md', 'CONTRIBUTING.md', 'website/package.json'],
  harness: ['AGENTS.md', 'CONTRIBUTING.md', 'harness/verification.json']
}
export function selectTask(markdown, task, docs = []) {
  if (!task) return null
  const inventory = docs.map(doc => doc.repoRel)
  const row = roadmapTasks(markdown, inventory).get(task)
  if (!row) throw new Error(`ROADMAP にタスクがありません: ${task}`)
  return { ...row, artifacts: row.artifacts.map(file => ({ declared: file, resolved: inventory.includes(file) ? file : null, status: inventory.includes(file) ? 'exists' : 'planned-or-missing' })) }
}
export function buildContext(root = ROOT, { profile = 'harness', task } = {}) {
  const catalog = jsonFile(path.join(root, 'harness/profiles.json'))
  if (catalog.schema_version !== 1 || !catalog.profiles?.[profile] || !rulesFor[profile]) throw new Error(`未対応の profile: ${profile}`)
  const roadmap = readFileSync(path.join(root, 'ROADMAP.md'), 'utf8')
  return {
    schema_version: 1, commit: git(root, 'rev-parse', 'HEAD'), profile, contract: catalog.profiles[profile],
    roadmap: { source: 'ROADMAP.md', sha256: crypto.createHash('sha256').update(roadmap).digest('hex'), task: selectTask(roadmap, task, collectDocs(root)) },
    instructions: rulesFor[profile].map(file => ({ path: file, text: readFileSync(path.join(root, file), 'utf8') })),
    verification: verificationManifest(root).checks.filter(row => ['unit', 'markdown', 'articles', 'links'].includes(row.id) || (profile === 'harness' && ['harness', 'windows'].includes(row.id)) || (profile === 'website' && row.job === 'build') || (profile === 'examples' && row.id === 'python')),
    authorization: '依頼・セッションの許可を作業契約へ記録してください。この出力は新しい外部操作を許可しません。'
  }
}
await cli(import.meta.url, () => { const options = parseOptions(process.argv.slice(2), ['root', 'profile', 'task']); return buildContext(options.root ?? ROOT, options) })
