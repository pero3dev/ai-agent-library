import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { formatCommitMessage } from './git-conventions.mjs';

const RUN_ID = /^[a-z0-9][a-z0-9-]{1,79}$/;
const SHA = /^[a-f0-9]{40}$/;
const ATTEMPT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export function commitTree(root, commit) {
  if (!SHA.test(commit ?? '') || git(root, 'cat-file', '-t', commit) !== 'commit') throw new Error('A locally available candidate commit SHA is required');
  const tree = git(root, 'rev-parse', `${commit}^{tree}`);
  if (!SHA.test(tree)) throw new Error('Invalid candidate tree');
  return tree;
}
/** Finish from the reviewed branch, the verified merge, or a fetched main containing that merge. */
export function assertPublicationCheckout(root, result) {
  if (!result?.verified || !SHA.test(result.merge_sha ?? '') || !SHA.test(result.merge_tree_sha ?? '') || commitTree(root, result.head_sha) !== result.head_tree_sha) throw new Error('Publication evidence does not match the local candidate');
  if (git(root, 'status', '--porcelain=v1', '--untracked-files=all')) throw new Error('Publication completion requires a clean worktree');
  const current = git(root, 'rev-parse', 'HEAD');
  if (current === result.head_sha) return;
  if (commitTree(root, result.merge_sha) !== result.merge_tree_sha) throw new Error('Fetch the verified merge before completing from main');
  if (current === result.merge_sha) return;
  let main = null;
  try { main = git(root, 'rev-parse', 'refs/remotes/origin/main'); } catch { /* A detached merge is accepted above. */ }
  if (current !== main) throw new Error('Current checkout is neither the candidate nor verified main');
  try { git(root, 'merge-base', '--is-ancestor', result.merge_sha, current); }
  catch { throw new Error('Current main does not contain the verified merge'); }
}
export function isPreservablePath(file) {
  if (typeof file !== 'string' || !file || path.isAbsolute(file) || file.includes('\\') || file.includes(':') || file.split('/').some(part => !part || part === '.' || part === '..')) return false;
  const lower = file.toLowerCase();
  if (/(^|\/)(?:node_modules|\.git|\.next|out|test-results|playwright-report)(\/|$)/.test(lower) || /^website\/(?:content|generated|public\/_pagefind)(\/|$)/.test(lower) || ['website/next-env.d.ts', 'website/dev-server.log'].includes(lower)) return false;
  return !/(^|\/)(?:\.env(?:\..*)?|auth\.json|credentials(?:\..*)?|\.npmrc|id_rsa|id_ed25519)$/.test(lower) && !/\.(?:pem|pfx|key|env)$/.test(lower);
}
export function assertNoLinkedTargets(root, paths) {
  root = path.resolve(root);
  for (const file of paths) {
    const target = path.resolve(root, file);
    for (let current = target; current !== root; current = path.dirname(current)) {
      if (path.dirname(current) === current) throw new Error('Path is outside the checked root');
      let stat;
      try { stat = fs.lstatSync(current); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (stat?.isSymbolicLink()) throw new Error(`Path contains a symlink: ${file}`);
      if (stat && current !== target && !stat.isDirectory()) throw new Error(`Parent path is not a directory: ${file}`);
    }
  }
}
export function snapshotOwned(root, dir, runId, { candidates, accepts, refPrefix = 'harness', beforePublish = () => {} }) {
  assertRunId(runId);
  assertNoLinkedTargets(root, candidates);
  assertNoLinkedTargets(path.dirname(dir), [path.basename(dir)]);
  fs.mkdirSync(dir, { recursive: true });
  const index = path.join(dir, `snapshot-index-${crypto.randomUUID()}`);
  const snapshotOptions = {
    cwd: root, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, GIT_INDEX_FILE: index }, stdio: ['ignore', 'pipe', 'pipe']
  };
  const snapshotGit = (...args) => execFileSync('git', args, snapshotOptions).trim();
  try {
    const head = git(root, 'rev-parse', 'HEAD');
    snapshotGit('read-tree', head);
    const paths = snapshotGit('ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...candidates)
      .split('\0').filter(file => isPreservablePath(file) && accepts(file));
    assertNoLinkedTargets(root, paths);
    if (paths.length) execFileSync('git', ['--literal-pathspecs', 'add', '-A', '--pathspec-from-file=-', '--pathspec-file-nul'], {
      ...snapshotOptions, stdio: ['pipe', 'pipe', 'pipe'], input: `${[...new Set(paths)].join('\0')}\0`
    });
    const tree = snapshotGit('write-tree');
    const commit = tree === git(root, 'rev-parse', `${head}^{tree}`) ? head : snapshotGit(
      '-c', 'user.name=AI Agent Library automation', '-c', 'user.email=automation@ai-agent-library.invalid',
      'commit-tree', tree, '-p', head, '-m', formatCommitMessage({
        type: 'chore', scope: 'harness', summary: '作業状態を保存する',
        reason: `${refPrefix} の実行 ${runId} を中断後に復元できるよう、所有する差分を保存します。`,
        validation: '保存のみ・未実施。記事や実装の検証結果を表すコミットではありません。',
        agent: 'automation', generatedBy: 'ai-agent-library',
      })
    );
    beforePublish();
    git(root, 'update-ref', `refs/${refPrefix}/checkpoints/${runId}`, commit);
    return { snapshot_commit: commit, snapshot_head: head };
  } finally {
    if (fs.existsSync(index)) fs.unlinkSync(index);
    if (fs.existsSync(`${index}.lock`)) fs.unlinkSync(`${index}.lock`);
  }
}
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}
export function assertRunId(id) {
  if (typeof id !== 'string' || !RUN_ID.test(id)) throw new Error('Invalid run ID');
}
function assertLockPaths(dir) {
  dir = path.resolve(dir);
  const anchor = path.parse(dir).root;
  assertNoLinkedTargets(anchor, [path.relative(anchor, dir)]);
  assertNoLinkedTargets(dir, ['lock', 'lock/owner.json', 'lock-mutex']);
  for (const [file, directory] of [[dir, true], [path.join(dir, 'lock'), true], [path.join(dir, 'lock-mutex'), true], [path.join(dir, 'lock', 'owner.json'), false]]) {
    let stat;
    try { stat = fs.lstatSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat && !(directory ? stat.isDirectory() : stat.isFile())) throw new Error('Invalid lock path type; preserve it for inspection');
  }
}
export function readLock(dir) {
  assertLockPaths(dir);
  const file = path.join(dir, 'lock', 'owner.json');
  if (!fs.existsSync(file)) return null;
  const owner = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!owner || !['run_id', 'attempt_id', 'started_at', 'expires_at'].every(key => typeof owner[key] === 'string') || !RUN_ID.test(owner.run_id) || !ATTEMPT_ID.test(owner.attempt_id) || !Number.isFinite(Date.parse(owner.started_at)) || !Number.isFinite(Date.parse(owner.expires_at))) throw new Error('Invalid lock owner; preserve it for inspection');
  return owner;
}
export function withLockMutex(dir, action) {
  assertLockPaths(dir);
  fs.mkdirSync(dir, { recursive: true });
  const mutex = path.join(dir, 'lock-mutex');
  try { fs.mkdirSync(mutex); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Lock recovery is already running. Retry later; inspect a persistent lock-mutex before removing it.');
    throw error;
  }
  try { return action(); }
  finally { assertLockPaths(dir); fs.rmdirSync(mutex); }
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
// Failure cleanup must never release a replacement attempt that acquired the lease.
export function releaseLockIfOwned(dir, runId, attemptId) {
  assertRunId(runId);
  return withLockMutex(dir, () => {
    const owner = readLock(dir);
    if (!owner || owner.run_id !== runId || owner.attempt_id !== attemptId) return false;
    fs.unlinkSync(path.join(dir, 'lock', 'owner.json'));
    fs.rmdirSync(path.join(dir, 'lock'));
    return true;
  });
}
export function assertOwner(dir, id, attemptId) {
  if (typeof attemptId !== 'string' || !ATTEMPT_ID.test(attemptId)) throw new Error('A valid lock attempt_id is required');
  const owner = readLock(dir);
  if (!owner || owner.run_id !== id || (attemptId && owner.attempt_id !== attemptId) || Date.parse(owner.expires_at) <= Date.now()) throw new Error('Run does not own the current lock attempt; stop before GitHub writes.');
}

const storageFile = relative => relative === 'state.json' || /^runs\/[a-z0-9][a-z0-9-]{1,79}\.json$/.test(relative);
function readGeneration(dir) {
  const file = path.join(dir, 'state.json');
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')).generation ?? 0) : 0;
}
export function recoverGeneration(dir, { dryRun = true } = {}) {
  dir = path.resolve(dir);
  assertNoLinkedTargets(path.dirname(dir), [path.basename(dir)]);
  assertNoLinkedTargets(dir, ['journal.json', 'state.json']);
  const file = path.join(dir, 'journal.json');
  if (!fs.existsSync(file)) return { needed: false, dry_run: dryRun };
  const journal = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (journal.schema_version !== 1 || !Number.isSafeInteger(journal.generation) || journal.generation < 1 || !journal.files || !journal.files['state.json'] || Object.keys(journal.files).some(name => !storageFile(name))) throw new Error('Invalid generation journal; preserve it for inspection');
  const current = readGeneration(dir);
  if (current > journal.generation || current < journal.generation - 1) throw new Error('Journal conflicts with stored generation');
  for (const [name, value] of Object.entries(journal.files)) {
    if (!value || value.generation !== journal.generation || (name.startsWith('runs/') && name !== `runs/${value.run_id}.json`)) throw new Error('Journal record generation/ID mismatch');
    assertNoLinkedTargets(dir, [name]);
  }
  if (!dryRun) {
    for (const [name, value] of Object.entries(journal.files)) writeJson(path.join(dir, name), value);
    fs.unlinkSync(file);
  }
  return { needed: true, dry_run: dryRun, generation: journal.generation, files: Object.keys(journal.files) };
}

// A prepared journal contains both state and checkpoint. Replaying either partial write is idempotent.
// The optional fault callback is only injected by isolated regression tests.
export function saveGeneration(dir, state, record, { beforeCommit = () => {}, fault = () => {} } = {}) {
  dir = path.resolve(dir);
  beforeCommit();
  assertRunId(record.run_id);
  assertNoLinkedTargets(path.dirname(dir), [path.basename(dir)]);
  assertNoLinkedTargets(dir, ['journal.json', 'state.json', `runs/${record.run_id}.json`]);
  recoverGeneration(dir, { dryRun: false });
  const generation = readGeneration(dir) + 1;
  const files = { 'state.json': { ...state, generation }, [`runs/${record.run_id}.json`]: { ...record, generation } };
  const journal = { schema_version: 1, generation, files };
  writeJson(path.join(dir, 'journal.json'), journal);
  fault('journal');
  for (const [name, value] of Object.entries(files)) {
    beforeCommit();
    writeJson(path.join(dir, name), value);
    fault(name);
  }
  fs.unlinkSync(path.join(dir, 'journal.json'));
  return files[`runs/${record.run_id}.json`];
}

export function queuedRuns(records, now = new Date()) {
  const ready = [], waiting_external = [], needs_decision = [];
  for (const record of records) {
    const state = record.queue_state ?? 'ready';
    const retry = record.next_eligible_at ? Date.parse(record.next_eligible_at) : -Infinity;
    if (!['ready', 'waiting_external', 'needs_decision'].includes(state) || Number.isNaN(retry)) throw new Error('Invalid run queue state');
    if (state === 'needs_decision') needs_decision.push(record);
    else if (retry > now.getTime()) waiting_external.push(record);
    else ready.push(record);
  }
  ready.sort((a, b) => a.started_at.localeCompare(b.started_at));
  return { ready, waiting_external, needs_decision };
}

export function budgetStatus(record, now = new Date()) {
  const budget = record.budget ?? {};
  const deadline = budget.deadline_at ? Date.parse(budget.deadline_at) : Infinity;
  const margin = budget.save_margin_seconds ?? 120;
  if (Number.isNaN(deadline) || !Number.isFinite(margin) || margin < 0) throw new Error('Invalid run budget');
  const mustSave = budget.stop_reason === 'usage_limit' || now.getTime() >= deadline - margin * 1000;
  return { must_save: mustSave, reason: budget.stop_reason === 'usage_limit' ? 'usage_limit' : mustSave ? 'deadline' : null, deadline_at: budget.deadline_at ?? null, usage: 'not_observed' };
}
