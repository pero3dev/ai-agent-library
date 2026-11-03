#!/usr/bin/env node
// Local orchestration only. The ChatGPT/Codex client performs editing and research.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { git, commitTree, assertPublicationCheckout, snapshotOwned, isPreservablePath, assertRunId, readLock, acquireLock, releaseLock, releaseLockIfOwned, assertOwner, assertNoLinkedTargets, withLockMutex, saveGeneration, recoverGeneration, queuedRuns, budgetStatus } from './lib/harness-state.mjs';
import { isRecord, errorMessage } from './lib/json-guards.mjs';
import type { HarnessProfile, HarnessContract, HarnessRecord, HarnessState, HarnessDependencies, HarnessBudget, HarnessRunResult, HarnessReconciliation, PullRequestState, LocalEvidence } from './lib/harness-runtime-types.mts';
import type { GithubVerification } from './lib/github-evidence.mts';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = /^[a-f0-9]{40}$/;
const gitMaybe = (root: string, ...args: string[]) => { try { return git(root, ...args); } catch { return null; } };
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
export function storage(root: string) {
  const common = path.resolve(root, git(root, 'rev-parse', '--git-common-dir'));
  // Freshness and general work share the existing lease; their records and ownership stay separate.
  return { dir: path.join(common, 'harness'), locks: path.join(common, 'freshness') };
}
export function readState(dir: string): HarnessState {
  const file = path.join(dir, 'state.json');
  if (!fs.existsSync(file)) return { schema_version: 1, generation: 0, runs: {} };
  const state: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  assertHarnessState(state);
  return state;
}
export function readProfiles() {
  const catalog: unknown = JSON.parse(fs.readFileSync(path.join(moduleRoot, 'harness/profiles.json'), 'utf8'));
  if (!isRecord(catalog) || catalog.schema_version !== 1 || !isRecord(catalog.profiles)) throw new Error('Invalid profile catalog');
  const profiles: Record<string, HarnessProfile> = {};
  for (const [name, value] of Object.entries(catalog.profiles)) {
    if (!isRecord(value) || !strings(value.allowed_files) || !strings(value.allowed_roots) || !strings(value.extensions) || typeof value.completion !== 'string' || ['change_manifests', 'root_markdown', 'review_required'].some(key => value[key] !== undefined && typeof value[key] !== 'boolean') || value.runtime !== undefined && typeof value.runtime !== 'string') throw new Error('Invalid profile catalog');
    profiles[name] = { ...value, allowed_files: value.allowed_files, allowed_roots: value.allowed_roots, extensions: value.extensions, completion: value.completion };
  }
  return profiles;
}
export function pathAllowed(file: unknown, profile: HarnessProfile) {
  if (!isPreservablePath(file)) return false;
  if (profile.change_manifests && /^harness\/changes\/[a-z0-9][a-z0-9-]{3,79}\.json$/.test(file)) return true;
  return profile.allowed_files.includes(file) || (profile.root_markdown && !file.includes('/') && file.endsWith('.md')) || (profile.allowed_roots.some(prefix => file.startsWith(prefix)) && (profile.extensions.includes('*') || profile.extensions.includes(path.posix.extname(file))));
}
function owned(file: string, paths: string[]) { return paths.some(entry => entry.endsWith('/') ? file.startsWith(entry) : file === entry); }
export function validateContract(contract: unknown, profiles = readProfiles()) {
  if (!isRecord(contract) || typeof contract.profile !== 'string') throw new Error('Select a supported general profile; freshness uses scripts/freshness-run.mjs');
  const profile = profiles[contract.profile];
  if (!profile || profile.runtime === 'freshness-run') throw new Error('Select a supported general profile; freshness uses scripts/freshness-run.mjs');
  for (const field of ['goal', 'authorization']) if (typeof contract[field] !== 'string' || !contract[field].trim()) throw new Error(`Contract requires ${field}`);
  if (contract.task_key !== undefined && (typeof contract.task_key !== 'string' || !contract.task_key.trim())) throw new Error('task_key must be a nonempty string');
  if (!strings(contract.owned_paths) || !contract.owned_paths.length || new Set(contract.owned_paths).size !== contract.owned_paths.length) throw new Error('Contract requires unique owned_paths');
  for (const file of contract.owned_paths) {
    const valid = file.endsWith('/') ? (profile.change_manifests && file === 'harness/changes/') || profile.allowed_roots.some(prefix => file.startsWith(prefix)) && pathAllowed(`${file}probe${profile.extensions.includes('*') ? '.md' : profile.extensions[0]}`, profile) : pathAllowed(file, profile);
    if (!valid) throw new Error(`Owned path is outside profile: ${file}`);
  }
  if (contract.completion !== undefined && typeof contract.completion !== 'string' || !['local', 'merged', 'published', 'observed'].includes(typeof contract.completion === 'string' ? contract.completion : profile.completion)) throw new Error('Invalid completion condition');
  return profile;
}
function assertHarnessContract(value: unknown): asserts value is HarnessContract { validateContract(value); }
function assertHarnessState(value: unknown): asserts value is HarnessState {
  if (!isRecord(value) || value.schema_version !== 1 || !isRecord(value.runs)) throw new Error('Unsupported harness state; use status --dry-run to inspect, do not rewrite it');
  for (const summary of Object.values(value.runs)) if (!isRecord(summary) || typeof summary.run_id !== 'string' || typeof summary.started_at !== 'string' || typeof summary.status !== 'string' || summary.task_key !== undefined && typeof summary.task_key !== 'string' || summary.queue_state !== undefined && typeof summary.queue_state !== 'string' || summary.next_eligible_at !== undefined && summary.next_eligible_at !== null && typeof summary.next_eligible_at !== 'string') throw new Error('Unsupported harness run summary; preserve it for inspection');
  if (value.generation !== undefined && typeof value.generation !== 'number') throw new Error('Unsupported harness state generation');
}
export function assertHarnessRecord(value: unknown): asserts value is HarnessRecord {
  assertHarnessContract(value);
  if (!isRecord(value) || value.schema_version !== 1 || ['run_id', 'completion', 'status', 'queue_state', 'started_at', 'base_sha', 'worktree'].some(key => typeof value[key] !== 'string') || value.branch !== null && typeof value.branch !== 'string' || !isRecord(value.budget) || typeof value.budget.deadline_at !== 'string' || typeof value.budget.save_margin_seconds !== 'number') throw new Error('Unsupported harness run record; preserve it for inspection');
  for (const key of ['attempt_id', 'saved_at', 'completed_at']) if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error(`Unsupported run field: ${key}`);
  for (const key of ['pr_url', 'head_sha', 'snapshot_commit', 'snapshot_head', 'next_eligible_at', 'wait_reason']) if (value[key] !== undefined && value[key] !== null && typeof value[key] !== 'string') throw new Error(`Unsupported run field: ${key}`);
  if (value.budget.stop_reason !== undefined && typeof value.budget.stop_reason !== 'string') throw new Error('Invalid run budget');
  const review = value.review;
  if (review !== undefined && review !== null && (!isRecord(review) || ['decision', 'tree_sha', 'reviewer_run_id'].some(key => review[key] !== undefined && typeof review[key] !== 'string'))) throw new Error('Invalid review record');
  if (value.verification !== undefined) {
    if (!isRecord(value.verification)) throw new Error('Invalid verification record');
    const local = value.verification.local;
    if (local !== undefined && (!isRecord(local) || ['passed', 'verified'].some(key => local[key] !== undefined && typeof local[key] !== 'boolean') || ['commit_sha', 'tree_sha', 'type', 'command', 'started_at', 'completed_at', 'node'].some(key => local[key] !== undefined && typeof local[key] !== 'string'))) throw new Error('Invalid local verification record');
  }
  if (value.publication_urls !== undefined) publicationUrls(value.publication_urls);
}
function publicationUrls(value: unknown): Array<string | { url: string; includes?: string }> {
  if (!Array.isArray(value)) throw new Error('Invalid publication URLs');
  return (value as unknown[]).map(url => {
    if (typeof url === 'string') return url;
    if (!isRecord(url) || typeof url.url !== 'string' || url.includes !== undefined && typeof url.includes !== 'string') throw new Error('Invalid publication URL');
    return { url: url.url, ...(typeof url.includes === 'string' ? { includes: url.includes } : {}) };
  });
}
export function readRecord(dir: string, id: unknown) {
  assertRunId(id);
  const record: unknown = JSON.parse(fs.readFileSync(path.join(dir, 'runs', `${id}.json`), 'utf8'));
  if (!isRecord(record) || record.run_id !== id || record.schema_version !== 1) throw new Error('Run ID/schema mismatch');
  assertHarnessRecord(record);
  return record;
}
function save(dir: string, locks: string, record: HarnessRecord, now: Date) {
  return withLockMutex(locks, () => {
    const state = readState(dir);
    const next = { ...record, saved_at: now.toISOString() };
    state.runs[record.run_id] = { run_id: record.run_id, task_key: record.task_key, status: record.status, queue_state: record.queue_state, started_at: record.started_at, next_eligible_at: record.next_eligible_at ?? null };
    return saveGeneration(dir, state, next, { beforeCommit: () => assertOwner(locks, record.run_id, record.attempt_id) });
  });
}
function snapshot(root: string, dir: string, record: HarnessRecord, profile: HarnessProfile) {
  const paths = git(root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...record.owned_paths).split('\0').filter(Boolean).filter(file => owned(file, record.owned_paths) && pathAllowed(file, profile));
  assertNoLinkedTargets(root, paths);
  const { locks } = storage(root);
  return withLockMutex(locks, () => {
    assertOwner(locks, record.run_id, record.attempt_id);
    return snapshotOwned(root, dir, record.run_id, { candidates: record.owned_paths, accepts: file => owned(file, record.owned_paths) && pathAllowed(file, profile), beforePublish: () => assertOwner(locks, record.run_id, record.attempt_id) });
  });
}
export function reconcile(root: string, record: HarnessRecord, pullRequest: PullRequestState | null = null): HarnessReconciliation {
  const current = git(root, 'rev-parse', 'HEAD');
  const main = gitMaybe(root, 'rev-parse', 'origin/main');
  const latestRef = gitMaybe(root, 'rev-parse', `refs/harness/checkpoints/${record.run_id}`);
  const snapshotCommit = latestRef ?? record.snapshot_commit;
  const snapshotExists = snapshotCommit && gitMaybe(root, 'cat-file', '-t', snapshotCommit) === 'commit';
  const snapshotHead = snapshotCommit === record.snapshot_commit ? record.snapshot_head : gitMaybe(root, 'rev-parse', `${snapshotCommit}^`);
  const branchHead = record.branch ? gitMaybe(root, 'rev-parse', `refs/heads/${record.branch}`) : null;
  const clean = !git(root, 'status', '--porcelain=v1', '--untracked-files=all');
  let action = 'continue';
  if (pullRequest?.state === 'MERGED') action = 'verify_publication';
  else if (pullRequest?.state === 'CLOSED') action = 'needs_decision';
  else if (pullRequest && record.head_sha && pullRequest.headRefOid !== record.head_sha) action = 'pr_head_changed';
  else if (main && main !== record.base_sha) action = 'rebase_and_review';
  else if (snapshotCommit && !snapshotExists) action = 'snapshot_missing';
  else if (snapshotCommit && current !== snapshotCommit) action = !clean ? 'preserve_worktree' : current === snapshotHead ? 'restore_snapshot' : 'compare_divergence';
  return { action, current_head: current, current_main_sha: main, base_sha: record.base_sha, branch_head: branchHead, snapshot_commit: snapshotCommit ?? null, snapshot_head: snapshotHead ?? null, orphan_snapshot: Boolean(latestRef && latestRef !== record.snapshot_commit), clean, pull_request: pullRequest };
}
const booleanOptions = ['dry-run', 'apply', 'usage-limit', 'ready', 'external'] as const;
const stringOptions = ['root', 'contract', 'run', 'run-id', 'attempt-id', 'outcome', 'wait-until', 'wait-reason', 'time-budget-minutes', 'queue-state', 'accept-base'] as const;
type HarnessOptions = Partial<Record<typeof booleanOptions[number], boolean>> & Partial<Record<typeof stringOptions[number], string>>;
const isBooleanOption = (key: string): key is typeof booleanOptions[number] => new Set<string>(booleanOptions).has(key);
const isStringOption = (key: string): key is typeof stringOptions[number] => new Set<string>(stringOptions).has(key);
function parse(argv: string[]) {
  const command = argv.shift() ?? 'status', options: HarnessOptions = {};
  while (argv.length) {
    const flag = argv.shift();
    if (flag === undefined) throw new Error('Missing option');
    const key = flag.slice(2);
    if (flag.startsWith('--') && isBooleanOption(key)) options[key] = true;
    else if (flag.startsWith('--') && isStringOption(key) && argv[0] && !argv[0].startsWith('--')) options[key] = argv.shift();
    else throw new Error(`Invalid option: ${flag}`);
  }
  return { command, options };
}
function budgetFor(options: HarnessOptions, now: Date): HarnessBudget {
  const minutes = Number(options['time-budget-minutes'] ?? 300);
  if (!Number.isFinite(minutes) || minutes < 3 || minutes > 350) throw new Error('time-budget-minutes must be 3..350');
  return { deadline_at: new Date(now.getTime() + minutes * 60000).toISOString(), save_margin_seconds: 120 };
}
function localCheck(root: string, { timeoutMs = 15 * 60000 } = {}): LocalEvidence {
  const start = new Date();
  const run = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'check'], { cwd: root, encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32', timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 });
  if (run.error || run.status !== 0) throw new Error(`npm run check failed: ${run.error?.message ?? (run.stderr || run.stdout).slice(-4000)}`);
  return { type: 'local', command: 'npm run check', passed: true, started_at: start.toISOString(), completed_at: new Date().toISOString(), node: process.version };
}
function verifiedCandidate(root: string, record: HarnessRecord) {
  const local = record.verification?.local;
  if (!local?.passed || typeof local.tree_sha !== 'string' || !sha.test(local.tree_sha)) throw new Error('Final candidate needs a successful local verify');
  const head = record.head_sha ?? local.commit_sha ?? git(root, 'rev-parse', 'HEAD');
  if ((local.commit_sha && local.commit_sha !== head) || commitTree(root, head) !== local.tree_sha) throw new Error('PR head does not match the locally verified candidate; verify the final candidate again');
  return { head, tree: local.tree_sha };
}
async function externalCheck(root: string, record: HarnessRecord, deps: HarnessDependencies) {
  const candidate = verifiedCandidate(root, record);
  const verify = deps.verifyGithubEvidence ?? (await import('./lib/github-evidence.mjs')).verifyGithubEvidence;
  const result = verify({ root, prUrl: record.pr_url ?? '', expectedHead: candidate.head, expectedTree: candidate.tree, requirePublication: record.completion === 'published', publicationUrls: record.publication_urls ?? [] });
  if (!result?.verified || !sha.test(result.merge_sha ?? '')) throw new Error('GitHub verification did not establish a merge');
  if (result.head_sha !== candidate.head || result.head_tree_sha !== candidate.tree) throw new Error('GitHub verification changed the candidate');
  if (record.completion === 'published' && !result.publication?.verified) throw new Error('Publication was not verified');
  assertPublicationCheckout(root, result);
  return result;
}

export async function main(argv = process.argv.slice(2), deps: HarnessDependencies = {}): Promise<HarnessRunResult> {
  const { command, options } = parse([...argv]);
  const root = path.resolve(options.root ?? process.cwd());
  const { dir, locks } = storage(root);
  const now = deps.now ?? new Date();
  const recovery = recoverGeneration(dir);
  if (command === 'status' || command === 'queue') {
    if (recovery.needed) return { storage: dir, lock: readLock(locks), recovery, status: 'recovery_required' };
    const stateFile = path.join(dir, 'state.json');
    const rawState: unknown = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { schema_version: 1 };
    const schema = isRecord(rawState) ? rawState.schema_version : undefined;
    if (schema !== 1) return { storage: dir, compatibility: { schema_version: schema, supported: false, migration_required: true, automatic_migration: false } };
    const state = readState(dir);
    const records = Object.keys(state.runs).map(id => readRecord(dir, id));
    return { storage: dir, lock: readLock(locks), recovery, compatibility: { schema_version: state.schema_version, automatic_migration: false }, queue: queuedRuns(records.filter(record => record.status === 'in_progress'), now), records, state };
  }
  if (recovery.needed) {
    if (options['dry-run']) return { status: 'recovery_required', recovery };
    const owner = acquireLock(locks, `recovery-${crypto.randomUUID()}`, now);
    try { withLockMutex(locks, () => recoverGeneration(dir, { dryRun: false })); }
    finally { releaseLock(locks, owner.run_id, owner.attempt_id); }
  }
  if (command === 'start') {
    if (!options.contract) throw new Error('--contract <JSON file> is required');
    const contract: unknown = JSON.parse(fs.readFileSync(path.resolve(options.contract), 'utf8'));
    assertHarnessContract(contract);
    const profile = validateContract(contract);
    assertNoLinkedTargets(root, contract.owned_paths);
    const base = gitMaybe(root, 'rev-parse', 'origin/main') ?? git(root, 'rev-parse', 'HEAD');
    const taskKey = contract.task_key ?? crypto.createHash('sha256').update(JSON.stringify([contract.profile, contract.goal, [...contract.owned_paths].sort(), base])).digest('hex');
    const duplicate = Object.values(readState(dir).runs).find(run => run.task_key === taskKey && run.status === 'in_progress');
    if (duplicate) return { status: 'existing_run', run_id: duplicate.run_id, next: 'resume', checkpoint: path.join(dir, 'runs', `${duplicate.run_id}.json`) };
    const runId = `${now.toISOString().replace(/[-:.]/g, '').toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
    const record: HarnessRecord = { schema_version: 1, run_id: runId, task_key: taskKey, profile: contract.profile, goal: contract.goal, authorization: contract.authorization, owned_paths: contract.owned_paths, completion: contract.completion ?? profile.completion, status: 'in_progress', queue_state: 'ready', started_at: now.toISOString(), worktree: root, branch: gitMaybe(root, 'symbolic-ref', '--short', 'HEAD'), base_sha: base, budget: budgetFor(options, now), notes: [], pending: [] };
    if (options['dry-run']) return { ...record, dry_run: true };
    const owner = acquireLock(locks, runId, now);
    record.attempt_id = owner.attempt_id;
    try { return { ...save(dir, locks, record, now), checkpoint: path.join(dir, 'runs', `${runId}.json`) }; }
    catch (error) { releaseLockIfOwned(locks, runId, owner.attempt_id); throw error; }
  }
  if (!options.run && !options['run-id']) throw new Error('--run <checkpoint JSON> or --run-id is required');
  const input: unknown = options.run ? JSON.parse(fs.readFileSync(path.resolve(options.run), 'utf8')) : null;
  if (input !== null && !isRecord(input)) throw new Error('Checkpoint must be an object');
  let record = readRecord(dir, options['run-id'] ?? input?.run_id);
  const profile = validateContract(record);
  if (record.status !== 'in_progress') return { status: 'already_finished', run_id: record.run_id, outcome: record.status };
  if (options['dry-run'] && command !== 'resume') return { dry_run: true, command, run_id: record.run_id, completion: record.completion, owned_paths: record.owned_paths, external_verification_required: ['merged', 'published'].includes(record.completion) };
  if (input) {
    for (const field of ['profile', 'goal', 'authorization', 'owned_paths', 'completion', 'base_sha'] as const) if (JSON.stringify(input[field]) !== JSON.stringify(record[field])) throw new Error(`Cannot change stored contract field: ${field}`);
    const changedPublication = (['pr_url', 'head_sha'] as const).some(field => Object.hasOwn(input, field) && input[field] !== record[field]);
    const update: Record<string, unknown> = { ...record };
    for (const field of ['notes', 'pending', 'pr_url', 'head_sha', 'publication_urls', 'review', 'queue_state', 'next_eligible_at', 'wait_reason']) if (Object.hasOwn(input, field)) update[field] = input[field];
    assertHarnessRecord(update);
    record = update;
    if (changedPublication) {
      if (record.verification) delete record.verification.github;
      delete record.github_verification;
      if (record.head_sha && record.verification?.local && (record.verification.local.commit_sha && record.verification.local.commit_sha !== record.head_sha || commitTree(root, record.head_sha) !== record.verification.local.tree_sha)) {
        delete record.verification.local; delete record.review;
      }
    }
  }
  if (command === 'resume') {
    if (options.ready) { if (!options['wait-reason']) throw new Error('--ready requires --wait-reason describing the resolved wait'); record.queue_state = 'ready'; record.next_eligible_at = null; record.wait_reason = options['wait-reason']; }
    if (!queuedRuns([record], now).ready.length) return { status: 'waiting', queue_state: record.queue_state, next_eligible_at: record.next_eligible_at ?? null };
    const rawPr: unknown = record.pr_url ? (deps.readPullRequest ? deps.readPullRequest(root, record.pr_url) : JSON.parse(gitHubRead(root, record.pr_url))) : null;
    if (rawPr !== null && (!isRecord(rawPr) || rawPr.state !== undefined && typeof rawPr.state !== 'string' || rawPr.headRefOid !== undefined && typeof rawPr.headRefOid !== 'string')) throw new Error('Invalid pull request state');
    const pr: PullRequestState | null = rawPr === null ? null : { ...(typeof rawPr.state === 'string' ? { state: rawPr.state } : {}), ...(typeof rawPr.headRefOid === 'string' ? { headRefOid: rawPr.headRefOid } : {}) };
    const check = reconcile(root, record, pr);
    if (options['dry-run']) return { run_id: record.run_id, reconciliation: check, dry_run: true };
    const resumedBudget = budgetFor(options, now);
    const owner = acquireLock(locks, record.run_id, now);
    record.attempt_id = owner.attempt_id;
    try {
      record.budget = resumedBudget;
      record.queue_state = 'ready';
      record.next_eligible_at = null;
      if (options['accept-base']) {
        const currentMain = gitMaybe(root, 'rev-parse', 'origin/main');
        if (!currentMain || options['accept-base'] !== currentMain || !check.clean || gitMaybe(root, 'merge-base', '--is-ancestor', currentMain, 'HEAD') === null) {
          throw new Error('Accept base only after integrating current main in a clean worktree');
        }
        record.base_sha = currentMain;
        delete record.review; delete record.verification;
      }
      if (['rebase_and_review', 'pr_head_changed', 'compare_divergence'].includes(check.action)) { delete record.review; delete record.verification; }
      if (options.apply && check.action === 'restore_snapshot') {
        const branch = gitMaybe(root, 'symbolic-ref', '--short', 'HEAD');
        if (branch && ['main', 'master'].includes(branch)) throw new Error('Restore requires an isolated task branch or detached worktree');
        if (!check.snapshot_commit) throw new Error('Missing snapshot commit');
        git(root, 'merge', '--ff-only', '--no-overwrite-ignore', check.snapshot_commit);
        record.snapshot_commit = check.snapshot_commit;
        record.snapshot_head = check.snapshot_head;
        record.worktree = root;
      }
      record = save(dir, locks, record, now);
      return { ...record, reconciliation: check, restored: Boolean(options.apply && check.action === 'restore_snapshot'), checkpoint: path.join(dir, 'runs', `${record.run_id}.json`) };
    } catch (error) { releaseLockIfOwned(locks, record.run_id, owner.attempt_id); throw error; }
  }
  const attempt = options['attempt-id'];
  if (!attempt) throw new Error('--attempt-id captured from start/resume is required');
  if (input?.attempt_id && input.attempt_id !== attempt) throw new Error('Checkpoint belongs to another attempt');
  assertOwner(locks, record.run_id, attempt);
  record.attempt_id = attempt;
  if (options['wait-until']) record.next_eligible_at = options['wait-until'];
  if (options['wait-reason']) record.wait_reason = options['wait-reason'];
  if (options['queue-state']) record.queue_state = options['queue-state'];
  else if (options['wait-until']) record.queue_state = 'waiting_external';
  if (options['usage-limit']) record.budget.stop_reason = 'usage_limit';
  const budget = budgetStatus(record, now);
  if (command === 'checkpoint' || command === 'suspend') {
    if (budget.must_save) { record.queue_state = 'waiting_external'; record.wait_reason = budget.reason; record.next_eligible_at = new Date(now.getTime() + (budget.reason === 'usage_limit' ? 24 * 60 : 5) * 60000).toISOString(); }
    queuedRuns([record], now);
    if (record.queue_state === 'waiting_external' && (!record.next_eligible_at || !record.wait_reason)) throw new Error('External waits require next_eligible_at and wait_reason');
    const previousTree = record.snapshot_commit && gitMaybe(root, 'rev-parse', `${record.snapshot_commit}^{tree}`);
    const saved = snapshot(root, dir, record, profile);
    if (previousTree !== git(root, 'rev-parse', `${saved.snapshot_commit}^{tree}`)) { delete record.verification; delete record.review; }
    record = save(dir, locks, { ...record, ...saved }, now);
    if (command === 'suspend' || budget.must_save) releaseLock(locks, record.run_id, attempt);
    return { ...record, budget_status: budget, released: command === 'suspend' || budget.must_save };
  }
  if (command === 'verify') {
    if (budget.must_save) throw new Error('Save a checkpoint before starting more verification: run budget reached');
    const tree = git(root, 'rev-parse', 'HEAD^{tree}');
    const commit = git(root, 'rev-parse', 'HEAD');
    if (git(root, 'status', '--porcelain=v1', '--untracked-files=all')) throw new Error('Commit the reviewed candidate before verify so evidence binds to its exact tree');
    const timeoutMs = Math.max(1, Math.min(15 * 60000, Date.parse(record.budget.deadline_at) - now.getTime() - record.budget.save_margin_seconds * 1000));
    const result = options.external ? { kind: 'github' as const, evidence: await externalCheck(root, record, deps) } : { kind: 'local' as const, evidence: (deps.runLocalCheck ?? localCheck)(root, { timeoutMs }) };
    if (!result.evidence?.verified && !('passed' in result.evidence && result.evidence.passed)) throw new Error('Verification did not pass');
    if (git(root, 'rev-parse', 'HEAD') !== commit || git(root, 'status', '--porcelain=v1', '--untracked-files=all')) throw new Error('Candidate changed during verification');
    if (!options.external && record.verification?.local?.commit_sha !== commit) {
      if (record.verification) delete record.verification.github;
      delete record.github_verification;
    }
    record.verification = result.kind === 'github' ? { ...record.verification, github: { ...result.evidence, commit_sha: result.evidence.head_sha, tree_sha: result.evidence.head_tree_sha } } : { ...record.verification, local: { ...result.evidence, commit_sha: commit, tree_sha: tree } };
    record = save(dir, locks, record, now);
    return { verified: true, record };
  }
  if (command === 'finish') {
    const outcome = options.outcome ?? record.completion;
    if (!['local', 'merged', 'published', 'observed', 'held', 'failed'].includes(outcome)) throw new Error('Invalid outcome');
    if (!['held', 'failed'].includes(outcome) && outcome !== record.completion) throw new Error('Outcome does not satisfy the recorded completion condition');
    if (['held', 'failed'].includes(outcome)) Object.assign(record, snapshot(root, dir, record, profile));
    if (outcome === 'observed' && (git(root, 'diff', '--name-only', record.base_sha, 'HEAD', '--', ...record.owned_paths) || git(root, 'status', '--porcelain=v1', '--untracked-files=all'))) throw new Error('Observed completion requires no candidate changes');
    if (!['held', 'failed', 'observed'].includes(outcome)) {
      const tree = ['merged', 'published'].includes(outcome) ? verifiedCandidate(root, record).tree : git(root, 'rev-parse', 'HEAD^{tree}');
      if (git(root, 'status', '--porcelain=v1', '--untracked-files=all') || record.verification?.local?.tree_sha !== tree || !record.verification.local.passed) throw new Error('Final candidate needs a successful local verify');
      if (profile.review_required && (record.review?.decision !== 'approved' || record.review?.tree_sha !== tree || !record.review.reviewer_run_id || record.review.reviewer_run_id === record.run_id)) throw new Error('Final candidate needs an independent approved review record');
      if (['merged', 'published'].includes(outcome)) record.github_verification = await externalCheck(root, record, deps);
    }
    record = save(dir, locks, { ...record, status: outcome, completed_at: now.toISOString() }, now);
    releaseLock(locks, record.run_id, attempt);
    return { finished: true, outcome, run_id: record.run_id };
  }
  if (command === 'release') { releaseLock(locks, record.run_id, attempt); return { released: true }; }
  throw new Error('Commands: status, queue, start, checkpoint, suspend, resume, verify, finish, release');
}
function gitHubRead(root: string, prUrl: string) {
  if (!/^https:\/\/github\.com\/pero3dev\/ai-agent-library\/pull\/\d+$/.test(prUrl)) throw new Error('Unexpected PR URL');
  const result = spawnSync('gh', ['pr', 'view', prUrl, '--json', 'state,headRefOid,mergeCommit,url'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.error || result.status !== 0) throw new Error('Could not reconcile existing GitHub PR; retain this run');
  return result.stdout;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch (error) { console.error(errorMessage(error)); process.exitCode = 1; }
}
