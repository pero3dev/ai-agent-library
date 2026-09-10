#!/usr/bin/env node
// Local Codex orchestration only. No model/API invocation and no credentials are stored.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readRegistry, selectSystems } from './freshness-registry.mjs';

import { git, snapshotOwned, writeJson, assertRunId, readLock, acquireLock, releaseLock, releaseLockIfOwned, assertOwner, assertNoLinkedTargets, withLockMutex, saveGeneration, recoverGeneration, queuedRuns, budgetStatus } from './lib/harness-state.mjs';
export { acquireLock, releaseLock } from './lib/harness-state.mjs';
const OUTCOMES = new Set(['observed', 'merged', 'held', 'failed']);
export function storageDirectory(root) {
  return path.resolve(root, git(root, 'rev-parse', '--git-common-dir'), 'freshness');
}
export function snapshotWork(root, dir, runId, beforePublish = () => {}) {
  return snapshotOwned(root, dir, runId, {
    candidates: ['docs', 'research', 'ROADMAP.md', 'GLOSSARY.md', 'README.md'],
    accepts: file => ['ROADMAP.md', 'GLOSSARY.md', 'README.md'].includes(file) || /^(docs|research)\/.*\.(md|json)$/.test(file),
    refPrefix: 'freshness', beforePublish
  });
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
export function readRunRecords(dir, state = loadState(dir)) {
  const runsDir = path.join(dir, 'runs');
  const records = new Map();
  for (const [id, result] of Object.entries(state.runs)) {
    assertRunId(id);
    records.set(id, { run_id: id, status: result.outcome, finished_at: result.completed_at, ...result });
  }
  for (const name of (fs.existsSync(runsDir) ? fs.readdirSync(runsDir) : []).filter(name => name.endsWith('.json'))) {
    const record = JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf8'));
    assertRunId(record.run_id);
    if (name !== `${record.run_id}.json`) throw new Error('Checkpoint file/ID mismatch');
    const completed = state.runs[record.run_id];
    records.set(record.run_id, { ...record, ...(completed ? { status: completed.outcome, finished_at: record.finished_at ?? completed.completed_at } : {}) });
  }
  return [...records.values()].sort((a, b) => (a.started_at ?? a.finished_at ?? '').localeCompare(b.started_at ?? b.finished_at ?? ''));
}
export function interruptedRuns(dir) {
  return readRunRecords(dir).filter(record => record.status === 'in_progress');
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
  result.pending_resolutions ??= {};
  const resolved = checkpoint.resolved_pending_ids ?? [];
  if (!Array.isArray(resolved) || resolved.some(id => typeof id !== 'string')) throw new Error('Invalid resolved pending IDs');
  for (const id of resolved) {
    const old = state.pending.find(item => item.id === id);
    const prior = result.pending_resolutions[id];
    if (!old && !(prior?.run_id === checkpoint.run_id && ids.includes(prior.system_id))) throw new Error('Unknown resolved pending ID');
    if (old && !ids.includes(old.system_id)) throw new Error('Cannot resolve another system\'s pending item');
    if (pending.some(item => item.id === id)) throw new Error('A pending item cannot also be resolved');
    if (old) result.pending_resolutions[id] = { run_id: checkpoint.run_id, system_id: old.system_id };
  }
  result.pending = result.pending.filter(item => !resolved.includes(item.id));
  for (const item of pending) {
    const old = result.pending.find(entry => entry.id === item.id);
    if (old && old.system_id !== item.system_id) throw new Error('Pending ID belongs to a different system');
    result.pending = result.pending.filter(entry => entry.id !== item.id);
    delete result.pending_resolutions[item.id];
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
    else if (flag === '--usage-limit') options.usageLimit = true;
    else if (flag === '--needs-decision') options.needsDecision = true;
    else if (['--mode', '--ids', '--run', '--run-id', '--attempt-id', '--outcome', '--root', '--wait-until', '--wait-reason', '--time-budget-minutes'].includes(flag)) {
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
    const records = readRunRecords(dir, state);
    const interrupted = records.filter(record => record.status === 'in_progress');
    return { storage: dir, lock: readLock(dir), interrupted, records, queue: queuedRuns(interrupted, now), recovery: recoverGeneration(dir), compatibility: { schema_version: state.schema_version, automatic_migration: false }, ...state };
  }
  if (command === 'prepare') {
    const recovery = recoverGeneration(dir);
    if (recovery.needed) {
      if (options.dryRun) return { status: 'recovery_required', recovery, dry_run: true };
      const recoveryOwner = acquireLock(dir, `recovery-${crypto.randomUUID()}`, now);
      try { withLockMutex(dir, () => recoverGeneration(dir, { dryRun: false })); }
      finally { releaseLock(dir, recoveryOwner.run_id, recoveryOwner.attempt_id); }
    }
    const registry = readRegistry(root);
    const state = loadState(dir);
    const allInterrupted = interruptedRuns(dir);
    const queue = queuedRuns(allInterrupted, now);
    const interrupted = queue.ready[0];
    const mode = interrupted?.mode ?? (!options.mode || options.mode === 'auto' ? automaticMode(now) : options.mode);
    const selected = interrupted
      ? selectSystems(registry, state, { mode: 'manual', now, limit: 3, ids: interrupted.systems })
      : selectSystems(registry, state, { mode, now, limit: 3, ids: options.ids?.split(','), excludeIds: allInterrupted.flatMap(record => record.systems) });
    const occupied = new Set(allInterrupted.flatMap(record => record.systems));
    const systems = selected.map(row => typeof row === 'string' ? registry.find(entry => entry.id === row) : row).filter(row => interrupted || !occupied.has(row.id));
    if (!systems.length) return { status: 'nothing_due', mode, waiting: queue.waiting_external.length, needs_decision: queue.needs_decision.length };
    const runId = interrupted?.run_id ?? `${now.toISOString().replace(/[-:.]/g, '').toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
    const checkpoint = interrupted ?? { schema_version: 1, run_id: runId, status: 'in_progress', mode, started_at: now.toISOString(), base_sha: git(root, 'rev-parse', 'origin/main'), systems: systems.map(row => row.id), completed_systems: [], pending: [], resolved_pending_ids: [], notes: [] };
    if (!options.dryRun) {
      const minutes = Number(options['time-budget-minutes'] ?? 300);
      if (!Number.isFinite(minutes) || minutes < 3 || minutes > 350) throw new Error('time-budget-minutes must be 3..350');
      checkpoint.attempt_id = acquireLock(dir, runId, now).attempt_id;
      checkpoint.queue_state = 'ready';
      checkpoint.next_eligible_at = null;
      checkpoint.budget = { deadline_at: new Date(now.getTime() + minutes * 60000).toISOString(), save_margin_seconds: 120 };
      try {
        assertNoLinkedTargets(dir, [`runs/${runId}.json`]);
        writeJson(path.join(dir, 'runs', `${runId}.json`), checkpoint);
      }
      catch (error) { releaseLockIfOwned(dir, runId, checkpoint.attempt_id); throw error; }
    }
    let orphanSnapshot = null;
    try { const savedRef = git(root, 'rev-parse', `refs/freshness/checkpoints/${runId}`); if (savedRef !== checkpoint.snapshot_commit) orphanSnapshot = savedRef; } catch { /* No snapshot has been made yet. */ }
    return { ...checkpoint, resuming: Boolean(interrupted), current_main_sha: git(root, 'rev-parse', 'origin/main'), orphan_snapshot_commit: orphanSnapshot, dry_run: Boolean(options.dryRun), checkpoint: path.join(dir, 'runs', `${runId}.json`), evidence: `research/freshness-runs/${runId}.json`, branch: `automation/freshness-${runId}`, targets: systems, previous_pending: state.pending };
  }
  if (command === 'checkpoint' || command === 'suspend' || command === 'finish') {
    if (!options.run) throw new Error('--run is required');
    const checkpoint = JSON.parse(fs.readFileSync(path.resolve(options.run), 'utf8'));
    assertRunId(checkpoint.run_id);
    if (options['attempt-id'] && options['attempt-id'] !== checkpoint.attempt_id) throw new Error('Checkpoint belongs to another attempt');
    assertOwner(dir, checkpoint.run_id, options['attempt-id'] ?? checkpoint.attempt_id);
    if (options['wait-until']) checkpoint.next_eligible_at = options['wait-until'];
    if (options['wait-reason']) checkpoint.wait_reason = options['wait-reason'];
    if (options.needsDecision) checkpoint.queue_state = 'needs_decision';
    else if (options['wait-until']) checkpoint.queue_state = 'waiting_external';
    if (options.usageLimit) checkpoint.budget = { ...checkpoint.budget, stop_reason: 'usage_limit' };
    const budget = budgetStatus(checkpoint, now);
    if (budget.must_save && command !== 'finish') {
      checkpoint.queue_state = 'waiting_external';
      checkpoint.wait_reason = budget.reason;
      checkpoint.next_eligible_at = new Date(now.getTime() + (budget.reason === 'usage_limit' ? 24 * 60 : 5) * 60000).toISOString();
    }
    queuedRuns([checkpoint], now);
    if (checkpoint.queue_state === 'waiting_external' && (!checkpoint.next_eligible_at || !checkpoint.wait_reason)) throw new Error('External waits require next_eligible_at and wait_reason');
    const registry = readRegistry(root);
    if (!Array.isArray(checkpoint.systems) || checkpoint.systems.some(id => !registry.some(row => row.id === id))) throw new Error('Unknown system');
    if (options.dryRun) return { dry_run: true, command, run_id: checkpoint.run_id, storage: dir, external_verification_required: command === 'finish' && options.outcome === 'merged' };
    // Validate completion/pending fields even during an intermediate checkpoint.
    const save = () => {
    const previous = loadState(dir);
    const state = applyCompletion(previous, checkpoint, command === 'finish' ? options.outcome : 'held', now);
    if (command === 'finish') {
      withLockMutex(dir, () => saveGeneration(dir, state, { ...checkpoint, status: options.outcome, finished_at: now.toISOString(), saved_at: now.toISOString() }, { beforeCommit: () => assertOwner(dir, checkpoint.run_id, checkpoint.attempt_id) }));
      releaseLock(dir, checkpoint.run_id, options['attempt-id'] ?? checkpoint.attempt_id);
    } else {
      const snapshot = withLockMutex(dir, () => {
        assertOwner(dir, checkpoint.run_id, checkpoint.attempt_id);
        return snapshotWork(root, dir, checkpoint.run_id, () => assertOwner(dir, checkpoint.run_id, checkpoint.attempt_id));
      });
      // Persist follow-ups without claiming the observation or PR is complete.
      withLockMutex(dir, () => saveGeneration(dir, { ...previous, pending: state.pending, pending_resolutions: state.pending_resolutions }, { ...checkpoint, ...snapshot, status: 'in_progress', saved_at: now.toISOString() }, { beforeCommit: () => assertOwner(dir, checkpoint.run_id, checkpoint.attempt_id) }));
      if (command === 'suspend' || budget.must_save) releaseLock(dir, checkpoint.run_id, options['attempt-id'] ?? checkpoint.attempt_id);
    }
    return { saved: true, command, run_id: checkpoint.run_id, storage: dir, budget };
    };
    if (command === 'finish' && options.outcome === 'merged') {
      return import('./lib/github-evidence.mjs').then(({ verifyGithubEvidence }) => {
        checkpoint.github_verification = verifyGithubEvidence({ root, prUrl: checkpoint.pr_url, expectedHead: checkpoint.head_sha ?? git(root, 'rev-parse', 'HEAD'), requirePublication: true, publicationUrls: checkpoint.publication_urls ?? [] });
        checkpoint.merge_sha = checkpoint.github_verification.merge_sha;
        checkpoint.publication = checkpoint.github_verification.publication;
        return save();
      });
    }
    return save();
  }
  if (command === 'assert-lock' || command === 'release') {
    assertRunId(options['run-id']);
    if (!options['attempt-id']) throw new Error('--attempt-id captured from prepare is required before publishing or releasing');
    assertOwner(dir, options['run-id'], options['attempt-id']);
    if (command === 'release') releaseLock(dir, options['run-id'], options['attempt-id']);
    return { ok: true, command };
  }
  throw new Error('Commands: prepare, checkpoint, suspend, finish, assert-lock, release, status');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
