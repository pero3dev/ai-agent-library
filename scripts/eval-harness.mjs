#!/usr/bin/env node
// Default evaluations are offline. Actual Codex runs require an explicit mode and binary.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, parseScalar, toLines } from './lib/md-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCRATCH_DIRECTORY = '.harness-eval-scratch';
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
  const common = fs.realpathSync(path.resolve(root, git('rev-parse', '--git-common-dir')));
  const home = path.join(common, 'harness-evaluations');
  assertUnlinked(home, common);
  return home;
}
export function assertUnlinked(target, anchor) {
  target = path.resolve(target);
  anchor = path.resolve(anchor);
  const relative = path.relative(anchor, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Evaluation path escaped its owned directory');
  for (let current = target; ; current = path.dirname(current)) {
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Linked evaluation paths are not accepted'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current === anchor) break;
  }
}
export function assertArchiveTree(listing) {
  for (const row of listing.split('\0').filter(Boolean)) {
    const entry = /^100(?:644|755) blob [a-f0-9]{40}\t([\s\S]+)$/.exec(row);
    if (!entry) throw new Error('Evaluation source must contain only regular files; symlinks and submodules are not extracted');
    if (['.git', SCRATCH_DIRECTORY].includes(entry[1].split('/')[0].toLowerCase())) throw new Error(`Evaluation source collides with reserved fixture path: ${entry[1]}`);
  }
}
/** Only a newly prepared, owned checkout gets this scratch directory and local Git exclusion. */
export function prepareExecutionEnvironment(checkout, ownedDirectory) {
  const owned = path.resolve(ownedDirectory);
  const target = path.resolve(checkout);
  assertUnlinked(target, owned);
  if (path.dirname(target) !== owned || path.basename(target) !== 'checkout' || !fs.statSync(target).isDirectory()) throw new Error('Execution environment requires the owned run checkout');
  const scratch = path.join(target, SCRATCH_DIRECTORY);
  const temporary = path.join(scratch, 'tmp');
  const npmCache = path.join(scratch, 'npm-cache');
  const gitDirectory = path.join(target, '.git');
  const info = path.join(gitDirectory, 'info');
  const exclude = path.join(info, 'exclude');
  for (const file of [scratch, gitDirectory, info, exclude]) assertUnlinked(file, target);
  if (fs.readdirSync(target).some(name => name.toLowerCase() === SCRATCH_DIRECTORY)) throw new Error(`Evaluation scratch path already exists: ${SCRATCH_DIRECTORY}`);
  if (!fs.statSync(gitDirectory).isDirectory()) throw new Error('Evaluation checkout must have its own Git directory');
  if (fs.existsSync(exclude) && !fs.statSync(exclude).isFile()) throw new Error('Evaluation Git exclude must be a regular file');
  fs.mkdirSync(scratch); // Exclusive creation: never overwrite an archived or concurrent path.
  fs.mkdirSync(temporary);
  fs.mkdirSync(npmCache);
  fs.mkdirSync(info, { recursive: true });
  fs.appendFileSync(exclude, `\n/${SCRATCH_DIRECTORY}/\n`);
  return {
    cwd: target, scratch_directory: scratch, temporary_directory: temporary, npm_cache_directory: npmCache,
    environment: { TEMP: temporary, TMP: temporary, TMPDIR: temporary, NODE_DISABLE_COMPILE_CACHE: '1', npm_config_cache: npmCache },
    inherit_parent_environment: true, git_exclude: '.git/info/exclude',
    dependency_install_command: 'npm ci --ignore-scripts',
    applies_to: ['dependency-install', 'agent-and-child-processes'],
  };
}
export function executionEnvironment(contract, parent = process.env) {
  const keys = ['TEMP', 'TMP', 'TMPDIR', 'NODE_DISABLE_COMPILE_CACHE', 'npm_config_cache'];
  if (!contract || !['cwd', 'scratch_directory', 'temporary_directory', 'npm_cache_directory'].every(key => typeof contract[key] === 'string' && path.isAbsolute(contract[key])) || !contract.environment || Object.keys(contract.environment).length !== keys.length || !keys.every(key => Object.hasOwn(contract.environment, key)) || contract.environment.TEMP !== contract.temporary_directory || contract.environment.TMP !== contract.temporary_directory || contract.environment.TMPDIR !== contract.temporary_directory || contract.environment.NODE_DISABLE_COMPILE_CACHE !== '1' || contract.environment.npm_config_cache !== contract.npm_cache_directory) throw new Error('Invalid prepared execution environment');
  for (const file of [contract.scratch_directory, contract.temporary_directory, contract.npm_cache_directory]) assertUnlinked(file, contract.cwd);
  if (contract.scratch_directory !== path.join(contract.cwd, SCRATCH_DIRECTORY) || contract.temporary_directory !== path.join(contract.scratch_directory, 'tmp') || contract.npm_cache_directory !== path.join(contract.scratch_directory, 'npm-cache') || !fs.statSync(contract.temporary_directory).isDirectory() || !fs.statSync(contract.npm_cache_directory).isDirectory()) throw new Error('Invalid prepared scratch path');
  // Windows の環境キーは大小文字を区別しない。古い NPM_CONFIG_CACHE 等を
  // 同時に渡して、子プロセスが意図しない方を採用することを防ぐ。
  const overridden = new Set(keys.map(key => key.toLowerCase()));
  const inherited = Object.fromEntries(Object.entries(parent).filter(([key]) => !overridden.has(key.toLowerCase())));
  return { ...inherited, ...contract.environment };
}
export function articleStatus(text) {
  const front = parseFrontMatter(toLines(text));
  if (!front || front.unclosed || front.errors.length) return null;
  const fields = front.fields.filter(field => field.key === 'status');
  return fields.length === 1 ? parseScalar(fields[0].value) : null;
}
function ownedRun(directory) {
  const home = evaluationHome();
  const target = path.resolve(directory);
  if (path.dirname(target) !== home || !fs.existsSync(path.join(target, 'evaluation.json'))) throw new Error('Run must be a direct, owned child of this repository evaluation directory');
  assertUnlinked(target, home);
  assertUnlinked(path.join(target, 'evaluation.json'), home);
  return target;
}
function prepare(options) {
  const ref = git('rev-parse', '--verify', `${options.ref}^{commit}`);
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Expected a resolved commit');
  assertArchiveTree(git('ls-tree', '-rz', '--full-tree', ref));
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
  const executionContract = prepareExecutionEnvironment(checkout, directory);
  fs.appendFileSync(path.join(checkout, 'ROADMAP.md'), '\n## 隔離評価タスク\n\n| タスク | 内容 | 成果物 | ステータス |\n| --- | --- | --- | --- |\n| HARNESS-EVAL-1 | Agentの停止条件と予算の設計 | `01-concepts/termination-budget.md` | 未着手 |\n');
  run('git', ['add', '.'], { cwd: checkout });
  run('git', ['commit', '-m', 'Prepare isolated harness evaluation', '-m', 'Co-authored-by: Codex <codex@openai.com>'], { cwd: checkout });
  const prompt = fs.readFileSync(path.join(root, 'tests/harness/authoring-prompt.txt.example'), 'utf8');
  fs.writeFileSync(path.join(directory, 'prompt.txt'), prompt);
  const record = { schema_version: 1, scenario: options.scenario, source_sha: ref, fixture_sha: run('git', ['rev-parse', 'HEAD'], { cwd: checkout }).stdout.trim(), prompt_sha256: crypto.createHash('sha256').update(prompt).digest('hex'), created_at: new Date().toISOString(), checkout, execution_contract: executionContract, dependency_install: { command: executionContract.dependency_install_command, result: 'not-run' }, instruction_bytes: fs.statSync(path.join(checkout, 'AGENTS.md')).size, status: 'prepared', evidence_class: 'fixture-preparation' };
  fs.writeFileSync(path.join(directory, 'evaluation.json'), `${JSON.stringify(record, null, 2)}\n`);
  return { directory, ...record };
}
function collect(directory) {
  const owned = ownedRun(directory);
  const record = JSON.parse(fs.readFileSync(path.join(owned, 'evaluation.json'), 'utf8'));
  if (record.schema_version !== 1 || record.scenario !== 'authoring' || record.checkout !== path.join(owned, 'checkout') || !/^[a-f0-9]{40}$/.test(record.fixture_sha)) throw new Error('Invalid evaluation ownership record');
  for (const file of ['events.jsonl', 'summary.json', 'checkout', 'checkout/docs/01-concepts/termination-budget.md']) assertUnlinked(path.join(owned, file), owned);
  const events = path.join(owned, 'events.jsonl');
  const observed = fs.existsSync(events) ? summarizeEvents(fs.readFileSync(events, 'utf8')) : null;
  const changes = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: record.checkout }).stdout;
  const head = run('git', ['rev-parse', 'HEAD'], { cwd: record.checkout }).stdout.trim();
  const committedChanges = run('git', ['diff', '--no-ext-diff', '--no-textconv', '--name-only', record.fixture_sha, head], { cwd: record.checkout }).stdout.trim().split(/\r?\n/).filter(Boolean);
  const article = path.join(record.checkout, 'docs/01-concepts/termination-budget.md');
  const text = fs.existsSync(article) ? fs.readFileSync(article, 'utf8') : '';
  const report = { ...record, observed, current_head: head, unexpected_commit: head !== record.fixture_sha, committed_changes: committedChanges, changes: changes.trim().split(/\r?\n/).filter(Boolean), article_status: articleStatus(text), draft_created: articleStatus(text) === 'draft', reviewed_quality: 'requires-independent-review', collected_at: new Date().toISOString(), summary_file: path.join(owned, 'summary.json') };
  fs.writeFileSync(path.join(owned, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
/** The saved summary retains every path and command; stdout explicitly reports bounded previews. */
export function consoleSummary(report) {
  if (!report.summary_file) return report;
  const { commands, ...observed } = report.observed ?? {};
  const changes = report.changes ?? [], committed = report.committed_changes ?? [];
  return {
    schema_version: report.schema_version, evidence_class: report.evidence_class, status: report.status,
    source_sha: report.source_sha, fixture_sha: report.fixture_sha, current_head: report.current_head, unexpected_commit: report.unexpected_commit,
    exit_code: report.exit_code, draft_created: report.draft_created, article_status: report.article_status,
    reviewed_quality: report.reviewed_quality, execution_contract: report.execution_contract, dependency_install: report.dependency_install,
    observed: report.observed ? { ...observed, commands_saved: commands?.length ?? 0 } : null,
    changes_count: changes.length, changes_preview: changes.slice(0, 10),
    committed_changes_count: committed.length, committed_changes_preview: committed.slice(0, 10),
    preview_truncated: changes.length > 10 || committed.length > 10,
    full_report: report.summary_file, collected_at: report.collected_at,
  };
}
export function seedDependencies(prepared, runner = run) {
  const environment = executionEnvironment(prepared.execution_contract);
  const recordFile = path.join(prepared.directory, 'evaluation.json');
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  const dependency = { command: prepared.execution_contract.dependency_install_command, result: 'running', started_at: new Date().toISOString() };
  const save = () => fs.writeFileSync(recordFile, `${JSON.stringify({ ...record, dependency_install: dependency }, null, 2)}\n`);
  save();
  try {
    runner(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--ignore-scripts'], { cwd: prepared.checkout, env: environment, shell: process.platform === 'win32' });
    dependency.result = 'passed';
  } catch (error) {
    dependency.result = 'failed';
    throw error;
  } finally {
    dependency.completed_at = new Date().toISOString();
    save();
  }
  return environment;
}
async function agent(options) {
  const auth = run(options.binary, ['login', 'status']);
  if (!/ChatGPT/i.test(auth.stdout + auth.stderr)) throw new Error('This evaluation requires existing ChatGPT login; it does not configure API credentials');
  const prepared = prepare(options);
  const directory = prepared.directory;
  const environment = seedDependencies(prepared);
  const recordFile = path.join(directory, 'evaluation.json');
  const version = run(options.binary, ['--version'], { env: environment }).stdout.trim();
  const startedAt = new Date();
  const stdout = fs.openSync(path.join(directory, 'events.jsonl'), 'w');
  const stderr = fs.openSync(path.join(directory, 'stderr.txt'), 'w');
  process.stdout.write(`${JSON.stringify({ status: 'running', directory, version })}\n`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(options.binary, ['exec', '--ephemeral', '--json', '-s', 'workspace-write', '-c', 'approval_policy="never"', '-o', path.join(directory, 'last-message.txt'), '-'], { cwd: prepared.checkout, env: executionEnvironment(prepared.execution_contract), windowsHide: true, timeout: 15 * 60000, stdio: ['pipe', stdout, stderr] });
    child.on('error', reject); child.on('close', resolve);
    child.stdin.on('error', () => {});
    child.stdin.end(fs.readFileSync(path.join(directory, 'prompt.txt')));
  }).finally(() => { fs.closeSync(stdout); fs.closeSync(stderr); });
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
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().then(result => console.log(JSON.stringify(consoleSummary(result), null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
