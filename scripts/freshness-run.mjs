#!/usr/bin/env node
// Local Codex orchestration only. No model/API invocation and no credentials are stored.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readRegistry, selectSystems } from './freshness-registry.mjs';

const RUN_ID = /^[a-z0-9][a-z0-9-]{1,79}$/;
const OUTCOMES = new Set(['observed', 'merged', 'held', 'failed']);
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
export function storageDirectory(root) {
  return path.resolve(root, git(root, 'rev-parse', '--git-common-dir'), 'freshness');
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}
export function loadState(dir) {
  const file = path.join(dir, 'state.json');
  if (!fs.existsSync(file)) return { schema_version: 1, systems: {}, pending: [], runs: {} };
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (state.schema_version !== 1 || !state.systems || !Array.isArray(state.pending) || !state.runs) {
    throw new Error('Invalid local state. Preserve it and inspect before retrying.');
  }
  return state;
}
export function interruptedRuns(dir) {
  const runsDir = path.join(dir, 'runs');
  if (!fs.existsSync(runsDir)) return [];
  const committedRuns = loadState(dir).runs;
  return fs.readdirSync(runsDir).filter(name => name.endsWith('.json')).map(name => {
    const record = JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf8'));
    assertRunId(record.run_id);
    if (name !== `${record.run_id}.json`) throw new Error('Checkpoint file/ID mismatch');
    return record;
  }).filter(record => record.status === 'in_progress' && !committedRuns[record.run_id]).sort((a, b) => a.started_at.localeCompare(b.started_at));
}
function assertRunId(id) {
  if (typeof id !== 'string' || !RUN_ID.test(id)) throw new Error('Invalid run ID');
}
function readLock(dir) {
  const file = path.join(dir, 'lock', 'owner.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}
function withLockMutex(dir, action) {
  fs.mkdirSync(dir, { recursive: true });
  const mutex = path.join(dir, 'lock-mutex');
  try { fs.mkdirSync(mutex); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Lock recovery is already running. Retry later; inspect a persistent lock-mutex before removing it.');
    throw error;
  }
  try { return action(); }
  finally { fs.rmdirSync(mutex); }
}
export function acquireLock(dir, runId, now = new Date()) {
  assertRunId(runId);
  return withLockMutex(dir, () => {
    const lockDir = path.join(dir, 'lock');
    if (fs.existsSync(lockDir)) {
      const owner = readLock(dir);
      if (!owner || !Number.isFinite(Date.parse(owner.expires_at)) || Date.parse(owner.expires_at) > now.getTime()) {
        throw new Error(`Another freshness run owns the lock: ${owner?.run_id ?? 'incomplete lock; inspect manually'}`);
      }
      // All acquisition/release paths share this mutex, including expired-owner recovery.
      fs.renameSync(lockDir, path.join(dir, `expired-lock-${crypto.randomUUID()}`));
    }
    fs.mkdirSync(lockDir);
    const owner = { run_id: runId, attempt_id: crypto.randomUUID(), started_at: now.toISOString(), expires_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString() };
    writeJson(path.join(lockDir, 'owner.json'), owner);
    return owner;
  });
}
export function releaseLock(dir, runId, attemptId) {
  assertRunId(runId);
  return withLockMutex(dir, () => {
    const owner = readLock(dir);
    if (!owner || owner.run_id !== runId || (attemptId && owner.attempt_id !== attemptId)) throw new Error('Lock owner changed; do not publish this run.');
    fs.unlinkSync(path.join(dir, 'lock', 'owner.json'));
    fs.rmdirSync(path.join(dir, 'lock'));
  });
}
function assertOwner(dir, id, attemptId) {
  if (typeof attemptId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(attemptId)) throw new Error('A valid lock attempt_id is required');
  const owner = readLock(dir);
  if (!owner || owner.run_id !== id || (attemptId && owner.attempt_id !== attemptId) || Date.parse(owner.expires_at) <= Date.now()) throw new Error('Run does not own the current lock attempt; stop before GitHub writes.');
}
export function automaticMode(now = new Date()) {
  const day = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay();
  return day === 1 ? 'weekly_focus' : 'rotation';
}
export function applyCompletion(state, checkpoint, outcome, now = new Date()) {
  if (!OUTCOMES.has(outcome)) throw new Error('Unknown outcome');
  assertRunId(checkpoint.run_id);
  const ids = checkpoint.systems;
  if (!Array.isArray(ids) || !ids.length || ids.length > 3 || ids.some(id => typeof id !== 'string')) throw new Error('Invalid systems');
  const completed = checkpoint.completed_systems ?? [];
  if (!Array.isArray(completed) || completed.some(id => !ids.includes(id))) throw new Error('Invalid completed systems');
  const pending = checkpoint.pending ?? [];
  if (!Array.isArray(pending)) throw new Error('Invalid pending items');
  for (const item of pending) {
    if (!ids.includes(item.system_id) || typeof item.id !== 'string' || !item.id || typeof item.reason !== 'string' || !item.reason.trim()) throw new Error('Invalid pending item');
    if (item.next_retry_at && !Number.isFinite(Date.parse(item.next_retry_at))) throw new Error('Invalid retry date');
  }
  if (completed.some(id => pending.some(item => item.system_id === id))) throw new Error('A system with pending items cannot be fully verified.');
  if (outcome === 'merged' && (!/^[a-f0-9]{40}$/.test(checkpoint.merge_sha ?? '') || !/^https:\/\/github\.com\/pero3dev\/ai-agent-library\/pull\/\d+$/.test(checkpoint.pr_url ?? ''))) throw new Error('Merged outcome requires a PR and merge SHA');
  const result = structuredClone(state);
  const resolved = checkpoint.resolved_pending_ids ?? [];
  if (!Array.isArray(resolved) || resolved.some(id => typeof id !== 'string')) throw new Error('Invalid resolved pending IDs');
  for (const id of resolved) {
    const old = state.pending.find(item => item.id === id);
    if (!old) throw new Error('Unknown resolved pending ID');
    if (old && !ids.includes(old.system_id)) throw new Error('Cannot resolve another system\'s pending item');
  }
  result.pending = result.pending.filter(item => !resolved.includes(item.id));
  for (const item of pending) {
    const old = result.pending.find(entry => entry.id === item.id);
    if (old && old.system_id !== item.system_id) throw new Error('Pending ID belongs to a different system');
    result.pending = result.pending.filter(entry => entry.id !== item.id);
    result.pending.push({ ...item, run_id: checkpoint.run_id });
  }
  if (completed.some(id => result.pending.some(item => item.system_id === id))) throw new Error('Existing pending items prevent full verification.');
  for (const id of ids) {
    result.systems[id] = { ...result.systems[id], last_attempted_at: now.toISOString() };
    if (completed.includes(id) && outcome !== 'failed') result.systems[id].last_verified_at = now.toISOString();
    // A failed source must not monopolize every run. Explicit pending dates can lengthen the delay.
    const retries = result.pending.filter(item => item.system_id === id && item.next_retry_at).map(item => item.next_retry_at).sort((a, b) => Date.parse(a) - Date.parse(b));
    result.systems[id].next_retry_at = retries[0] ?? (completed.includes(id) && outcome !== 'failed' ? null : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString());
  }
  result.runs[checkpoint.run_id] = { outcome, systems: ids, completed_at: now.toISOString(), pr_url: checkpoint.pr_url ?? null, merge_sha: checkpoint.merge_sha ?? null, publication: checkpoint.publication ?? 'not_checked' };
  return result;
}
export function parseArgs(argv) {
  const command = argv.shift() ?? 'status';
  const options = {};
  while (argv.length) {
    const flag = argv.shift();
    if (flag === '--dry-run') options.dryRun = true;
    else if (['--mode', '--ids', '--run', '--run-id', '--attempt-id', '--outcome', '--root'].includes(flag)) {
      if (!argv.length || argv[0].startsWith('--')) throw new Error(`Missing value: ${flag}`);
      options[flag.slice(2)] = argv.shift();
    } else throw new Error(`Unknown argument: ${flag}`);
  }
  return { command, options };
}
export function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs([...argv]);
  const root = path.resolve(options.root ?? process.cwd());
  const dir = storageDirectory(root);
  const now = new Date();
  if (command === 'status') {
    const state = loadState(dir);
    return { storage: dir, lock: readLock(dir), interrupted: interruptedRuns(dir), ...state };
  }
  if (command === 'prepare') {
    const registry = readRegistry(root);
    const state = loadState(dir);
    const interrupted = interruptedRuns(dir)[0];
    const mode = interrupted?.mode ?? (!options.mode || options.mode === 'auto' ? automaticMode(now) : options.mode);
    const selected = interrupted
      ? selectSystems(registry, state, { mode: 'manual', now, limit: 3, ids: interrupted.systems })
      : selectSystems(registry, state, { mode, now, limit: 3, ids: options.ids?.split(',') });
    const systems = selected.map(row => typeof row === 'string' ? registry.find(entry => entry.id === row) : row);
    if (!systems.length) return { status: 'nothing_due', mode };
    const runId = interrupted?.run_id ?? `${now.toISOString().replace(/[-:.]/g, '').toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
    const checkpoint = interrupted ?? { schema_version: 1, run_id: runId, status: 'in_progress', mode, started_at: now.toISOString(), base_sha: git(root, 'rev-parse', 'origin/main'), systems: systems.map(row => row.id), completed_systems: [], pending: [], resolved_pending_ids: [], notes: [] };
    if (!options.dryRun) {
      checkpoint.attempt_id = acquireLock(dir, runId, now).attempt_id;
      writeJson(path.join(dir, 'runs', `${runId}.json`), checkpoint);
    }
    return { ...checkpoint, resuming: Boolean(interrupted), current_main_sha: git(root, 'rev-parse', 'origin/main'), dry_run: Boolean(options.dryRun), checkpoint: path.join(dir, 'runs', `${runId}.json`), evidence: `research/freshness-runs/${runId}.json`, branch: `automation/freshness-${runId}`, targets: systems, previous_pending: state.pending };
  }
  if (command === 'checkpoint' || command === 'finish') {
    if (!options.run) throw new Error('--run is required');
    const checkpoint = JSON.parse(fs.readFileSync(path.resolve(options.run), 'utf8'));
    assertRunId(checkpoint.run_id);
    if (options['attempt-id'] && options['attempt-id'] !== checkpoint.attempt_id) throw new Error('Checkpoint belongs to another attempt');
    assertOwner(dir, checkpoint.run_id, options['attempt-id'] ?? checkpoint.attempt_id);
    const registry = readRegistry(root);
    if (!Array.isArray(checkpoint.systems) || checkpoint.systems.some(id => !registry.some(row => row.id === id))) throw new Error('Unknown system');
    // Validate completion/pending fields even during an intermediate checkpoint.
    const state = applyCompletion(loadState(dir), checkpoint, command === 'finish' ? options.outcome : 'held', now);
    if (command === 'finish') {
      writeJson(path.join(dir, 'state.json'), state);
      writeJson(path.join(dir, 'runs', `${checkpoint.run_id}.json`), { ...checkpoint, status: options.outcome, saved_at: now.toISOString() });
      releaseLock(dir, checkpoint.run_id, options['attempt-id'] ?? checkpoint.attempt_id);
    } else writeJson(path.join(dir, 'runs', `${checkpoint.run_id}.json`), { ...checkpoint, status: 'in_progress', saved_at: now.toISOString() });
    return { saved: true, command, run_id: checkpoint.run_id, storage: dir };
  }
  if (command === 'assert-lock' || command === 'release') {
    assertRunId(options['run-id']);
    if (!options['attempt-id']) throw new Error('--attempt-id captured from prepare is required before publishing or releasing');
    assertOwner(dir, options['run-id'], options['attempt-id']);
    if (command === 'release') releaseLock(dir, options['run-id'], options['attempt-id']);
    return { ok: true, command };
  }
  throw new Error('Commands: prepare, checkpoint, finish, assert-lock, release, status');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(main(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
