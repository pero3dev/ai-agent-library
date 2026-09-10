import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkHarness, isActiveTeachingFile, parseConfiguration, validateSchemaReferences, verificationDrift } from '../../scripts/check-harness.mjs'
import { checkCommand, describeChecks, runChecks } from '../../scripts/check-ci.mjs'
import { selectTask } from '../../scripts/harness-context.mjs'
import { readObservations, selectedConfig } from '../../scripts/harness-doctor.mjs'
import { measureStorage, summarizeHealth } from '../../scripts/harness-health.mjs'
import { filesUnder, resolvePython, ROOT, versionSupported } from '../../scripts/lib/tooling-common.mjs'

function fixture(t) {
  const base = path.resolve(os.tmpdir())
  const root = mkdtempSync(path.join(base, 'ai-agent-library-tooling-'))
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), base)
    assert.ok(path.basename(root).startsWith('ai-agent-library-tooling-'))
    rmSync(root, { recursive: true, force: true })
  })
  const write = (file, content) => { const target = path.join(root, file); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content)) }
  return { root, write }
}

test('YAML and TOML parsers handle multiline values and reject duplicate or malformed keys', () => {
  assert.equal(parseConfiguration('role.toml', 'name="role"\ndeveloper_instructions="""line1\nline2"""').developer_instructions, 'line1\nline2')
  assert.equal(parseConfiguration('role.md', '---\nname: role\ndescription: >\n  first\n  second\n---\n# Body').description.trim(), 'first second')
  for (const [file, text] of [['a.yml', 'name: one\nname: two'], ['a.toml', 'name="one"\nname="two"'], ['a.json', '{invalid'], ['role.md', '# No metadata']]) assert.throws(() => parseConfiguration(file, text))
})

test('teaching settings are inert across examples, templates and harness test fixtures', () => {
  for (const file of ['examples/demo/AGENTS.md', 'examples/demo/agents.md', 'examples/demo/AGENTS.MD', 'examples/demo/CLAUDE.local.md', 'examples/demo/.CODEX/CONFIG.TOML', 'examples/demo/.codex/agents/writer.toml', 'examples/demo/.claude/agents/writer.md', 'examples/demo/.claude/commands/nested/run.md', 'examples/demo/.claude/rules/nested/files.md', 'examples/demo/.github/prompts/run.prompt.md', 'templates/demo/SKILL.md', 'tests/harness/case/.codex/config.toml', 'tests/other/AGENTS.md', 'tests/fixture/.claude/settings.json', 'harness/fixtures/example/.claude/settings.json']) {
    assert.equal(isActiveTeachingFile(file), true)
    assert.equal(isActiveTeachingFile(file + '.example'), false)
  }
  for (const file of ['AGENTS.md', '.agents/skills/real/SKILL.md', 'tests/harness/README.md', 'examples/settings.json']) assert.equal(isActiveTeachingFile(file), false)
})

test('a dangling teaching root link cannot disappear from the inventory', t => {
  const { root } = fixture(t)
  assert.deepEqual(filesUnder(root, 'tests'), [])
  symlinkSync(path.join(root, 'missing-owned-target'), path.join(root, 'tests'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => filesUnder(root, 'tests'), /symlink/)
})

test('schema verification resolves escaped local references and rejects dangling requirements or references', () => {
  const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['name'], properties: { name: { $ref: '#/$defs/a~1b' } }, $defs: { 'a/b': { type: 'string' } } }
  assert.doesNotThrow(() => validateSchemaReferences(schema))
  assert.throws(() => validateSchemaReferences({ ...schema, $defs: {} }))
  assert.throws(() => validateSchemaReferences({ ...schema, required: ['missing'] }))
})

test('doctor reports selected configuration origins without exposing unrelated secrets or asserting hook firing', () => {
  const rows = selectedConfig({ model: 'gpt-example', api_key: 'DO_NOT_EXPOSE', mcp_servers: { server: { token: 'DO_NOT_EXPOSE' } }, features: { hooks: true }, projects: { '/repo': { trust_level: 'trusted' } } }, '/user/config.toml', '/repo')
  assert.equal(rows.length, 3)
  assert.ok(rows.every(row => row.source === '/user/config.toml' && row.classification === 'configured'))
  assert.equal(rows.at(-1).hook_trust, 'unknown')
  assert.doesNotMatch(JSON.stringify(rows), /DO_NOT_EXPOSE|mcp_servers/)
  assert.equal(selectedConfig({ model: { secret: 'DO_NOT_EXPOSE' } }, 'config', '/repo')[0].value, 'invalid-type')
})

test('Python selection detects an unsupported PATH interpreter and uses an available launcher without installation', t => {
  assert.equal(versionSupported('Python 3.10.1', 'python'), 'unsupported')
  assert.equal(versionSupported('Python 3.11.3', 'python'), 'supported')
  const selected = resolvePython({ platform: 'win32', execute: binary => binary === 'python' ? 'Python 3.10.1' : 'Python 3.11.3' })
  assert.equal(selected.binary, 'py')
  assert.deepEqual(selected.args, ['-3.11'])
  assert.equal(resolvePython({ platform: 'linux', execute: () => { throw new Error('not installed') } }).result, 'unknown')
  const { root, write } = fixture(t)
  write('python.exe', 'inert version probe fixture')
  const binary = path.join(root, 'python.exe')
  assert.equal(resolvePython({ python: binary, execute: () => 'Python 3.11.3' }).binary, binary)
  assert.equal(resolvePython({ python: binary, execute: () => 'Python 3.10.1' }).result, 'unknown', 'explicit unsupported interpreter does not fall back')
  assert.throws(() => resolvePython({ python: 'relative/python.exe' }))
})

test('reported observations remain bound to version and time; missing observations are unknown', t => {
  const { root, write } = fixture(t)
  const file = path.join(root, 'observations.json')
  assert.deepEqual(readObservations(), [])
  write('observations.json', { schema_version: 1, observations: [{ kind: 'model-compatibility', surface: 'Codex CLI', version: '0.141.0', result: 'failed', observed_at: '2026-01-01T01:00:00Z', evidence: 'fixture run' }] })
  const [record] = readObservations(file, new Date('2026-01-02T00:00:00Z'))
  assert.equal(record.result, 'failed')
  assert.equal(record.rerun_in_this_command, false)
  assert.equal(record.version, '0.141.0')
  assert.throws(() => readObservations(file, new Date('2025-01-01T00:00:00Z')))
  write('observations.json', { schema_version: 1, observations: [{ ...record, api_key: 'do-not-print' }] })
  assert.throws(() => readObservations(file))
  assert.throws(() => readObservations(path.join(root, 'auth.json')))
})

test('health separates configuration, app registration, starts and saved publication evidence', () => {
  const unknown = summarizeHealth({})
  assert.equal(unknown.harness.availability, 'unknown')
  assert.equal(unknown.automation.availability, 'unknown')
  const value = summarizeHealth({
    freshness: { runs: { a: { outcome: 'merged' } }, pending: [{ id: 'source', next_retry_at: '2026-01-03T00:00:00Z' }] },
    harness: { state: { runs: { a: { status: 'completed', started_at: '2026-01-01T00:00:00Z' } } }, records: [{ run_id: 'a', github_verification: { verified: true, checked_at: '2026-01-01T01:00:00Z', publication: { verified: true, state: 'superseded' } } }], queue: { waiting_external: [{ run_id: 'b', next_eligible_at: '2026-01-01T00:00:00Z' }] } },
    registration: { registered: 1, expected: 2, tasks: [{ id: 'task', configured_status: 'ACTIVE', status: 'PAUSED', last_run_at: null }] }
  }, new Date('2026-01-02T00:00:00Z'))
  assert.deepEqual(value.freshness.published, [], 'merged status alone does not prove a live publication')
  assert.equal(value.freshness.pending_observations[0].next_retry_at, '2026-01-03T00:00:00Z')
  assert.equal(value.harness.published[0].state, 'superseded')
  assert.equal(value.harness.waiting[0].overdue, true)
  assert.equal(value.automation.tasks[0].configured, 'ACTIVE')
  assert.equal(value.automation.tasks[0].registered_status, 'PAUSED')
  assert.equal(value.automation.tasks[0].last_started_at, null)
  assert.equal(summarizeHealth({ harness: { status: 'recovery_required', recovery: { pending: true } } }).harness.successful, 'unknown')
  assert.equal(summarizeHealth({ freshness: { recovery: { needed: true }, runs: {} } }).freshness.successful, 'unknown')
  assert.equal(summarizeHealth({ harness: { compatibility: { supported: false } } }).harness.availability, 'unknown')
  const local = summarizeHealth({ harness: { state: { runs: { a: { status: 'local' } } }, records: [{ run_id: 'a', status: 'local', completed_at: '2026-01-01T01:00:00Z' }] } }).harness
  assert.equal(local.successful, 1)
  assert.equal(local.last_success_at, '2026-01-01T01:00:00.000Z')
})

test('context selects an actual ROADMAP task table and preserves planned artifacts', () => {
  const table = '| タスク | 内容 | 成果物 | ステータス |\n| --- | --- | --- | --- |\n| 2-1 | Work | `topic.md`, `01-concepts/future.md` | 完了 |\n| 2-10 | Other | `01-concepts/other.md` | 未着手 |\n'
  const markdown = '# Roadmap\n\n### Phase\n```markdown\n' + table + '```\n<!--\n' + table + '-->\n\n' + table
  const row = selectTask(markdown, '2-1', [{ repoRel: 'docs/01-concepts/topic.md' }])
  assert.equal(row.id, '2-1')
  assert.equal(row.status, '完了')
  assert.equal(row.artifacts.find(item => item.declared.endsWith('/topic.md')).resolved, 'docs/01-concepts/topic.md')
  assert.equal(row.artifacts.find(item => item.declared.endsWith('/future.md')).status, 'planned-or-missing')
  assert.throws(() => selectTask(markdown + '\n' + table, '2-1', [{ repoRel: 'docs/01-concepts/topic.md' }]))
  assert.throws(() => selectTask('```markdown\n' + table + '```', '2-1'))
  assert.throws(() => selectTask(markdown, 'missing'))
})

test('health measures owned run and evaluation logs without counting checkouts or installing/deleting files', t => {
  const { root, write } = fixture(t)
  write('harness/run.json', '123')
  write('freshness/log.json', '45')
  write('harness-evaluations/test/events.jsonl', '6789')
  write('harness-evaluations/test/checkout/large-file', 'excluded')
  write('harness-eval/test/node_modules/package', 'excluded')
  write('harness-tools/python/large-file', 'excluded')
  const result = measureStorage(root, { threshold: 8 })
  assert.equal(result.bytes, 9)
  assert.equal(result.files, 3)
  assert.equal(result.inventory_required, true)
  assert.equal(result.automatic_deletion, false)
  assert.equal(readFileSync(path.join(root, 'harness/run.json'), 'utf8'), '123')
})

test('verification manifest rejects CI command, working directory and optional-step drift', () => {
  const manifest = { checks: [{ id: 'test', job: 'docs', command: 'npm test', cwd: 'website' }] }
  const workflow = step => ({ jobs: { docs: { steps: [step] } } })
  const good = { run: 'npm test', 'working-directory': 'website' }
  assert.deepEqual(verificationDrift(manifest, workflow(good)), [])
  for (const step of [{ ...good, run: 'npm run another-test' }, { ...good, 'working-directory': '.' }, { ...good, if: 'false' }, { ...good, 'continue-on-error': true }]) assert.equal(verificationDrift(manifest, workflow(step)).length, 1)
  for (const field of [{ if: 'false' }, { 'continue-on-error': true }]) assert.equal(verificationDrift(manifest, { jobs: { docs: { ...field, steps: [good] } } }).length, 1)
  assert.deepEqual(verificationDrift(manifest, { defaults: { run: { 'working-directory': 'website' } }, jobs: { docs: { steps: [{ run: 'npm test' }] } } }), [])
})

test('CI inventory cannot claim unexecuted checks or execute deploy through a selected command', () => {
  const inventory = describeChecks(ROOT, 'linux')
  assert.ok(inventory.checks.every(row => row.result === 'not-run'))
  assert.equal(inventory.checks.find(row => row.id === 'windows').availability, 'other-os')
  assert.ok(inventory.excluded_actions.includes('deploy'))
  for (const command of ['npm run deploy', 'npm publish', 'curl https://example.com', 'node scripts/test.mjs; echo bad']) assert.throws(() => checkCommand(command))
})

test('selected CI checks reject bad IDs before execution and retain failed and other-OS outcomes', () => {
  let calls = 0
  const execute = () => { calls++; throw new Error('fixture failure') }
  assert.throws(() => runChecks(ROOT, 'articles,unknown', { platform: 'linux', execute }))
  assert.equal(calls, 0)
  const result = runChecks(ROOT, 'articles,windows', { platform: 'linux', execute })
  assert.equal(calls, 1)
  assert.equal(result.verified, false)
  assert.deepEqual(result.results.map(row => row.result), ['failed', 'not-run'])
})

function configuredFixture(t) {
  const { root, write } = fixture(t)
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) if (entry.isFile() && entry.name.endsWith('.md')) cpSync(path.join(ROOT, entry.name), path.join(root, entry.name))
  for (const dir of ['.agents', '.claude', '.codex', '.github', 'harness', 'project', 'templates', 'examples', 'docs', 'scripts/schemas']) if (existsSync(path.join(ROOT, dir))) cpSync(path.join(ROOT, dir), path.join(root, dir), { recursive: true, filter: source => !source.split(path.sep).some(part => ['node_modules', '.venv', '__pycache__'].includes(part)) })
  if (!existsSync(path.join(root, 'harness/profiles.json'))) write('harness/profiles.json', { schema_version: 1, profiles: Object.fromEntries(['new-doc', 'article-update', 'freshness', 'publish-review', 'examples', 'website', 'harness'].map(name => [name, { allowed_roots: [], allowed_files: [], extensions: [], completion: 'local', review_required: false }])) })
  for (const file of ['.codex/hooks.json', '.claude/settings.json']) {
    const config = JSON.parse(readFileSync(path.join(root, file), 'utf8'))
    for (const event of ['PreToolUse', 'PostToolUse']) {
      config.hooks[event][0].hooks[0].command = 'fixture-expected-command'
      if (file === '.codex/hooks.json') config.hooks[event][0].hooks[0].commandWindows = 'fixture-expected-windows-command'
    }
    write(file, config)
  }
  return { root, write, options: { trackedFiles: [], hooks: { hookCommand: () => 'fixture-expected-command', codexWindowsHookCommand: () => 'fixture-expected-windows-command', generatedPath: file => file.startsWith('website/generated/') } } }
}

test('harness verification detects source drift, role metadata, hook changes and tracked generated files', async t => {
  const { root, write, options } = configuredFixture(t)
  const clean = await checkHarness(root, options)
  assert.deepEqual(clean.problems, [])
  write('CLAUDE.md', 'drift')
  write('.codex/agents/doc-reviewer.toml', 'name="wrong"\ndescription="fixture"\ndeveloper_instructions="fixture"')
  write('tests/outside-harness/AGENTS.md', 'active fixture')
  options.trackedFiles.push('website/generated/file.json')
  const value = await checkHarness(root, options)
  assert.equal(value.verified, false)
  for (const expected of [/同期/, /name \/ description/, /sandbox_mode/, /教材設定/, /生成物/]) assert.match(value.problems.join('\n'), expected)
})

test('existing review roles must keep their read-only sandbox even with valid metadata', async t => {
  const { root, write, options } = configuredFixture(t)
  const file = '.codex/agents/freshness-checker.toml'
  const original = readFileSync(path.join(root, file), 'utf8')
  for (const text of [original.replace('sandbox_mode = "read-only"', 'sandbox_mode = "workspace-write"'), original.replace('sandbox_mode = "read-only"', '')]) {
    write(file, text)
    assert.match((await checkHarness(root, options)).problems.join('\n'), /sandbox_mode/)
  }
  const claude = '.claude/agents/doc-reviewer.md'
  write(claude, readFileSync(path.join(root, claude), 'utf8').replace('tools: Read, Grep, Glob', 'tools: Read, Write, Bash'))
  assert.match((await checkHarness(root, options)).problems.join('\n'), /tools が共通 contract と不一致/)
})

test('teaching inventory examines files in old and relocated tests areas, including hidden settings', async t => {
  const { root, write, options } = configuredFixture(t)
  const active = ['tests/harness/old/AGENTS.md', 'tests/unit/fixture/CLAUDE.md', 'tests/helpers/sample/SKILL.md', 'tests/fixtures/harness/new/.codex/config.toml']
  for (const file of active) write(file, 'inert test input')
  const unsafe = await checkHarness(root, options)
  assert.equal(unsafe.verified, false)
  assert.deepEqual(unsafe.problems.filter(problem => problem.startsWith('教材設定')).sort(), active.map(file => `教材設定を .example にしてください: ${file}`).sort())
  for (const file of active) renameSync(path.join(root, file), path.join(root, file + '.example'))
  assert.deepEqual((await checkHarness(root, options)).problems, [])
})

test('hook command mismatch and malformed settings are not a successful harness check', async t => {
  const { root, write, options } = configuredFixture(t)
  write('.codex/hooks.json', '{invalid')
  const claude = JSON.parse(readFileSync(path.join(root, '.claude/settings.json'), 'utf8'))
  claude.hooks.PreToolUse[0].hooks[0].command = 'different'
  write('.claude/settings.json', claude)
  const result = await checkHarness(root, options)
  assert.equal(result.verified, false)
  assert.match(result.problems.join('\n'), /command が共通 contract と不一致/)
  assert.match(result.problems.join('\n'), /\.codex\/hooks\.json/)
})

test('Codex Windows hook override cannot be removed or drift even when portable commands match', async t => {
  const { root, write, options } = configuredFixture(t)
  const original = JSON.parse(readFileSync(path.join(root, '.codex/hooks.json'), 'utf8'))
  for (const event of ['PreToolUse', 'PostToolUse']) {
    for (const value of [undefined, 'different-command', null]) {
      const config = structuredClone(original)
      config.hooks[event][0].hooks[0].commandWindows = value
      write('.codex/hooks.json', config)
      const result = await checkHarness(root, options)
      assert.equal(result.verified, false)
      assert.match(result.problems.join('\n'), new RegExp(`${event} commandWindows`))
    }
  }
})
