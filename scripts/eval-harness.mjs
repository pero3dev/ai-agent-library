#!/usr/bin/env node
// Default evaluations are offline. Actual Codex runs require an explicit mode and binary.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const suites = Object.freeze([
  'sync-harness.test.mjs', 'hooks.test.mjs', 'markdown-validation.test.mjs',
  'freshness-policy.test.mjs', 'harness-policy.test.mjs', 'github-evidence.test.mjs',
  'freshness-run.test.mjs', 'freshness-registry.test.mjs', 'harness-run.test.mjs',
]);
const git = (...args) => run('git', args, { cwd: root }).stdout.trim();
function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, { encoding: 'utf8', windowsHide: true, timeout: 600000, maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(binary)} failed: ${result.error?.message ?? (result.stderr || result.stdout).slice(-3000)}`);
  return result;
}
export function parseOptions(argv) {
  const options = { mode: 'fixture', scenario: 'authoring', ref: 'HEAD' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].slice(2);
    if (!['mode', 'ref', 'scenario', 'binary', 'run'].includes(key) || !argv[i].startsWith('--') || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Invalid option: ${argv[i]}`);
    options[key] = argv[i + 1];
  }
  if (!['fixture', 'prepare', 'agent', 'collect'].includes(options.mode)) throw new Error('mode must be fixture, prepare, agent, or collect');
  if (options.scenario !== 'authoring') throw new Error('Unknown scenario');
  if (options.mode === 'agent' && (!options.binary || !path.isAbsolute(options.binary) || !fs.statSync(options.binary).isFile() || /\.(?:cmd|bat|ps1)$/i.test(options.binary))) throw new Error('agent mode requires an absolute native Codex executable; shell wrappers are not accepted');
  if (options.mode === 'collect' && !options.run) throw new Error('collect requires --run');
  return options;
}
export function summarizeEvents(text) {
  const events = text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
  const completed = events.filter(event => event.type === 'item.completed');
  const turns = events.filter(event => event.type === 'turn.completed');
  return {
    thread_id: events.find(event => event.type === 'thread.started')?.thread_id ?? null,
    completed_turns: turns.length,
    failed_turns: events.filter(event => event.type === 'turn.failed' || event.type === 'error').length,
    command_count: completed.filter(event => event.item?.type === 'command_execution').length,
    command_failures: completed.filter(event => event.item?.type === 'command_execution' && event.item.exit_code !== 0).length,
    usage: turns.at(-1)?.usage ?? null,
    // This is an observed command list, not proof every instruction was loaded.
    commands: completed.filter(event => event.item?.type === 'command_execution').map(event => event.item.command),
  };
}
function evaluationHome() {
  return path.join(path.resolve(root, git('rev-parse', '--git-common-dir')), 'harness-evaluations');
}
function ownedRun(directory) {
  const home = evaluationHome();
  const target = path.resolve(directory);
  if (path.dirname(target) !== home || !fs.existsSync(path.join(target, 'evaluation.json'))) throw new Error('Run must be a direct, owned child of this repository evaluation directory');
  for (let current = target; current !== path.dirname(home); current = path.dirname(current)) if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Linked evaluation paths are not accepted');
  return target;
}
function prepare(options) {
  const ref = git('rev-parse', '--verify', `${options.ref}^{commit}`);
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Expected a resolved commit');
  const home = evaluationHome();
  fs.mkdirSync(home, { recursive: true });
  const directory = fs.mkdtempSync(path.join(home, `${options.scenario}-`));
  const checkout = path.join(directory, 'checkout');
  const archive = path.join(directory, 'source.tar');
  fs.mkdirSync(checkout);
  run('git', ['archive', '--format=tar', '-o', archive, ref], { cwd: root });
  run('tar', ['-xf', archive, '-C', checkout]);
  run('git', ['init', '-b', 'main'], { cwd: checkout });
  run('git', ['config', 'user.name', 'Harness evaluation'], { cwd: checkout });
  run('git', ['config', 'user.email', 'codex@openai.com'], { cwd: checkout });
  fs.appendFileSync(path.join(checkout, 'ROADMAP.md'), '\n## 隔離評価タスク\n\n| ID | 内容 | 成果物 | 状態 |\n| --- | --- | --- | --- |\n| HARNESS-EVAL-1 | Agentの停止条件と予算の設計 | `01-concepts/termination-budget.md` | 未着手 |\n');
  run('git', ['add', '.'], { cwd: checkout });
  run('git', ['commit', '-m', 'Prepare isolated harness evaluation', '-m', 'Co-authored-by: Codex <codex@openai.com>'], { cwd: checkout });
  const prompt = fs.readFileSync(path.join(root, 'tests/harness/authoring-prompt.txt.example'), 'utf8');
  fs.writeFileSync(path.join(directory, 'prompt.txt'), prompt);
  const record = { schema_version: 1, scenario: options.scenario, source_sha: ref, fixture_sha: run('git', ['rev-parse', 'HEAD'], { cwd: checkout }).stdout.trim(), prompt_sha256: crypto.createHash('sha256').update(prompt).digest('hex'), created_at: new Date().toISOString(), checkout, instruction_bytes: fs.statSync(path.join(checkout, 'AGENTS.md')).size, status: 'prepared', evidence_class: 'fixture-preparation' };
  fs.writeFileSync(path.join(directory, 'evaluation.json'), `${JSON.stringify(record, null, 2)}\n`);
  return { directory, ...record };
}
function collect(directory) {
  const owned = ownedRun(directory);
  const record = JSON.parse(fs.readFileSync(path.join(owned, 'evaluation.json'), 'utf8'));
  const events = path.join(owned, 'events.jsonl');
  const observed = fs.existsSync(events) ? summarizeEvents(fs.readFileSync(events, 'utf8')) : null;
  const changes = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: record.checkout }).stdout;
  const article = path.join(record.checkout, 'docs/01-concepts/termination-budget.md');
  const text = fs.existsSync(article) ? fs.readFileSync(article, 'utf8') : '';
  const report = { ...record, observed, changes: changes.trim().split(/\r?\n/).filter(Boolean), draft_created: /^status:\s*["']?draft["']?\s*$/m.test(text), reviewed_quality: 'requires-independent-review', collected_at: new Date().toISOString() };
  fs.writeFileSync(path.join(owned, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
async function agent(options) {
  const auth = run(options.binary, ['login', 'status']);
  if (!/ChatGPT/i.test(auth.stdout + auth.stderr)) throw new Error('This evaluation requires existing ChatGPT login; it does not configure API credentials');
  const prepared = prepare(options);
  const directory = prepared.directory;
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--ignore-scripts'], { cwd: prepared.checkout, shell: process.platform === 'win32' });
  const version = run(options.binary, ['--version']).stdout.trim();
  const startedAt = new Date();
  const stdout = fs.openSync(path.join(directory, 'events.jsonl'), 'w');
  const stderr = fs.openSync(path.join(directory, 'stderr.txt'), 'w');
  process.stdout.write(`${JSON.stringify({ status: 'running', directory, version })}\n`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(options.binary, ['exec', '--ephemeral', '--json', '-s', 'workspace-write', '-c', 'approval_policy="never"', '-o', path.join(directory, 'last-message.txt'), '-'], { cwd: prepared.checkout, windowsHide: true, timeout: 15 * 60000, stdio: ['pipe', stdout, stderr] });
    child.on('error', reject); child.on('close', resolve);
    child.stdin.on('error', () => {});
    child.stdin.end(fs.readFileSync(path.join(directory, 'prompt.txt')));
  }).finally(() => { fs.closeSync(stdout); fs.closeSync(stderr); });
  const recordFile = path.join(directory, 'evaluation.json');
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  Object.assign(record, { evidence_class: 'actual-agent', binary: options.binary, version, started_at: startedAt.toISOString(), ended_at: new Date().toISOString(), elapsed_ms: Date.now() - startedAt.getTime(), exit_code: exitCode, status: exitCode === 0 ? 'executed' : 'failed' });
  fs.writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`);
  return collect(directory);
}
export async function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  if (options.mode === 'prepare') return prepare(options);
  if (options.mode === 'collect') return collect(options.run);
  if (options.mode === 'agent') return agent(options);
  const result = run(process.execPath, ['--test', ...suites.map(file => path.join(root, 'scripts', file))], { cwd: root });
  return { evidence_class: 'offline-fixture', passed: true, suites, report: result.stdout, actual_agent: 'not-run', github: 'not-run', publication: 'not-run' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
